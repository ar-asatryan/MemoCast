const express = require('express');
const models = require('../config/models');

module.exports = function(app) {

    let router = express.Router();
    let User = models.User;

    // videos api
    router.use('/video', require('./api/video')());

    // videos lists api (public usage)
    router.use('/videos', require('./api/videos')());

    // comments api
    router.use('/comment', require('./api/comment')());

    // settings api
    router.use('/settings', require('./api/settings')());

    // categories
    router.use('/categories', require('./api/categories')());

    // languages
    router.use('/languages', require('./api/languages')());

    // countries
    router.use('/countries', require('./api/countries')());

    // flash adverts
    router.use('/flash', require('./api/flash')());

    // autocomplete
    router.use('/autocomplete', require('./api/autocomplete')());

    // user images
    router.use('/user-image/', require('./api/user-image')());

    // captions / subtitles
    router.use('/captions/', require('./api/captions')());

    // user
    router.use('/user', require('./api/user')());
    // payments
    router.use('/payments', require('./api/payments')());
    // user feed
    router.use('/feed', require('./api/feed')());

    // messages
    var imRouter = require('./api/messages')();
    router.use('/messages', imRouter);
    router.use('/im', imRouter);

    // social stuff (followers, etc.)
    router.use('/social', require('./api/social')());

    // user's video rating
    router.use('/user-video-rating', require('./api/user-video-rating')());

    // video request
    router.use('/video-request', require('./api/video-request')());

    // feedback
    router.use('/feedback', require('./api/feedback')());

    // admin
    router.use('/admin/', require('./api/admin')());

    // roku
    router.use('/roku', require('./api/roku/roku')());

    // socket.io link
    router.use('/io', require('./api/io')());

    return router;

};
