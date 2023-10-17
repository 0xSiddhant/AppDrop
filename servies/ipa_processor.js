const fs = require("fs")
const plist = require('plist')
const url = require('url')
const path = require("path")
const os = require('os')

const { exec, spawn } = require("child_process");
const { qrCodeGenerator } = require("../utils/qrcode_generator")
const { generateFileName } = require("../utils/util")
const DropboxManager = require("./dropbox_manager")

class IPAProcessor {
    processIOSBuild(uploadFolder, file, req) {
        return new Promise((resolve, reject) => {
            // Renaming the File
            const oldPath = path.join(uploadFolder, file.newFilename)
            const newName = generateFileName(file)
            const newPath = path.join(uploadFolder, newName)

            const removeFile = (filePath) => {
                fs.unlink(filePath, () => {
                    console.log("File Removed successfully")
                })
            }

            fs.rename(oldPath, newPath, (err) => {
                if (err) {
                    return reject({
                        status: "Fail",
                        message: "Failed To Save File",
                    })
                }

                const DM = new DropboxManager()
                const dbFolderName = "/ios"

                DM.uploadFile(`${dbFolderName}/${newName}`, fs.readFileSync(newPath))
                    .then((ipaUploadedPath) => {
                        this.#extractIPAData(uploadFolder, newPath)
                            .then((res) => {
                                this.#generateXMLFile(uploadFolder, newPath, newName, ipaUploadedPath, res.appMetaData, req)
                                    .then((res) => {
                                        DM.uploadFile(`${dbFolderName}/${res.plistName}`, fs.readFileSync(res.plistPath))
                                            .then((plistUrl) => {
                                                // removing saved plist file after uploading
                                                fs.unlink(res.plistPath, (err) => { if (err) { console.log(err) } })

                                                this.#generateITMSlink(plistUrl)
                                                    .then(resolve)
                                                    .catch(reject)
                                            }).catch(reject)
                                    })
                                    .catch(reject)
                            })
                            .catch(reject)
                    })
            });
        })
    }

    #plistBuilder = (fileURL, appMetaData) => {
        const json = {
            items: [
                {
                    assets: [
                        {
                            kind: "software-package",
                            url: fileURL
                        }
                    ],
                    metadata: {
                        "bundle-identifier": appMetaData.CFBundleIdentifier,
                        "bundle-version": appMetaData.CFBundleShortVersionString,
                        "kind": "Software",
                        "title": appMetaData.CFBundleName
                    }
                }
            ]
        }
        const xml = plist.build(json)
        return xml
    }

    #generateXMLFile(uploadFolder, newPath, newName, iPAFilePath, appMetaData, req) {
        return new Promise((resolve, reject) => {
            const xmlPath = path.join(uploadFolder, `${newName}.plist`)
            const xmlData = this.#plistBuilder(iPAFilePath, appMetaData)

            fs.writeFile(xmlPath, xmlData, (err) => {
                if (err) {
                    removeFile(newPath)
                    return reject({
                        status: "Fail",
                        message: "Failed To Generate Manifest file",
                    })
                }
                return resolve({
                    plistName: `${newName}.plist`,
                    plistPath: xmlPath
                })
            });
        })
    }

    #extractIPAData(existingIPADir, ipaPath) {
        return new Promise((resolve, reject) => {
            const buildName = "temp.ipa"
            const copyPath = path.join(existingIPADir, "copyPath")
            const ipaNewPath = path.join(copyPath, buildName)

            // Create Copy folder is not exist
            if (!fs.existsSync(copyPath)) {
                try {
                    fs.mkdirSync(copyPath)
                } catch (err) {
                    return reject({
                        status: "Fail",
                        message: "Failed To Process Build. CODE: 0",
                        error: err
                    })
                }
            }
            // copied existing IPA file to new Path
            fs.copyFile(ipaPath, ipaNewPath, (err) => {
                if (err) {
                    return reject({
                        status: "Fail",
                        message: "Failed To Process Build. CODE: -1",
                    })
                }
                const ls = spawn("python3", ["extractor.py", buildName]);

                ls.stdout.on("data", data => {
                    console.log(`stdout: ${data}`);
                });

                ls.on('error', (error) => {
                    return reject({
                        status: "Fail",
                        message: "Failed To Process Build. CODE: -2",
                        error: error.message
                    })
                });

                ls.on("close", code => {
                    let command = ""
                    if (os.type() == "Darwin") {
                        // For MAC
                        command = `plutil -convert json -o ${path.join(copyPath, "Info.json")} ${path.join(copyPath, "Info.plist")}`
                    } else {
                        // For Linux
                        command = `python3 plist_to_json_converter.py ${path.join(copyPath, "Info.plist")} ${path.join(copyPath, "Info.json")}`
                    }
                    exec(command, (err, stdOut, stderr) => {
                        if (fs.existsSync(path.join(copyPath, "Info.json"))) {
                            const jsonFile = require("../storage/copyPath/Info.json")

                            this.#resetTempFile(existingIPADir)

                            // Removing IPA File after processing as current file is uploaded on dropbox
                            fs.unlink(ipaPath, (err) => { if (err) { console.log(err) } })

                            return resolve({
                                status: "Pass",
                                appMetaData: jsonFile
                            })
                        } else {
                            this.#resetTempFile(existingIPADir)

                            return reject({
                                status: "Fail",
                                message: "Failed To Process Build. CODE: -3",
                            })
                        }
                    })
                });
            })
        })
    }

    #generateITMSlink(plistUrl) {
        return new Promise((resolve, reject) => {
            qrCodeGenerator(`itms-services:///?action=download-manifest&url=${plistUrl}`)
                .then((src) => {
                    return resolve({
                        src: src,
                        path: `${plistUrl}`
                    })
                })
                .catch(reject)
        })
    }

    #resetTempFile(storageDir) {
        fs.rmSync(path.join(storageDir, "copyPath"), { recursive: true, force: true });
    }
}

module.exports = new IPAProcessor()