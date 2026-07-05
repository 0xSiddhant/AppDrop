const fs = require("fs")
const path = require("path")

const { qrCodeGenerator } = require("../utils/qrcode_generator")
const { generateFileName } = require("../utils/util")

class APKProcessor {
    processAndroidBuild(uploadFolder, file, req) {
        return new Promise((resolve, reject) => {
            // Renaming the File
            const oldPath = path.join(uploadFolder, file.newFilename)
            const newName = generateFileName(file)
            const newPath = path.join(uploadFolder, newName)

            fs.rename(oldPath, newPath, (err) => {
                if (err) {
                    return reject({
                        status: "Fail",
                        message: "Failed To Save File",
                    })
                }

                const encodedName = encodeURIComponent(newName)
                const baseURL = (process.env.BASE_URL || `https://${req.hostname}`).replace(/\/+$/, "")
                // Android installs straight from the downloaded file, no manifest needed
                const downloadURL = `${baseURL}/storage/${encodedName}`

                qrCodeGenerator(downloadURL)
                    .then((src) => {
                        return resolve({
                            src: src,
                            path: downloadURL,
                            installUrl: downloadURL
                        })
                    })
                    .catch((qrErr) => {
                        fs.unlink(newPath, () => { })
                        reject(qrErr)
                    })
            })
        })
    }
}

module.exports = new APKProcessor()
