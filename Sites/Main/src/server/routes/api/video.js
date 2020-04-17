var express = require('express');
var models = require('../../config/models');

module.exports = function() {

    var router = express.Router();
    var VideoTitle = models.VideoTitle;
    var VideoItem = models.VideoItem;

    router.route('/')
        .get(function(req, res) {
            var searchString = req.query['search'];
            var count = queryToNumber(req.query['count'], 50);
            var skip = queryToNumber(req.query['skip'], 0)

            var query = { $or : [

                    { title : { $regex: searchString, $options: 'gi' } },
                    { searchString : { $regex: searchString, $options: 'gi' } }

                ]};
            if (req.query['publicOnly'] !== 'false') {
                query.isPublic = true;
            }
            VideoTitle.find(query, {score: { $meta: "textScore" }})
                .sort({ 'views-count' : -1, 'title' : 'asc', 'year' : -1 })
                .exec(function(err, items) {
               res.send(items);
            });
        });

    router.use('/titles', require('./video/titles')());

    router.use('/items', require('./video/items')());

    router.use('/history', require('./video/history')());

    router.use('/likes', require('./video/likes')());

    router.use('/subs', require('./video/subs')());

    return router;

};

var queryToNumber = function(str, defaultValue) {
    var v = str ? parseInt(str) : defaultValue;
    if (isNaN(v)) {
        v = defaultValue;
    }
    if (v <= 0) {
        v = defaultValue;
    }
    return v;
}
