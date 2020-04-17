var express = require('express');
var mongoose = require('mongoose');

var obj = { };

obj.checkAPIAuthentication = function (req, res, next) {
    if (!req.user) {
        return res.status(403).send({ error: 'please authenticate first' });
    } // if !req.user
    next();
};

obj.isValidObjectID = function (id) {
    return mongoose.Types.ObjectId.isValid(id);
}

obj.isValidObjectIDWithCallback = function (id, callback) {
    if (obj.isValidObjectID(id)) {
        return callback(null, mongoose.Types.ObjectId(id));
    } else {
        return callback({ error: 'Incorrect Object ID' });
    }
}

module.exports = obj;
