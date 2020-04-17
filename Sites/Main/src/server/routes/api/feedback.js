const express = require('express');
const async = require('async');
const models = require('../../config/models');
const presentation = require('../../config/presentation');
const rabbit = require('../../config/rabbit');

module.exports = function () {

    const Feedback = models.Feedback;

    const router = express.Router();

    router.route('/')
        .post(function (req, res) {
            async.waterfall([
                // checking request params
                // expecting: email, body, department
                function (callback) {

                    let body = req.body['body'];
                    let email = req.body['email'];
                    let department = req.body['department'];

                    if ((!body || !email || !department) ||
                        (body == '' || email == '' || department == '')) {
                        return callback({ error: 'Incorrect request. Expecting params in body: email, body, department' });
                    }

                    let data = {
                        email: email,
                        body: body,
                        department: department
                    };

                    callback(null, data);

                },
                // Posting feedback to db
                function (data, callback) {
                    Feedback.create(data, function (err, item) {
                        if (err) {
                            return callback(err);
                        }
                        callback(null, data);
                    });
                }
            ], function (err, result) {
                if (err) {
                    return res.status(500).send(err);
                }
                res.send(result);
                // adding feedback to rabbitmq queue for processing
                rabbit.notifyNewFeedback(result);
            });
        });

    return router;

};
