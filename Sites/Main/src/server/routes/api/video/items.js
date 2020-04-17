var express = require('express');
var models = require('../../../config/models');
var presentation = require('../../../config/presentation');
const async = require('async');
const cache = require('../../../config/cache');
const helpers = require('../../../../../../../Common/helpers');

module.exports = function() {

    const isAdmin = (req, res, next) => {
        if (req.userIsAdmin) {
            return next();
        } else {
            res.status(403).send('Forbidden');
        }
    }

    var router = express.Router();

    var VideoTitle = models.VideoTitle;
    var VideoItem = models.VideoItem;
    var File = models.File;

    router.use('/:id', function(req, res, next) {
        var videoItemID = req.params['id'];
        var query = { _id: videoItemID };
        VideoItem.findOne(query, function(err, item) {
            if (err || !item) {
                res.status(404).send({
                    message: 'Video item with id \'' + videoItemID + '\' not found',
                    error: err
                });
            } else {
                req.videoItem = item;
                next();
            }
        });
    });

    router.route('/:id')
        .put(isAdmin, async (req, res) => {

            try
            {
                var item = req.body;
                delete item['_id'];
                delete item['__v'];
    
                var videoItem = req.videoItem;
                videoItem.title = item.title;
                videoItem.exportedTitle = item.exportedTitle;
                videoItem.status = item.status;
                // videoItem.categories = item.categories;
                videoItem.languages = item.languages;
                videoItem.isPublic = item.isPublic;
                videoItem.videoTitle = item.videoTitle;
                videoItem.year = item.year;
                videoItem.seasonNumber = item.seasonNumber;
                videoItem.seasonIndex = item.seasonIndex;
                videoItem.seasonTitle = item.seasonTitle;
                videoItem.episodeNumber = item.episodeNumber;
                videoItem.episodeIndex = item.episodeIndex;
                videoItem.episodePartNumber = item.episodePartNumber;
                videoItem.airDate = null;
                if (item.airDate && item.airDate != '') {
                    videoItem.airDate = item.airDate;
                }
    
                videoItem.adminNotes = item.adminNotes;
                videoItem.host = item.host;
                videoItem.guests = item.guests;

                await videoItem.save();

                res.send({ item: videoItem });

                const videoTitle = await models.VideoTitle.findOne({ _id: videoItem.videoTitle });
                helpers.updateVideoItemPermalink({ videoItem, videoTitle });

                cache.clear(`*${videoItem._id}*`);
                cache.clear(`*${videoItem.videoTitle}:items`);

            } catch (e) {
                res.status(500).send({ err: e });
            }

        });

    router.route('/:id/tracks')
        .get(function(req, res) {

            async.waterfall([
                // load video tracks
                (callback) => {
                    var query = { videoItem: req.videoItem['_id'], type: 'stream' };

                    File.find(query)
                        .sort({ size: 'asc' })
                        .exec(function(err, items) {
                            let sources = items.map(function(item) {
                                return presentation.File(item);
                            });
                            if (sources.length > 0) {
                                sources[0].label = 'SD';
                            }
                            if (sources.length > 1) {
                                sources[sources.length - 1].label = 'HD';
                            }
                            if (sources.length > 2) {
                                for (let i = 1; i < sources.length - 1; i++) {
                                    sources[i].label = 'MD';
                                }
                            }
                            callback(null, sources);
                        });
                },
                // load video captions
                (videos, callback) => {
                    let query = { videoItem : req.videoItem['_id'] };
                    let sort = { language : 1 };
                    models.Captions.find(query)
                        .sort(sort)
                        .select({ content : 0 })
                        .exec((err, subs) => {
                            let data = {
                                videos : videos,
                                subtitles : subs
                            };
                            callback(null, data);
                        });
                }
            ], (err, result) => {
                res.send(result);
            });
    });

    var videoTitleFinder = function(req, res, next) {
        VideoTitle.findOne({ _id: req.videoItem['videoTitle'] }, function(err, item) {
            if (!item) {
                return res.status(404).send({ error: 'Видео с ID ' + req.videoItem['videoTitle'] + ' не найдено.' });
            }

            req.videoTitle = item;

            var query = { videoTitle: item['_id'], status: 'ready' };
            var fields = { _id: 1, episodeIndex: 1, seasonIndex: 1, title : 1, permalink: 1 };

            VideoItem.find(query)
                .sort({ seasonIndex: 1, episodeIndex: 1, title: 1 })
                .select(fields)
                .exec(function(err, docs) {

                    req.videoItems = docs;
                    return next();

                });

        });
    };

    var urlToVideoItem = function(doc, videoTitle) {

        const { permalink } = doc;

        if (!(typeof permalink === 'undefined' || permalink === '')) {
            return `/video/${permalink}`;
        }

        var titleID = videoTitle['titleID'];
        var videoTitleID = videoTitle['_id'];
        var link = '/video/';
        link += titleID ? titleID : videoTitleID;
        link += '/';
        link += doc._id;
        return link;
    };

    router.route('/:id/next')
        .all(videoTitleFinder)
        .get(function(req, res) {

            var foundItem = null;

            for (var i = 0; i < req.videoItems.length; i++) {
                var item = req.videoItems[i];
                if (item['_id'].equals(req.videoItem['_id'])) {
                    if ((i + 1) < req.videoItems.length) {
                        foundItem = req.videoItems[ i + 1 ];
                    }
                    break;
                }
            }

            if (foundItem) {
                res.send({ next: urlToVideoItem(foundItem, req.videoTitle) });
            } else {
                res.send({ next: '' });
            }

        });

    router.route('/:id/prev')
        .all(videoTitleFinder)
        .get(function(req, res) {

            var foundItem = null;

            for (var i = 0; i < req.videoItems.length; i++) {
                var item = req.videoItems[i];
                if (item['_id'].equals(req.videoItem['_id'])) {
                    if ((i - 1) > 0) {
                        foundItem = req.videoItems[ i - 1 ];
                    }
                    break;
                }
            }

            if (foundItem) {
                res.send({ prev: urlToVideoItem(foundItem, req.videoTitle) });
            } else {
                res.send({ prev: '' });
            }

        });

    router.route('/:id/prevnext')
        .all(videoTitleFinder)
        .get(function(req, res) {

            var data = {
                prev: '',
                next: '',
                nextID: '',
                prevID: ''
            };

            var nextItem = null;
            var prevItem = null;

            for (let i = 0; i < req.videoItems.length; i++) {

                var item = req.videoItems[i];

                if (nextItem && prevItem) {
                    break;
                }

                if (item['_id'].equals(req.videoItem['_id'])) {
                    if ((i + 1) < req.videoItems.length) {
                        nextItem = req.videoItems[ i + 1 ];
                        data.next = urlToVideoItem(nextItem, req.videoTitle);
                        data.nextID = nextItem._id;
                        data.nextTitle = nextItem.title;
                    }
                    if ((i - 1) >= 0) {
                        prevItem = req.videoItems[ i - 1 ];
                        data.prev = urlToVideoItem(prevItem, req.videoTitle);
                        data.prevID = prevItem._id;
                        data.prevTitle = prevItem.title;
                    }
                }
            }

            res.send(data);

        });

    return router;

}
