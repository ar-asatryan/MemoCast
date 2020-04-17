var express = require('express');
var models = require('../config/models');
var presentation = require('../config/presentation');
var cache = require('../config/cache');
var async = require('async');
const io = require('../config/io');
const feedController = require('../controllers/feed')();

const { getTopTags } = require('selectors/tags');

module.exports = function(req, res) {

    var VideoTitle = models.VideoTitle;
    var VideoHistory = models.VideoHistory;

    var tasks = {
        'flash': function (callback) {

            const cacheKey = 'cache:page:index:flash';

            cache.get(cacheKey, (err, data) => {
                if (!!data) {
                    return callback(null, data);
                }

                // no cache - loading data from db
                models.Flash.find({ isPublic: true })
                    .select('-img -order -__v -createDate -isPublic')
                    .sort({ order: 'desc' })
                    .lean()
                    .exec(function(err, items) {
                        callback(err, items);
                        cache.set(cacheKey, items, 30 * 60, cache.emptyCallback);
                    });
            });

        },
        'new-videos': function(callback) {

            const cacheKey = 'cache:pages:index:new-videos';

            async.waterfall([
                function (cb) {
                    cache.get(cacheKey, cb);
                },
                function (cacheValue, cb) {
                    if (cacheValue) {
                        return cb(null, cacheValue);
                    }

                    VideoTitle.find({ isPublic : true })
                        .populate('categories')
                        .sort({ createDate: 'desc' })
                        .limit(6)
                        .lean()
                        .exec(function(err, items) {

                        const data = presentation.VideoTitles(items);

                        cb(err, data);
                        cache.set(cacheKey, data, 30 * 60, function (err) {
                            if (err) {
                            }
                        });

                    });
                }
            ], function (err, result) {
                callback(err, result);
            });
        },
        'online': function (cb) {
            async.waterfall([
                // get current movies from app
                function (callback) {
                    let list = io.getCurrentMovies();
                    if (list) {
                        if (list.length > 6) {
                            list = list.slice(0, 6);
                        }
                    }
                    callback(null, list);
                },
                // load movies data from db
                function (list, callback) {
                    let ids = list.map(function (item) {
                        return item.id;
                    });
                    if (ids.length == 0) {
                        return callback(null, { videos: [] } );
                    }
                    VideoTitle.find({ _id : { $in : ids } })
                        .select('-sinopsis')
                        .populate('categories')
                        .exec(function (err, items) {
                            if (err) { return callback(err); }
                            let videos = { };
                            for (let i = 0; i < list.length; i++) {
                                let video = list[i];
                                videos[video.id] = video;
                            }
                            for (let i = 0; i < items.length; i++) {
                                let item = items[i];
                                let id = item['_id'].toString();
                                let video = videos[id];
                                if (video) {
                                    video.item = item;
                                }
                            }
                            let data = {
                                videos: list.filter(function (item) {
                                    let video = videos[item.id];
                                    return video.item;
                                })
                            }
                            callback(null, data);
                        });
                },
                // format videos for presentation
                function (data, callback) {
                    data.videos = data.videos.map(function (video) {
                        return presentation.VideoTitle(video.item);
                    });
                    callback(null, data.videos);
                }
            ], function (err, result) {
                cb(err, result);
            });
        },
        'kids': function (cb) {

            const cacheKey = 'cache:page:index:kids';

            cache.get(cacheKey, (err, data) => {
                if (!!data) {
                    return cb(null, data);
                }

                models.SubCategory.find({ kids : true })
                    .select({ _id : 1 })
                    .lean()
                    .exec(function (err, cats) {
                        models.VideoTitle.find({ isPublic : true, categories : { $in : cats } })
                            .sort({'views-count' : -1})
                            .limit(6)
                            .populate('categories')
                            .lean()
                            .exec(function (err, items) {
                                let videos = items.map(function (video) {
                                    return presentation.VideoTitle(video);
                                });
                                cb(err, videos);
                                cache.set(cacheKey, videos, 30 * 60, cache.emptyCallback);
                            });
                    });
            });


        },
        'categories': function (cb) {

            const cacheKey = 'cache:page:index:categories';

            cache.get(cacheKey, (err, data) => {
                if (!!data) {
                    return cb(null, data);
                }

                let categories = [];
                models.SubCategory.find({ public : true, popular : true })
                    .sort({ order : 1 })
                    // .limit(5)
                    .lean()
                    .exec(function (err, items) {
                        if (err) {
                            return cb(err);
                        }
                        async.each(items, function (item, categoryCallback) {
                            let category = {
                                title : item.title,
                                id : item._id
                            }
                            let query = {
                                isPublic: true,
                                categories: item['_id']
                            };
                            models.VideoTitle.find(query)
                                .sort({ 'views-count' : -1 })
                                .limit(6)
                                .populate('categories')
                                .lean()
                                .exec(function (err, items) {
                                    category.videos = items.map(function (video) {
                                        return presentation.VideoTitle(video);
                                    });
                                    categories.push(category);
                                    categoryCallback(err, category);
                                })
                        }, function (err) {
                            if (err) {
                                return cb(err);
                            } else {
                                return cb(null, categories);
                                cache.set(cacheKey, categories, 30 * 60, cache.emptyCallback);
                            }
                        });
                    });
            });


        },
        'tags': (cb) => {

            const cacheKey = 'cache:page:index:tags';

            cache.get(cacheKey, (err, data) => {
                if (!!data) {
                    return cb(null, data);
                }

                getTopTags({ limit: 6 })
                    .then((tags) => {
                        cb(null, tags);
                        cache.set(cacheKey, tags, 30 * 60, cache.emptyCallback);
                    })
                    .catch(err => cb(err));
            });


        },
    };

    if (req.user) {
        tasks['history'] = function(callback) {
            VideoHistory.find({ user: req.user['_id'] })
                .sort({ updateDate: 'desc' })
                .populate('videoTitle')
                .limit(6)
                .exec(function(err, items) {

                    async.forEach(items, function (item, callback) {
                        item.videoTitle.populate('categories', function (err, output) {
                            callback();
                        })
                    }, function (err) {
                        var videos = items.map(function(item) {
                            var videoTitle = item['videoTitle'];
                            return presentation.VideoTitle(videoTitle);
                        });

                        callback(null, videos);
                    });
            });
        }
        tasks['feed'] = callback => {
            let options = {
                req: req,
                userID: req.user._id,
                limit: 10
            };
            feedController.processFeedRequest(options, (err, result) => {
                if (err) {
                    return callback(err, null);
                }
                if (result) {
                    if (result.result) {
                        if (result.result.length > 0) {
                            return callback(null, result.result);
                        }
                    }
                }
                callback(null, null);
            });
        }
    }

    async.parallel(tasks, function (err, result) {
        res.locals.user = presentation.User(req.user);
        res.render('home', result);
    });

};
