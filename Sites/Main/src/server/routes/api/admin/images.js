const express = require('express');
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage, fileFilter: fileFilter });
const models = require('../../../config/models');

function fileFilter(req, file, cb) {
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
        cb(null, true);
    } else {
        cb(null, false);
    }
}

module.exports = function () {
    let router = express.Router();
    router.route('/')
        .post(upload.array('image'), function (req, res) {
            let videoTitleID = req.body.videoTitle;
            let files = req.files;
            let images = req.files.map(function (file) {
                let image = {
                    createDate: new Date,
                    videoTitle: videoTitleID,
                    img: {
                        data: file.buffer,
                        contentType: file.mimetype
                    }
                };
                return image;
            });
            if (images.length > 0) {
                models.Image.create(images, function (err, items) {
                    if (err) {
                        return res.status(500).send(err);
                    } else {
                        res.send({ ok : true });
                    }
                })
            } else {
                res.status(500).send({ error : 'No images to insert'});
            }
        })
        .get(function (req, res) {
            let query = {
                videoTitle: req.query['videoTitle']
            };
            models.Image.find(query)
                .select({ _id : 1 })
                .sort({ createDate : 1 })
                .exec(function (err, items) {
                    if (err) {
                        return res.status(500).send(err);
                    } else {
                        return res.send(items);
                    }
                });
        });

    router.route('/:id')
        // remove the image
        .post(function (req, res) {
            let imgID = req.params['id'];
            models.Image.findOneAndRemove({_id : imgID}, function (err, item) {
                if (err) {
                    return res.status(500).send(err);
                } else {
                    return res.send({ ok : true });
                }
            });
        });

    return router;
}
