var express = require('express');
var models = require('../../config/models');
var async = require('async');
var presentation = require('../../config/presentation');
var localization = require('../../config/localization/localization');

module.exports = function () {
    var PersonalMessage = models.PersonalMessage;
    var router = express.Router();
    router.route('/im/:id')
        .get(function (req, res) {
            var MsgID = req.params.id;
            async.waterfall([
                // select message
                function (callback) {
                    PersonalMessage.findById(MsgID)
                        .populate('from')
                        .exec(function(err, item) {
                            if (item) {
                                callback(null, item);
                            } else {
                                callback('message not found', null);
                            }
                        });
                },
                function (msg, callback) {
                    callback(null, presentation.User(msg.from));
                }
            ], function(err, result) {
                if (err) {
                    res.redirect('/');
                } // if (err) ...
                else {
                    res.redirect(result.url + '?mode=messages');
                }
            });
        });

    router.route('/locale/:locale')
        .get(localization['update-languge']);

    router.route('/legacyplayback/:value')
        .get((req, res) => {
            let ref = req.get('Referrer');
            res.cookie('legacy-playback', req.params['value'], { maxAge : 1000 * 60 * 60 * 24 * 30 * 12 });
            if (ref) {
                res.redirect(ref);
            } else {
                res.redirect('/');
            }
        });
    return router;
};
