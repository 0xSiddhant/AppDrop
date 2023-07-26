const path = require("path")
const formidable = require("formidable")

const BuildProcessor = require("../servies/build_processor")

exports.upload = (req, res) => {
    var form = new formidable.IncomingForm();
    const uploadFolder = path.join(
        path.dirname(require.main.filename),
        "storage"
    );
    form.uploadDir = uploadFolder;
    // allow multiple file upload at once
    // form.multiples = true;

    const buildProcessor = new BuildProcessor()

    form.parse(req, function (err, fields, files) {
        if (err) {
            return res.status(400).json({
                status: "Fail",
                message: "Failed To upload file",
                error: err,
            });
        }

        const finalFile = files.uploadfile[0];

        buildProcessor.processBuild(uploadFolder, finalFile)
            .then((json) => {
                return res.status(201).render("download", json);
            })
            .catch((err) => {
                return res.status(400).json(err);
            })
    });
}