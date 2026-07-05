const express = require('express')
const path = require('path')
require("dotenv").config()

const port = process.env.PORT || 3002
const app = express()

// Handlebars template engine
app.set("view engine", "hbs")

// Registered public folder
app.use('/public', express.static(path.join(__dirname, 'public')))
app.use('/storage', express.static(path.join(__dirname, 'storage'), {
    setHeaders: (res, filePath) => {
        // iOS OTA install expects the manifest served as XML
        if (filePath.endsWith(".plist")) {
            res.setHeader("Content-Type", "application/xml")
        }
        // Android expects APKs with this type to offer install after download
        if (filePath.endsWith(".apk")) {
            res.setHeader("Content-Type", "application/vnd.android.package-archive")
        }
    }
}))

// route
app.use("/", require("./routes/home"))
app.use("/", require("./routes/upload"))

app.listen(port, () => {
    console.log(`Port running on http://localhost:${port}`)
})