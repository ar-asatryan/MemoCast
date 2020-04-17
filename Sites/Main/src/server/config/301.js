var express = require('express');
var models = require('./models');
var async = require('async');

// this module redirect with 301 status code (permanent redirect)
module.exports = function (app) {

    var VideoItem = models.VideoItem;
    var VideoTitle = models.VideoTitle;

    app.get('/media.aspx', function (req, res) {

        var cacheKey = 'cache:301:media-id:' + req.query['id'];

        async.waterfall([
            // load params (media id) from query string
            function (callback) {
                var id = parseInt(req.query['id']);
                if (isNaN(id)) {
                    callback({ error: 'Incorrect Media ID'});
                } else {
                    callback(null, id);
                }
            },
            // looking for video in Redis Cache
            function (MediaID, callback) {
                var redis = req.app.get('redis');
                if (redis) {
                    redis.get(cacheKey, function (err, reply) {
                        return callback(err, MediaID, reply);
                    });
                } else {
                    return callback(null, MediaID, null);
                }
            },
            // looking for video in DB with that id
            function (MediaID, cache, callback) {

                // checking if cache exists
                if (cache) {
                    return callback(null, {
                        redirUrl: cache
                    });
                }

                var query = { 'external-media-id' : MediaID };
                VideoItem.findOne(query)
                    .select('_id videoTitle')
                    .populate({
                        path: 'videoTitle',
                        select: '_id titleID'
                    })
                    .exec(function (err, item) {
                        if (err) {
                            return callback(err);
                        } else {
                            var url = '/videos/all';
                            if (item) {
                                url = '/video/';
                                url += item.videoTitle.titleID ? item.videoTitle.titleID : item.videoTitle['_id'];
                                url += '/' + item['_id'];
                            }
                            // save redir url to redis cache
                            var redis = req.app.get('redis');
                            if (redis) {
                                // cache duration  - 30 min
                                redis.setex(cacheKey, 30 * 60, url, function (err) {
                                    if (err) { console.log(err); }
                                });
                            }
                            // return redir url to app
                            return callback(null, {
                                redirUrl: url
                            });
                        }
                    });
            }
        ], function (err, result) {
            if (err) {
                res.redirect('/');
            } else if (result.redirUrl){
                res.redirect(301, result.redirUrl);
            } else {
                res.redirect('/videos/all');
            }
        });
    });

    app.get('/paymentoptions.aspx', function (req, res) {
        res.redirect(301, '/paymentoptions');
    });

    app.get('/about.aspx', function (req, res) {
        res.redirect(301, '/about');
    });

    app.get('/help.aspx', function (req, res) {
        res.redirect(301, '/help');
    });

    app.get('/terms.aspx', function (req, res) {
        res.redirect(301, '/eula');
    });

    app.get('/privacy.aspx', function (req, res) {
        res.redirect(301, '/privacy');
    });

    app.get('/contact.aspx', function (req, res) {
        res.redirect(301, '/contacts');
    });

    app.get('/login.aspx', (req, res) => {
        res.redirect(301, '/login');
    });

    app.get('/signup.aspx', (req, res) => {
        res.redirect(301, '/signup');
    });

};
