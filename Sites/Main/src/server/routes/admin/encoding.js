const express = require('express');

module.exports = function () {
    let router = express.Router();
    
    router.use((req, res, next) => {
        res.locals.search = {
            type : 'videos'
        };
        next();
    });

    router.route('/')
        .get(function (req, res) {
            res.render('admin/videos/encoding', {
                layout: 'admin'
            });
        });
    return router;
}
