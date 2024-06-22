const ImageKit = require("imagekit");
const fs = require('fs');
const multer = require("multer");
require('dotenv').config();


const imagekit = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINTS
});


const sendImageToImageKit = (
    imageName,
    folderName,
    path
) => {
    return new Promise((resolve, reject) => {
        fs.readFile(`uploads/${imageName}`, function (err, data) {
            if (err) return reject(err);

            imagekit.upload({
                file: data,
                fileName: imageName + "_blogs",
                folder: folderName,
            }, function (error, result) {
                if (error) {
                    return reject(error);
                }
                fs.unlink(path, error => {
                    if (error) {
                        return reject(error);
                    }
                });
                resolve(result);
            });
        });
    });
};

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, process.cwd() + '/uploads');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, file.fieldname + '-' + uniqueSuffix);
    },
});
const upload = multer({ storage: storage });

module.exports = {
    sendImageToImageKit,
    upload
};