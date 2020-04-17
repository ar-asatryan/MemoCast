var express = require('express');
var async = require('async');
var mongoose = require('mongoose');
var models = require('../config/models');
var presentation = require('../config/presentation');
var cache = require('../config/cache');

var TopCategory = models.TopCategory;
var SubCategory = models.SubCategory;

var controller = {

};

controller.allCategories = function (resultCallback) {

    var cacheKey = 'cache:categories';

    var tasks = [
        // trying load data from redis (cache)
        function (callback) {
            cache.get(cacheKey, callback);
        },
        // load all categories from db
        function (cacheValue, callback) {

            // if cache - return it
            if (cacheValue) { return callback(null, cacheValue); }

            var query = TopCategory.find({})
                .select('_id order title childs')
                .populate('childs', '_id title order permalink')
                .sort({ order: 'asc' })
                .exec(function(err, items) {
                    if (err) { return callback(err); }
                    callback(null, { categories: items });
                    // if redis online - store data to it
                    cache.set(cacheKey, { categories: items }, 30 * 60, function (err) {
                        if (err) {
                        }
                    });
                });
        },
        // configure categories for presentation
        function (data, callback) {
            data.categories = data.categories.map(function (item) {
                return presentation.TopCategory(item);
            });
            callback(null, data);
        }
    ];

    async.waterfall(tasks, resultCallback);
};

module.exports = function () {
    return controller;
};
