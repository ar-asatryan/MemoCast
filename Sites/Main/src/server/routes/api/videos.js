var express = require('express');
var controller = require('../../controllers/videos')();
var models = require('../../config/models');

module.exports = function () {
    var router = express.Router();

    router.route('/all')
        .get(function (req, res) {

            // init options for videos controller
            var params = {
                req: req,
                limit: 100,
                presentation: true,
                query: {  }
            };

            let title = req.query.title;
            if (title && title !== '') {
                let reg = new RegExp(title, "i");
                params.query = { title: { $regex : reg, $options: "i" } };
            }

            // process videos request
            controller.processVideosRequest(params, function (err, result) {
                if (err) {
                    return res.status(500).send(err);
                }
                return res.send(result);
            });
        });

    router.route('/new')
        .get(function (req, res) {

            // init options for videos controller
            var params = {
                req: req,
                limit: 100,
                presentation: true,
                query: {  },
                sort: { createDate : -1 }
            };

            let title = req.query.title;
            if (title && title !== '') {
                let reg = new RegExp(title, "i");
                params.query = { title: { $regex : reg, $options: "i" } };
            }

            // process videos request
            controller.processVideosRequest(params, function (err, result) {
                if (err) {
                    return res.status(500).send(err);
                }
                return res.send(result);
            });
        });

    router.route('/kids')
        .get(function (req, res) {

            models.SubCategory.find({ kids : true })
                .select({ _id : 1 })
                .exec(function (err, cats) {
                    // init options for videos controller
                    var params = {
                        req: req,
                        limit: 100,
                        presentation: true,
                        query: { isPublic : true, categories : { $in : cats } },
                        sort: { 'views-count' : -1 }
                    };

                    let title = req.query.title;
                    if (title && title !== '') {
                        let reg = new RegExp(title, "i");
                        params.query = { title: { $regex : reg, $options: "i" } };
                    }

                    // process videos request
                    controller.processVideosRequest(params, function (err, result) {
                        if (err) {
                            return res.status(500).send(err);
                        }
                        return res.send(result);
                    });

                });
        });

    router.route('/:id')
        .get(function (req, res) {

            // init options for videos controller
            var params = {
                req: req,
                presentation: true,
                query: { }
            };

            let title = req.query.title;
            if (title && title !== '') {
                let reg = new RegExp(title, "i");
                params.query = { title: { $regex : reg, $options: "i" } };
            }

            // process videos request
            controller.processVideosByCategoryRequest(params, function (err, result) {
                if (err) {
                    return res.status(500).send(err);
                }
                return res.send(result);
            });
        });

    return router;
};
