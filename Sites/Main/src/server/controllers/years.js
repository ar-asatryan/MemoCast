const express = require('express');
const models = require('../config/models');
const presentation = require('../config/presentation');
const async = require('async');
const cache = require('../config/cache');

let controller = {

};

function onlyUnique(value, index, self) {
    return self.indexOf(value) === index;
}

//ToDo: Get ready for filter movies by year
controller.getVideoTitleYears = function (params, resultCallback) {

    let VideoTitle = models.VideoTitle;
    let cacheKey = 'cache:libraries:video-title-years';
    let match = { isPublic: true };

    if (params) {
        if (params.category) {
            cacheKey += ':category:' + params.category;
            match.categories = params.category;
        }
    }

    let tasks = [
        // checking cache for data
        function (callback) {
            cache.get(cacheKey, callback);
        },
        function (cacheValue, callback) {
            if (cacheValue) { return callback(null, cacheValue); }
            VideoTitle.aggregate(
                { $match: { isPublic: true } },
            	{ $group: { _id: '$year' } },
            	{ $sort: { _id: -1 } }, function (err, items) {
                    callback(err, items);
                    if (items) {
                        cache.set(cacheKey, items, 24 * 60 * 60, cache.emptyCallback);
                    }
                });
        },
        // process data
        function (items, callback) {
            let data = items.map(function (item) {
                let num = parseInt(item['_id']);
                return num;
            });
            const maxYear = (new Date()).getFullYear();
            data = data.filter(function (item) {
                return !isNaN(item) && item >= 1900 && item <= maxYear;
            });
            data = data.filter( onlyUnique );
            callback(null, data);
        }
    ];

    async.waterfall(tasks, resultCallback);
}

module.exports = function () {
    return controller;
};
