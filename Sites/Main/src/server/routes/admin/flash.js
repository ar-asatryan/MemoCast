const express = require('express');
const async = require('async');
const models = require('../../config/models');

module.exports = () => {
    let router = express.Router();

    router.route('/')
        .get((req, res) => {
            res.render('admin/flash/list', { layout : 'admin' });
        });

    router.route('/list')
        .get((req, res) => {
            res.render('admin/flash/list', { layout : 'admin' });
        });

    router.route('/add')
        .get((req, res) => {
            res.render('admin/flash/form', { layout: 'admin' });
        });

    router.route('/:id')
        .get((req, res) => {
            let id = req.params['id'];
            let query = { _id : id };
            models.Flash.findOne(query)
                .exec((err, item) => {
                    if (!item) {
                        return res.redirect('/admin/flash/')
                    } else {
                        res.render('admin/flash/form', { layout : 'admin', item : item });
                    }
                });
        });

    return router;
};
