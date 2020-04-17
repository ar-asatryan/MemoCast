var express = require('express');
var passport = require('passport');
var router = express.Router();

router.route('/vk/callback')
    .get(passport.authenticate('vkontakte', {
        successRedirect: '/secured',
        failureRedirect: '/error',
        passReqToCallback: true
    }));

router.route('/vk')
    .get(
        passport.authenticate(
            'vkontakte',
            { scope: ['status', 'email', 'notify'] }
        ), function(req, res) { }
    );

router.route('/facebook')
    .get(
        passport.authenticate('facebook', {
            scope: ['email', 'user_friends']
        })
    );

router.route('/facebook/callback')
    .get(passport.authenticate('facebook', {
        successRedirect: '/secured',
        failureRedirect: '/error',
        passReqToCallback: true
    }));

module.exports = router;