const express = require('express');
const async = require('async');
const models = require('../../../config/models');
const rabbit = require('../../../config/rabbit');

module.exports = function () {

    let router = express.Router();

    router.route('/')
        .get(function (req, res) {
            models.EncodingRequest.find({})
                .sort({ createDate : -1 })
                .limit(500)
                .populate({ path : 'file', select: { _id : 1, videoItem: 1 }, populate: { path: 'videoItem', select: { title : 1, _id : 1, videoTitle : 1 } } })
                .populate({ path: 'user', select : { _id : 1, displayName : 1 }})
                .exec(function (err, items) {
                    if (err) {
                        return res.status(500).send(err);
                    } else {
                        return res.send(items);
                    }
                });
        })
        .post(function (req, res) {
            let preset = req.body['encoding-preset'];
            let audio = req.body['audioTrack'];
            async.waterfall([
                // load originals for posted items
                function functionName(callback) {

                    let videoItems = req.body['items'];
                    let query = { type : 'original', videoItem : { $in : videoItems } };

                    models.File.find(query)
                        .select({ _id : 1 })
                        .exec(callback);
                },
                // insert encoding requests into DB
                function (files, callback) {
                    let requests = files.map(function (item) {
                        return {
                            user : req.user['_id'],
                            file : item['_id'],
                            createDate : new Date(),
                            encodingPreset : preset,
                            audioTrack: audio,
                            status : 'queued'
                        };
                    });
                    models.EncodingRequest.insertMany(requests, callback);
                }
            ], function (err, result) {
                if (err) {
                    return res.status(500).send(err);
                } else {
                    res.send(result);
                    // adding encoding request to queue server
                    result.forEach(function (item) {
                        rabbit.notifyNewEncodingRequest(item);
                    });
                }
            });
        });

    return router;

};
