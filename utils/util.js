const DateFormatter = require("../utils/dateFormatter")

exports.generateFileName = (file) => {
    const fileType = file.originalFilename.split(".").pop().toLowerCase()
    // Keep only URL-safe characters so the name works in the manifest and itms-services URLs
    const baseName = file.originalFilename.slice(0, file.originalFilename.lastIndexOf("."))
    const fileName = baseName.replace(/[^a-zA-Z0-9_-]/g, "") || "build"
    let date = DateFormatter.dateFormattedInDDMMYYYHHMMSS()
    return `${fileName}_${date}.${fileType}`
}