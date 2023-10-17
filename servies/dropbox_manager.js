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
            }).then(async () =>  {
                // Generated Downloadable link

                // which expire in 4hr
                // this._client.filesGetTemporaryLink({
                //     path: filePath
                // }).then((res) => {
                //     resolve(`${res.result.link}?dl=1`)
                // }).catch((err) => {
                //     reject(err)
                // })

                // Permanent Download link
                const sharingInfo = await this._client.sharingCreateSharedLinkWithSettings({
                    path: filePath
                })
                const sharedLink = sharingInfo.result.url;
                const forcedDownloadLink = sharedLink.replace('dl=0', 'dl=1');
                
                resolve(forcedDownloadLink)
            }).catch((err) => {
                reject(err)
            })
        })
    }

}

module.exports = DropboxManager