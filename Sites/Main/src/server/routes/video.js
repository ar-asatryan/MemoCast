const express = require('express');
const models = require('../config/models');
const cache = require('../config/cache');
const async = require('async');
const mongoose = require('mongoose');
const presentation = require('../config/presentation');
const _ = require('lodash')

module.exports = function() {

    const router = express.Router();

    const VideoTitle = models.VideoTitle;

    const getVideoTitle = async (title) => {

        const cacheKey = 'cache:pages:video:video-title:' + title + ':2017.12.28';

        const cacheValue = await new Promise((resolve, reject) => {
            cache.get(cacheKey, (err, value) => {
                resolve(value);
            });
        });

        if (!!cacheValue) { return cacheValue };
        // video loading and opening section >>
        const query = mongoose.Types.ObjectId.isValid(title) ? 
            { isPublic: true, $or: [ { _id: mongoose.Types.ObjectId(title) }, { titleID: title } ] } :
            { isPublic: true, titleID: title } ;
        
        const videoTitle = await models.VideoTitle.findOne(query)
            .populate('categories', 'title permalink')
            .lean();

        if (!!videoTitle) {
            cache.set(cacheKey, videoTitle, 30 * 60, cache.emptyCallback);
        }
  
        return videoTitle;
    };

    const videoRouteHandler = async (req, res, next) => {

        if (!!req['video-title'] && !!req['video-item']) {
            return next();
        }

        let { title, season, episode, item } = req.params;

        // get video title
        const videoTitle = await getVideoTitle(title);

        if (!videoTitle) { return next(); }

        // checking history
        if (!season && !episode && !item && req.user) {

            const pipeline = [
                {
                    $match: {
                        user: req.user._id,
                        videoTitle: mongoose.Types.ObjectId(videoTitle._id)
                    }
                },
                {
                    $project: {
                        ts: '$itemTimeStamps'
                    }
                },
                {
                    $unwind: {
                        path: '$ts',
                        includeArrayIndex: 'arrayIndex',
                        preserveNullAndEmptyArrays: false
                    }
                },
                {
                    $lookup: {
                        from: 'videoitems',
                        localField: 'ts.videoItem',
                        foreignField: '_id',
                        as: 'videoItem'
                    }
                },
                {
                    $match: {
                        'videoItem.isPublic': true
                    }
                },
                {
                    $project: {
                        '_id': '$videoItem._id',
                        'order': '$arrayIndex',
                    }
                },
                {
                    $unwind: {
                        path: '$_id',
                        preserveNullAndEmptyArrays: false,
                    }
                },
                {
                    $sort: {
                        order: -1
                    }
                },
                {
                    $limit: 1
                },
            ];

            const histories = await models.VideoHistory.aggregate(pipeline);

            const [ history = null ] = histories;

            if (!!history) {
                item = history._id;
            }
        } 

        // get video item
        const query = { 
            videoTitle: videoTitle._id, 
            status: 'ready',
            isPublic: true 
        };
        const seasonNumber = Number.parseInt(season);
        const episodeNumber = Number.parseInt(episode);
        if (!Number.isNaN(seasonNumber)) { query.seasonNumber = seasonNumber };
        if (!Number.isNaN(episodeNumber)) { query.episodeNumber = episodeNumber };
        if (mongoose.Types.ObjectId.isValid(item)) {
            query._id = mongoose.Types.ObjectId(item);
        }
        if (Number.isNaN(episodeNumber) 
            && !mongoose.Types.ObjectId.isValid(item)
            && !Number.isNaN(Number.parseInt(item))) {
            query.episodeIndex = Number.parseInt(item);
        }
        const videoItem = await models.VideoItem
            .findOne(query)
            .sort({ seasonIndex: 1, episodeIndex: 1, title: 1 })
            .lean();

        if (!!videoItem) {
            req['video-title'] = videoTitle;
            req['video-item'] = videoItem;  
        }

        return next();

    };

    const renderVideoHandler = async (req, res) => {

        let videoTitle = req['video-title'];
        
        let videoItem = req['video-item'];

        const { path } = req;
        const correctPath = `/${permalinkForVideoItem(videoTitle, videoItem)}`;

        if (encodeURI(correctPath) !== path) {
            return res.redirect(`/video${correctPath}`);
        }

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
        presentationObject['too-many-sessions'] = false;
        
        const isActive = _.get(req.user, 'session.isActive', false)
        if (req.user && !isActive) {
          presentationObject['too-many-sessions'] = true;
        }

        const { seasonNumber, episodeNumber } = video;
        const { year } = videoTitle;
        let pageTitle = presentationObject.title;
        if (!Number.isNaN(Number.parseInt(episodeNumber))) {
            if (!Number.isNaN(Number.parseInt(seasonNumber))) {
                pageTitle = `${pageTitle} ${seasonNumber} сезон`;
            }
            pageTitle = `${pageTitle} ${episodeNumber} серия`;
        } else {
            if (!Number.isNaN(Number.parseInt(year))) {
                pageTitle = `${pageTitle} (${year})`;
            }
        }
        pageTitle += ' смотреть онлайн';

        res.locals['page-title'] = res.locals.initPageTitle(pageTitle);
        // res.locals['user'] = req.user;
        if (!req.user) {
            req.session['redirect-after-login'] = req.originalUrl;
        }
        res.render('video/video', presentationObject);
    };

    router.use('/:title([a-zA-Z0-9\-]+)-:season([0-9]+)-season-:episode([0-9]+)-seriya', videoRouteHandler);
    router.use('/:title([a-zA-Z0-9\-]+)-:episode([0-9]+)-seriya', videoRouteHandler);
    router.use('/:title([a-zA-Z0-9\-]+)-:item([a-zA-Z0-9]+)', videoRouteHandler);
    router.use('/:title([a-zA-Z0-9\-]+)/:item([a-zA-Z0-9\-]+)', videoRouteHandler);
    router.use('/:title([a-zA-Z0-9\-]+)', videoRouteHandler);
    router.use('/:id', async (req, res, next) => {
        const { id } = req.params;
        let videoTitle = req['video-tiele'];
        let videoItem = req['video-item'];
        if (!!videoItem) {
            return next();
        }

        videoItem = await models.VideoItem.findOne({ permalink: id, isPublic: true }).lean();

        if (!!videoItem) {
            videoTitle = await models.VideoTitle.findById(videoItem.videoTitle)
                .populate('categories', 'title permalink')
                .lean();
            req['video-title'] = videoTitle;
            req['video-item'] = videoItem;
        }

        return next();
    });

    router.use('/:title/:id', async (req, res, next) => {
        const { id } = req.params;
        let videoTitle = req['video-tiele'];
        let videoItem = req['video-item'];
        if (!!videoItem) {
            return next();
        }

        if (mongoose.Types.ObjectId.isValid(id)) {
            const videoItemID = mongoose.Types.ObjectId(id);
            videoItem = await models.VideoItem.findOne({ _id: videoItemID, isPublic: true }).lean();

            if (!!videoItem) {
                videoTitle = await models.VideoTitle.findOne({ _id: videoItem.videoTitle, isPublic: true })
                    .populate('categories', 'title permalink')
                    .lean();
                req['video-title'] = videoTitle;
                req['video-item'] = videoItem;

                let link = '/video/';
    
                if (!!videoItem['permalink']) {
                    link += videoItem['permalink'];
                } else if (!!videoTitle) {
                    if (!!videoTitle['titleID'] && videoTitle['titleID'] !== '') {
                        link += videoTitle['titleID'];
                    } else {
                        link += videoTitle['_id'];
                    }
                    link += '/' + videoItem['_id'];
                }

                if (link !== '/video/') {
                    return res.redirect(301, link);
                }

            }
        }

        return next();
    });

    router.use('/', async (req, res, next) => {

        let videoTitle = req['video-title'];
        
        let videoItem = req['video-item'];

        if (!videoItem || !videoTitle) {
            await models.MissedVideo.create({ url: req.path, referer: req.get('Referrer') });
            return res.redirect('/404');
        }

        return next();
    });
    
    // check for all videos in title
    router.use('/', function(req, res, next) {
        
        const videoTitleID = req['video-title']._id;

        const cacheKey = 'cache:pages:video:' + videoTitleID + ':items';

        async.waterfall([
            function (callback) {
                cache.get(cacheKey, callback);
            },
            function (cacheValue, callback) {
                if (cacheValue) { return callback(null, cacheValue); }
                models.VideoItem.find({
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

    router.use('/', renderVideoHandler)

    // router.use('/:id', function(req, res, next) {

    //     let videoTitleID = req.params['id'];

    //     const objectIDTemplate = /^[0-9a-f]{24}$/i

    //     const cacheKey = 'cache:pages:video:video-title:' + videoTitleID;

    //     async.waterfall([
    //         function (callback) {
    //             cache.get(cacheKey, callback);
    //         },
    //         function (cacheValue, callback) {
    //             if (cacheValue) { return callback(null, cacheValue); }

    //             let query = objectIDTemplate.test(videoTitleID) ? { _id: videoTitleID } : { titleID: videoTitleID } ;

    //             VideoTitle.findOne(query)
    //                 .populate('categories', 'title')
    //                 .lean()
    //                 .exec(function(err, item) {
    //                 if (item && !err) {
    //                     callback(null, item);
    //                     // req['video-title'] = item;
    //                     cache.set(cacheKey, item, 30 * 60, cache.emptyCallback);
    //                 } else {
    //                     callback({ error: 'Video with ID ' + videoTitleID + ' not found'}, null);
    //                 }
    //             });
    //         }
    //     ], function (err, item) {
    //         if (item && !err) {
    //             if (item && !err) {
    //                 req['video-title'] = item;
    //                 next();
    //             } else {
    //                 res.redirect('/');
    //             }
    //         }
    //     });

    // });

    // router.use('/:id', require('./video-item')());

    return router;

};

const permalinkForVideoItem = (videoTitle, videoItem) => {
    let link = '';

    const item = videoItem;

    if (!!item['permalink']) {
        link += item['permalink'];
    } else {
        if (!!videoTitle['titleID'] && videoTitle['titleID'] !== '') {
            link += videoTitle['titleID'];
        } else {
            link += videoTitle['_id'];
        }
        link += '/' + item['_id'];
    }

    return link;
}

const groupSeeAlsoVideos = function (videoTitle, videos) {

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
    
            let link = `/video/${permalinkForVideoItem(videoTitle, item)}` ;
    
            // if (!!item['permalink']) {
            //     link += item['permalink'];
            // } else {
            //     if (!!videoTitle['titleID'] && videoTitle['titleID'] !== '') {
            //         link += videoTitle['titleID'];
            //     } else {
            //         link += videoTitle['_id'];
            //     }
            //     link += '/' + item['_id'];
            // }

            seasonItem['link'] = link;
    
            season.items.push(seasonItem);
    
        }
    
        return videosBySeasonIndex;
    
    };
    
    const videoToPresentation = function(videoTitle, videoItem) {
    
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
