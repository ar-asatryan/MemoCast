var express = require('express');
var models = require('../../config/models');
var cache = require('../../config/cache');
var async = require('async');

module.exports = function() {

    var router = express.Router();

    var Flash = models.Flash;

    router.route('/')
        .get(function(req, res) {

            var cacheKey = 'cache:flash';

            async.waterfall([
                // trying to load cache
                function (callback) {
                    cache.get(cacheKey, callback);
                },
                // load data from db if no cache
                function (cacheValue, callback) {

                    if (cacheValue) {
                        return callback(null, cacheValue);
                    }

                    // no cache - loading data from db
                    Flash.find({ isPublic: true })
                        .select('-img -order -__v -createDate -isPublic')
                        .sort({ order: 'desc' })
                        .exec(function(err, items) {

                            callback(err, items);

                            cache.set(cacheKey, items, 30 * 60, function (err) {
                                if (err) { }
                            });

                    });
                }

            ], function (err, result) {
                if (err) {
                    res.status(500).send(err);
                } else {
                    res.send(result);
                }
            });

        });



    return router;

};
