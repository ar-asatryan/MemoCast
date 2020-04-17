var express = require('express');
var models = require('../../config/models');
var controller = require('../../controllers/categories')();

module.exports = function() {

    var router = express.Router();

    var TopCategory = models.TopCategory;
    var SubCategory = models.SubCategory;

    router.route('/')
        .get(function(req, res) {

            controller.allCategories(function (err, result) {
                res.send(result.categories);
            });

            // var query = TopCategory.find({})
            //     .select('_id order title childs')
            //     .populate('childs', '_id title order')
            //     .sort({ order: 'asc' })
            //     .exec(function(err, items) {
            //         res.send(items);
            //     });

        });



    return router;

};
