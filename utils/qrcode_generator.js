const qr = require("qrcode")

exports.qrCodeGenerator = (url) => {
    return new Promise((resolve, reject) => {
        qr.toDataURL(url, (err, src) => {
            if (err) {
                return reject({
                    status: "Fail",
                    message: "Failed To Generate QR Code",
                });
            }
            return resolve(src)
        });
    })
}