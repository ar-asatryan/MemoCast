const express = require('express');
const async = require('async');
let models = require('../config/models');
let presentation = require('../config/presentation');
let cache = require('../config/cache');

let VideoTitle = models.VideoTitle;
let VideoItem = models.VideoItem;
let VideoFile = models.File;
let VideoHistory = models.VideoHistory;

const objectIDTemplate = /^[0-9a-f]{24}$/i;
const numericIndexTemplate = /^\d+$/;

module.exports = function() {

    const router = express.Router();

    const navigateToVideoItem = function(req, res, doc, videoTitle) {

        if (!videoTitle || !doc) {
            return res.redirect('/');
        }

        let titleID = videoTitle['titleID'];
        let videoTitleID = videoTitle['_id'];
        let link = '/video/';
        link += titleID ? titleID : videoTitleID;
        link += '/';
        let seasonIndex = doc['seasonIndex'];
        let episodeIndex = doc['episodeIndex'];
        // link += episodeIndex ? episodeIndex : doc['_id'];
        link += doc['_id'];
        if (seasonIndex) {
           link += '?season=' + seasonIndex;
        }
        res.redirect(link);
    };

    router.route('/')
        .get(function(req, res) {
            let videoTitle = req['video-title'];

            let videoTitleID = videoTitle['_id'];

            let query = { videoTitle: videoTitleID, status: 'ready' };
            let fields = { _id: 1, episodeIndex: 1, seasonIndex: 1 };

            VideoItem.find(query)
                .sort({ seasonIndex: 1, episodeIndex: 1, title: 1 })
                .select(fields)
                .lean()
                .exec(function(err, docs) {

                    if (req.user) {

                        VideoHistory.findOne({
                            videoTitle: videoTitleID,
                            user: req.user['_id']
                        }, function(err, item) {
                            if (item) {
                                let foundedItem = null;
                                if (item.itemTimeStamps) {
                                    if (item.itemTimeStamps.length > 0) {
                                        let historyItem = item.itemTimeStamps[item.itemTimeStamps.length - 1];
                                        for (let i = 0; i < docs.length; i++) {
                                            let videoItem = docs[i];
                                            if (videoItem['_id'].equals(historyItem.videoItem)) {
                                                foundedItem = videoItem;
                                                if (historyItem.finished && ((i + 1) < docs.length)) {
                                                    foundedItem = docs[i+1];
                                                }
                                                break;
                                            }
                                        }
                                    }
                                }
                                if (!foundedItem) {
                                    foundedItem = docs[0];
                                }
                                navigateToVideoItem(req, res, foundedItem, videoTitle);
                            } else {
                                navigateToVideoItem(req, res, docs[0], videoTitle);
                            }
                        });

                    } else {

                        let ok = false;
                        if (!err) {
                           let doc = docs[0];
                           if (doc) {
                               ok = true;
                               navigateToVideoItem(req, res, doc, videoTitle);
                           }
                        }
                        if (!ok) {
                            res.redirect('/');
                        }

                    }
                });
        });

    // check for one video
    router.use('/:id', function(req, res, next) {

        let videoItemID = req.params['id'];
        let videoTitle = req['video-title'];

        if (!videoTitle) { return res.redirect('/'); }

        let cacheKey = 'cache:pages:video:' + videoTitle._id + ':item';

        let query = { videoTitle: videoTitle._id, status: 'ready' };
        if (objectIDTemplate.test(videoItemID)) {
            query['_id'] = videoItemID;
            cacheKey += ':id:' + videoItemID;
        } else if (numericIndexTemplate.test(videoItemID)) {
            query['episodeIndex'] = parseInt(videoItemID);
            cacheKey += ':episode:' + query['episodeIndex'];
            let season = req.query['season'];
            if (numericIndexTemplate.test(season)) {
                query['seasonIndex'] = parseInt(season);
                cacheKey += ':season:' + query['seasonIndex'];
            }
        } else {
            res.redirect('/');
            return;
        }

        async.waterfall([
            // check video item in cache
            function (callback) {
                cache.get(cacheKey, callback);
            },
            // load video item from db
            function (cacheValue, callback) {
                if (cacheValue) { return callback(null, cacheValue); }

                VideoItem.findOne(query)
                    .lean()
                    .exec(function(err, doc) {
                        if (doc) {
                            callback(null, doc);
                            req['video-item'] = doc;
                            cache.set(cacheKey, doc, 30 * 60, cache.emptyCallback);
                        } else {
                            return callback({ message: 'Video Item not found' });
                        }
                    });
            },
            // load files from cache
            function (videoItem, callback) {
                req['video-item'] = videoItem;
                let cacheKey = 'cache:pages:video:' + videoTitle._id + ':item:' + videoItem['_id'] + ':files';
                cache.get(cacheKey, function (err, cacheValue) {
                    callback(err, cacheValue, videoItem);
                });
            },
            // load item's files from db
            function (cacheValue, videoItem, callback) {
                if (cacheValue) { return callback(null, cacheValue, videoItem); }
                let cacheKey = 'cache:pages:video:' + videoTitle._id + ':item:' + videoItem['_id'] + ':files';
                VideoFile.find({ videoItem: videoItem['_id'], type: 'stream' })
                    .sort({ size: -1 })
                    .lean()
                    .exec(function(err, docs) {
                        callback(err, docs, videoItem);
                        if (docs) {
                            cache.set(cacheKey, docs, 30 * 60, cache.emptyCallback);
                        }
                    });
            },
            function (files, videoItem, callback) {
                let data = { files: files, item: videoItem };
                req['video-item-files'] = files;
                callback(null, data);
            }
        ], function (err, doc) {
            if (!err) {
                next();
            } else {
                res.redirect('/');
            }
        });
    });

    // check for all videos in title
    router.use('/:id', function(req, res, next) {

        const videoTitleID = req['video-title']._id;

        const cacheKey = 'cache:pages:video:' + videoTitleID + ':items';

        async.waterfall([
            function (callback) {
                cache.get(cacheKey, callback);
            },
            function (cacheValue, callback) {
                if (cacheValue) { return callback(null, cacheValue); }
                VideoItem.find({
                    videoTitle: videoTitleID,
                    status: 'ready',
                    isPublic: true })
                    .sort({ seasonIndex: 1, episodeIndex: 1, title: 1 })
                    .lean()
                    .exec(function(err, docs) {
                        if (!err && docs) {
                            callback(null, docs);
                            cache.set(cacheKey, docs, 30 * 60, cache.emptyCallback);
                        } else {
                            return callback({ error: 'Video items not found' });
                        }
                    });
            }
        ], function (err, result) {
            if (!err) {
                req['video-items'] = result;
                next();
            } else {
                res.redirect('/');
            }
        });
    });

    // recomended videos
    router.use('/:id', function (req, res, next) {

        const videoTitleID = req['video-title']._id;
        const cacheKey = 'cache:pages:video:' + videoTitleID + ':recomended';

        cache.get(cacheKey, (err, data) => {
            if (!!data) {
                req.recomendations = data;
                return next();
            }

            async.waterfall([
                // get all recomended videos
                function (callback) {
                    let id = req['video-title']['_id'];
                    let query = { isPublic : true, _id: { $ne: id } };
                    let sort = { 'views-count' : -1 };
                    let limit = 20;
                    VideoTitle.find(query)
                        .sort(sort)
                        .limit(limit)
                        .lean()
                        .exec(callback);
                },
                // format videos for presentation
                function (videos, callback) {
                    let data = videos.map(function (item) {
                        return presentation.VideoTitle(item);
                    });
                    callback(null, data);
                }
            ], function (err, result) {
                if (result) {
                    req.recomendations = result;
                    cache.set(cacheKey, result, 30 * 60, cache.emptyCallback);
                }
                next();
            });
        });


    });

    router.route('/:id')
        .get(function(req, res) {
            let videoTitle = req['video-title'];

            let videoItem = req['video-item'];

            let video = videoItem;

            let presentationObject = videoToPresentation(videoTitle, videoItem);

            let seeAlsoBySeasons = groupSeeAlsoVideos(videoTitle, req['video-items']);

            let playbackAvailable = false;
            let episodesAvailable = req['video-items']
                && req['video-items'].length > 1 ? true : false;
            let seasonsAvailable = seeAlsoBySeasons.length > 1;
            if (req.activeSubscription) {
                playbackAvailable = true;
            } else {
                if (episodesAvailable) {
                    playbackAvailable = req['video-items'][0]['_id'].toString() == videoItem['_id'].toString();
                }
            }

            presentationObject['playbackAvailable'] = playbackAvailable;
            presentationObject['seealso'] = req['video-items'];
            presentationObject['seealso'] = seeAlsoBySeasons;
            let seasons = 0;
            for (var prop in seeAlsoBySeasons) {
                seasons++;
            }
            presentationObject['seealso-dropdown'] = seasons > 1;
            presentationObject['recomendations'] = req['recomendations'];
            presentationObject['original-url'] = req.originalUrl;
            presentationObject['share-url'] = 'https://www.memocast.com' + req.originalUrl;
            presentationObject['share-image-url'] = 'https://www.memocast.com/images/video-title/' + videoTitle['_id'] + '?height=320';
            presentationObject['episodesAvailable'] = episodesAvailable;
            presentationObject['seasonsAvailable'] = seasonsAvailable;

            res.locals['page-title'] = res.locals.initPageTitle(presentationObject.title);
            // res.locals['user'] = req.user;
            if (!req.user) {
                req.session['redirect-after-login'] = req.originalUrl;
            }
            res.render('video/video', presentationObject);
        });

    return router;

};

let groupSeeAlsoVideos = function (videoTitle, videos) {

    let videosBySeasonIndex = {};

    if (!videos) {
        return videosBySeasonIndex;
    }

    for (let i = 0; i < videos.length; i++) {
        let item = videos[i];
        let seasonIndex = item['seasonIndex'];
        if (!seasonIndex) {
            seasonIndex = 1;
        }

        let season = videosBySeasonIndex[seasonIndex];
        if (!season) {
            season = {
                seasonNumber: item['seasonNumber'],
                seasonTitle: item['seasonTitle'],
                seasonIndex: item['seasonIndex'],
                items: []
            };
            videosBySeasonIndex[seasonIndex] = season;
        }

        let seasonItem = {
            item: item
        };

        let link = '/video/';

        if (false && !!item['permalink']) {
            link += item['permalink'];
        } else {
            if (!!videoTitle['titleID'] && videoTitle['titleID'] !== '') {
                link += videoTitle['titleID'];
            } else {
                link += videoTitle['_id'];
            }
            link += '/' + item['_id'];
        }

        seasonItem['link'] = link;

        season.items.push(seasonItem);

    }

    return videosBySeasonIndex;

};

let videoToPresentation = function(videoTitle, videoItem) {

    let obj = { title: videoTitle.title, subTitle: videoItem.title };
    obj = presentation.VideoTitle(videoTitle);
    obj.subTitle = videoItem.title;
    //
    // if (videoTitle.categories) {
    //     obj.categories = videoTitle.categories;
    // }

    obj.videoItemID = videoItem['_id'];
    obj.videoTitleID = videoTitle['_id'];

    //
    // obj.year = videoTitle.year;
    // obj.sinopsis = videoTitle.sinopsis;

    return obj;

}
