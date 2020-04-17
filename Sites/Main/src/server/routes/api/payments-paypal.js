const paypal = require('paypal-rest-sdk');
const async = require('async');
const models = require('../../config/models');
const settings = require('../../config/settings');
const express = require('express');

paypal.configure(settings.paypal);

module.exports = function () {

    let router = express.Router();

    router.route('/subscription')
        .post(function (req, res) {

            async.waterfall([
                // looking for billina plan in db
                function (callback) {
                    let query = { name: 'gold' };
                    models.PayPalBillingPlan.findOne(query, callback);
                },
                // if billing plan exists - using it, if not - create one
                function (billingPlanItem, callback) {
                    if (billingPlanItem) {
                        return callback(null, billingPlanItem);
                    }
                    if (!billingPlanItem) {
                        let billingPlanOptions = {
                            "name": "Memocast Gold Membership",
                            "description": "Memocast Gold Membership Subscription - unlimited access to Memocast Movies Library.",
                            "type": "INFINITE",
                            "payment_definitions": [
                                {
                                    "name": "Memocast Gold Membership Regular Payment",
                                    "type": "REGULAR",
                                    "frequency_interval": "1",
                                    "frequency": "MONTH",
                                    "cycles": "0",
                                    "amount": {
                                        "value": "9.95",
                                        "currency": "USD"
                                    }
                                }
                            ],
                            "merchant_preferences": {
                                "cancel_url": "http://localhost:7885/profile/subscription/paypal/cancel",
                                "return_url": "http://localhost:7885/profile/subscription/paypal/success",
                                "max_fail_attempts": "0",
                                "auto_bill_amount": "YES",
                                "initial_fail_amount_action": "CANCEL"
                            }
                        };
                        paypal.billingPlan.create(billingPlanOptions, function (err, plan) {
                            if (err) {
                                return callback(err);
                            } else {
                                // plan created - activating it
                                let billingPlanId = plan.id;
                                let billing_plan_update_attributes = [
                                    {
                                        "op": "replace",
                                        "path": "/",
                                        "value": {
                                            "state": "ACTIVE"
                                        }
                                    }
                                ];
                                paypal.billingPlan.update(billingPlanId, billing_plan_update_attributes, function (error, response) {
                                    if (err) { return callback(err); }
                                    plan.state = 'ACTIVE';
                                    let planObj = {
                                        plan: plan,
                                        name: 'gold'
                                    };
                                    models.PayPalBillingPlan.create(planObj, callback);
                                });
                            }
                        });
                    }
                },
                // crate billing agreement options
                function (billingPlanItem, callback) {
                    let isoDate = new Date();
                    // 2 weeks in seconds
                    let trialPeriod = 2 * 7 * 24 * 60 * 60;
                    isoDate.setSeconds(isoDate.getSeconds() + trialPeriod);
                    let isoDateStr = isoDate.toISOString().slice(0, 19) + 'Z';
                    let PlanID = '';
                    if (billingPlanItem.plan) {
                        PlanID = billingPlanItem.plan.id;
                    }
                    let billingAgreementOptions = {
                        name: 'Memocast Gold Membership',
                        description: 'Memocast Gold Membership Subscription - unlimited access to Memocast Movies Library.',
                        start_date: isoDateStr,
                        plan:
                        {
                          id: PlanID
                        },
                        payer:
                        {
                          payment_method: 'paypal'
                        },
                        override_merchant_preferences: settings.paypal['override_merchant_preferences']
                    };
                    callback(null, billingAgreementOptions);
                },
                // create billing agreement
                function (billingAgreementOptions, callback) {
                    paypal.billingAgreement.create(billingAgreementOptions, callback);
                },
                // analize billing agreement response
                function (billingAgreement, callback) {
                    let approval_url = '';
                    for (let index = 0; index < billingAgreement.links.length; index++) {
                        if (billingAgreement.links[index].rel === 'approval_url') {
                            approval_url = billingAgreement.links[index].href;
                            break;
                        }
                    }
                    if (approval_url === '') {
                        callback({ message : 'Can\'t get approval url from PayPal.'});
                    } else {
                        callback(null, { url : approval_url });
                    }
                }
            ], function (err, result) {
                if (err) {
                    return res.status(500).send({ error : err });
                } else {
                    return res.send(result);
                }
            });

        });

    router.route('/2daypass')
        .post(function (req, res) {

            async.waterfall([
                // create payment options
                function (callback) {
                    let paymentOptions = {
                        intent: 'sale',
                        payer:
                        {
                          payment_method: 'paypal'
                        },
                        transactions: [{
                            amount: {
                                total: '2.99',
                                currency: 'USD'
                            },
                            description: 'Memocast 2-days pass ticket'
                        }],
                        redirect_urls: settings.paypal['2daypass-redirect_urls']
                    };
                    callback(null, paymentOptions);
                },
                // get payment data from paypal
                function (paymentOptions, callback) {
                    paypal.payment.create(paymentOptions, callback);
                },
                // analize payment response
                function (payment, callback) {
                    let approval_url = '';
                    for (let index = 0; index < payment.links.length; index++) {
                        if (payment.links[index].rel === 'approval_url') {
                            approval_url = payment.links[index].href;
                            break;
                        }
                    }
                    if (approval_url === '') {
                        callback({ message : 'Can\'t get approval url from PayPal.'});
                    } else {
                        callback(null, { url : approval_url });
                    }
                }
            ], function (err, result) {
                if (err) {
                    return res.status(500).send({ error : err });
                } else {
                    return res.send(result);
                }
            });

        });

    return router;

};
