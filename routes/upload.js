const express = require('express')

const router = express.Router()

const { upload } = require("../controllers/uploadController")

router.route("/upload").post(upload)

module.exports = router