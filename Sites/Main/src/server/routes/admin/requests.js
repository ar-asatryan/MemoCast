const express = require('express');
const async = require('async');
const models = require('../../config/models');

module.exports = function () {

    const router = express.Router();

    router.use((req, res, next) => {
        res.locals.search = {
            type : 'videos'
        };
        next();
    });

    router.route('/')
        .get(function (req, res) {
            res.render('admin/requests', { layout : 'admin' });
        });

    router.route('/:id')
        .get((req, res) => {
            let id = req.params['id'];
            let query = { _id : id };
            models.VideoRequest.findOne(query)
                .populate('user', 'displayName')
                .populate('videoTitles', 'title')
                .populate('videoItems', 'title videoItem')
                .exec((err, item) => {
                    if (!item) {
                        return res.redirect('/admin/requests');
                    } else {
                        res.render('admin/request', { layout : 'admin', item : item });
                    }
                });
        });

    return router;

};
