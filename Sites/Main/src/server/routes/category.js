var express = require('express');
const mongoose = require('mongoose');
var models = require('../config/models');
var controller = require('../controllers/categories')();
const permalink = require('../helpers/permalink');

module.exports = function() {

    var TopCategory = models.TopCategory;
    var SubCategory = models.SubCategory;
    var VideoTitle = models.VideoTitle;

    var router = express.Router();

    router.route('/all')
        .get(function (req, res) {
            controller.allCategories(function (err, result) {
                var data = {
                    layout: 'main',
                    categories: result.categories
                };
                res.render('video/categories', data);
            });
    });

    router.use('/:id', function(req, res, next) {
        let categoryID = req.params['id'];
        let query = mongoose.Types.ObjectId.isValid(categoryID) ?
            { _id: mongoose.Types.ObjectId(categoryID) }
            : { permalink: categoryID };
        SubCategory.findOne(query)
            .populate('topCategory', '_id title')
            .exec(function(err, doc) {
                if (doc) {
                    req['sub-category'] = doc;
                    next();
                } else {
                    return res.status(404).render('helpers/404');
                }
            });
    });

    router.route('/:id')
        .get(function(req, res) {

            var category = req['sub-category'];

            VideoTitle.find({ isPublic: true, languages: 'russian', categories: category['_id'] })
                .limit(100)
                .exec(function(err, docs) {

                    var ctx = {
                        category: req['sub-category'],
                        videos: docs
                    };

                    res.render('video/category', ctx);
                });


        });

    return router;

};
