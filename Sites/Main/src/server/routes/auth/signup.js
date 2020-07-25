const express = require('express');
const router = express.Router();
const async = require('async');
const models = require('../../config/models');
var passport = require('passport');

const jssha = require('jssha');

module.exports = function() {

    const User = models.User;

    router.route('/')
        .get(function(req, res) {
            res.render('auth/signup');
        })
        .post(function (req, res) {

            let email = req.body['username']; email = email ? email : '';
            email = email.toLowerCase();

            let displayName = req.body['displayName'];
            let password = req.body['password'];
            let confirm = req.body['confirm-password'];

            async.waterfall([
                // checking if user already exists
                function (callback) {
                    let query = { $or: [ { email: email }, { 'local-credentials.login' : email } ] };
                    User.count(query, function (err, count) {
                        if (err) {
                            return callback(err);
                        } else {
                            if (count > 0) {
                                return callback({ message: 'Пользователь с такой эл. почтой уже существует' });
                            } else {
                                return callback(null);
                            }
                        }
                    });
                },
                // user not found - create the new one
                function (callback) {

                    let sha = new jssha("SHA-1", "TEXT");
                    let salt = makeSalt();
                    let saltAndPassword = salt + password;
                    sha.update(saltAndPassword);
                    let hash = sha.getHash('B64');

                    let usr = {
                        displayName: displayName,
                        email: email,
                        'local-credentials': {
                            login: email,
                            hash: hash,
                            salt: salt
                        }
                    };

                    User.create(usr, function (err, doc) {
                        if (err) {
                            callback({ message: 'При создании пользователя произошла ошибка' });
                        } else {
                            callback(null, doc);
                        }
                    });


                }
            ], function (err, result) {
                if (err) {
                    res.render('auth/signup', {
                        email: email,
                        password: password,
                        displayName: displayName,
                        confirmPassword : confirm,
                        error: err
                    });


                } else {
                    passport.authenticate('local')(req, res, function () {
                        res.redirect('/profile/subscription/purchase-promo');
                    });
                    // req.logIn(result, function (err) {
                    //     if (err) {
                    //         res.render('auth/signup', {
                    //             email: email,
                    //             password: password,
                    //             displayName: displayName,
                    //             confirmPassword : confirm,
                    //             error: { message : 'При создании пользователя произошла ошибка' }
                    //         });
                    //     } else {
                    //         res.redirect('/profile/subscription/purchase-promo');
                    //     }
                    // });
                }
            });

        });

    return router;
};

function makeSalt()
{
    let text = "";
    const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (let i = 0; i < 10; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}
