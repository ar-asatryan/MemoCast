const express = require('express');

module.exports = function() {

    var router = express.Router();

    router.use((req, res, next) => {
        res.locals.search = {
            type : 'videos'
        };
        next();
    });

    router.route('/')
        .get(function(req, res) {
            let search = { search : req.query['search'], type: 'videos' };

            res.locals.search = search;

            res.render('admin/videos/videos', { layout: 'admin' });
        });

    router.route('/titles/:id')
        .get(function(req, res) {
            let id = req.params['id'];
            res.render('admin/videos/videoTitle', { layout: 'admin', new: false, id: id });
        });

    router.route('/titles/:title/:item')
        .get(function (req, res) {
            let id = req.params['title'];
            let itemID = req.params['item'];
            res.render('admin/videos/videoTitle', {
                layout: 'admin',
                new: false,
                id: id,
                item: itemID
            });
        })

    router.route('/new')
        .get(function(req, res) {
            res.render('admin/videos/videoTitle', { layout: 'admin', new: true });
        });

    router.use('/items', require('./items.js')());

    return router;
}
