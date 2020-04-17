var express = require('express');
var router = express.Router();
var passport = require('passport');

module.exports = function() {

    var router = express.Router();

    router.post('/', passport.authenticate('local', {
        failureRedirect: '/login',
        failureFlash: true,
        passReqToCallback: true
    }), function(req, res) {

        var sess = req.session;
        var url = sess['redirect-after-login'];
        if (url) {
            sess['redirect-after-login'] = null;
            res.redirect(url);
        } else {
            res.redirect('/');
        }
    });

    router.get('/', function(req, res) {

//        console.dir(req.session);

        if (req.user) {

            var sess = req.session;
            var url = sess['redirect-after-login'];
            if (url) {
                sess['redirect-after-login'] = null;
                res.redirect(url);
            } else {
                res.redirect('/');
            }

        } else {
            var flash = req.flash('error');
            var ctx = { message: null };
            if (flash) {
                if (flash[0]) {
                    ctx.message = flash[0];
                }
            }
            res.render('auth/login', ctx);
        }
    });

//    router.route('/')
//        .get(function(req, res) {
//            res.render('auth/login');
//        });

    return router;
};
