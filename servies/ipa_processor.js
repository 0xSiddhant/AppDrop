const fs = require("fs")
const plist = require('plist')
const url = require('url')
const path = require("path")
const os = require('os')

const { exec, spawn } = require("child_process");
const { qrCodeGenerator } = require("../utils/qrcode_generator")
const { generateFileName } = require("../utils/util")

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
                this.#extractIPAData(uploadFolder, newPath)
                    .then((res) => {
                        this.#generateXMLFile(uploadFolder, newPath, newName, res.appMetaData, req)
                            .then(resolve)
                            .catch(reject)
                    })
                    .catch((err) => {
                        // Don't leave a broken build publicly downloadable in /storage
                        removeFile(newPath)
                        reject(err)
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
                        "bundle-version": appMetaData.CFBundleShortVersionString || "1.0",
                        "kind": "Software",
                        "title": appMetaData.CFBundleDisplayName || appMetaData.CFBundleName || "App"
                    }
                }
            ]
        }
        const xml = plist.build(json)
        return xml
    }

    #generateXMLFile(uploadFolder, newPath, newName, appMetaData, req) {
        return new Promise((resolve, reject) => {
            if (!appMetaData || !appMetaData.CFBundleIdentifier) {
                fs.unlink(newPath, () => { })
                return reject({
                    status: "Fail",
                    message: "Could not read bundle identifier from Info.plist",
                })
            }
            const xmlPath = path.join(uploadFolder, `${newName}.plist`)
            const encodedName = encodeURIComponent(newName)
            // BASE_URL (e.g. https://builds.example.com) covers non-443 ports and reverse proxies;
            // iOS requires HTTPS for OTA installs, so default scheme is https
            const baseURL = (process.env.BASE_URL || `https://${req.hostname}`).replace(/\/+$/, "")
            const manifestURL = `${baseURL}/storage/${encodedName}.plist`
            const installURL = `itms-services:///?action=download-manifest&url=${encodeURIComponent(manifestURL)}`
            const xmlData = this.#plistBuilder(`${baseURL}/storage/${encodedName}`, appMetaData)

            fs.writeFile(xmlPath, xmlData, (err) => {
                if (err) {
                    fs.unlink(newPath, () => { })
                    return reject({
                        status: "Fail",
                        message: "Failed To Generate Manifest file",
                    })
                }

                qrCodeGenerator(installURL)
                    .then((src) => {
                        return resolve({
                            src: src,
                            path: manifestURL,
                            installUrl: installURL
                        })
                    })
                    .catch(reject)
            });
        })
    }


    #extractIPAData(existingIPADir, ipaPath) {
        return new Promise((resolve, reject) => {
            const buildName = "temp.ipa"
            // Unique temp folder per upload so concurrent uploads don't collide
            let copyPath
            try {
                copyPath = fs.mkdtempSync(path.join(existingIPADir, "copy-"))
            } catch (err) {
                return reject({
                    status: "Fail",
                    message: "Failed To Process Build. CODE: 0",
                    error: err
                })
            }
            const ipaNewPath = path.join(copyPath, buildName)

            // copied existing IPA file to new Path
            fs.copyFile(ipaPath, ipaNewPath, (err) => {
                if (err) {
                    this.#resetTempFile(copyPath)
                    return reject({
                        status: "Fail",
                        message: "Failed To Process Build. CODE: -1",
                    })
                }
                const ls = spawn("python3", ["extractor.py", buildName, copyPath]);

                ls.stdout.on("data", data => {
                    console.log(`stdout: ${data}`);
                });

                ls.on('error', (error) => {
                    this.#resetTempFile(copyPath)
                    return reject({
                        status: "Fail",
                        message: "Failed To Process Build. CODE: -2",
                        error: error.message
                    })
                });

                ls.on("close", code => {
                    const plistPath = path.join(copyPath, "Info.plist")
                    const jsonPath = path.join(copyPath, "Info.json")
                    let command = ""
                    if (os.type() == "Darwin") {
                        // For MAC
                        command = `plutil -convert json -o "${jsonPath}" "${plistPath}"`
                    } else {
                        // For Linux
                        command = `python3 plist_to_json_converter.py "${plistPath}" "${jsonPath}"`
                    }
                    exec(command, (err, stdOut, stderr) => {
                        let appMetaData = null
                        try {
                            appMetaData = JSON.parse(fs.readFileSync(jsonPath, "utf8"))
                        } catch (readErr) {
                            appMetaData = null
                        }
                        this.#resetTempFile(copyPath)

                        if (appMetaData) {
                            return resolve({
                                status: "Pass",
                                appMetaData: appMetaData
                            })
                        }
                        return reject({
                            status: "Fail",
                            message: "Failed To Process Build. CODE: -3",
                        })
                    })
                });
            })
        })
    }

    #resetTempFile(copyPath) {
        fs.rmSync(copyPath, { recursive: true, force: true });
    }
}

module.exports = new IPAProcessor()
