const express = require('express');
const models = require('../config/models');
const sharp = require('sharp');
const async = require('async');

const Flash = models.Flash;
const UserImage = models.UserImage;
const User = models.User;
const Image = models.Image;
const VideoTitle = models.VideoTitle;

var processImage = function(req, res, mime, buffer) {
    var image = sharp(buffer);
    image
        .metadata()
        .then(function(metadata) {

            var w = NaN;
            if (req.query.width) {
                w = parseInt(req.query.width);
            }
            var h = NaN;
            if (req.query.height) {
                h = parseInt(req.query.height);
            }

            if (isNaN(w) && isNaN(h)) {
                return image.jpeg().toBuffer();
            } else if (!isNaN(w) && !isNaN(h)) {
                return image.resize(w, h).jpeg().toBuffer();
            } else if (!isNaN(w)) {
                return image.resize(w).jpeg().toBuffer();
            } else {
                return image.resize(null, h).jpeg().toBuffer();
            }

        })
        .then(function(data) {
            // res.contentType('image/png');
            res.contentType('image/jpeg');
            res.set('Cache-Control', 'max-age=3600');
            res.send(data);
        });

}

var navigateToUserImage = function(req, res, user) {
    UserImage.findOne({ user: user['_id'] })
        .select('_id')
        .exec(function(err, item) {
            if (err) {
                return res.status(500).send({ error: err });
            }

            var w = NaN;
            if (req.query.width) {
                w = parseInt(req.query.width);
            }
            var h = NaN;
            if (req.query.height) {
                h = parseInt(req.query.height);
            }

            var params = [ ];

            if (!isNaN(w)) {
                params.push('width=' + w);
            }

            if (!isNaN(h)) {
                params.push('height=' + h);
            }

            var url = '';

            if (item) {
                url = '/images/user-image/' + item['_id'];
            } else if (user['vkontakte-credentials']) {
                url = user['vkontakte-credentials'].photo;
            } else if (user['facebook-credentials']) {
                url = 'https://graph.facebook.com/' + user['facebook-credentials'].id + '/picture';
            }

            if (url == '') {
                return res.redirect('/img/user-icon.png');
            }

            if (params.length > 0) {
                url += params.reduce(function(total, item, index) {
                    var val = total;
                    if (index > 0) {
                        val += '&';
                    }
                    val += item;
                    return val;
                }, '?');
            }

            res.redirect(url);
        });
}

var navigateToVideoImage = function(req, res, videoTitle, img) {
    var w = NaN;
    if (req.query.width) {
        w = parseInt(req.query.width);
    }
    var h = NaN;
    if (req.query.height) {
        h = parseInt(req.query.height);
    }

    var params = [ ];

    if (!isNaN(w)) {
        params.push('width=' + w);
    }

    if (!isNaN(h)) {
        params.push('height=' + h);
    }

    var url = '/images/img/' + img['_id'];

    if (url == '') {
        return res.redirect('/img/zast3.png');
    }

    if (params.length > 0) {
        url += params.reduce(function(total, item, index) {
            var val = total;
            if (index > 0) {
                val += '&';
            }
            val += item;
            return val;
        }, '?');
    }
    return res.redirect(url);
}

module.exports = function(app) {

    const router = express.Router();

    router.route('/my')
        .all(function(req, res, next) {
            if (!req.user) {
                // TODO: send empty user image
                return res.status(401).send('Unauthorized');
            }

            next();
        })
        .get(function(req, res) {

            navigateToUserImage(req, res, req.user);

        });

    // looking for user's image by USER ID
    router.route('/user/:id')
        .get(function(req, res) {

            User.findById(req.params['id'], function(err, user) {
                if (err) {
                    return res.status(500).send({ error: err });
                }
                if (user) {
                    return navigateToUserImage(req, res, user);
                } else {
                    return res.status(404).send('Not found');
                }
            });

        });

    // looking for user's image by IMAGE ID
    router.route('/user-image/:id')
        .get(function(req, res) {
            var id = req.params['id'];
            UserImage.findById(id, function(err, item) {
                if (err || !item) {
                    return res.status(405).send('unknown user image');
                }
                processImage(req, res, item.img.contentType, item.img.data);
            });
        });

    router.route('/video-title/:id')
        .get(function(req, res) {
            var id = req.params['id'];
            Image.findOne({ videoTitle: id })
                // .select('_id')
                .exec(function(err, item) {
                    if (err || !item) {
                        // return res.status(404).send('image not found');
                        return res.redirect('/img/zast3.png');
                    }

                    processImage(req, res, item.img.contentType, item.img.data);

                    // navigateToVideoImage(req, res, null, item);
                });
        });

    router.route('/img/:id')
        .get(function(req, res) {
            var id = req.params['id'];
            Image.findById(id, function(err, item) {
                if (err || !item) {
                    return res.status(404).send('unknown image');
                }
                processImage(req, res, item.img.contentType, item.img.data);
            });
        });

    router.route('/flash/:id')
        .get(function(req, res) {

            var id = req.params['id'];
            Flash.findById(id, function(err, item) {

                if (err || !item) {
                    res.status(405).send('unknown flash image');
                    return;
                }

                processImage(req, res, item.img.contentType, item.img.data);

            });
        });

    router.route('/tag')
        .get((req, res) => {
            async.waterfall([
                (callback) => {
                    const { t: tag } = req.query;
                    return callback(null, tag);
                },
                (tag, callback) => {
                    models.VideoTitle
                        .find({ isPublic: true, tags: tag })
                        .select({ _id: 1 })
                        .sort({ 'views-count': -1 })
                        .limit(1)
                        .exec(callback);
                },
                (videos, callback) => {
                    const [ video ] = videos || [];
                    if (!video) {
                        return callback('Now images in that tag');
                    }
                    return callback(null, video._id);
                },
                (id, callback) => {
                    Image.findOne({ videoTitle: id }).exec(callback);
                },
                (image, callback) => {
                    if (!image) {
                        return callback('Image not found')
                    }
                    return callback(null, image);
                },
            ], (err, result) => {
                if (err) {
                    return res.redirect('/img/zast3.png');
                }
                const { contentType, data } = result.img;
                processImage(req, res, contentType, data);
            });
        });

    return router;

};
