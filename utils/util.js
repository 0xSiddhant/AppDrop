const DateFormatter = require("../utils/dateFormatter")

exports.generateFileName = (file) => {
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