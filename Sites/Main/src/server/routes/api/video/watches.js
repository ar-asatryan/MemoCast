let express = require('express');
let async = require('async');
let models = require('../../../config/models');
let io = require('../../../config/io');
let presentation = require('../../../config/presentation');
let rabbit = require('../../../config/rabbit');
let mongoose = require('mongoose');

let authCheck = function(req, res, next) {
    if (!req.user) {
        return res.status(403).send({ error: 'please authenticate first' });
    } // if !req.user
    next();
};

module.exports = function () {

    let VideoTitle = models.VideoTitle;
    let VideoLike = models.VideoLike;
    let VideoItem = models.VideoItem;
    let VideoView = models.VideoView;

};