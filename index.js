const express = require('express')
require("dotenv").config()

const port = process.env.PORT
const app = express()

app.set("view engine", "hbs")

// route
app.use("/", require("./routes/home"))
app.use("/", require("./routes/upload"))

app.listen(port,() => {
    console.log(`Port running on http://localhost:${port}`)
})