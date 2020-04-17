var express = require('express');
var async = require('async');
var models = require('../../config/models');
var presentation = require('../../config/presentation');
var mongoose = require('mongoose');
var io = require('../../config/io');

module.exports = function() {

    var PersonalMessage = models.PersonalMessage;
    var User = models.User;

    var router = express.Router();

    // check for user's authentication
    router.use(function(req, res, next) {
        if (!req.user) {
            return res.status(403).send({ error: 'please authenticate first' });
        } // if !req.user
        next();
    });

    router.route('/')
        .post(function(req, res) {
            var ToUserID = req.body.to;
            var FromUserID = req.user._id;

            async.waterfall([
                // check input params
                function(callback) {
                    var msg = req.body;
                    var result = {
                        from: FromUserID,
                        createDate: new Date
                    };
                    if (msg.to && msg.body) {
                        result.to = msg.to;
                        result.body = msg.body;
                        if (!mongoose.Types.ObjectId.isValid(msg.to)) {
                            return callback({ error: 'Incorrect user ID' });
                        }
                    } else {
                        return callback( { error: 'Please specify recepient user\'s id and message body' } );
                    }

                    if (msg.videoTitle) {
                        if (!mongoose.Types.ObjectId.isValid(msg.videoTitle)) {
                            return callback({ error: 'Incorrect video title ID' });
                        }
                        result.videoTitle = msg.videoTitle;
                    }

                    callback(null, result);
                },
                // create new message in DB
                function(msg, callback) {
                    PersonalMessage.create(msg, function(err, item) {
                        return callback(err, item);
                    });
                },
                // MSG from DB ---> presentation
                function(msg, callback) {
                    msg.from = req.user;
                    callback(null, presentation.PersonalMessage(msg));
                },
                function(msg, callback) {
                    let envelope = {
                        type: 'personal-message',
                        data: msg
                    };
                    io.sendMessageToUser(msg.to, envelope);
                    callback(null, msg);
                }
            ], function(err, result) {

                if (err) {
                    return res.status(500).send(err);
                }

                res.send(result);
            });

        });

    router.route('/unread')
        .get(function(req, res) {
            async.waterfall([
                // query DB
                function(callback) {

                    var UserID = req.user['_id'];

                    var query = {
                        $or: [ { to: UserID }, { from: UserID }]
                    };

                    PersonalMessage.find(query)
                        .sort({ createDate: 'desc' })
                        .exec(function(err, items) {
                            callback(err, items);
                        });
                },
                // DB items --> presentation
                function(items, callback) {
                    callback(items.map(presentation.PersonalMessage), false);
                }
            ], function(err, result) {
                if (err) {
                    return res.status(500).send(err);
                }
                res.send(result);
            })
        });

    router.route('/dialogs')
        .get(function(req, res) {
            async.waterfall([
                // get from's for dialogs
                function(callback) {
                    var UserID = req.user._id;
                    PersonalMessage.aggregate(
                        { $match: { from: UserID } },
                        { $group: { _id: "$to", date: { $max: "$createDate" } } },
                        { $sort: { date: -1 } },
                        function (err, items) {
                            return callback(err, items);
                        }
                    );
                },
                // get to's for dialogs
                function(froms, callback) {
                    var UserID = req.user._id;
                    var fromIDS = froms.map(function(item) {
                        return item._id;
                    });
                    PersonalMessage.aggregate(
                        { $match: { to: UserID, from: { $nin: fromIDS} } },
                        { $group: { _id: "$from", date: { $max: "$createDate" } } },
                        { $sort: { date: -1 } },
                        function (err, items) {
                            return callback(err, froms, items);
                        }
                    );
                },
                // combine to's and from's
                function(froms, tos, callback) {
                    all = froms.concat(tos);
                    callback(null, all);
                },
                // get users
                function(all, callback) {
                    var ids = all.map(function (item) {
                        return item._id;
                    });
                    User.find({ _id: { $in: ids }}, function (err, items) {
                        return callback(err, items, all);
                    })
                },
                // combine results
                function(users, all, callback) {
                    all.forEach(function (item, i, arr) {
                        var tmp = users.filter(function (usr) {
                            return usr._id.equals(item._id);
                        })
                        if (tmp.length > 0) {
                            item.user = presentation.User(tmp[0]);
                        }
                    });
                    var result = all.map(function(item) {
                        return {
                            date: item.date,
                            user: item.user
                        };
                    });
                    callback(null, result);
                }
            ], function(err, result) {
                if (err) {
                    return res.status(500).send(err);
                }
                res.send(result);
            });
        });

    router.route('/dialog/:userid')
        .get(function (req, res)
        {
            var UserID = req.params.userid;
            async.waterfall([
                function (callback) {
                    if (!mongoose.Types.ObjectId.isValid(UserID)) {
                        return callback({ error: 'Incorrect user id'});
                    }
                    return callback(null, UserID);
                },
                function (userID, callback) {
                    var currentUserID = req.user._id;
                    var query = { $or: [
                        { to: currentUserID, from: userID },
                        { from: currentUserID, to: userID }
                    ] };
                    PersonalMessage.find(query)
                        .sort({ createDate: 'asc' })
                        .populate('from to videoTitle')
                        .exec(function (err, items) {
                            callback(err, items);
                        });
                },
                function (items, callback) {
                    return callback(null, items.map(presentation.PersonalMessage));
                }
            ], function (err, result) {
                if (err) {
                    return res.status(500).send(err);
                }
                res.send(result);
            });
        });

    router.route('/markasread')
        .put(function(req, res) {
            var MessageID = req.body.id;
            var UserID = req.user._id;
            async.waterfall([
                function(callback) {
                    if (!mongoose.Types.ObjectId.isValid(MessageID)) {
                        return callback('Incorrect message id.');
                    }
                    return callback(null, MessageID, UserID);
                },
                function(msgID, userID, callback) {
                    var query = { to: userID, _id: msgID };
                    var update = { $set: { readed: true } };
                    var options = { new: true, upsert: false };
                    PersonalMessage.findOneAndUpdate(query, update, options, function (err, item) {
                        if (err) {
                            return callback(err);
                        }
                        if (!item) {
                            return callback({ error: 'Message not found' });
                        }
                        return callback(null, presentation.PersonalMessage(item));
                    });
                }
            ], function(err, result) {
                if (err) {
                    return res.status(500).send(err);
                }
                res.send(result);
            });
        });

    router.route('/:id')
        .delete(function(req, res) {
            var MessageID = req.params['id'];
            async.waterfall([
                function(callback) {
                    if (!mongoose.Types.ObjectId.isValid(MessageID)) {
                        return callback({ error: 'Incorrect user ID' });
                    }
                    return callback(null, MessageID);
                },
                function (msgID, callback) {
                    if (!req.userIsAdmin) {
                        return callback({ error: 'You can\'t remove messages' });
                    }
                    return callback(null, msgID);
                },
                function (msgID, callback) {
                    PersonalMessage.findByIdAndRemove(msgID, function (err, doc) {
                        return callback(err, { message: 'Message with ID = ' + msgID + ' was removed.'});
                    });
                }
            ], function(err, result) {
                if (err) {
                    return res.status(500).send(err);
                }
                res.send(result);
            });
        });


    return router;

};
