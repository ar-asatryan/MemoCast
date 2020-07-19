const express = require('express');
const mongoose = require('mongoose');
const async = require('async');
const models = require('../config/models');
const presentation = require('../config/presentation');
const yearsController = require('./years')();
const math = require('mathjs');

let controller = {

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

controller.processVideosRequest = function (options, resultCallback) {

    const VideoTitle = models.VideoTitle;

    let tasks = [
        // init params initial task
        function (callback) {
            let data = { };
            // query for videos
            data.query = options.query;
            data.sort = options.sort;

            paramToInt(options.req.query.limit, 'limit', 20, data);
            paramToInt(options.req.query.skip, 'skip', 0, data);
            paramToInt(options.req.query.year, 'year', 0, data);
            if (data.year > 0) {
                data.query.year = data.year.toString();
            }

            // if (options.req.query['skip']) {
            //     var skip = parseInt(options.req.query['skip']);
            //     if (!isNaN(skip) && skip > 0) {
            //         data.skip = skip;
            //     }
            // }

            callback(null, data);
        },
        // get videos count (for paging)
        (data, callback) => {
            // make sure 'is public' filter is set for query
            data.query['isPublic'] = true;
            let q = VideoTitle.count(data.query);
            q.exec((err, count) => {
                data.totalCount = count;
                callback(err, data);
            });
        },
        // query videos
        function (data, callback) {
            // init db query
            let q = VideoTitle.find(data.query);
            // add skip number of rows (if specified)
            if (data.skip) { q = q.skip(data.skip); }
            // add sorting (by default views-count DESC, year DESC, title ASC)
            q = q.sort( data.sort ? data.sort : { 'views-count' : -1, 'year': -1, 'title': 1 } );
            // add limit for rows to return
            data.limit = data.limit ? data.limit : 50;
            q = q.limit( data.limit );
            // populate sub documents (categories, etc)
            q = q.populate('categories');

            // execute query
            q.exec(function (err, items) {
                if (err) { return callback(err); }
                data.videos = items;
                return callback(null, data);
            });
        },
        // init pager
        (data, callback) => {
            let pager = {
                pagesCount : math.ceil(data.totalCount / data.limit),
                currentPage : math.floor((data.skip / data.limit) + 1),
                limit : data.limit,
                skip : data.skip,
                params: Object.keys(options.req.query).map(function (key) {
                    return {
                        name: key,
                        value: options.req.query[key]
                    };
                }).filter(function (item) {
                    return item.name !== 'skip';
                })
            }
            pager.visible = pager.pagesCount > 1;
            pager.first = {
                link: linkToVideoPage(options.req, 0)
            };
            pager.prev = pager.skip - pager.limit >= 0 ? { 
                skip : pager.skip - pager.limit, 
                link : linkToVideoPage(options.req, pager.skip - pager.limit)
            } : null;
            pager.next = pager.currentPage < pager.pagesCount ? { 
                skip : pager.skip + pager.limit , 
                link : linkToVideoPage(options.req, pager.skip + pager.limit)
            } : null ;
            pager.decade = math.ceil(pager.currentPage / 10);
            let pages = [];
            for (let i = 1; i <= 10; i++) {
                let page = (pager.decade - 1) * 10 + i;
                if (page <= pager.pagesCount) {
                    pages.push({
                        page: page,
                        skip: (page - 1) * pager.limit,
                        link: linkToVideoPage(options.req, (page - 1) * pager.limit),
                        active: pager.currentPage == page,
                    });
                }
            }
            pager.pages = pages.length > 0 ? pages : null;
            data.pager = pager.pagesCount > 1 ? pager : pager;
            callback(null, data);
        },
        // load years (for filter)
        function (data, callback) {
            yearsController.getVideoTitleYears({}, function (err, years) {
                if (years) {
                    data.years = years.map(function (item) {
                        return {
                            year: item,
                            selected: item === data.year
                        };
                    });
                }
                callback(err, data);
            });
        }
    ];

    if (options.presentation) {
        // format videos for presentation
        tasks.push(
            function (data, callback) {
                data.videos = data.videos.map(function (item) {
                    return presentation.VideoTitle(item);
                });
                callback(null, data);
            });
    }

    async.waterfall(tasks, resultCallback);
}

controller.processPopularVideosRequest = (options, resultCallback) => {

    let date = { pager: null, items: [] };

    let tasks = [
        // query popular videos (aggregate)
        (callback) => {
            let d = new Date();
            d = new Date(d.setDate(d.getDate() - 14));
            models.VideoHistory.aggregate([
                { $match: { updateDate: { $gt : d } } },
                { $unwind: { path: '$itemTimeStamps', preserveNullAndEmptyArrays: false } },
                { $match: { 'itemTimeStamps.createDate': { $gt : d } }},
                { $group: { _id: '$videoTitle', count: { $sum : 1 } } },
                { $lookup: { from: 'videotitles', localField: '_id', foreignField: '_id', as: 'videoTitle' }},
                { $unwind: { path: '$videoTitle', preserveNullAndEmptyArrays: true } },
                { $match: { 'videoTitle.isPublic': true } },
                { $sort: { count : -1 } },
                { $limit: 2 },
                { $lookup: { from: 'subcategories', localField: 'videoTitle.categories', foreignField: '_id', as: 'videoTitle.categories' }},
            ]).exec((err, items) => {
                return callback(err, Object.assign({}, data, { videos: items }));
            })
        },
        // map query result
        (data, callback) => {
            callback(null, data, { videos: data.videos.map(item => item.videoTitle) })
        },
    ]; // tasks ...

    if (options.presentation) {
        tasks.push((data, callback) => {
            return callback(
                null,
                Object.assign({},
                    data,
                    { videos: data.videos.map(item => presentation.VideoTitle(item)) }
                )
            )
        })
    }

    async.waterfall(tasks, resultCallback);

}

controller.processVideosByCategoryRequest = function (options, resultCallback) {

    var VideoTitle = models.VideoTitle;
    var SubCategory = models.SubCategory;
    var TopCategory = models.TopCategory;

    var tasks = [
        // init params initial task
        function (callback) {
            let data = { };
            // get category id
            let CategoryID = options.req.params['id'];
            let PageNumber = options.req.params['page'];
            if (Number.isNaN(Number.parseInt(PageNumber)) || PageNumber < 1) {
                PageNumber = 1;
            }
            // check if its correct category ID
            data.CategoryID = CategoryID;
            data.pagerPrefix = options.pagerPrefix;

            data.query = options.query ? options.query : { };

            paramToInt(options.req.query.limit, 'limit', 20, data);
            paramToInt(options.req.query.skip, 'skip', 0, data);
            paramToInt(options.req.query.year, 'year', 0, data);
            paramToInt(options.req.params.page, 'page', 0, data);
            if (data.page > 0) {
                data.skip = (data.page - 1) * data.limit;
            }
            if (data.year > 0) {
                data.query.year = data.year.toString();
            }

            return callback(null, data);
        },
        // init category from db
        function (data, callback) {
            let query = mongoose.Types.ObjectId.isValid(data.CategoryID) ?
                { _id: mongoose.Types.ObjectId(data.CategoryID)}
                : { permalink: data.CategoryID };
            // query for category
            SubCategory.findOne(query, function (err, item) {
                if (err || !item) { return callback({ error: 'Category not found'}); }
                //console.log({"data ----->": data});
                //console.log({"item of id": item});
                //console.log({id: item._id });
                if (!!item && item.permalink !== data.CategoryID) {
                    let link = `/videos/${item.permalink}`;
                    let original = options.req.originalUrl;
                    const index = original.indexOf('?');
                    if (index !== -1) {
                        link += original.slice(index);
                        console.log({ link });
                    }
                    return callback('Need redirect', link);
                }
                data.category = presentation.SubCategory(item);
                data.query.categories = item._id;
                return callback(null, data);
            });
        },
        // get videos count (for paging)
        (data, callback) => {
            // make sure 'is public' filter is set for query
            data.query['isPublic'] = true;
            let q = VideoTitle.count(data.query);
            q.exec((err, count) => {
                data.totalCount = count;
                callback(err, data);
            });
        },
        // query videos
        function (data, callback) {
            // make sure 'is public' filter is set for query
            data.query['isPublic'] = true;

            // init db query
            var q = VideoTitle.find(data.query);
            // add skip number of rows (if specified)
            if (data.skip) { q = q.skip(data.skip); }
            // add sorting (by default views-count DESC, year DESC, title ASC)
            q = q.sort( data.sort ? data.sort : { 'views-count' : -1, 'year': -1, 'title': 1 } );
            // add limit for rows to return
            q = q.limit( data.limit ? data.limit : 50 );
            // populate sub documents (categories, etc)
            q = q.populate('categories');

            // execute query
            q.exec(function (err, items) {
                if (err) { return callback(err); }
                data.videos = items;
                return callback(null, data);
            });
        },
        // init pager
        (data, callback) => {
            let pager = {
                pagesCount : math.ceil(data.totalCount / data.limit),
                currentPage : math.floor((data.skip / data.limit) + 1),
                limit : data.limit,
                skip : data.skip,
                pagerPrefix: data.pagerPrefix,
                params: Object.keys(options.req.query).map(function (key) {
                    return {
                        name: key,
                        value: options.req.query[key]
                    };
                }).filter(function (item) {
                    return item.name !== 'skip';
                })
            }
            pager.visible = pager.pagesCount > 1;

            pager.first = {
                link: linkToVideoPage(options.req, 0)
            };

            pager.prev = pager.skip - pager.limit >= 0 ? { 
                skip : pager.skip - pager.limit,
                url: `${pager.pagerPrefix}/page-${pager.currentPage - 1}`,
                link: linkToVideoPage(options.req, pager.skip - pager.limit)
            } : null;

            pager.next = pager.currentPage < pager.pagesCount ? { 
                skip : pager.skip + pager.limit,
                url: `${pager.pagerPrefix}/page-${pager.currentPage + 1}`,
                link: linkToVideoPage(options.req, pager.skip + pager.limit),
            } : null ;

            pager.decade = math.ceil(pager.currentPage / 10);
            let pages = [];
            for (let i = 1; i <= 10; i++) {
                let page = (pager.decade - 1) * 10 + i;
                if (page <= pager.pagesCount) {
                    pages.push({
                        page: page,
                        skip: (page - 1) * pager.limit,
                        link: linkToVideoPage(options.req, (page - 1) * pager.limit),
                        active: pager.currentPage == page
                    });
                }
            }
            pager.pages = pages.length > 0 ? pages : null;
            data.pager = pager;
            callback(null, data);
        },
        // ToDo: function which load years for filtering movies>
        function (data, callback) {
            yearsController.getVideoTitleYears( { category: data.category.id }, function (err, years) {
                if (years) {
                    data.years = years.map(function (item) {
                        return {
                            year: item,
                            selected: item === data.year
                        };
                    });
                }
                callback(err, data);
            });
        }
    ];

    if (options.presentation) {
        // format videos for presentation
        tasks.push(
            function (data, callback) {
                data.videos = data.videos.map(function (item) {
                    return presentation.VideoTitle(item);
                });
                callback(null, data);
            });
    }

    async.waterfall(tasks, resultCallback);
};

const linkToVideoPage = (req, skip) => {
    const keys = Object.keys(req.query);
    let query = '';
    for (key in req.query) {
        if (key !== 'skip') {
            const value = encodeURIComponent(req.query[key].toString());
            if (query !== '') {
                query += '&';
            }
            query += `${key}=${value}`;
        }
    }
    if (skip > 0) {
        query = `skip=${skip}${query !== '' ? `&${query}` : ''}`;
    }

    const link = `/videos${req.path}${ query !== '' ? `?${query}` : ''}`;
    return link;
}

module.exports = function () {
    return controller;
};
