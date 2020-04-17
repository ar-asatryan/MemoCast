const express = require('express');
const async = require('async');
const models = require('../../../config/models');

module.exports = function () {

    const router = express.Router();

    // GET requests list
    router.route('/')
        .get(function (req, res) {
            async.waterfall([
                // fetch requests from db
                function (callback) {
                    let query = { };
                    let sort = { createDate : -1 };
                    let limit = 1000;
                    models.VideoRequest.find(query)
                        .sort(sort)
                        .limit(limit)
                        .populate('user', 'displayName')
                        .populate('videoTitles', 'title')
                        .populate('videoItems', 'title videoItem')
                        .exec(callback);
                }
            ], function (err, result) {
                if (err) {
                    return res.status(500).send(err);
                } else {
                    return res.send(result);
                }
            })
        });

    router.route('/:id')
        .put((req, res) => {
            let id = req.params['id'];
            let update = { $set : req.body.update };
            if (!update['$set'].videoItems) {
                update['$set'].videoItems = [];
            }
            if (!update['$set'].videoTitles) {
                update['$set'].videoTitles = [];
            }
            let query = { _id : id };
            models.VideoRequest.findOneAndUpdate(query, update, (err, raw) => {
                res.send({ err : err, raw : raw });
            });
        });

    return router;

};
