var express = require('express');

module.exports = function(app) {

    var router = express.Router();

    router.use(function(req, res, next) {
        if (req.userIsAdmin) {
            next();
        } else {
            res.redirect('/login');
        }
    });

    router.route('/')
        .get(function(req, res) {
            res.render('admin/index', { layout: 'admin' });
        });

    router.use('/videos', require('./videos')());
    router.use('/titles', require('./videos')());
    router.use('/encoding', require('./encoding')());
    router.use('/subscriptions', require('./subscriptions')());
    router.use('/user', require('./user')());
    router.use('/requests', require('./requests')());
    router.use('/settings', require('./settings')());
    router.use('/flash', require('./flash')());

    router.route('/users')
        .get(require('./users'));

    return router;
};
