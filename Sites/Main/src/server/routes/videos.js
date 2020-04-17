const express = require('express');
const mongoose = require('mongoose');
const models = require('../config/models');
const presentation = require('../config/presentation');
const localization = require('../config/localization/localization');
const io = require('../config/io');
const videosController = require('../controllers/videos')();
const async = require('async');
const categoryTranslate = require('../config/categories');
const helpers = require('../../../../../Common/helpers');

let localeString = localization.localeString;

const { getTopTags } = require('selectors/tags');

module.exports = function () {
    let router = express.Router();

    let VideoTitle = models.VideoTitle;
    let VideoLike = models.VideoLike;

    const tsInDay = 1000 * 60 * 60 * 24;

    // all movies
    router.route('/all')
        .get(function (req, res) {

            if (req.query['skip'] === '0') {
                return res.redirect(linkToVideoPage(req, 0));
            }

            // init options for videos controller
            let params = {
                req: req,
                presentation: true,
                query: { }
            };

            let title = req.query.title;
            if (title && title !== '') {
                let reg = new RegExp(title, "i");
                params.query.title = { $regex : reg, $options: "i" };
            }

            // process videos request
            videosController.processVideosRequest(params, function (err, result) {
                if (err) {
                    return res.status(500).send(err);
                }
                result.layout = 'main';
                result['video-list-title'] = localeString(req.locale, {
                    ru: `Все фильмы`,
                    en: `All movies`
                });

                const pageTitle = helpers.stringWithPageNumber(`Смотреть фильмы онлайн в отличном качестве${ result.year !== 0 ? ' за ' + result.year + ' год' : '' }#page#`, result.pager.currentPage)
                res.locals['page-title'] = res.locals.initPageTitle(pageTitle);

                const pageDescription = helpers.stringWithPageNumber(`Фильмы онлайн  - фильмы, которые собраны у нас, вам хватит надолго. Каталог постоянно пополняется, как русскими так и иностранными фильмами#page#`, result.pager.currentPage);
                result['pageDescription'] = pageDescription;

                if (!result.pager) {
                    result.pager = {};
                }
                result.pager.pagerPrefix = '/videos/all';
                result['videos-list-need-filter'] = true;
                result['api-url'] = '/api/videos/all';
                result['page-url'] = '/videos/all';
                return res.render('video/videos', result);
            });

        });

    // new movies
    router.route('/new')
        .get(function (req, res) {

            if (req.query['skip'] === '0') {
                return res.redirect(linkToVideoPage(req, 0));
            }

            // init options for videos controller
            let params = {
                req: req,
                presentation: true,
                query: { },
                sort: { createDate : -1 }
            };

            let title = req.query.title;
            if (title && title !== '') {
                let reg = new RegExp(title, "i");
                params.query.title = { $regex : reg, $options: "i" };
            }

            // process videos request
            videosController.processVideosRequest(params, function (err, result) {
                if (err) {
                    return res.status(500).send(err);
                }
                result.layout = 'main';
                // result['video-list-title'] = localeString(req.locale, {
                //     ru: 'Новинки',
                //     en: 'New videos'
                // });
                result['video-list-title'] = 'Новинки на сайте';

                const pageTitle = helpers.stringWithPageNumber(`Последние добавленные фильмы и сериалы на сайте, новинки${ result.year !== 0 ? ' за ' + result.year + ' год' : '' }#page#`, result.pager.currentPage)
                res.locals['page-title'] = res.locals.initPageTitle(pageTitle);

                const pageDescription = helpers.stringWithPageNumber(`Новые фильмы и сериалы добавленные на сайт, онлайн в хорошем качестве. Широкий выбор русских и иностранных новинок, с отличной озвучкой#page#`, result.pager.currentPage);
                result['pageDescription'] = pageDescription;

                if (!result.pager) {
                    result.pager = {};
                }
                result.pager.pagerPrefix = '/videos/new';

                result['videos-list-need-filter'] = true;
                result['api-url'] = '/api/videos/new';
                result['page-url'] = '/videos/new';
                return res.render('video/videos', result);
            });

        });

    // new movies
    router.route('/kids')
        .get(function (req, res) {

            if (req.query['skip'] === '0') {
                return res.redirect(linkToVideoPage(req, 0));
            }

            models.SubCategory.find({ kids : true })
                .select({ _id : 1 })
                .exec(function (err, cats) {

                    // init options for videos controller
                    let params = {
                        req: req,
                        presentation: true,
                        query: { isPublic : true, categories : { $in : cats } },
                        sort: { 'views-count' : -1 }
                    };

                    let title = req.query.title;
                    if (title && title !== '') {
                        let reg = new RegExp(title, "i");
                        params.query.title = { $regex : reg, $options: "i" };
                    }

                    // process videos request
                    videosController.processVideosRequest(params, function (err, result) {
                        if (err) {
                            return res.status(500).send(err);
                        }
                        result.layout = 'main';
                        // result['video-list-title'] = localeString(req.locale, {
                        //     ru: 'Для детей',
                        //     en: 'For kids'
                        // });
                        result['video-list-title'] = 'Детские мультфильмы онлайн';

                        const pageTitle = helpers.stringWithPageNumber(`Детские мультфильмы онлайн - смотреть мультсериалы${ result.year !== 0 ? ' за ' + result.year + ' год' : '' }#page#`, result.pager.currentPage)
                        res.locals['page-title'] = res.locals.initPageTitle(pageTitle);

                        const pageDescription = helpers.stringWithPageNumber(`Мультсериалы для детей смотреть онлайн. Список лучших мультфильмов в хорошем качестве#page#`, result.pager.currentPage);
                        result['pageDescription'] = pageDescription;

                        if (!result.pager) {
                            result.pager = {};
                        }
                        result.pager.pagerPrefix = '/videos/kids';

                        result['display-category-kids-full-info'] = true;
                        result['videos-list-need-filter'] = true;
                        result['api-url'] = '/api/videos/kids';
                        result['page-url'] = '/videos/kids';
                        return res.render('video/videos', result);
                    });

                });
        });

    // tv channels
    router.route('/tv')
        .get(function (req, res) {
            res.render('video/tv', { layout : 'main' });
        });

    // video requests
    router.route('/requests')
        .get(function (req, res) {
            res.render('video/video-requests', { layout: 'main' });
        });

    // current online movies
    router.route('/online')
        .get(function (req, res) {

            if (req.query['skip'] === '0') {
                return res.redirect(linkToVideoPage(req, 0));
            }

            async.waterfall([
                // get current movies from app
                function (callback) {
                    let list = io.getCurrentMovies();
                    if (list) {
                        if (list.length > 50) {
                            list = list.slice(0, 50);
                        }
                    }
                    callback(null, list);
                },
                // load movies data from db
                function (list, callback) {
                    let ids = list.map(function (item) {
                        return item.id;
                    });
                    if (ids.length == 0) {
                        return callback(null, { videos: [] } );
                    }
                    VideoTitle.find({ _id : { $in : ids } })
                        .select('-sinopsis')
                        .populate('categories')
                        .exec(function (err, items) {
                            if (err) { return callback(err); }
                            let videos = { };
                            for (let i = 0; i < list.length; i++) {
                                let video = list[i];
                                videos[video.id] = video;
                            }
                            for (let i = 0; i < items.length; i++) {
                                let item = items[i];
                                let id = item['_id'].toString();
                                let video = videos[id];
                                if (video) {
                                    video.item = item;
                                }
                            }
                            let data = {
                                videos: list.filter(function (item) {
                                    let video = videos[item.id];
                                    return video.item;
                                })
                            }
                            callback(null, data);
                        });
                },
                // format videos for presentation
                function (data, callback) {
                    data.videos = data.videos.map(function (video) {
                        return presentation.VideoTitle(video.item);
                    });
                    callback(null, data);
                }
            ], function (err, result) {
                if (err) {
                    return res.render('helpers/error', { layout: 'main', error: err });
                }
                result.layout = 'main';
                result['video-list-title'] = localeString(req.locale, {
                    ru: 'Что смотрят в данный момент',
                    en: 'Watching right now'
                });
                result['api-url'] = '';
                result['page-url'] = '/videos/online';
                return res.render('video/videos', result)
            });
        });

    // most liked movies
    router.route('/liked')
        .get(function (req, res) {

            if (req.query['skip'] === '0') {
                return res.redirect(linkToVideoPage(req, 0));
            }

            async.waterfall([
                // load most liked movies from db
                function (callback) {
                    // today day
                    let today = new Date();
                    // 7 days before today
                    let startDate = new Date(today - 30 * tsInDay);
                    VideoLike.aggregate(
                        { $match: { createDate: { $gt: startDate } } },
                        { $group: { _id: '$videoTitle', count: { $sum: 1 } } },
                        // { $match: { _id: { $ne : null } }},
                        { $sort: { count: -1 } },
                        { $limit: 50 },
                        { $lookup: {
                                from: 'videotitles',
                                localField: '_id',
                                foreignField: '_id',
                                as: 'videos'
                            }
                        },
                        function (err, items) {
                            callback(err, items);
                        });
                },
                // format videos for presentation
                function (items, callback) {
                    let videos = items.filter(function (item) {
                        if (item.videos) {
                            if (item.videos.length > 0) {
                                return true;
                            }
                        }
                        return false;
                    });
                    videos = videos.map(function (item) {
                        return presentation.VideoTitle(item['videos'][0]);
                    });
                    callback(null, { videos: videos });
                },
            ], function (err, result) {
                if (err) {
                    return res.render('helpers/error', { layout: 'main', error: err });
                }
                result.layout = 'main';
                result['video-list-title'] = localeString(req.locale, {
                    ru: 'Любимые фильмы за прошедшую неделю',
                    en: 'Most popular for last week'
                });
                result['api-url'] = '';
                result['page-url'] = '/videos/liked';
                return res.render('video/videos', result)
            });
        });

    // tags
    router.route('/tags')
        .get(async (req, res) => {
            const tags = await getTopTags({ limit: 50 });
            res.render('video/tags', { tags });
        })
    router.route('/tag/:tag')
        .get((req, res) => {

            if (req.query['skip'] === '0') {
                return res.redirect(linkToVideoPage(req, 0));
            }

            const tag = req.params['tag'];

            // init options for videos controller
            let params = {
                req: req,
                presentation: true,
                query: { tags: tag },
                sort: { createDate : -1 }
            };

            let title = req.query.title;
            if (title && title !== '') {
                let reg = new RegExp(title, "i");
                params.query.title = { $regex : reg, $options: "i" };
            }

            // process videos request
            videosController.processVideosRequest(params, function (err, result) {
                if (err) {
                    return res.status(500).send(err);
                }
                result.layout = 'main';
                result['video-list-title'] = `#${tag}`;
                result['videos-list-need-filter'] = false;
                result['api-url'] = null;
                result['page-url'] = `/videos/tag/${tag}`;
                result['years'] = null;
                return res.render('video/videos', result);
            });

        });

    const moviesByCategoryHandler = (req, res) => {

        if (req.query['skip'] === '0') {
            return res.redirect(linkToVideoPage(req, 0));
        }

        // init options for vidoes controller
        let params = {
            req: req,
            presentation: true,
            query: { },
            pagerPrefix: `/videos/${req.params.id}`
        };

        let title = req.query.title;
        if (title && title !== '') {
            let reg = new RegExp(title, "i");
            params.query.title = { $regex : reg, $options: "i" };
        }

        // process videos request
        videosController.processVideosByCategoryRequest(params, function (err, result) {
            if (err === 'Need redirect') {
                return res.redirect(301, result);
            }
            if (err) {
                return res.status(404).render('helpers/404');
            }
            result.layout = 'main';
            const russianCategoryTitle = localeString(req.locale, { 'ru' : categoryTranslate(result.category.title), 'en' : result.category.title });
            result['video-list-title'] = russianCategoryTitle;
            
            const pageTitle = helpers.stringWithPageNumber(`${russianCategoryTitle} - подборка сериалов и фильмов в хорошем качестве#page#`, result.pager.currentPage);
            res.locals['page-title'] = res.locals.initPageTitle(pageTitle);
            const pageDescription = helpers.stringWithPageNumber(`Категория: ${categoryTranslate(result.category.title)} — смотреть онлайн. Список лучших сериалов в хорошем качестве#page#`, result.pager.currentPage);
            result['pageDescription'] = pageDescription;

            const { meta } = result.category;

            if (!!meta) {

                const { header, title, description } = meta;

                const pageTitle = helpers.stringWithPageNumber(`${title}${ result.year !== 0 ? ' за ' + result.year + ' год' : '' }#page#`, result.pager.currentPage)
                res.locals['page-title'] = res.locals.initPageTitle(pageTitle);

                const pageDescription = helpers.stringWithPageNumber(`${description}#page#`, result.pager.currentPage);
                result['pageDescription'] = pageDescription;

                if (header) {
                    result['video-list-title'] = header;
                }
            }
            
            result['videos-list-need-filter'] = true;
            result['api-url'] = '/api/videos/' + result.category.id;
            result['page-url'] = '/videos/' + req.params['id'];

            let isFirstPage = true;
            if (!!result.pager && !!result.pager.currentPage) {
                isFirstPage = result.pager.currentPage === 1;
            }

            if (isFirstPage) {

                let fullCategoryInfo = false;

                switch (result.category.permalink) {
                    case 'romance':
                    case 'thriller':
                    case 'western':
                    case 'science-fiction-fantasy':
                    case 'cartoons':
                    case 'documentary':
                    case 'drama':
                    case 'horror':
                    case 'experimental-art':
                    case 'politics':
                    case 'classics':
                    case 'humor':
                    case 'detective':
                    case 'religion':
                    case 'anime':
                    case 'short-films':
                    case 'education':
                    case 'musicals-music':
                    case 'action-adventure':
                    case 'turkish-serials':
                    case 'war':
                    case 'historical-epics':
					case 'comedy':
					case 'kids-family':
                        fullCategoryInfo = true;
                        break;
                    default:
                        fullCategoryInfo = false;
                }

                if (fullCategoryInfo) {
                    result[`display-category-${result.category.permalink}-full-info`] = fullCategoryInfo;
                }
            }

            return res.render('video/videos', result);
        });
    }

    // movies by category
    router.route('/:id').get(moviesByCategoryHandler);
    router.route('/:id/page-:page').get(moviesByCategoryHandler);


    return router;
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