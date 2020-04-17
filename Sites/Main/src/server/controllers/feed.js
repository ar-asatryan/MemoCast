var express = require('express');
var presentation = require('../config/presentation');
var models = require('../config/models');
var async = require('async');

var controller = { };

function paramToInt(paramValue, paramName, defaultValue, data) {
    data[paramName] = defaultValue;
    if (paramValue) {
        var val = parseInt(paramValue);
        if (!isNaN(val)) {
            data[paramName] = val;
        }
    }
}

controller.processFeedRequest = function (options, resultCallback) {

    var FeedItem = models.FeedItem;

    var tasks = [
        // init params (query, limit, skip, etc.)
        function (callback) {

            let d = new Date();
            d = new Date(d - 1000 * 60 * 60 * 24 * 30); // minus 30 days

            var data = {
                query: { user: options.userID },
                'min-date': d
            };

            paramToInt(options.req.query.limit, 'limit', 20, data);
            paramToInt(options.req.query.skip, 'skip', 0, data);

            callback(null, data);
        },
        // load following users
        (data, callback) => {
            let query = { follower : options.userID };
            models.UserFollower.find(query)
                .select({ user : 1, createDate : 1 })
                .sort({ createDate : -1 })
                .populate('user')
                .exec((err, items) => {
                    if (items) {
                        data.users = items.map(item => item.user);
                    }
                    callback(err, data);
                });
        },
        // load followers,
        (data, callback) => {
            let query = { user : options.userID,
                createDate : { $gte : data['min-date'] } };
            models.UserFollower.find(query)
            .select({ follower : 1, createDate : 1 })
            .sort({ createDate : -1 })
            .populate('follower')
            .exec((err, items) => {
                if (items) {
                    let followerMapper = (item) => {
                        return {
                            createDate : item.createDate,
                            objType : 'follower',
                            author : presentation.User(item.follower)
                        };
                    };
                    data.followers = items
                        .map(followerMapper);
                }
                callback(err, data);
            });
        },
        // load comments
        (data, callback) => {
            let query = { user :
                { $in : data.users },
                    createDate : { $gte : data['min-date'] }};
            models.Comment.find(query)
                .populate('videoTitle user')
                .sort({ createDate : -1 })
                .exec((err, items) => {
                    if (items) {
                        data.comments = items.map((item) => {
                            return {
                                createDate : item.createDate,
                                objType : 'comment',
                                obj : item,
                                comment : presentation.Comment(item),
                                author : presentation.User(item.user),
                                videoTitle : presentation.VideoTitle(item.videoTitle)
                            };
                        });
                    }
                    callback(err, data);
                });
        },
        // load likes
        (data, callback) => {
            let query = { user :
                { $in : data.users },
                    createDate : { $gte : data['min-date'] }};
            models.VideoLike.find(query)
                .populate('videoTitle user')
                .sort({ createDate : -1 })
                .exec((err, items) => {
                    if (items) {
                        data.likes = items.map((item) => {
                            return {
                                createDate : item.createDate,
                                objType : 'like',
                                obj : item,
                                like : presentation.VideoLike(item),
                                author : presentation.User(item.user),
                                videoTitle : presentation.VideoTitle(item.videoTitle)
                            };
                        });
                    }
                    callback(err, data);
                });
        },
        // load video subscriptions
        (data, callback) => {
            let query = { user :
                options.userID };
            models.VideoSubscription.find(query)
                .select({ videoTitle : 1, _id : 0 })
                .exec((err, items) => {
                    if (items) {
                        data.subscriptions = items.map((item) => {
                            return item.videoTitle
                        });
                    }
                    callback(err, data);
                });
        },
        // load video title updates
        (data, callback) => {
            let query = { isPublic : true, status: 'ready', videoTitle :
                { $in : data.subscriptions },
                    createDate : { $gte : data['min-date'] }};
            models.VideoItem.find(query)
                .populate('videoTitle')
                .sort({ createDate : -1 })
                .exec((err, items) => {
                    if (items) {
                        data.newvideoitems = items.map((item) => {
                            return {
                                createDate : item.createDate,
                                objType : 'newvideoitem',
                                obj : item,
                                videoTitle : presentation.VideoTitle(item.videoTitle),
                                videoItem: presentation.VideoItem(item)
                            };
                        });
                    }
                    callback(err, data);
                });
        },
        // combine all data (followers, comments, together)
        (data, callback) => {
            let feedSorter = (a, b) => {
                return b.createDate.getTime() - a.createDate.getTime();
            };
            data.result = data.followers
                .concat(data.comments)
                .concat(data.likes)
                .concat(data.newvideoitems);
            data.result = data.result.sort(feedSorter);
            if (options.limit) {
                if (data.result.length > options.limit) {
                    data.result = data.result.slice(0, options.limit);
                }
            }
            callback(null, data);
        },
        // load feed from db
        function (data, callback) {
            var query = data.query;
            var q = FeedItem.find(query)
                .sort({ createDate: 'desc' });

            if (data.skip && data.skip > 0) {
                q = q.skip(data.skip);
            }

            q = q.limit( data.limit ? data.limit : 50 );

            q = q.populate('comment videoTitle author');

            q.exec(function (err, items) {
                data.feed = items;
                callback(err, data);
            });
        },
        // format documents for presentation
        function (data, callback) {
            data.feed = data.feed.map(function (item) {
                return presentation.FeedItem(item);
            });
            callback(null, data);
        }
    ];

    async.waterfall(tasks, resultCallback);

};

module.exports = function () {
    return controller;
};
