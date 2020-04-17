var express = require('express');
var router = express.Router();
const models = require('../../config/models');
const async = require('async');

module.exports = function() {

    router.route('/')
        .get(function(req, res) {
            res.render('auth/passwordrecovery');
        });

    router.route('/:token')
        .get((req, res) => {
            let token = req.params['token'];
            async.waterfall([
                // get password recovery request
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
                // get accounts by email
                (data, callback) => {
                    let query = {
                        $or: [
                            { email : data.email },
                            { 'local-credentials.login' : data.email }
                        ],
                        'local-credentials.login' : { $exists : true }
                    };
                    models.User.find(query)
                        .select({ _id : 1, 'local-credentials.login' : 1})
                        .sort({ 'local-credentials.login' : 1})
                        .exec(callback);
                }
            ], (err, result) => {
                if (err) {
                    return res.redirect('/');
                }

                res.render('auth/password-restore-form', { token : token, accounts : result });
            });

        });

    return router;
};
