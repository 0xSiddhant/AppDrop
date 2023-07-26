const IPAProcessor = require("./ipa_processor")

class BuildProcessor {
    constructor() {

    }

    processBuild(uploadFolder, file) {
        return new Promise((resolve, reject) => {
            // File Type validation
            if (!this.#isFileValid(file)) {
                return reject(
                    {
                        status: "Fail",
                        message: "Invalid File Type",
                    }
                )
            }
            const buildExt = this.#buildType(file)

            if (buildExt === "ipa") {
                IPAProcessor.processIOSBuild(uploadFolder, file)
                    .then(resolve)
                    .catch(reject)
            } else if (buildExt === "apk" || buildExt === "abb") {
                // TODO: Android
            }
        })
    }


    #buildType(file) {
        const type = file.originalFilename.split(".").pop();
        return type
    }

    #isFileValid = (file) => {
        const type = file.originalFilename.split(".").pop();
        const validTypes = ["ipa", "apk", "abb"];
        if (validTypes.indexOf(type) === -1) {
            return false;
        }
        return true;
    }
}

module.exports = BuildProcessor