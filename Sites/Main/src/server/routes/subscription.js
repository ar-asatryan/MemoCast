var express = require('express');

module.exports = function() {

    var router = express.Router();

    // detect is current subscription updateable
    router.use(function (req, res, next) {
        let subscription = req.activeSubscription;
        if (subscription) {
            if (subscription.kind === 'recurring' && subscription.cybersource) {
                req.activeSubscriptionUpdateable = true;
                res.locals.activeSubscriptionUpdateable = true;
            }
        }
        next();
    });

    router.route('/')
        .get(function(req, res) {
            if (req.activeSubscription) {
                res.render('subscription/status', { layout: 'profile' });
            } else {
                res.redirect('/profile/subscription/purchase');
            }
        });

    router.route('/purchase')
        .get(function(req, res) {
            if (!req.activeSubscription || req.activeSubscriptionIsTemporary) {
                res.render('subscription/purchase', { layout: 'main' });
            } else {
                res.redirect('/profile/subscription');
            }
        });

    router.route('/update')
        .get(function (req, res) {
            if (req.activeSubscriptionUpdateable) {
                res.render('subscription/update', { layout: 'main' });
            } else {
                res.redirect('/profile/subscription');
            }
        });

    router.route('/family')
        .get(function(req, res) {
            res.render('subscription/family', { layout: 'profile' });
        });

    router.route('/welcome')
        .get(function (req, res) {
            res.redirect('/profile/subscription');
        });

    router.use('/paypal', require('./profile/subscription/paypal')());

    return router;

};
