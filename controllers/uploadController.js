const qr = require('qrcode')

exports.upload = (req, res) => {
    qr.toDataURL("itms-services:///?action=download-manifest&url=https://dl.dropboxusercontent.com/s/jt1rpr58xlbim7h/App.plist", (err, src) => {
        if (err) res.status(400).send("Unable to generate QR code");
      
        res.status(201).render("download", { 
            src: src,
            path: "download file"
         });
    });

}