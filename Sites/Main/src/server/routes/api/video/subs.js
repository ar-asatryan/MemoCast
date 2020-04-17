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
    let User = models.User;
    let UserFollower = models.UserFollower;

    let router = express.Router();

    router.use('/my', authCheck);
    router.route('/my/')
        .get(function (req, res) {
            let query = { user : req.user._id };
            let sort = { createDate : -1 };
            models.VideoSubscription.find(query)
                .sort(sort)
                .populate('videoTitle')
                .exec(function (err, items) {
                    if (err) {
                        return res.status(500).send(err);
                    } else {
                        res.send(items.map(function (item) {
                            return presentation.VideoSubscription(item);
                        }));
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

    router.use('/:videoTitleID', authCheck);
    // router.post('/:videoTitleID', authCheck);
    // router.delete('/:videoTitleID', authCheck);

    router.route('/:videoTitleID')
        .get(function (req, res) {
            let query = { user : req.user._id, videoTitle : req.videoTitle._id };
            models.VideoSubscription.find(query)
                .exec(function (err, items) {
                    if (err) {
                        return res.status(500).send(err);
                    } else {
                        res.send(items.map(function (item) {
                            return presentation.VideoSubscription(item);
                        }));
                    }
                });
        })
        .post(function (req, res) {

            let lk = { user: req.user._id, videoTitle: req.videoTitle._id, createDate: Date.now() };
            let query = { user: req.user._id, videoTitle: req.videoTitle._id };
            let options = { new: true, upsert: true, setDefaultsOnInsert: true };
            models.VideoSubscription.findOneAndUpdate(query, lk, options, function (err, item) {
                if (err || !item) {
                    res.status(500).send({ error: err });
                } else {
                    let data = presentation.VideoSubscription(item);
                    res.send(data);
                }
            });

        })
        .delete(function(req, res) {

            let query = { user: req.user._id, videoTitle: req.videoTitle._id };
            models.VideoSubscription.findOneAndRemove(query, function (err, item) {
                if (err) {
                    res.status(500).send({ error: err });
                } else {
                    res.send({ status: 'removed' });
                }
            });

        });

    return router;

};
