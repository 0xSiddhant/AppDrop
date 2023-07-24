const qr = require("qrcode");
const path = require("path");
const formidable = require("formidable");
const fs = require("fs");
const DateFormatter = require("../utils/dateFormatter")
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
                // TODO: - Generate xml file
            }
        });
        res.end();
    });

    // qr.toDataURL("itms-services:///?action=download-manifest&url=https://dl.dropboxusercontent.com/s/jt1rpr58xlbim7h/App.plist", (err, src) => {
    //     if (err) res.status(400).send("Unable to generate QR code");

    //     res.status(201).render("download", {
    //         src: src,
    //         path: "download file"
    //      });
    // });

    const isFileValid = (file) => {
        const type = file.originalFilename.split(".").pop();
        const validTypes = ["ipa", "apk", "abb"];
        if (validTypes.indexOf(type) === -1) {
            return false;
        }
        return true;
    };

    const generateNewName = (file) => {
        const fileType = file.originalFilename.split(".").pop();
        if (fileType == "ipa") {
            const fileName = file.originalFilename.split(".")[0];
            let date = DateFormatter.dateFormattedInDDMMYYYHHMMSS()
            return `${fileName}_${date}.ipa`
        } else {
            // APK file --
            return "apkfile.apk"
        }
    }
};
