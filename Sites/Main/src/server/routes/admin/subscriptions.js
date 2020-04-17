const express = require('express');

module.exports = function () {
    let router = express.Router();
    router.route('/')
        .get(function (req, res) {
            res.render('admin/users/subscriptions', { layout : 'admin' });
        });
    return router;
};
