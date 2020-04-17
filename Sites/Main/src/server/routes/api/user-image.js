var models = require('../../config/models');
var express = require('express');
var async = require('async');
var sharp = require('sharp');
var multer = require('multer');
var storage = multer.memoryStorage();
var upload = multer({ storage: storage, fileFilter: fileFilter });
var uploadHandler = upload.single('image');

function fileFilter(req, file, cb) {
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
        cb(null, true);
    } else {
        cb(null, false);
    }
}

module.exports = function() {

    var router = express.Router();

    var UserImage = models.UserImage;

    router.use(function(req, res, next) {
        if (!req.user) {
            return res.status(401).send('Unauthorized');
        }

        next();
    });

    router.route('/')
        .post(upload.single('image'), function(req, res) {

            uploadHandler(req, res, function(err) {

                var file = req.file;

                if (err || !file) {
                    return res.status(500).send({ err: err, error: 'Incorrect file. Image (png or jpeg) was expected.' });
                }

                var image = { createDate: new Date, user: req.user['_id'], img: {
                    data: file.buffer,
                    contentType: file.mimetype
                }};

                UserImage.findOneAndUpdate(
                    { user: req.user['_id'] },
                    image,
                    { upsert: true, new: true},
                    function(err, item) {
                        if (err) {
                            return res.status(500).send({ error: err });
                        }

                        res.send({ message: 'Image was updated'});
                    }
                );

            });

        })
        .delete(function (req, res) {
            UserImage.remove({ user : req.user['_id']}, function (err, item) {
                if (err) {
                    return res.status(500).send({ error : err });
                }
                res.send({ message : 'Image was removed' });
            });
        });

    return router;

};
