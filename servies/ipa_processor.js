const fs = require("fs")
const plist = require('plist')
const url = require('url')
const path = require("path")
const { exec, spawn } = require("child_process");



const { qrCodeGenerator } = require("../utils/qrcode_generator")
const { generateFileName } = require("../utils/util")

class IPAProcessor {
    processIOSBuild(uploadFolder, file) {
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
                this.#extractIPAData(uploadFolder, newPath)
                    .then((res) => {
                        console.log(res.appMetaData);
                        this.#generateXMLFile(uploadFolder, newPath, newName, res.appMetaData)
                            .then(resolve)
                            .catch(reject)
                    })
                    .catch(reject)
            });
        })
    }

    #plistBuilder = (filePath, appMetaData) => {
        // TODO: Extra Content from build file
        const json = {
            items: [
                {
                    assets: [
                        {
                            kind: "software-package",
                            url: url.pathToFileURL(filePath).href
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

    #generateXMLFile(uploadFolder, newPath, newName, appMetaData) {
        return new Promise((resolve, reject) => {
            const xmlPath = path.join(uploadFolder, `${newName}.plist`)
            const xmlData = this.#plistBuilder(newPath, appMetaData)

            fs.writeFile(xmlPath, xmlData, (err) => {
                if (err) {
                    removeFile(newPath)
                    return reject({
                        status: "Fail",
                        message: "Failed To Generate Manifest file",
                    })
                }

                qrCodeGenerator(`itms-services:///?action=download-manifest&url=${url.pathToFileURL(xmlPath).href}`)
                    .then((src) => {
                        return resolve({
                            src: src,
                            path: url.pathToFileURL(xmlPath).href
                        })
                    })
                    .catch(reject)
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
                fs.mkdir(copyPath, (err) => {
                    if (err) {
                        return reject({
                            status: "Fail",
                            message: "Failed To Process Build. CODE: 0",
                        })
                    }
                })
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
                    exec(`plutil -convert json -o ${path.join(copyPath, "Info.json")} ${path.join(copyPath, "Info.plist")}`, (err, stdOut, stderr) => {
                        if (fs.existsSync(path.join(copyPath, "Info.json"))) {
                            return resolve({
                                status: "Pass",
                                appMetaData: require("../storage/copyPath/Info.json")
                            })
                        } else {
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
}

module.exports = new IPAProcessor()