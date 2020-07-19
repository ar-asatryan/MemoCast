var express = require('express');

module.exports = function() {

    var router = express.Router();

    router.use(function(req, res, next) {
        if (req.user) {
            return next();
        } else {
            res.redirect('/login');
        }
    });

    router.route('/')
        .get(function(req, res) {

            var sess = req.session;
            var url = sess['redirect-after-login'];
            if (url) {
                sess['redirect-after-login'] = null;
                req.session.save(function () { });
                res.redirect(url);
            } else {
                if (req.activeSubscription) {
                    res.redirect('/');
                }
               // else {
                //    res.redirect('/profile/subscription/purchase-promo')
               // }
            }

        });

    return router;

};
