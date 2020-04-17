const express = require('express');
const models = require('../../../config/models');
const async = require('async');
const postSpread = require('./titles/postSpread');

module.exports = function () {

    let router = express.Router();

    router.route('/')
        .get(function (req, res) {
            let search = req.query.search;
            let query = {
                $text: { $search: search }
            };
            models.VideoTitle.find(query, {score: { $meta: "textScore" }})
                .sort({score: { $meta: "textScore" }, 'views-count' : -1 })
                .exec(function(err, items) {
                    if (err) {
                        res.status(500).send(err);
                    } else {
                        res.send(items);
                    }
                })
        })
        .post(function (req, res) {
            let doc = Object.assign({}, req.body, { createDate: new Date });
            models.VideoTitle.create(doc, { new : true }, function (err, item) {
                res.send(item);
            });
        });

    router.post('/spread', postSpread);

    return router;

}
