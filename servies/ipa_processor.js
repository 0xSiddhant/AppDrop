const { generateFileName } = require("../utils/util")
const fs = require("fs")
const plist = require('plist')
const url = require('url')
const path = require("path")
const { qrCodeGenerator } = require("../utils/qrcode_generator")

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
                } else {
                    const xmlPath = path.join(uploadFolder, `${newName}.plist`)
                    const xmlData = this.#plistBuilder(newPath)

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
                }
            });
        })
    }

    #plistBuilder = (filePath) => {
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
                        "bundle-identifier": "com.app.travclan.dev",
                        "bundle-version": "1.10",
                        "kind": "Software",
                        "title": "TravClan"
                    }
                }
            ]
        }
        const xml = plist.build(json)
        return xml
    }
}

module.exports = new IPAProcessor()