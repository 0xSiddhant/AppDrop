const qr = require("qrcode")
const path = require("path")
const formidable = require("formidable")
const fs = require("fs")
const DateFormatter = require("../utils/dateFormatter")
const url = require('url')
const plist = require('plist')

exports.upload = (req, res) => {
    var form = new formidable.IncomingForm();
    const uploadFolder = path.join(
        path.dirname(require.main.filename),
        "storage"
    );
    form.uploadDir = uploadFolder;
    // allow multiple file upload at once
    // form.multiples = true;

    form.parse(req, function (err, fields, files) {
        if (err) {
            console.log("Error parsing the files");
            return res.status(400).json({
                status: "Fail",
                message: "Failed To upload file",
                error: err,
            });
        }
        const finalFile = files.uploadfile[0];
        const isValid = isFileValid(finalFile);
        // File Type validation
        if (!isValid) {
            return res.status(400).json({
                status: "Fail",
                message: "Invalid File Type",
            });
        }

        // Renaming the File
        const oldPath = path.join(uploadFolder, finalFile.newFilename)
        const newName = generateNewName(finalFile)
        const newPath = path.join(uploadFolder, newName)

        fs.rename(oldPath, newPath, (err) => {
            if (err) {
                return res.status(400).json({
                    status: "Fail",
                    message: "Failed To Save File",
                });
            } else {
                const xmlPath = path.join(uploadFolder, `${newName}.plist`)
                const xmlData = plistBuilder(newPath)
                
                fs.writeFile(xmlPath, xmlData, (err) => {
                    if (err) {
                        removeFile(newPath)
                        return res.status(400).json({
                            status: "Fail",
                            message: "Failed To Generate Manifest file",
                        });
                    }

                    qr.toDataURL(`itms-services:///?action=download-manifest&url=${url.pathToFileURL(xmlPath).href}`, (err, src) => {
                        if (err) {
                            return res.status(400).json({
                                status: "Fail",
                                message: "Failed To Generate QR Code",
                            });
                        }
                        res.status(201).render("download", {
                            src: src,
                            path: url.pathToFileURL(xmlPath).href
                        });
                    });
                });
            }
        });
    });

    const isFileValid = (file) => {
        const type = file.originalFilename.split(".").pop();
        const validTypes = ["ipa", "apk", "abb"];
        if (validTypes.indexOf(type) === -1) {
            return false;
        }
        return true;
    };

    const removeFile = (filePath) => {
        fs.unlink(filePath, () => {
            console.log("File Removed successfully")
        })
    }

    const generateNewName = (file) => {
        const fileType = file.originalFilename.split(".").pop()
        if (fileType == "ipa") {
            // replace(/\s/g, "") => Removing Whitespace from string.
            const fileName = file.originalFilename.split(".")[0].replace(/\s/g, "")
            let date = DateFormatter.dateFormattedInDDMMYYYHHMMSS()
            return `${fileName}_${date}.ipa`
        } else {
            // APK file --
            return "apkfile.apk"
        }
    }

    const plistBuilder = (filePath) => {
        // TODO: Extra Content from build file
        const json = {
            dict: {
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
        }
        const xml = plist.build(json)
        return xml
    }
}