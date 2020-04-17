let express = require('express');
let models = require('../../config/models');
let presentation = require('../../config/presentation');
let rabbit = require('../../config/rabbit');
let io = require('../../config/io');
let commentsController = require('../../controllers/comments')();

module.exports = function() {

    let router = express.Router();

    let Comment = models.Comment;
    let VideoItem = models.VideoItem;
    let UserFollower = models.UserFollower;

    router.route('/')
        .post(function(req, res) {
            if (req.user) {
                let videoItemID = req.body['VideoItem'];
                VideoItem.findById(videoItemID, function(err, item) {
                    if (item) {

                        let videoTitle = item['videoTitle'];

                        let comment = {
                            body: req.body['body'],
                            createDate: new Date(),
                            videoItem: videoItemID,
                            videoTitle: videoTitle,
                            user: req.user['_id']
                        };

                        Comment.create(comment, function(err, doc) {
                            let result = presentation.Comment(doc);
                            result.user = presentation.User(req.user);
                            res.send(result);

                            result.videoTitle = presentation.VideoTitle(videoTitle);

                            // send notification about new comment to RabbitMQ server
                            let msg = { id: doc['_id']};
                            rabbit.notifyNewComment(msg);

                            let envelope = {
                                type: 'comment',
                                data: result
                            };

                            console.dir(doc);
                            // update video title stats for comments
                            doc.updateVideoTitleStats();

                            // send notification for followers
                            UserFollower.find({ user: req.user['_id'] })
                                .select('follower')
                                .exec(function (err, followers) {
                                    if (followers) {
                                        followers.forEach(function (item) {
                                            let f = item['follower'].toString();
                                            io.sendMessageToUser(f, envelope);
                                        });
                                    }
                                });
                        });

                    } else {
                        res.status(500).send({
                            err: 'Нельзя добавлять комментарий к несуществующему фильму'
                        });
                    }
                });
            } else {
                res.status(401).send({
                    err: 'Отправлять комментарии могут только авторизованные пользователи'
                })
            }
        })
        .get(function(req, res) {
            res.send({ message: 'API / Comment: Hello World' });
        });

    router.route('/video-title/:id')
        .get(function(req, res) {
            let videoTitleID = req.params['id'];

            let params = {
                req: req,
                query: { videoTitle: videoTitleID },
                populate: {
                    user: true,
                    videoItem: true,
                    videoTitle: false
                }
            };

            commentsController.processCommentsRequest(params, function (err, result) {
                return res.send(result.comments);
            });

        });

    router.route('/video-item/:id')
        .get(function(req, res) {

            let videoItemID = req.params['id'];

            let params = {
                req: req,
                query: { videoItem: videoItemID },
                populate: {
                    user: true,
                    videoItem: false,
                    videoTitle: false
                }
            };

            commentsController.processCommentsRequest(params, function (err, result) {
                return res.send(result.comments);
            });

        });

    router.route('/recent')
        .get(function(req, res) {

            let params = {
                req: req,
                query: { },
                populate: {
                    user: true,
                    videoItem: true,
                    videoTitle: true
                }
            };

            commentsController.processCommentsRequest(params, function (err, result) {
                return res.send(result.comments);
            });

        });

    router.route('/my')
        .get(function(req, res) {
            if (req.user) {

                let params = {
                    req: req,
                    query: { user: req.user['_id'] },
                    populate: {
                        user: true,
                        videoItem: true,
                        videoTitle: true
                    }
                };

                commentsController.processCommentsRequest(params, function (err, result) {
                    return res.send(result.comments);
                });

            } else {
                res.status(401).send({
                    err: 'Авторизуйтесь для начала, ёпте!'
                })
            }
        });

    router.route('/user/:id')
        .get(function(req, res) {
            let userID = req.params['id'];
            Comment.find({ user: userID })
                // .select('user')
                .sort({ createDate: 'desc' })
                .populate('videoItem user')
                .populate('videoTitle', '-sinopsis -cast')
                // .populate('user')
                .limit(200)
                .exec(function(err, items) {
                    let docs = items.map(function(item) {
                        return presentation.Comment(item);
                    });
                    res.send(docs);
                });
        });

    router.route('/:id')
        .delete(function(req, res) {
            if (req.user) {

                let commentID = req.params['id'];

                let isAdmin = req.userIsAdmin === true;
                let isOwner = false;

                let commentRemoveHanlder = function(err, item) {
                    if (err) {
                        res.status(500).send({
                            err: err
                        });
                    } else {
                        models.VideoTitle.updateCommentStats(item.videoTitle);
                        res.send({ message: 'Сообщение с ID ' + commentID + ' удалено' });
                        rabbit.notifyObjectRemoval({ id: commentID });
                    }
                };

                if (isAdmin) {
                    Comment.findByIdAndRemove(commentID, commentRemoveHanlder);
                } else {
                    Comment.findOneAndRemove({ _id: commentID, user: req.user['_id']  }, commentRemoveHanlder);
                }

            }
        });


    return router;

};
