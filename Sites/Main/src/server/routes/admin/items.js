const express = require('express');
const async = require('async');
const models = require('../../config/models');

module.exports = function () {

    let router = express.Router();

    router.route('/')
        .get(function (req, res) {
            async.waterfall([
                // load all encoding presets
                function (callback) {
                    models.EncodingPreset.find({})
                        .select({ _id : 1, label : 1, height : 1 })
                        .sort({ height : 1 })
                        .exec(callback);
                },
                // displaying presets
                function (presets, callback) {
                    let data = {
                        presets : presets,
                        layout: 'admin'
                     };
                    callback(null, data)
                }
            ], function (err, result) {
                res.render('admin/videos/items', result);
            });
        });

    return router;

};
