var express = require('express');
var models = require('../../config/models');
var presentation = require('../../config/presentation');
var feedController = require('../../controllers/feed')();

module.exports = function () {

    var router = express.Router();

    // check for user's authentication
    router.use(function(req, res, next) {
        if (!req.user) {
            return res.status(403).send({ error: 'please authenticate first' });
        } // if !req.user
        next();
    });

    router.route('/')
        .get(function (req, res) {

            var params = {
                req: req,
                userID: req.user._id,
                limit: req.query.limit
            };

            feedController.processFeedRequest(params, function (err, result) {
                if (err) {
                    res.status(500).send(err);
                } else {
                    res.send(result.result);
                }
            });

        });

    return router;

};
