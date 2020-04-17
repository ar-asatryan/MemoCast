var express = require('express');
const models = require('../../../config/models');

module.exports = function() {

    var router = express.Router();
    var VideoTitle = models.VideoTitle;

    router.route('/videos')
        .get(function(req, res) {

            var searchString = req.query['search'];
            searchString = searchString.replace(/\s/g, '.+');

            if (searchString && searchString != '') {

                var r = /[\w\dа-я]+/gi;
                var matches = searchString.match(r);

                if (matches.length > 0) {

                    var query = { $or : [

                            { title : { $regex: searchString, $options: 'gi' } },
                            { searchTitle : { $regex: searchString, $options: 'gi' } }

                        ]};

                    VideoTitle.find(query)
                        .sort({ 'views-count': -1, title: 'asc' })
                        .select('title year originalTitle titleID')
                        .limit(50)
                        .exec(function(err, items) {
                            if (err) {
                                res.status(500).send(err);
                            } else {
                                res.send(items.map(function(item) {
                                    var doc = {
                                        title: item.title,
                                        originaltitle: item.originalTitle,
                                        id: item['_id'],
                                        year: item.year
                                    };

                                    var url = '/video/' + doc.id;

                                    if (item.titleID && item.titleID != '') {
                                        url = '/video/' + item.titleID;
                                    }

                                    doc.url = url;

                                    return doc;
                                }));
                            }
                        });

                } else {
                    res.status(400).send({
                       error: 'Поиск может содержать только буквы и цифры (query parameter "search", ex. /api/autocomplete/videos?search=yoursearchstring)'
                    });
                }


//                res.send({ search: searchString, matches: matches });
            } else {
                res.status(400).send({
                   error: 'Поисковая строка не может быть пустой (query parameter "search", ex. /api/autocomplete/videos?search=yoursearchstring)'
                });
            }

        });

        router.route('/video-items')
            .get(function(req, res) {

                var searchString = req.query['search'];

                if (searchString && searchString != '') {

                    var r = /[\d\wа-я]+/gi
                    var matches = searchString.match(r);

                    if (matches.length > 0) {

                        var query = { $or : [

                                { $and: matches.map(function(item) {
                                return { title: { $regex: item, $options: 'i' } }
                                })},

                                { $and: matches.map(function(item) {
                                return { searchTitle: { $regex: item, $options: 'i' } }
                                })}

                            ]};

                        models.VideoItem.find(query)
                            .sort({ title: 'asc' })
                            .select('title year')
                            .limit(50)
                            .exec(function(err, items) {
                                if (err) {
                                    res.status(500).send(err);
                                } else {
                                    res.send(items.map(function(item) {
                                        var doc = {
                                            title: item.title,
                                            id: item['_id'],
                                            year: item.year
                                        };

                                        return doc;
                                    }));
                                }
                            });

                    } else {
                        res.status(400).send({
                           error: 'Поиск может содержать только буквы и цифры (query parameter "search", ex. /api/autocomplete/videos?search=yoursearchstring)'
                        });
                    }


    //                res.send({ search: searchString, matches: matches });
                } else {
                    res.status(400).send({
                       error: 'Поисковая строка не может быть пустой (query parameter "search", ex. /api/autocomplete/videos?search=yoursearchstring)'
                    });
                }

            });

    return router;

}
