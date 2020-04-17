const express = require('express');
const mongoose = require('mongoose');
const models = require('../config/models');
const presentation = require('../config/presentation');
const localization = require('../config/localization/localization');
const io = require('../config/io');
const async = require('async');

let localeString = localization.localeString;

module.exports = function() {

    let router = express.Router();

    let User = models.User;
    let Comment = models.Comment;
    let VideoItem = models.VideoItem;
    let VideoTitle = models.VideoTitle;
    let VideoLike = models.VideoLike;
    let UserFollower = models.UserFollower;

    const tsInDay = 1000 * 60 * 60 * 24;

    router.use('/', function (req, res, next) {
        if (req.user) {
            return next();
        } else {
            var sess = req.session;
            sess['redirect-after-login'] = req.originalUrl;
            res.redirect('/login');
        }
    });

    router.route('/')
        .get(function(req, res) {
            res.render('people/browse');
        });

    router.route('/commentators')
        .get(function (req, res) {
            async.waterfall([
                // load top commentators from db
                function (callback) {
                    // today day
                    let today = new Date();
                    // 7 days before today
                    let startDate = new Date(today - 7 * tsInDay);
                    Comment.aggregate(
                        { $match: { createDate: { $gt: startDate } } },
                        { $group: { _id: '$user', count: { $sum: 1 } } },
                        { $match: { _id: { $ne : null } }},
                        { $sort: { count: -1 } },
                        { $limit: 20 },
                        { $lookup: {
                                from: 'users',
                                localField: '_id',
                                foreignField: '_id',
                                as: 'users'
                            }
                        },
                        function (err, items) {
                            callback(err, items);
                        });
                },
                // format users for presentation
                function (items, callback) {
                    let users = items.filter(function (item) {
                        if (item.users) {
                            if (item.users.length > 0) {
                                return true;
                            }
                        }
                        return false;
                    });
                    users = users.map(function (item) {
                        return presentation.User(item['users'][0]);
                    });
                    callback(null, { users: users });
                }
            ], function (err, result) {

                if (err) {
                    return res.render('helpers/error', { layout: 'main', error: err });
                }

                if (result) {
                    result['user-list-title'] = localeString(req.locale, {
                        ru: 'Активные комментаторы фильмов',
                        en: 'Active commentators'
                    });
                    result['user-list-description'] = localeString(req.locale, {
                        ru: 'Самые активные комментаторы фильмов за неделю.',
                        en: 'Most active commentators for last week.'
                    });
                }

                result.layout = 'main';
                res.render('people/users', result);
            });
        });

    router.route('/leaders')
        .get(function (req, res) {
            async.waterfall([
                // load top leaders (by fallowers count) from db
                function (callback) {
                    // today day
                    let today = new Date();
                    // 7 days before today
                    let startDate = new Date(today - 7 * tsInDay);
                    UserFollower.aggregate()
                    Comment.aggregate(
                        // { $match: { createDate: { $gt: startDate } } },
                        { $group: { _id: '$user', count: { $sum: 1 } } },
                        // { $match: { _id: { $ne : null } }},
                        { $sort: { count: -1 } },
                        { $limit: 20 },
                        { $lookup: {
                                from: 'users',
                                localField: '_id',
                                foreignField: '_id',
                                as: 'users'
                            }
                        },
                        function (err, items) {
                            callback(err, items);
                        });
                },
                // format users for presentation
                function (items, callback) {
                    let users = items.filter(function (item) {
                        if (item.users) {
                            if (item.users.length > 0) {
                                return true;
                            }
                        }
                        return false;
                    });
                    users = users.map(function (item) {
                        return presentation.User(item['users'][0]);
                    });
                    callback(null, { users: users });
                }
            ], function (err, result) {

                if (err) {
                    return res.render('helpers/error', { layout: 'main', error: err });
                }

                if (result) {
                    result['user-list-title'] = localeString(req.locale, {
                        ru: 'Популярные пользователи',
                        en: 'Popular users'
                    });
                    result['user-list-description'] = localeString(req.locale, {
                        ru: 'Пользователи, у которых больше всего followers.',
                        en: 'Most followed users'
                    });
                }

                result.layout = 'main';
                res.render('people/users', result);
            });
        });

    router.route('/online')
        .get(function (req, res) {
            async.waterfall([
                // get online users ids
                function (callback) {
                    let ids = io.getOnlineUsers().map(function (id) {
                        return mongoose.Types.ObjectId(id);
                    });
                    User.aggregate(
                        { $match: { _id : { $in: ids } } },
                        { $sample: { size : 20 } },
                        function (err, items) {
                            callback(err, items);
                        });
                },
                // format users for presentation
                function (items, callback) {
                    let users = items.map(function (item) {
                        return presentation.User(item);
                    });
                    callback(null, { users: users });
                }
            ], function (err, result) {

                if (err) {
                    return res.render('helpers/error', { layout: 'main', error: err });
                }

                if (result) {
                    result['user-list-title'] = localeString(req.locale, {
                        ru: 'Сейчас на сайте',
                        en: 'Online users'
                    });
                    result['user-list-description'] = localeString(req.locale, {
                        ru: 'Случайная выборка пользователей, которые онлайн :) Не стесняйтесь "Обновить страницу" :)',
                        en: 'Random selection from online users ;) Feel free to refresh page ;)'
                    });
                }

                result.layout = 'main';
                res.render('people/users', result);
            });
        });

    // set user to display and redirect to profile if its current user
    router.use('/:id', function(req, res, next) {
        let id = req.params['id'];
        let query = { userID: id };

        if (mongoose.Types.ObjectId.isValid(id)) {
            query = { _id: id };
        }

        User.findOne(query, function(err, item) {
            if (!item) {
                res.redirect('/');
            } else {
                if (req.user) {
                    if (req.user['_id'].toString() == item['_id'].toString()) {
                        res.redirect('/profile');
                        return;
                    }
                }

                req.selectedUser = item;
                res.locals.selectedUser = presentation.User(item);
                next();
            }
        });

    });
    router.route('/:id')
        .get(function(req, res) {

            async.waterfall([
                // load user's likes
                function (callback) {
                    let query = { user: req.selectedUser._id };
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
                },
                // load user's comments
                // likes - video titles list
                function (likes, callback) {
                    Comment.find({ user: req.selectedUser._id })
                        .select('-user')
                        .sort({ createDate: 'desc' })
                        .populate('videoItem')
                        .populate('videoTitle', '-sinopsis -cast')
                        .limit(50)
                        .exec(function(err, items) {
                            if (err) {
                                return callback(err);
                            }
                            let docs = items.map(function(item) {
                                return presentation.Comment(item);
                            });
                            return callback(null, { likes: likes, comments: docs } );
                        });
                },
                // load followers
                function (data, callback) {
                    let query = { user: req.selectedUser._id };
                    UserFollower.find(query)
                        .select('follower')
                        .populate('follower')
                        .exec(function (err, items) {
                            if (err) {
                                return callback(err);
                            }
                            data.followers = items.map(function (item) {
                                return presentation.User(item.follower);
                            });
                            callback(null, data);
                        });
                    // });
                },
                // load following user's
                function (data, callback) {
                    let query = { follower: req.selectedUser._id };
                    UserFollower.find(query)
                        .select('user')
                        .populate('user')
                        .exec(function (err, items) {
                            if (err) {
                                return callback(err);
                            }
                            data.following = items.map(function (item) {
                                return presentation.User(item.user);
                            });
                            callback(null, data);
                        });
                },
                // load current watching video
                function (data, callback) {
                    let videoTitleID = io.getCurrentVideoTitleIDByUserID(req.selectedUser._id.toString());

                    if (videoTitleID && videoTitleID != '') {
                        VideoTitle.findById(videoTitleID)
                            .exec(function (err, item) {
                                if (item) {
                                    data.videoTitle = presentation.VideoTitle(item);
                                }
                                return callback(err, data);
                            })
                    } else {
                        return callback(null, data);
                    }
                }

            ], function (err, result) {
                if (req.user) {
                    let followingCheck = result.followers.filter(function (item) {
                        return item.id == req.user._id.toString();
                    });
                    if (followingCheck.length > 0) {
                        result.iAmFollower = true;
                    }
                }
                result.layout = 'main';
                res.render('people/publicprofile', result);
            });

        });

    router.route('/:id/comments')
        .get(function(req, res) {
            res.render('people/comments');
        });

    return router;

};
