var express = require('express');
var models = require('../../config/models');

module.exports = function() {

    var router = express.Router();
    var Settings = models.Settings;

    router.route('/')
        .all(function(req, res, next) {
            var apiKey = req.get('memocast-api-key');
            if (apiKey === 'fFzTwySabqlT0PsHI4yZA2Qn') {
                next();
            } else {
                res.status(403).send({
                   error: 'Not authorized'
                });
            }
        })
        .get(function(req, res) {
            var query = Settings.find({})
                .select({ key: 1, value: 1, _id: 0 })
                .sort({ key: 'asc' }).exec(function(err, items) {
                res.send(items);
            });
        })
        .put(function(req, res) {
            var data = req.body;
            if (data.updates) {
                data = data.updates;
            }
            if (data) {
                if (data.length > 0) {
                    for (var i = 0; i < data.length; i++) {
                        var item = data[i];
                        if (item.key && item.value) {
                            Settings.findOneAndUpdate({ 'key': item.key }, item, { upsert: true, new: true }, function(err, doc) {
                                /// 
                            });
                        }
                    }
                }
            }
            res.send({ ok: true, updates: data });
        })

    return router;

};
