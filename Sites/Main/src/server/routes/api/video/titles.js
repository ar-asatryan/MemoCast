var express = require('express');
var models = require('../../../config/models');
var presentation = require('../../../config/presentation');
var io = require('../../../config/io');
var mongoose = require('mongoose');
const vtsp = require('../../../../../../../Common/selectors/videoTitleSearchPrepare');
const helpers = require('../../../../../../../Common/helpers');
const cache = require('../../../config/cache');

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
    var VideoHistory = models.VideoHistory;
    var User = models.User;

    // get video title's titles by ids
    router.route('/')
        .get((req, res) => {
            let ids = req.query.id;
            ids = ids instanceof Array ? ids : (ids ? [ids] : [])

            let validIds = { _id : ids.filter(item => mongoose.Types.ObjectId.isValid(item))
                .map(item => mongoose.Types.ObjectId(item)) }

            let invalidIds = { titleID : ids.filter(item => !mongoose.Types.ObjectId.isValid(item)) }

            let query = { isPublic: true };

            if (validIds._id.length > 0 && invalidIds.titleID.length > 0) {
                query = Object.assign(query,
                    { $or: [
                        validIds,
                        invalidIds,
                    ] })
            } else if (validIds._id.length > 0) {
                query = Object.assign(query, validIds)
            } else if (invalidIds.titleID.length > 0) {
                query = Object.assign(query, invalidIds)
            } else {
                return res.status(500).send('Invalid (empty) request')
            }

            models.VideoTitle.find(query)
                .select({ _id : 1, title : 1 })
                .limit(10)
                .exec((err, items) => {
                    res.send(items);
                });
        });

    router.use('/:id', function (req, res, next) {
        var videoTitleID = req.params['id'];
        var query = { _id: videoTitleID };
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

    router.route('/:id')
        .get(function(req, res) {
            res.send(req.videoTitle);
        })
        .put(isAdmin, async (req, res) => {
            try {
                let item = req.body;
                const tags = item.tags ? item.tags : [];
                const { _id } = req.videoTitle;
                item.tags = (tags || []).filter(tag => tag !== '');

                delete item['_id'];
                delete item['__v'];

                // checking for video with same titleID
                const { titleID } = item;
                if (typeof titleID !== 'undefined' && titleID !== '') {
                    const titleIDCount = await VideoTitle.count({ 
                        _id: { $ne: _id},
                        titleID
                    });
                    if (titleIDCount > 0) {
                        throw 'You can\'t post video with the same Title ID';
                    }
                }

                item = Object.assign(item, vtsp(item));
                const updatedVideoTitle = await VideoTitle.findOneAndUpdate(
                    { _id }, 
                    item, 
                    { new: true });
                
                res.send(updatedVideoTitle);
                cache.clear(`*${_id}*`);

                // updating permalinks for video items
                const items = await models.VideoItem.find({ videoTitle: _id });
                for (let videoItem of items) {
                    helpers.updateVideoItemPermalink({ videoItem, videoTitle: updatedVideoTitle })
                }

            } catch (e) {
                res.status(500).send({ error: e });
            }

        });

    router.route('/:id/viewers')
        .get(function (req, res) {
            var videoTitleID = req.videoTitle._id.toString();
            var ids = io.getUsersByVideoTitleID(videoTitleID);
            var oids = ids.map(function (item) {
                return mongoose.Types.ObjectId(item);
            });
            var query = { _id : { $in: oids }};
            User.find(query, function (err, items) {
                if (err) {
                    return res.status(500).send(err);
                }
                var usrs = items.map(function (item) {
                    return presentation.User(item);
                });
                res.send(usrs);
            });
        });

    router.route('/:id/history')
        .get(function(req, res) {

            req.videoTitle.populate('categories', function(err, item) {

                var data = {
                    videoTitle: presentation.VideoTitle(item)
                };

                if (req.user) {
                    var query = { user: req.user['_id'], videoTitle: item['_id'] };
                    VideoHistory.findOne(query)
                        .select('itemTimeStamps')
                        .exec(function(err, historyItem) {

                            var historyFound = false;

                            if (historyItem) {
                                if (historyItem.itemTimeStamps) {
                                    if (historyItem.itemTimeStamps.length > 0) {
                                        historyFound = true;

                                        var timeStamp = historyItem.itemTimeStamps[historyItem.itemTimeStamps.length - 1];
                                        var videoItemID = timeStamp.videoItem;

                                        VideoItem.findOne({
                                            _id: videoItemID
                                        }, function(err, videoItem) {

                                            data.history = {
                                                time: timeStamp.time,
                                                finished: timeStamp.finished,
                                                createDate: timeStamp.createDate,
                                                videoItem: presentation.VideoItem(videoItem)
                                            };

                                            res.send(data);

                                        });

                                    }
                                }
                            }

                            if (!historyFound) {
                                res.send(data);
                            }

                        });
                } else {
                    res.send(data);
                }

            });



        });

    router.route('/:id/items')
        .get(function(req, res) {

            var query = VideoItem.find( { videoTitle: req.videoTitle['_id'] } )
                .sort({ createDate: 'desc', episodeNumber: 'desc',  })
                .exec(function(err, items) {
                    res.send(items);
                });

        });

    return router;

}
