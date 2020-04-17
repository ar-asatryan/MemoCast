let express = require('express');
let async = require('async');
let models = require('../../../config/models');
let io = require('../../../config/io');
let presentation = require('../../../config/presentation');
let rabbit = require('../../../config/rabbit');
let mongoose = require('mongoose');

let authCheck = function(req, res, next) {
    if (!req.user) {
        return res.status(403).send({ error: 'please authenticate first' });
    } // if !req.user
    next();
};

module.exports = function () {

    let VideoTitle = models.VideoTitle;
    let VideoLike = models.VideoLike;
    let User = models.User;
    let UserFollower = models.UserFollower;

    let router = express.Router();

    router.get('/user/:userID', function(req, res) {
        let userID = req.params['userID'];
        async.waterfall([
            // check UserID for valid ObjectID
            function (callback) {
                if (!mongoose.Types.ObjectId.isValid(userID)) {
                    return callback({ error: 'Incorrect user ID' });
                } else {
                    return callback(null, userID)
                }
            },
            // got all likes by user
            function (userID, callback) {
                let query = { user: userID };
                VideoLike.find(query)
                    .sort({ createDate: 'desc' })
                    .select('videoTitle')
                    .populate('videoTitle')
                    .exec(function (err, items) {
                        return callback(err, items);
                    });
            },
            // translate likes to video list
            function (likes, callback) {
                return callback(null, likes.map(function (item) {
                    return presentation.VideoTitle(item.videoTitle);
                }));
            }
        ], function (err, result) {
            if (err) {
                res.status(500).send(err);
            } else {
                res.send(result);
            }
        });
    });

    router.use('/:videoTitleID', function (req, res, next) {
        let videoTitleID = req.params['videoTitleID'];
        let query = { _id: videoTitleID };
        VideoTitle.findOne(query, function(err, item) {
            if (err) {
                res.status(404).send({
                    message: 'Video title with id \'' + videoTitleID + '\' not found',
                    error: err
                });
            } else {
                req.videoTitle = item;
                next();
            }
        });
    });

    router.post('/:videoTitleID', authCheck);
    router.delete('/:videoTitleID', authCheck);

    router.route('/:videoTitleID')
        .get(function(req, res) {
            async.waterfall([
                function (callback) {
                    let query = {
                        videoTitle: req.videoTitle['_id']
                    };
                    let select = '-videoTitle';
                    if (req.query['my'] == 'yes') {
                        if (req.user) {
                            select = '_id createDate';
                            query.user = req.user['_id'];
                        } else {
                            return callback('please authenticate first');
                        }
                    }
                    VideoLike.find(query)
                        .select(select)
                        .populate('user')
                        .sort({ 'createDate' : 'desc' })
                        .exec(function (err, items) {
                            return callback(err, items);
                        });
                }, function (items, callback) {
                    return callback(null, items.map(function (item) {
                        return presentation.VideoLike(item);
                    }));
                }
            ], function (err, result) {
                if (err) {
                    res.status(500).send({ error: err });
                } else {
                    res.send(result);
                }
            })

        })
        .post(function (req, res) {

            let lk = { user: req.user._id, videoTitle: req.videoTitle._id, createDate: Date.now() };
            let query = { user: req.user._id, videoTitle: req.videoTitle._id };
            let options = { new: true, upsert: true, setDefaultsOnInsert: true };
            VideoLike.findOneAndUpdate(query, lk, options, function (err, item) {
                if (err || !item) {
                    res.status(500).send({ error: err });
                } else {
                    let data = presentation.VideoLike(item);
                    res.send(data);
                    rabbit.notifyNewLike({ id: item._id });

                    let ioData = presentation.VideoLike(item);
                    ioData.videoTitle = presentation.VideoTitle(req.videoTitle);
                    ioData.user = presentation.User(req.user);
                    let envelope = {
                        type: 'like',
                        data: ioData
                    };
                    req.videoTitle.updateLikesStats();
                    UserFollower.find({ user: data.user })
                        .select('follower')
                        .exec(function (err, followers) {
                            if (followers) {
                                followers.forEach(function (item) {
                                    let f = item['follower'].toString();
                                    io.sendMessageToUser(f, envelope);
                                });
                            }
                        });
                }
            });

        })
        .delete(function(req, res) {

            let query = { user: req.user._id, videoTitle: req.videoTitle._id };
            VideoLike.findOneAndRemove(query, function (err, item) {
                if (err) {
                    res.status(500).send({ error: err });
                } else {
                    res.send({ status: 'removed' });
                    if (item) {
                        req.videoTitle.updateLikesStats();
                        rabbit.notifyObjectRemoval({ id: item._id });
                    }
                }
            });

        });

    return router;

};
