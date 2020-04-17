var express = require('express');
var mongoose = require('mongoose');
var models = require('../../config/models');
var presentation = require('../../config/presentation');
var async = require('async');

var User = models.User;
var PersonalMessage = models.PersonalMessage;

module.exports = function () {
    var router = express.Router();

    router.route('/')
        .get(function (req, res) {
            res.render('profile/dialogs', { layout: 'profile' });
        });

    router.route('/:userid')
        .all(function (req, res, next) {
            var userID = req.params.userid;

            async.waterfall([
                function (callback) {
                    if (!mongoose.Types.ObjectId.isValid(userID)) {
                        return callback({ error: 'Incorrect user id'});
                    }
                    callback(null, userID);
                },
                function (userID, callback) {
                    var query = { _id: userID };
                    User.findOne(query, function (err, item) {
                        callback(err, item);
                    });
                },
                function (user, callback) {
                    if (!user) {
                        return callback({ error: 'User not found'});
                    }
                    callback(null, presentation.User(user));
                }
            ], function (err, result) {
                if (err) {
                    return res.redirect('/profile/im');
                }
                req.dialogUser = result;
                res.locals.dialogUser = result;
                next();
            });

        })
        .get(function (req, res) {
            res.redirect(req.dialogUser.messagesUrl);
            // res.render('profile/dialog', { layout: 'profile' });
        });

    return router;
};
