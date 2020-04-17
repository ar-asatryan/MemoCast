var express = require('express');
var async = require('async');
var models = require('../../config/models');
var presentation = require('../../config/presentation');
var mongoose = require('mongoose');

module.exports = function() {

    var UserVideoTitleRating = models.UserVideoTitleRating;
    var VideoTitle = models.VideoTitle;

    var router = express.Router();

    // check user's authentication
    router.use(function (req, res, next) {
        if (!req.user) {
            return res.status(403).send({ error: 'please authenticate first' });
        }
        next();
    });

    router.route('/')
        .post(function (req, res) {
            var VideoTitleID = req.body['id'];
            var UserID = req.user._id;
            var Rating = parseInt(req.body['rating']);
            async.waterfall([
                function(callback) {
                    if (!mongoose.Types.ObjectId.isValid(VideoTitleID)) {
                        return callback({ error: 'Incorrect video title id'});
                    }
                    if (isNaN(Rating)) {
                        return callback({ error: 'Incorrect rating' });
                    }
                    return callback(null, VideoTitleID, UserID, Rating);
                },
                function(videoID, userID, rating, callback) {
                    var query = { videoTitle: videoID, user: userID };
                    var update = {
                        createDate: new Date,
                        user: userID,
                        videoTitle: videoID,
                        rating: rating
                    };
                    var options = {
                        new: true,
                        upsert: true,
                        runValidators: true
                    };
                    UserVideoTitleRating.findOneAndUpdate(query, update, options, function(err, doc) {
                        return callback(err, doc);
                    });
                },
                function(item, callback) {
                    UserVideoTitleRating.aggregate(
                        { $match: { videoTitle: item['videoTitle'] } },
                        { $group: { _id: '$videoTitle', votes: { $sum: 1 }, rating: { $avg: '$rating' } } },
                        function (err, result) {
                            return callback(err, result);
                        }
                    );
                },
                function(stats, callback) {

                    if (stats.length == 0) {
                        return callback({ error: 'Video rating update error' });
                    }

                    var data = stats[0];
                    var query = { _id: data._id };
                    var update = { $set: { 'user-rating' : { rating: data.rating, votes: data.votes } } };
                    var options = {
                        new: true,
                        upsert: false
                    };
                    VideoTitle.findOneAndUpdate(query, update, options, function(err, item) {
                        return callback(err, item);
                    });
                },
                function (item, callback) {
                    if (!item) {
                        return callback({ error: 'Video not found'});
                    }
                    return callback(null, item['user-rating']);
                }
            ], function (err, result) {
                if (err) {
                    return res.status(500).send(err);
                }
                res.send(result);
                // res.send({ message: 'Video rating was updated' });
            });
        });

    return router;

};
