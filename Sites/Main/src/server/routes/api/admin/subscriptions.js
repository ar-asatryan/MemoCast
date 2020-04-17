const express = require('express');
const models = require('../../../config/models');
const async = require('async');
const mongoose = require('mongoose');

module.exports = function () {
    let router = express.Router();

    router.route('/')
        // GET subs list
        .get(function (req, res) {
            models.User.aggregate([
                { $match : { subs : { $exists : true } } },
                { $project : { _id : 0, user : { _id : '$_id', displayName: '$displayName' }, sub : '$subs' } },
                { $unwind : '$sub' },
                { $match: { 'sub.active': true } },
                { $sort : { 'sub.createDate' : -1 } },
            ])
            .exec(function (err, items) {
                if (err) {
                    return res.status(500).send(err);
                } else {
                    return res.send(items);
                }
            });
        })
        .post(function (req, res) {
            let userID = req.body.user;
            let sub = req.body.subscription;
            sub._id = mongoose.Types.ObjectId();
            models.User.update({ _id : userID }, { $push : { subs : sub }}, function (err, raw) {
                if (err) {
                    return res.status(500).send(err);
                } else {
                    return res.send(raw);
                }
            });
        });

    router.route('/:id')
        // GET sub by id
        .get(function (req, res) {
            let subscriptionID = new mongoose.Types.ObjectId(req.params['id']);
            models.User.aggregate([
                { $match : { 'subs._id' : subscriptionID } },
                { $project : { _id : 0, user: { _id : '$_id', displayName: '$displayName' }, sub: '$subs' } },
                { $unwind : '$sub' },
                { $match : { 'sub._id' : subscriptionID } }
            ])
            .exec(function (err, items) {
                if (err) {
                    return res.status(500).send(err);
                } else {
                    return res.send(items);
                }
            });
        })
        // DELETE sub by id
        .delete(function (req, res) {
            let subscriptionID = new mongoose.Types.ObjectId(req.params['id']);
            let update = { $pull: { subs : { _id : subscriptionID } } };
            models.User.update({ 'subs._id' : subscriptionID }, update, function (err, raw) {
                if (err) {
                    return res.status(500).send(err);
                } else {
                    return res.send({ ok : true, raw : raw });
                }
            });
        });

    // TODO: add sub


    return router;
};
