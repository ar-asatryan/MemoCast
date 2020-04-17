var express = require('express');
var presentation = require('../config/presentation');
var models = require('../config/models');
var async = require('async');
var feedController = require('../controllers/feed')();

module.exports = function() {

    var router = express.Router();
    var subsRouter = require('./subscription')();
    var imRouter = require('./profile/messages')();

    var VideoHistory = models.VideoHistory;
    var VideoTitle = models.VideoTitle;
    var VideoItem = models.VideoItem;
    var SubCategory = models.SubCategory;
    var VideoLike = models.VideoLike;
    var UserFollower = models.UserFollower;
    var FeedItem = models.FeedItem;

    router.use(function(req, res, next) {

        if (req.user) {
            res.locals.profileUser = presentation.User(req.user);
            next();
        } else {
            var sess = req.session;
            sess['redirect-after-login'] = req.originalUrl;
            res.redirect('/login');
        }

    });

    router.route('/')
        .get(function(req, res) {
            res.redirect('/profile/history');
//            res.render('profile/index', { layout: 'profile' });
        });

    router.route('/edit')
        .get(function(req, res) {

            var data = { layout: 'profile' };

            async.waterfall([
                function(callback) {
                    data['profile'] = presentation.User(req.user);
                    data['profile'].birthDate = req.user.birthDate;
                    callback(null, data);
                },
                function(data, callback) {
                    data.profile.email = req.user['email'];
                    callback(null, data);
                },
                function (data, callback) {
                    data.canChangePassword = !!req.user['local-credentials'];
                    callback(null, data);
                },
            ], function(err, result) {
                if (!err) {
                    res.render('profile/edit', result );
                }
            });
        });

    router.route('/change-password')
        .get((req, res) => {

          let canChangePassword = !!req.user['local-credentials'];

          if (canChangePassword) {
              res.render('profile/change-password', { layout: 'profile' });
          } else {
              res.redirect('/profile/edit');
          }

        });

    router.route('/edit-avatar')
        .get(function(req, res) {
            res.render('profile/edit-avatar', { layout: 'profile' } );
        });

    router.route('/welcome')
        .get(function(req, res) {
            res.render('profile/welcome', { layout: 'profile' });
        });

    router.route('/history')
        .get(function(req, res) {

            var query = { user: req.user['_id'] };

            VideoHistory.find(query)
                .sort({ updateDate: 'desc' })
                .populate('videoTitle')
                .exec(function(err, items) {

                    async.forEach(items, function (item, callback) {
                        item.videoTitle.populate('categories', function (err, output) {
                            callback();
                        });
                    }, function (err) {
                        var videos = items.map(function(item) {
                            var videoTitle = item['videoTitle'];
                            return presentation.VideoTitle(videoTitle);
                        });

                        var historyItems = presentation.VideoHistory(items);

                        res.render('profile/history', { layout: 'profile', history: historyItems, videos: videos });
                    });


                });

        });

    router.route('/feed')
        .get(function (req, res) {

            var params = {
                req: req,
                userID: req.user._id,
                limit: req.query.limit
            };

            feedController.processFeedRequest(params, function (err, result) {
                if (err) {
                    res.status(500).send(err);
                } else {
                    res.render('profile/feed', { layout: 'profile', feed: result.result });
                }
            });
        });

    router.route('/likes')
        .get(function (req, res) {

            var userID = req.user._id;
            async.waterfall([
                // got all likes by user
                function (callback) {
                    var query = { user: userID };
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
                    res.render('profile/likes', { layout: 'profile', likes: result });
                }
            });

        });

    router.use('/subscription', subsRouter);

    router.route('/comments')
        .get(function(req, res) {
            res.render('profile/comments', { layout: 'profile' });
        });

    router.route('/video-subscriptions')
        .get(function (req, res) {
            res.render('profile/video-subs', { layout: 'profile' });
        });

    router.route('/io')
        .get(function(req, res) {
            res.render('profile/io');
        });

    router.use('/im', imRouter);

    router.route('/followers')
        .get(function (req, res) {

            async.waterfall([
                // load followers
                function (callback) {
                    var query = { user: req.user._id };
                    UserFollower.find(query)
                        .select('follower')
                        .populate('follower')
                        .exec(function (err, items) {
                            if (err) {
                                return callback(err);
                            }
                            var data = items.map(function (item) {
                                return presentation.User(item.follower);
                            });
                            callback(null, data);
                        });
                    // });
                },

            ], function (err, result) {
                res.render('profile/followers', {
                    layout: 'profile',
                    followers: result
                });
            });

        });

        router.route('/following')
            .get(function (req, res) {

                async.waterfall([
                    // load followers
                    function (callback) {
                        var query = { follower: req.user._id };
                        UserFollower.find(query)
                            .select('user')
                            .populate('user')
                            .exec(function (err, items) {
                                if (err) {
                                    return callback(err);
                                }
                                var data = items.map(function (item) {
                                    return presentation.User(item.user);
                                });
                                callback(null, data);
                            });
                        // });
                    },

                ], function (err, result) {
                    res.render('profile/following', {
                        layout: 'profile',
                        following: result
                    });
                });

            });

    router.route('/video-requests')
        .get(function (req, res) {
            res.render('profile/videorequest', {
                layout: 'profile'
            });
        });

    router.route('/video-requests/new')
        .get(function (req, res) {
            res.render('profile/videorequest-new', {
                layout: 'profile',
                searchString: req.query['search']
            });
        });

    return router;

};
