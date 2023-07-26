const express = require('express')
const path = require('path')
require("dotenv").config()

const port = process.env.PORT
const app = express()

// Handlebars template engine
app.set("view engine", "hbs")

// Registered public folder
app.use('/public', express.static(path.join(__dirname, 'public')))

// route
app.use("/", require("./routes/home"))
app.use("/", require("./routes/upload"))

app.listen(port, () => {
    console.log(`Port running on http://localhost:${port}`)
})