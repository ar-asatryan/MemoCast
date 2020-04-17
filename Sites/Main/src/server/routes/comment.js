var express = require('express');
const controller = require('../controllers/comments')();
const helpers = require('../../../../../Common/helpers');

module.exports = function(app) {

    app.get('/comments', function(req, res) {

        let params = {
            req: req,
            query: {},
            populate: {
                user: true,
                videoItem: true,
                videoTitle: true
            }
        };

        controller.processCommentsRequest(params, function (err, result) {

            const pageTitle = helpers.stringWithPageNumber('Свежие комментарии#page#', result.pager.currentPage);
            const pageDescription = helpers.stringWithPageNumber('Свежие комментарии#page#', result.pager.currentPage);

            res.locals['page-title'] = res.locals.initPageTitle(pageTitle);
            if (!result.pager) { result.pager = {}; }
            result.pager.pagerPrefix = '/comments';
            result.pageDescription = pageDescription;
            res.render('comments', result);

            // return res.send(result.comments);
        });


    });

};
