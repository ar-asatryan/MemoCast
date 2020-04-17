const express = require('express');
const crypto = require('crypto');
const models = require('../../../config/models');
const presentation = require('../../../config/presentation');
const async = require('async');
const mongoose = require('mongoose');

function random (howMany, chars) {
    chars = chars
        || "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    var rnd = crypto.randomBytes(howMany)
        , value = new Array(howMany)
        , len = chars.length;

    for (var i = 0; i < howMany; i++) {
        value[i] = chars[rnd[i] % len]
    };

    return value.join('');
}

function rokuAuthCheck (req, res, next) {
    if (req.user) {
        return next()
    } else {
        return res.send({ Error : 'Invalid token' });
    }
}

module.exports = function () {

    let router = express.Router();

    // router.use(rokuAuthCheck);

    // hello test service
    router.route('/hello')
        .get(function (req, res) {
            res.send({ hello : 'world', version: 'node.js' });
        });

    // link device
    router.route('/link')
        .get(function functionName(req, res) {
            let code = req.query['code'];
            let token = random(64);
            async.waterfall([
                // check auth code
                function (callback) {
                    let query = { code : code };
                    models.RokuActivationCode.findOne(query, function (err, item) {
                        if (item) {
                            return callback(null, item);
                        } else {
                            return callback({ Error: "Incorrect activation code" });
                        }
                    });
                },
                // create roku device link
                function (item, callback) {
                    models.RokuDevice.create({
						user: item.user,
						createDate: new Date(),
						token: token
					}, function(err, doc) {
						return callback(err, { token : token });
					})
                }
            ], function (err, result) {
                if (err) {
                    return res.send(err);
                } else {
                    res.send(result);
                }
            });

        });

    // auth check
    router.use('/authcheck', rokuAuthCheck);
    router.route('/authcheck')
        .get(function (req, res) {
            if (req.activeSubscription) {
                res.send({ Status : 'OK' });
            } else {
                res.send({
                    Message : "Need upgrade subscription",
                    NeedUpgrade : true
                });
            }
        })

    // new videos
    router.route('/new')
        .get(function (req, res) {
            models.VideoTitle.find({ isPublic : true })
                .populate('categories')
                .sort({ createDate: 'desc' })
                .limit(20)
                .exec(function(err, items) {
                    let data = presentation.VideoTitles(items);
                    res.send(data);
                });
        });

    // top movies
    router.route('/top')
        .get(function (req, res) {
            models.VideoTitle.find({ isPublic : true })
                .populate('categories')
                .sort({ 'views-count': 'desc' })
                .limit(20)
                .exec(function(err, items) {
                    let data = presentation.VideoTitles(items);
                    res.send(data);
                });
        });

    // history
    router.use('/history', function (req, res, next) {
        if (req.user) {
            next();
        } else {
            res.send([]);
        }
    });

    router.route('/history')
        .get(function (req, res) {
            models.VideoHistory.find({ user: req.user['_id'] })
                .sort({ updateDate: 'desc' })
                .populate('videoTitle')
                .limit(20)
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

                        res.send(videos);
                    });
            });
        });

    router.use('/history-update', function (req, res, next) {
        if (req.user) {
            next();
        } else {
            res.send([]);
        }
    });

    router.route('/history-update')
        .get(function (req, res) {

            async.waterfall([
                // init input options
                function (callback) {
                    let VideoItemID = mongoose.Types.ObjectId(req.query['item']);
                    let time = parseFloat(req.query['time']);
                    if (isNaN(time)) { time = 0; }
                    let finished = false;
                    let options = {
                        item : VideoItemID,
                        time : time,
                        finished : finished
                    };
                    callback(null, options);
                },
                // load video item
                function (options, callback) {
                    let query = { _id : options.item };
                    models.VideoItem.findOne(query)
                        .exec(function (err, doc) {
                            if (err) {
                                return callback(err, null);
                            }
                            if (!doc) {
                                return callback({ Error : 'video item with id ' + options.item + ' not found' }, null);
                            }
                            options.item = doc;
                            callback(null, options);
                        });
                },
                // remove obsolete item from watch history
                function (options, callback) {
                    let query = {
                        videoTitle : options.item.videoTitle,
                        user : req.user._id
                    };
                    let update = {
                        $set: {
                            updateDate: new Date(),
                            videoTitle: options.item.videoTitle,
                            user: req.user._id
                        },
                        $pull: {
                            itemTimeStamps: {
                                videoItem: options.item._id
                            }
                        }
                    };
                    models.VideoHistory.findOneAndUpdate(
                        query,
                        update,
                        { upsert : true, new : true },
                        function (err, doc) {
                            if (err) {
                                return callback(err, null);
                            } else {
                                callback(null, options);
                            }
                        });
                },
                // insert new item to history
                function (options, callback) {
                    let query = {
                        videoTitle : options.item.videoTitle,
                        user : req.user._id
                    };
                    let update = {
                        $set: {
                            updateDate: new Date(),
                            videoTitle: options.item.videoTitle,
                            user: req.user._id
                        },
                        $push: {
                            itemTimeStamps: {
                                videoItem: options.item._id,
                                finished: options.finished,
                                time: options.time,
                                createDate: new Date()
                            }
                        }
                    };
                    models.VideoHistory.findOneAndUpdate(
                        query,
                        update,
                        { upsert : true, new : true },
                        function (err, doc) {
                            if (err) {
                                return callback(err, null);
                            } else {
                                options.history = doc;
                                callback(null, options);
                            }
                        });
                }
            ], function (err, result) {
                if (err) {
                    res.send(err);
                } else {
                    res.send(result);
                }
            });
        });

    // video details
    router.use('/video/:titleid', rokuAuthCheck);

    router.route('/video/:titleid')
        .get(function (req, res) {
            let itemID = req.query['item'];
            let titleID = req.params['titleid'];
            async.waterfall([
                // load video title
                function (callback) {
                    let query = { _id : titleID };
                    models.VideoTitle.findOne(query)
                        .exec(function (err, item) {
                            if (!item) {
                                callback({ message : 'Video with id ' + titleID + ' was not founded'});
                            } else {
                                let data = { title : item, startTime : 0 };
                                callback(null, data);
                            }
                        });
                },
                // load item from history
                function (data, callback) {
                    // if we got item id from url - skip history check
                    if (itemID && itemID != '') {
                        return callback(null, data);
                    }

                    let query = { user : req.user._id, videoTitle : titleID };
                    models.VideoHistory.findOne(query, function (err, doc) {
                        if (doc) {
                            if (doc.itemTimeStamps) {
                                if (doc.itemTimeStamps.length > 0) {
                                    let historyItem = doc.itemTimeStamps[doc.itemTimeStamps.length-1];
                                    data.startTime = historyItem.time;
                                    itemID = historyItem.videoItem;
                                }
                            }
                        }
                        callback(err, data);
                    });
                },
                // load item from query
                function (data, callback) {
                    let query = { status : 'ready', videoTitle : data.title._id };
                    if (itemID && itemID != '') {
                        query._id = itemID;
                    }
                    let sort = { seasonIndex: 1, episodeIndex: 1, title: 1 };
                    models.VideoItem.find(query)
                        .select({ _id : 1, title : 1, year : 1, episodeNumber : 1, seasonIndex : 1 })
                        .sort(sort)
                        .limit(1)
                        .exec(function (err, items) {
                            if (err) {
                                callback({ message : 'No items found for video title'});
                            } else if (items.length == 0) {
                                callback({ message : 'No items found for video title'});
                            } else {
                                data.currentItem = items[0];
                                callback(null, data);
                            }
                        })
                },
                // load other items for title
                function (data, callback) {
                    let query = { status : 'ready', videoTitle : data.title._id };
                    let sort = { seasonIndex: 1, episodeIndex: 1, title: 1 };
                    models.VideoItem.find(query)
                        .select({ _id : 1, title : 1, year : 1, episodeNumber : 1, seasonIndex : 1 })
                        .sort(sort)
                        .exec(function (err, items) {
                            data.items = items;
                            callback(err, data);
                        });
                },
                // load video tracks
                function (data, callback) {
                    let query = { videoItem: data.currentItem._id, type: 'stream' };
                    let sort = { size: 1 };
                    models.File.find(query)
                        .sort(sort)
                        .exec(function (err, items) {
                            data.tracks = items;
                            callback(err, data);
                        });
                },
                // pack all data to presentation
                function (data, callback) {
                    let p = {
                        title : presentation.VideoTitle(data.title),
                        item : presentation.VideoItem(data.currentItem),
                        items : data.items.map(function (item) {
                            return presentation.VideoItem(item);
                        }),
                        tracks : data.tracks.map(function (item) {
                            const file = presentation.File(item);
                            file.http = file.rokuPath || (file.http || '').replace('https://', 'http://');
                            if (file.rokuPath) {
                              delete file.rokuPath;
                            }
                            return file;
                        })
                    };
                    // exlude top quality track (if tracks length >= 2)
                    // p.tracks = p.tracks.length > 1 ? p.tracks.slice(0, p.tracks.length - 1) : p.tracks;
                    callback(null, p);
                }
            ], function (err, data) {
                if (err) {
                    res.send({ Error : err });
                } else {
                    res.send(data);
                }
            })
        });

    // autocomplete
    router.route('/autocomplete')
        .get(function(req, res) {

            var searchString = req.query['search'];

            if (searchString && searchString != '') {

                var r = /[\d\wа-я]+/gi
                var matches = searchString.match(r);

                if (matches.length > 0) {

                    var query = { $or : [

                            { $and: matches.map(function(item) {
                            return { title: { $regex: item, $options: 'i' } }
                            })},

                            { $and: matches.map(function(item) {
                            return { searchTitle: { $regex: item, $options: 'i' } }
                            })}

                        ]};
                    query.isPublic = true;

                    models.VideoTitle.find(query)
                        .sort({ 'views-count': 'desc', title: 'asc' })
                        .select('title')
                        .limit(3)
                        .exec(function(err, items) {
                            if (err) {
                                res.status(500).send(err);
                            } else {
                                res.send(items.map(function(item) {
                                    return item.title;
                                }));
                            }
                        });

                } else {
                    res.send([]);
                }


    //                res.send({ search: searchString, matches: matches });
            } else {
                res.send([]);
            }

        });
    // search
    router.route('/search')
        .get(function(req, res) {

            var searchString = req.query['search'];

            if (searchString && searchString != '') {

                var r = /[\d\wа-я]+/gi
                var matches = searchString.match(r);

                if (matches.length > 0) {

                    var query = { $or : [

                            { $and: matches.map(function(item) {
                            return { title: { $regex: item, $options: 'i' } }
                            })},

                            { $and: matches.map(function(item) {
                            return { searchTitle: { $regex: item, $options: 'i' } }
                            })}

                        ]};
                    query.isPublic = true;

                    models.VideoTitle.find(query)
                        .sort({ 'views-count': 'desc', title: 'asc' })
                        .limit(20)
                        .exec(function(err, items) {
                            if (err) {
                                res.status(500).send(err);
                            } else {
                                res.send(items.map(function(item) {
                                    return presentation.VideoTitle(item);
                                }));
                            }
                        });

                } else {
                    res.send([]);
                }


    //                res.send({ search: searchString, matches: matches });
            } else {
                res.send([]);
            }

        });

    return router;

};
