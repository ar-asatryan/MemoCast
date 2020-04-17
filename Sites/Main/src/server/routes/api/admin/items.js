const express = require('express');
const models = require('../../../config/models');
const async = require('async');

module.exports = function () {

    let router = express.Router();

    router.route('/')
        .get(function(req, res) {
            async.waterfall([
                // init query
                function (callback) {
                    let params = { };
                    let query = models.VideoItem.find(params);
                    query = query.sort({ createDate : -1 });
                    query = query.limit(500);
                    query = query.populate('videoTitle', 'title isPublic');
                    query.exec(callback);
                }
            ], function (err, result) {
                if (err) {
                    return res.status(500).send(err);
                } else {
                    res.send(result);
                }
            });

        })
        .put(function (req, res) {
            let query = { _id : { $in :  req.body.items } };
            let update = {
                $set : req.body.update
            }
            models.VideoItem.update(query, update, { multi : true }, function (err, rows) {
                if (err) {
                    return res.status(500).send(err);
                } else {
                    res.send({ ok : true });
                }
            })
        });

    return router;

}
