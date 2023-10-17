const { Dropbox } = require("dropbox")

class DropboxManager {
    constructor() {
        this._client = new Dropbox({
            accessToken: process.env.DROPBOX_ACCESS_TOKEN
        })
    }


    uploadFile(filePath, fileContent) {

        return new Promise((resolve, reject) => {
            // supports upto 150mb
            // Uploaded File
            this._client.filesUpload({
                path: filePath,
                contents: fileContent
            }).then(() => {
                // Generated Downloadable link
                // which expire in 4hr
                this._client.filesGetTemporaryLink({
                    path: filePath
                }).then((res) => {
                    resolve(`${res.result.link}?dl=1`)
                }).catch((err) => {
                    reject(err)
                })
            }).catch((err) => {
                reject(err)
            })
        })
    }

}

module.exports = DropboxManager