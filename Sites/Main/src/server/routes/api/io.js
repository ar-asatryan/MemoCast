var express = require('express');
var io = require('../../config/io');
var async = require('async');

module.exports = function () {
    var router = express.Router();

    router.route('/connect')
        .post(function(req, res) {
            var id = req.body['id'];
            async.waterfall([
                function (callback) {
                    if (!id || id == '') {
                        return callback({ error: 'incorrect socket id' });
                    }
                    callback(null, id);
                },
                function (socketID, callback) {
                    var usr = req.user;
                    if (!usr) {
                        return callback({ error: 'Please login first' });
                    }
                    callback(null, socketID, usr._id.toString());
                },
                function (socketID, userID, callback) {
                    var sockets = io.users[userID];
                    if (!sockets) {
                        sockets = [];
                    }
                    var socket = {
                        socketID: socketID
                    };
                    if (req.body['videoTitleID']) {
                        socket.videoTitleID = req.body.videoTitleID;
                    }
                    sockets.push(socket);
                    io.users[userID] = sockets;
                    callback(null, { message: 'OK' });
                }
            ], function (err, result) {
                if (err) {
                    return res.status(500).send(err);
                }
                res.send(result);
            });
        });

    return router;
};
