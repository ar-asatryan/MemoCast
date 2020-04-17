const express = require('express');
const async = require('async');
const models = require('../../../config/models');

module.exports = function () {

    let router = express.Router();

    router.route('/')
        .get(function (req, res) {
            async.waterfall([
                function (callback) {
                    let item = req.query['item'];
                    let type = req.query['type'];
                    let query = {
                        videoItem : item
                    };
                    if (type) { query.type = type; }
                    models.File.find(query, callback);
                },
                function (files, callback) {
                    callback(null, files);
                }
            ], function (err, result) {
                if (err) {
                    return res.status(500).send(err);
                } else {
                    res.send(result);
                }
            });


        });

    router.route('/:id')
        .delete(function (req, res) {
            async.waterfall([
                // remove file from Files collection
                function (callback) {
                    let fileID = req.params['id'];
                    models.File.findOneAndRemove({ _id : fileID }, function (err, item) {
                        if (err) {
                            return callback(err);
                        } else {
                            return callback(null, item);
                        }
                    });
                },
                // add removed file to Deleted Files collection
                function (item, callback) {
                    if (item) {
                        delete item['__v'];
                        // item['__v'] = null;
                        let update = {
                            $set : {
                                encodingPreset: item.encodingPreset,
                                size: item.size,
                                label: item.label,
                                type: item.type,
                                path: item.path,
                                videoItem: item.videoItem
                            }
                        };
                        models.DeletedFile.findByIdAndUpdate(item._id, update, { upsert : true, new : true}, callback);
                    } else {
                        return callback(null, null);
                    }
                }
            ], function (err, result) {
                if (err) {
                    return res.status(500).send(err);
                } else {
                    res.send({ ok : true, file : result });
                }
            });

        });

    return router;

};
