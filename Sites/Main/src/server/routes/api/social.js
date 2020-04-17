const express = require('express');
const async = require('async');
const models = require('../../config/models');
const api = require('../../config/api-util');
const presentation = require('../../config/presentation');
const rabbit = require('../../config/rabbit');
const io = require('../../config/io');


module.exports = function () {

    let UserFollower = models.UserFollower;

    let router = express.Router();
    //
    router.route('/followers/:userid')
        .get(function (req, res) {
            let UserID = req.params['userid'];
            async.waterfall([
                // check user id
                function (callback) {
                    // if not valid object id - throw error
                    return api.isValidObjectIDWithCallback(UserID, callback);
                },
                // add followers to DB
                function (UserID, callback) {
                    let query = { user: UserID };
                    UserFollower.find(query)
                        .select('follower')
                        .populate('follower')
                        .exec(function (err, items) {
                        callback(err, items);
                    });
                },
                // format user's follow
                function (items, callback) {
                    return callback(null, items.map(function(obj) {
                        return presentation.User(obj.follower);
                    }));
                }
            ], function (err, result) {
                if (err) {
                    res.status(500).send(err);
                } else {
                    res.send(result);
                }
            });
        });

    router.route('/follow/:userid')
        // check is user pass authentication
        .all(api.checkAPIAuthentication)
        // check following existence
        .get(function (req, res) {
            let UserID = req.params['userid'];
            let CurrentUserID = req.user['_id'];
            async.waterfall([
                // check user id
                function (callback) {
                    // if not valid object id - throw error
                    return api.isValidObjectIDWithCallback(UserID, callback);
                },
                // add followers to DB
                function (UserID, callback) {
                    let query = { user: UserID, follower: CurrentUserID };
                    UserFollower.find(query)
                        .populate('user follower')
                        .exec(function (err, items) {
                        callback(err, items);
                    });
                },
                // format user's follow
                function (items, callback) {
                    return callback(null, items.map(function(obj) {
                        return presentation.UserFollower(obj);
                    }));
                }
            ], function (err, result) {
                if (err) {
                    res.status(500).send(err);
                } else {
                    res.send(result);
                }
            });
        })
        // follow this users
        .post(function (req, res) {
            let UserID = req.params['userid'];
            let CurrentUserID = req.user['_id'];
            async.waterfall([
                // check user id
                function (callback) {
                    // if not valid object id - throw error
                    return api.isValidObjectIDWithCallback(UserID, callback);
                },
                // check if UserID = CurrentUserID
                function (UserID, callback) {
                    if (UserID.equals(CurrentUserID)) {
                        callback({ error: 'Can\'t follow yourself.'});
                    } else {
                        callback(null, UserID, CurrentUserID);
                    }
                },
                // add followers to DB
                function (UserID, FollowerUserID, callback) {
                    let obj = { user: UserID, follower: FollowerUserID };
                    let query = obj;
                    UserFollower.findOneAndUpdate(query, obj, { upsert: true, new: true }, function (err, item) {
                        callback(err, item);
                    });
                },
                // format user's follow
                function (userFollower, callback) {
                    let data = presentation.UserFollower(userFollower);
                    data.follower = presentation.User(req.user);
                    let envelope = {
                        type: 'follower',
                        data: data
                    };
                    io.sendMessageToUser(data.user, envelope);
                    return callback(null, data);
                }
            ], function (err, result) {
                if (err) {
                    res.status(500).send(err);
                } else {
                    res.send(result);
                    rabbit.notifyNewFollow({ id: result.id });
                }
            });
        })
        // unfollow this user
        .delete(function (req, res) {
            let UserID = req.params['userid'];
            let CurrentUserID = req.user['_id'];
            async.waterfall([
                // check user id
                function (callback) {
                    // if not valid object id - throw error
                    return api.isValidObjectIDWithCallback(UserID, callback);
                },
                // add followers to DB
                function (UserID, callback) {
                    let query = { user: UserID, follower: CurrentUserID };
                    UserFollower.findOneAndRemove(query, function (err, item) {
                        callback(err, item);
                    });
                },
                // format user's follow
                function (userFollower, callback) {
                    return callback(null, presentation.UserFollower(userFollower));
                }
            ], function (err, result) {
                if (err) {
                    res.status(500).send(err);
                } else {
                    res.send(result);
                    if (result) {
                        rabbit.notifyObjectRemoval({ id: result.id });
                    }
                }
            });
        });

    return router;

};
