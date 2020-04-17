var express = require('express');
var models = require('../../../config/models');
var presentation = require('../../../config/presentation');

module.exports = function() {

    var VideoItem = models.VideoItem;
    var VideoTitle = models.VideoTitle;
    var VideoHistory = models.VideoHistory;

    var router = express.Router();

    router.use(function(req, res, next) {
        if (req.user) {
            return next();
        }

        res.status(401).send({ error: 'Необходимо авторизоваться для этого запроса.' });
    });

    router.route('/')
        .post(function(req, res) {

            var VideoItemID = req.body['VideoItem'];
            var time = req.body['time'];
            var finished = req.body['finished'];

            if (VideoItemID && time) {
                VideoItem.findOne({ _id: VideoItemID })
                    .exec(function(err, item) {
                        if (!item) {
                            res.status(404).send({ error: 'Видео с ID ' + VideoItemID + ' не найдено.' });
                        } else {
                            var VideoTitleID = item['videoTitle'];
                            VideoHistory.findOneAndUpdate({ videoTitle: VideoTitleID, user: req.user['_id'] }, {
                                $set: {
                                    updateDate: new Date(),
                                    videoTitle: VideoTitleID,
                                    user: req.user['_id']
                                },
                                $pull: {
                                    itemTimeStamps: {
                                        videoItem: item['_id']
                                    }
                                }
                            }, {
                                new: true,
                                upsert: true
                            }, function(err, doc) {

                                var items = doc.itemTimeStamps;
                                if (!items) {
                                    items = [];
                                }
                                items.push({
                                        videoItem: item['_id'],
                                        finished: finished,
                                        time: time,
                                        createDate: new Date()
                                    });
                                doc.itemTimeStamps = items;
                                doc.save(function(err, doc) {
                                   res.send(doc);
                                });

                            }); // VideoHistory.findOneAndUpdate ...
                        }
                    });
            } else {
                res.status(400).send({ error: 'Некорректный запрос' });
            }
        });

    router.route('/item/:id')
        .get(function(req, res) {

            var query = {
                user: req.user['_id'],
                'itemTimeStamps.videoItem': req.params['id']
            };

            VideoHistory.findOne(query, function(err, doc) {
               if (!doc) {
                   res.send({
                       time: 0,
                       finished: false
                   });
               } else {
                   var filtered = doc.itemTimeStamps.filter(function(item) {
                       return item.videoItem.equals(req.params['id'])
                   });

                   res.send({
                       time: filtered[0].time,
                       finished: filtered[0].finished
                   });
               }
            });

        });

    return router;

};
