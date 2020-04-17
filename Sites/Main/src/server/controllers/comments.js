var express = require('express');
var models = require('../config/models');
var presentation = require('../config/presentation');
var async = require('async');
var mongoose = require('mongoose');
const math = require('mathjs');

var controller = {

};

function paramToInt(paramValue, paramName, defaultValue, data) {
    data[paramName] = defaultValue;
    if (paramValue) {
        var val = parseInt(paramValue);
        if (!isNaN(val)) {
            data[paramName] = val;
        }
    }
}

controller.processCommentsRequest = function (options, resultCallback) {

    var Comment = models.Comment;

    var tasks = [
        // init params (query, limit, skip, etc.)
        function (callback) {

            var data = {
                query: options.query
            };

            paramToInt(options.req.query.limit, 'limit', 20, data);
            paramToInt(options.req.query.skip, 'skip', 0, data);

            callback(null, data);

        },
        // get videos count (for paging)
        (data, callback) => {
            // make sure 'is public' filter is set for query
            let q = Comment.count(data.query);
            q.exec((err, count) => {
                data.totalCount = count;
                callback(err, data);
            });
        },
        // select comments from db
        function (data, callback) {

            var q = Comment.find(data.query)
                .sort({ createDate: 'desc' });

            var populate = options.populate;
            if (populate) {
                if (populate.user) { q = q.populate('user'); }
                if (populate.videoItem) { q = q.populate('videoItem'); }
                if (populate.videoTitle) { q = q.populate('videoTitle', '-sinopsis -cast -categories'); }
            }

            if (data.skip && data.skip > 0) {
                q = q.skip(data.skip);
            }

            q = q.limit( data.limit ? data.limit : 50 );

            q.exec(function (err, items) {
                data.comments = items;
                callback(err, data);
            });

        },
        // init pager
        (data, callback) => {
            let pager = {
                pagesCount : math.ceil(data.totalCount / data.limit),
                currentPage : math.floor((data.skip / data.limit) + 1),
                limit : data.limit,
                skip : data.skip
            }
            pager.prev = pager.skip - pager.limit >= 0 ? { skip : pager.skip - pager.limit } : null;
            pager.next = pager.currentPage < pager.pagesCount ? { skip : pager.skip + pager.limit } : null ;
            pager.decade = math.ceil(pager.currentPage / 10);
            let pages = [];
            for (let i = 1; i <= 10; i++) {
                let page = (pager.decade - 1) * 10 + i;
                if (page <= pager.pagesCount) {
                    pages.push({
                        page: page,
                        skip: (page - 1) * pager.limit,
                        active: pager.currentPage == page
                    });
                }
            }
            pager.pages = pages.length > 0 ? pages : null;
            data.pager = pager;
            callback(null, data);
        },
        // format comments for presentation
        function (data, callback) {
            data.comments = data.comments.map(function(item) {
                return presentation.Comment(item);
            });
            callback(null, data);
        }
    ];

    async.waterfall(tasks, resultCallback);
}

module.exports = function () {
    return controller;
};
