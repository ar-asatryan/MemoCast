var express = require('express');
var models = require('../config/models');
var presentation = require('../config/presentation');
var searchModule = require('selectors/search');

module.exports = function() {

    var router = express.Router();
    var VideoTitle = models.VideoTitle;

    router.route('/')
        .get(async (req, res) => {
            try {
                const search = req.query['s'];

                res.locals['hide-nav-search'] = true;

                const data = await searchModule({
                    searchString: search,
                    limit: 200,
                    needPresentation: true,
                });

                res.render('video/search', { searchString: search, videos: data });
            } catch (err) {
                res.render('video/search', {});
            }
        });

    return router;

};
