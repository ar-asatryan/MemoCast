const express = require('express');

module.exports = function () {

    let router = express.Router();

    // ensure that user is admin
    router.use(function (req, res, next) {
        if (req.userIsAdmin) {
            return next();
        } else {
            // http status - 403 - Forbidden
            res.status(403).send({ message : 'User not authenticated or not admin' });
        }
    });

    // items
    router.use('/items', require('./admin/items')());

    // titles
    router.use('/titles', require('./admin/titles')());

    // files
    router.use('/files', require('./admin/files')());

    // encoding requests
    router.use('/encoding-requests', require('./admin/encoding-requests')());

    // images
    router.use('/images', require('./admin/images')());

    // users
    router.use('/users', require('./admin/users')());

    // subscriptions
    router.use('/subscriptions', require('./admin/subscriptions')());

    // requests
    router.use('/requests', require('./admin/requests')());

    // autocomplete (titles, items, users, etc.)
    router.use('/autocomplete', require('./admin/autocomplete')());

    // flash items
    router.use('/flash', require('./admin/flash')());

    // captions
    router.use('/captions', require('./admin/captions'));

    router.route('/ping')
        .get(function (req, res) {
            res.send({ ping : 'pong' });
        });

    return router;

};
