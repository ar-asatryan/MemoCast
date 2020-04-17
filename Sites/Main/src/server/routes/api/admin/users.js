const express = require('express');
const models = require('../../../config/models');
const async = require('async');
const jssha = require('jssha');

module.exports = function () {
    let router = express.Router();

    // users list
    router.route('/')
        .get(function (req, res) {
            let search = req.query['search'];
            let reg = { $regex : search, $options : "i" }
            let query = { $or : [
                { displayName: reg },
                { 'local-credentials.login': reg },
                { email: reg },
                { 'vkontakte-credentials.displayName' : reg },
                { 'facebook-credentials.displayName' : reg },
                { 'subs.notes': reg },
                { 'subs.cybersource.subscription-id' : reg },
                { 'subs.paypal.id' : reg }
            ] };
            let limit = 1000;
            let sort = { createDate : - 1 };
            models.User.find(query)
                .select({ subs : 0 })
                .sort(sort)
                .limit(limit)
                .exec(function (err, items) {
                    if (err) {
                        return res.status(500).send(err);
                    } else {
                        return res.send(items);
                    }
                });
        });

    router.use('/:id', function (req, res, next) {
        let userID = req.params['id'];
        models.User.findOne({ _id : userID }, function (err, user) {
            if (err) {
                return res.status(500).send(err);
            } else {
                if (!user) {
                    return res.status(404).send({ error : 'User with id ' + userID + 'not found' });
                }
            }
            req.selectedUser = user;
            next();
        });

    });
    router.route('/:id')
        // get user
        .get(function (req, res) {
            res.send(req.selectedUser);
        })
        // update user
        .put(function (req, res) {
            let userID = req.selectedUser._id;
            let update = { $set : req.body.update };
            if (req.body.unset) {
                update['$unset'] = req.body.unset;
            }
            if (req.body.update) {
                let local = req.body.update['local-credentials'];
                if (local) {
                    let sha = new jssha("SHA-1", "TEXT");
                    let salt = makeSalt();
                    let saltAndPassword = salt + local.password;
                    sha.update(saltAndPassword);
                    let hash = sha.getHash('B64');

                    update['$set']['local-credentials'] = {
                        login: local.login.toLowerCase(),
                        hash: hash,
                        salt: salt
                    }
                }
            }
            models.User.findOneAndUpdate({ _id : userID }, update, { upsert : false, new : true }, function (err, item) {
                if (err) {
                    return res.status(500).send(err);
                } else {
                    return res.send({ ok : true, user : item });
                }
            });
        });

    return router;
}

function makeSalt()
{
    let text = "";
    const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (let i = 0; i < 10; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}
