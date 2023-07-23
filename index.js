const express = require('express')
const app = express()

app.set("view engine", "hbs")

app.use("/", require("./routes/home"))

app.listen(3000,() => {
    console.log("Port running on http://localhost:3000")
})