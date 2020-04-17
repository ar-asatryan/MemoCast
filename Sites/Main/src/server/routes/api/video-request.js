const async = require('async');
const models = require('../../config/models');
const presentation = require('../../config/presentation');
const express = require('express');

module.exports = function () {

    const router = express.Router();
    const VideoRequest = models.VideoRequest;

    // check for user's authentication
    // router.use(function(req, res, next) {
    //     if (!req.user) {
    //         return res.status(403).send({ error: 'please authenticate first' });
    //     } // if !req.user
    //     next();
    // });

    router.route('/')
        // post new video request
        .post(function (req, res) {

            if (!req.user) {
                return res.status(403).send({ error: 'please authenticate first' });
            } // if !req.user

            async.waterfall([
                // cheking input params: expecting request, searchString (optional)
                function (callback) {
                    let request = req.body['request'];
                    let searchString = req.body['searchString'];
                    if (!request) {
                        return callback({ error: 'Incorrect request. Expecting \'request\' parameter in body'});
                    }
                    let data = {
                        user: req.user['_id'],
                        request: request,
                        searchString: searchString,
                        status: 'created'
                    };
                    return callback(null, data);
                },
                // inserting request to DB
                function (data, callback) {
                    VideoRequest.create(data, function (err, item) {
                        callback(err, item);
                    });
                },
                // format created video request to presentation
                function (item, callback) {
                    callback(null, presentation.VideoRequest(item));
                }
            ], function (err, result) {
                if (err) { return res.status(500).send(err); }
                res.send(result);
            });
        })
        // get my video requests
        .get(function (req, res) {

            if (!req.user) {
                return res.status(403).send({ error: 'please authenticate first' });
            } // if !req.user

            async.waterfall([
                // querying DB
                function (callback) {
                    let query = {
                        user: req.user['_id']
                    };
                    VideoRequest.find(query)
                        .sort({ createDate: -1 })
                        .limit(50)
                        .populate('user videoTitles videoItems')
                        .exec(function (err, items) {
                            callback(err, items);
                        });
                },
                // formatting data for presentation
                function (items, callback) {
                    callback(null, items.map(function (item) {
                        return presentation.VideoRequest(item);
                    }));
                }
            ], function (err, result) {
                if (err) { return res.status(500).send(err); }
                res.send(result);
            });
        });

    router.route('/all')
        .get(function (req, res) {
            async.waterfall([
                // querying DB
                function (callback) {
                    let query = {
                        // user: req.user['_id']
                    };
                    if (req.query.status) { query.status = req.query.status; }
                    VideoRequest.find(query)
                        .sort({ createDate: -1 })
                        .limit(50)
                        .populate('user videoTitles videoItems')
                        .exec(function (err, items) {
                            callback(err, items);
                        });
                },
                // formatting data for presentation
                function (items, callback) {
                    callback(null, items.map(function (item) {
                        return presentation.VideoRequest(item);
                    }));
                }
            ], function (err, result) {
                if (err) { return res.status(500).send(err); }
                res.send(result);
            });
        });

    return router;

};
