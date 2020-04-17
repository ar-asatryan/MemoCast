let express = require('express');
let http = require('http');
let https = require('https');
var async = require('async');
let models = require('../../config/models');
let settings = require('../../config/settings');

let csStatus = {
    '100' : {
        success: true,
        code: 'SOK',
        message: 'Successful transaction'
    },
    '101' : {
        code: 'DMISSINGFIELD',
        message: 'Declined - The request is missing one or more fields',
        resolution: 'See the reply fields missingField_0...N for which fields are invalid. Resend the request with the correct information.'
    },
    '102': {
        code: 'DINVALIDDATA',
        message: 'Declined - One or more fields in the request contains invalid data',
        resolution: 'See the reply fields invalidField_0...N for which fields are invalid. Resend the request with the correct information.'
    },
    '202': {
        code: 'DCARDEXPIRED',
        message: 'Decline - Expired card. You might also receive this if the expiration date you provided does not match the date the issuing bank has on file.',
        note: 'The ccCreditService does not check the expiration date; instead, it passes the request to the payment processor. If the payment processor allows issuance of credits to expired cards, CyberSource does not limit this functionality.',
        resolution: 'Request a different card or other form of payment.'
    },
    '203': {
        code: 'DCARDREFUSED',
        message: 'Decline - General decline of the card. No other information provided by the issuing bank.',
        resolution: 'Request a different card or other form of payment.'
    },
    '204': {
        code: 'DCARDREFUSED',
        message: 'Decline - Insufficient funds in the account.',
        resolution: 'Request a different card or other form of payment.'
    },
    '205': {
        code: 'DCARDREFUSED',
        message: 'Decline - Stolen or lost card.',
        resolution: 'Refer the transaction to your customer support center for manual review.'
    },
    '207': {
        code: 'DCARDREFUSED',
        message: 'Decline - Issuing bank unavailable.',
        resolution: 'Wait a few minutes and resend the request.'
    },
    '208': {
        code: 'DCARDREFUSED',
        message: 'Decline - Inactive card or card not authorized for card-not-present transactions.',
        resolution: 'Request a different card or other form of payment.'
    },
    '209': {
        code: 'DCARDREFUSED',
        message: 'Decline - card verification number (CVN) did not match.',
        resolution: 'Request a different card or other form of payment.'
    },
    '210': {
        code: 'DCARDREFUSED',
        message: 'Decline - The card has reached the credit limit.',
        resolution: 'Request a different card or other form of payment.'
    },
    '211': {
        code: 'DCARDREFUSED',
        message: 'Decline - Invalid Card Verification Number (CVN).',
        resolution: 'Request a different card or other form of payment.'
    },
    '231': {
        code: 'DINVALIDCARD',
        message: 'Decline - Invalid account number',
        resolution: 'Request a different card or other form of payment.'
    },
    '232': {
        code: 'DINVALIDDATA',
        message: 'Decline - The card type is not accepted by the payment processor.',
        resolution: 'Contact your merchant bank to confirm that your account is set up to receive the card in question.'
    },
    '240': {
        code: 'DINVALIDDATA',
        message: 'Decline - The card type sent is invalid or does not correlate with the credit card number.',
        resolution: 'Confirm that the card type correlates with the credit card number specified in the request, then resend the request.'
    },
    '450': {
        code: 'DINVALIDADDRESS',
        message: 'Apartment number missing or not found.',
        resolution: 'Ask the customer to verify the address information and resend the request.'
    },
    '451': {
        code: 'DINVALIDADDRESS',
        message: 'Insufficient address information.',
        resolution: 'Ask the customer to verify the address information and resend the request.'
    },
    '452': {
        code: 'DINVALIDADDRESS',
        message: 'House/Box number not found on street.',
        resolution: 'Ask the customer to verify the address information and resend the request.'
    },
    '453': {
        code: 'DINVALIDADDRESS',
        message: 'Multiple address matches were found.',
        resolution: 'Ask the customer to verify the address information and resend the request.'
    },
    '454': {
        code: 'DINVALIDADDRESS',
        message: 'P.O. Box identifier not found or out of range.',
        resolution: 'Ask the customer to verify the address information and resend the request.'
    },
    '455': {
        code: 'DINVALIDADDRESS',
        message: 'Route service identifier not found or out of range.',
        resolution: 'Ask the customer to verify the address information and resend the request.'
    },
    '456': {
        code: 'DINVALIDADDRESS',
        message: 'Street name not found in Postal code.',
        resolution: 'Ask the customer to verify the address information and resend the request.'
    },
    '457': {
        code: 'DINVALIDADDRESS',
        message: 'Postal code not found in database.',
        resolution: 'Ask the customer to verify the address information and resend the request.'
    },
    '458': {
        code: 'DINVALIDADDRESS',
        message: 'Unable to verify or correct address.',
        resolution: 'Ask the customer to verify the address information and resend the request.'
    },
    '459': {
        code: 'DINVALIDADDRESS',
        message: 'Multiple addres matches were found (international)',
        resolution: 'Ask the customer to verify the address information and resend the request.'
    },
    '460': {
        code: 'DINVALIDADDRESS',
        message: 'Address match not found (no reason given)',
        resolution: 'Ask the customer to verify the address information and resend the request.'
    },
    '461': {
        code: 'DINVALIDADDRESS',
        message: 'Unsupported character set',
        resolution: 'Verify the character set that you are using to process transactions.'
    }
};

let formatCCRequest = function (req, amount) {

    if ('cc-expire-date' in req) {
        let arr = req['cc-expire-date'].split(' / ');
        if (arr.length >= 2) {
            req['cc-expire-data-month'] = arr[0];
            req['cc-expire-date-year'] = arr[1];
        }
    }

    let result = {
    	"request" : {
            "SubscriptionID": req['subscription-id'],
    		"Amount": amount,
    		"BillTo": {
    			"FirstName": req['first-name'],
    			"LastName": req['last-name'],
    			"Address": req['address'],
    			"City": req['city'],
    			"State": req['region'],
    			"PostalCode": req['postal-code'],
    			"Country": req['country'],
    			"Email": req['e-mail']
    		},
    		"PaymentTitle": "Gold Membership Subscription",
    		"CreditCard": {
    			"CardNumber": req['cc-number'],
    			"ExpirationMonth": req['cc-expire-data-month'],
    			"ExpirationYear": req['cc-expire-date-year'],
    			"CardType": req['cc-card-type']
    		}
    	}
    };

    return result;
};

let makeProxyRequest = function (url, data, callback) {
    let param = data;

    let options = settings['payments-proxy'];
    options = JSON.parse(JSON.stringify(options));
    options.path = url;

    let http_ = options.port == 443 ? https : http;

    let r = http_.request(options, function (response) {
        let str = '';
        response.on('data', function (chunk) {
            str += chunk;
        });
        response.on('end', function () {
            let resp = JSON.parse(str);
            let d = resp['d'];
            if (callback) {
                callback(d);
            }
        });
    });

    // write data to request body
    r.write(JSON.stringify(param));
    r.end();
};

let paymentProcessor = function (req, res, amount, paymentURL, successPaymentCallback) {

    let params = formatCCRequest(req.body, amount);

    makeProxyRequest(paymentURL, params, function (data) {

        async.waterfall([
            // check for error and reply fields
            function (callback) {
                if (!data) { return callback('Unknown error'); }
                let err = data['Error'];
                let reply = data['Reply'];
                if (err) {
                    return callback(err);
                }
                if (!reply) {
                    return callback('Unknown error');
                }
                return callback(null, reply);
            },
            // checking reasonCode in reply
            function (reply, callback) {
                let reasonCode = reply['reasonCode'];
                let status = csStatus[reasonCode];
                if (!status) {
                    return callback('Unknown payment error');
                }
                if (status.success) {
                    return callback(null, reply);
                } else {
                    return callback(status, { status : status });
                }
            },
            // all fine with payment - adding subscription to DB
            successPaymentCallback
        ], function (err, result) {
            if (err) {
                res.status(500).send({ error : err, ok: false });
            } else {
                res.send({ ok : true });
            }
        });

    });
};

module.exports = function () {

    let router = express.Router();

    router.use(function(req, res, next) {
            if (!req.user) {
                res.status(401).send('Unauthorized');
            } else {
                next();
            }
        });

    router.route('/hello')
        .post(function (req, res) {
            let name = req.body['name'];
            // res.send ( { message : 'Hello, ' + name } );

            let param = { request : { name : name } };
            makeProxyRequest( '/services/payments/cb.asmx/SayHello' , param, function (response) {
                res.send(response);
            } );

        });

    router.route('/2dayspass')
    .post(function (req, res) {

        paymentProcessor(req, res, 2.99, '/services/payments/cb.asmx/CreateOneTimePayment', function (reply, callback) {
            let requestID = reply.requestID;
            let expire = new Date();
            expire.setDate(expire.getDate() + 2);
            let sub = {
                active: true,
                kind: 'onetime',
                expire: expire,
                cybersource: {
                    'merchantReferenceCode': reply.merchantReferenceCode
                }
            };
            let update = { $push : { subs: sub } };
            models.User.findByIdAndUpdate(req.user['_id'], update, { new : true }, callback);
        });
    });

    router.route('/subscription')
        .post(function (req, res) {

            paymentProcessor(req, res, 9.95, '/services/payments/cb.asmx/CreateSubscription', function (reply, callback) {
                let requestID = reply.requestID;
                let sub = {
                    active: true,
                    kind: 'recurring',
                    cybersource: {
                        'subscription-id': requestID
                    }
                };
                let update = { $push : { subs: sub } };
                models.User.findByIdAndUpdate(req.user['_id'], update, { new : true }, callback);
            });
        })
        .patch(function (req, res) {
            async.waterfall([
                // checking if active subscription equals with subscription-id
                function (callback) {
                    let SubscriptionID = req.body['subscription-id'];
                    let subscription = req.activeSubscription;
                    if (subscription) {
                        let cybersource = subscription.cybersource;
                        if (cybersource) {
                            if (SubscriptionID && cybersource['subscription-id'] === SubscriptionID) {
                                return callback(null, SubscriptionID);
                            }
                        }
                    }
                    return callback({ message : 'Can\'t update empty subscription'});
                }
            ], function (err, result) {

                if (err) {
                    res.status(500).send({ error : err, ok: false });
                } else {
                    paymentProcessor(req, res, 9.95, '/services/payments/cb.asmx/UpdateSubscription', function (reply, callback) {
                        callback(null, { ok : true });
                    });
                }

                // res.send({ err: err, result : req.activeSubscription });
            });
        });

    router.route('/countries')
        .get(function (req, res) {
            models.CyberSourceCountry.find({})
                .select( { name : 1 } )
                .sort({ top : -1, default : -1, name : 1 })
                .exec(function (err, items) {
                    res.send(items);
                });
        });

    router.route('/regions/:country')
        .get(function (req, res) {
            let country = req.params['country'];
            models.CyberSourceCountry.findById({ _id : country })
                .select( { regions : 1, _id : 0 } )
                .exec(function (err, item) {
                    if (item) {
                        res.send(item.regions.map(function (r) {
                            return {
                                code: r.code,
                                name: r.name
                            };
                        }));
                    } else {
                        res.send([]);
                    }
                });
        });

    router.use('/paypal', require('./payments-paypal')());

    return router;

};
