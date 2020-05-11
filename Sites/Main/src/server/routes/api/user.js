const express = require('express');
const models = require('../../config/models');
const rabbit = require('../../config/rabbit');
const presentation = require('../../config/presentation');
const async = require('async');
const uuidv4 = require('uuid/v4');
const jssha = require('jssha');
const _ = require('lodash');

var User = models.User;
const mongoose = require('mongoose');

function makeSalt()
{
    let text = "";
    const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (let i = 0; i < 10; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}

module.exports = function () {

    var router = express.Router();

    router.route('/password-recovery')
        // create password restore request
        .post((req, res) => {
            if (req.user) {
                return res.status.send({ message : 'You already logged in' });
            }
            let email = req.body.email;
            async.waterfall([
                // load users with posted email
                callback => {
                    let query = {
                        $or: [
                            { email : email },
                            { 'local-credentials.login' : email }
                        ],
                        'local-credentials.login' : { $exists : true }
                    };
                    models.User.count(query, (err, count) => {
                        callback(err, count);
                    });
                },
                // checking if count > 0
                (count, callback) => {
                    if (count == 0) {
                        return callback({ message: 'This email not found' });
                    }
                    callback(null, { count : count });
                },
                // creating password restore request in DB
                (data, callback) => {
                    let token = uuidv4();
                    let prr = {
                        email: email,
                        createDate : new Date(),
                        token: token
                    };
                    models.PasswordRestore.create(prr, (err, doc) => {
                        callback(err, doc);
                    });
                },
                // sending email
                (doc, callback) => {
                    let id = doc.token;
                    let email = doc.email;
                    let mail = {
            			from: {
                            name: 'Memocast Password Recovery',
                            address: 'info@memocast.com'
                        },
            			to: doc.email,
            			subject: 'Memocast Password Recovery',
            			template: 'password-recovery',
            			context: { link : 'https://www.memocast.com/passwordrecovery/' + id }
            		};
                    rabbit.sendEmail(mail);
                    callback(null, {});
                }
            ], (err, result) => {
                if (err) {
                    // let nameMatch = /(?:\"email\"\ \: \")(.+)(\"\,)$/g;
                    // if(models.User.email != nameMatch) {
                    //     res.send({ message : 'This E-Mail has not been found' });
                    // }
                    return res.status(500).send(err);
                }
                res.send({ message : 'An email with instructions on how to reset your password has been sent to your e-mail. Check your spam or junk folder if you don\’t see the email in your inbox.' });
            });
        })
        // change account password
        .put((req, res) => {
            if (req.user) {
                return res.status(500).send({ message : 'You already logged in' });
            }
            let token = req.body.token;
            let user = req.body.user;
            let password = req.body.password;
            async.waterfall([
                // checking password restore
                (callback) => {
                    models.PasswordRestore.findOne({ token : token })
                        .exec((err, item) => {
                            if (err) {
                                return callback(err);
                            }
                            if (!item) {
                                return callback({ message : 'Unknown restore token' });
                            }
                            let data = {
                                token : token,
                                email : item.email
                            };
                            callback(null, data);
                        });
                },
                // checking user
                (data, callback) => {
                    let query = {
                        $or: [
                            { email : data.email },
                            { 'local-credentials.login' : data.email }
                        ],
                        _id : user
                    };
                    models.User.count((err, count) => {
                        if (err) {
                            return callback(err);
                        }
                        if (count == 0) {
                            return callback({ message : 'Unknown user'});
                        }
                        callback(null, data);
                    });
                },
                // updating password
                (data, callback) => {
                    let sha = new jssha("SHA-1", "TEXT");
                    let salt = makeSalt();
                    let saltAndPassword = salt + password;
                    sha.update(saltAndPassword);
                    let hash = sha.getHash('B64');

                    let update = {
                        $set : {
                            'local-credentials.hash' : hash,
                            'local-credentials.salt' : salt
                        }
                    };

                    // clear all user sessions
                    const deleteQuery = { user: mongoose.Types.ObjectId(user) };
                    models.UserSession.deleteMany(deleteQuery)
                      .exec((err) => {
                        console.log('clear sessions', err);
                      });
                    // update user
                    models.User.findOneAndUpdate(
                      { _id : user },
                      update,
                      { upsert : false, new : true },
                      (err, item) => {
                        callback(err, item);
                      }
                    );
                },
                // remove password restore from db
                (usr, callback) => {
                    models.PasswordRestore.remove({ token : token }, (err) => {
                        callback(err, usr);
                    });
                },
                // login
                (usr, callback) => {
                    req.login(usr, (err) => {
                        if (err) {
                            return callback(err);
                        }
                        callback(null, { message : 'Password updated' });
                    });
                }
            ], (err, result) => {
                if (err) {
                  return res.status(500).send(err);
                }
                res.send(result);
            });
        });

    router.route('/userid-check')
        .post(function(req, res) {
            var query = { userID: req.body.userID };
            User.findOne(query)
                .select('_id')
                .exec(function(err, user) {
                    if (err) {
                        return res.status(500).send({ error: err });
                    }

                    var available = false;

                    if (user) {
                        if (req.user) {
                            available = req.user['_id'].equals(user['_id']);
                        } else {
                            available = false;
                        }
                    } else {
                        available = true;
                    }

                    res.send({ available: available });

                });
        });

    router.route('/profile')
        .post(function(req, res) {

            if (!req.user) {
                return res.status(401).send('Unauthorized');
            }

            var bd = req.body['birth-date'];
            if (bd && bd != '') {
                bd = new Date(bd);
            } else {
                bd = null;
            }

            var update = {
                $set: {
                    displayName: req.body['displayName'],
                    email: req.body['email'],
                    city: req.body['city'],
                    sex: req.body['sex'],
                    birthDate: bd }
            };
            User.findByIdAndUpdate(req.user['_id'],
                update,
                { new: true },
                function(err, user) {
                    if (err) {
                        return res.status(500).send({ error: err });
                    }

                    if (!user) {
                        return res.status(404).send({ error: 'User not found' });
                    }

                    res.send(presentation.User(user));
                }
            );
        });

    router.route('/password')
        .put(async (req, res) => {

            if (!req.user) {
                return res.status(401).send('Unauthorized');
            }

            const { _id: userID } = req.user;

            try {
                const { password } = req.body;

                let local = req.user['local-credentials'];
                if (!!local) {
                    const sha = new jssha("SHA-1", "TEXT");
                    const salt = makeSalt();
                    const saltAndPassword = salt + password;
                    sha.update(saltAndPassword);
                    const hash = sha.getHash('B64');

                    const update = {
                        $set : {
                            'local-credentials.hash' : hash,
                            'local-credentials.salt' : salt
                        }
                    };

                    const item = await models.User.findOneAndUpdate({ 
                      _id : userID, 
                      'local-credentials': { $exists: true } 
                    }, update, { upsert : false, new : true });
                    
                    const session = _.get(req, 'user.session', null);
                    if (session != null) {
                      await models.UserSession.remove({ user: userID, _id: { $ne: session._id } });
                      if (!session.isActive) {
                        await models.UserSession.updateOne({ _id: session._id }, {$set: { isActive: true }});
                      }
                    }

                    return res.send({ ok : true, user : item });
                    
                } else {
                    throw new Error('Incorrect user account type');
                }
            }
            catch (err) {
              console.log(err.message);
              res.status(500).send(err);
            }

        });

    router.route('/incognito')
        .post(function (req, res) {

            if (!req.user) {
                return res.status(401).send('Unauthorized');
            }

            var incognito = req.body['incognito'] ? req.body['incognito'] : false;

            var update = {
                $set: { incognito: incognito }
            };

            User.findByIdAndUpdate(req.user['_id'],
                update,
                { new: true, upsert: false },
                function(err, user) {
                    if (err) {
                        return res.status(500).send({ error: err });
                    }

                    if (!user) {
                        return res.status(404).send({ error: 'User not found' });
                    }

                    res.send(presentation.User(user));
                }
            );
        });

    router.route('/activate-welcome-back-subscription')
        .post(async (req, res) => {
            try {

                if (!req.user) {
                    throw new Error('Unknown user');
                }

                const wbe = req['welcome-back'];
                if (!wbe) {
                    throw new Error('Your account not eligibled for free subscription');
                }
                //
                // const { email } = req.user;
                // const where = { email, activated: false };
                // const wbe = models.WelcomeBackEmail.findOne(where);


                const expire = new Date();
                expire.setDate(expire.getDate() + 30);
                const sub = {
                    active: true,
                    kind: 'onetime',
                    expire: expire,
                    notes: 'Welcome Back Subscription'
                };
                const update = { $push : { subs: sub } };
                await models.User.findByIdAndUpdate(req.user['_id'], update, { new : false });

                wbe.activated = true;
                await wbe.save();

                res.json({ ok: true });

            } catch (e) {
                res.status(500).send(e);
            }
        });

    return router;

};
