const IPAProcessor = require("./ipa_processor")
const APKProcessor = require("./apk_processor")
const fs = require("fs")

class BuildProcessor {
    constructor() {

    }

    processBuild(uploadFolder, file, req) {
        return new Promise((resolve, reject) => {
            // File Type validation
            if (!this.#isFileValid(file)) {
                // Removing unwanted file
                fs.rmSync(file.filepath)
                return reject(
                    {
                        status: "Fail",
                        message: "Invalid File Type",
                    }
                )
            }
            const buildExt = this.#buildType(file)

            if (buildExt === "ipa") {
                IPAProcessor.processIOSBuild(uploadFolder, file, req)
                    .then(resolve)
                    .catch(reject)
            } else {
                // apk / aab
                APKProcessor.processAndroidBuild(uploadFolder, file, req)
                    .then(resolve)
                    .catch(reject)
            }
        })
    }


    #buildType(file) {
        const type = file.originalFilename.split(".").pop().toLowerCase();
        return type
    }

    #isFileValid = (file) => {
        const type = file.originalFilename.split(".").pop().toLowerCase();
        const validTypes = ["ipa", "apk", "aab"];
        if (validTypes.indexOf(type) === -1) {
            return false;
        }
        return true;
    }
}

module.exports = BuildProcessor