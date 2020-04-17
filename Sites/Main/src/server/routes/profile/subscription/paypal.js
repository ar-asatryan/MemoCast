const express = require('express');
const paypal = require('paypal-rest-sdk');
const settings = require('../../../config/settings');
const models = require('../../../config/models');
const async = require('async');

paypal.configure(settings.paypal);

module.exports = function () {

    let router = express.Router();

    router.route('/cancel')
        .get(function (req, res) {
            res.redirect('/profile/subscription');
        });

    router.route('/success')
        .get(function (req, res) {
            let token = req.query['token'];
            async.waterfall([
                // execute billing agreement
                function (callback) {
                    paypal.billingAgreement.execute(token, {}, callback);
                },
                function (billingAgreement, callback) {
                    let sub = {
                        active: true,
                        kind: 'recurring',
                        paypal: billingAgreement
                    };
                    let update = { $push : { subs: sub } };
                    models.User.findByIdAndUpdate(req.user['_id'], update, { new : true }, callback);
                }
            ], function (err, result) {
                res.redirect('/profile/subscription');
            });
        });

    router.route('/2daypass-success')
        .get(function (req, res) {
            let token = req.query['token'];
            let PayerID = req.query['PayerID'];
            let paymentId = req.query['paymentId'];
            async.waterfall([
                // execute payment
                function (callback) {
                    let execute_payment_json = {
                        payer_id: PayerID,
                        "transactions": [{
                            "amount": {
                                currency: 'USD',
                                total: "2.99"
                            }
                        }]
                    };
                    paypal.payment.execute(paymentId, execute_payment_json, callback);
                },
                function (payment, callback) {
                    let expire = new Date();
                    expire.setDate(expire.getDate() + 2);
                    let sub = {
                        active: true,
                        kind: 'onetime',
                        expire: expire,
                        paypal: payment
                    };
                    let update = { $push : { subs: sub } };
                    models.User.findByIdAndUpdate(req.user['_id'], update, { new : true }, callback);
                }
            ], function (err, result) {
                res.redirect('/profile/subscription');
            });
        });

    return router;

};
