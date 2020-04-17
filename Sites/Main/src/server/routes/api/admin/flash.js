const express = require('express');
const async = require('async');
const models = require('../../../config/models');
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage, fileFilter: fileFilter });
const uploadHandler = upload.single('image');
const cache = require('../../../config/cache');
const cacheKey = 'cache:page:index:flash';

function fileFilter(req, file, cb) {
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
        cb(null, true);
    } else {
        cb(null, false);
    }
}

module.exports = () => {
    let router = express.Router();

    router.route('/')
        // GET all Flash items
        .get((req, res) => {
            let query = {};
            let sort = { createDate : -1 };
            let select = { img : 0 };
            models.Flash.find(query)
                .select(select)
                .sort(sort)
                .exec((err, items) => {
                    res.send(items);
                });
        })
        // CREATE Flash Item
        .post(upload.single('image'), (req, res) => {
            let update = {
                createDate : new Date,
                title: req.body.title,
                body: req.body.body,
                url: req.body.url,
                order: req.body.order,
                isPublic: req.body.isPublic
            };
            if (req.file) {
                update.img = {
                    data : req.file.buffer,
                    contentType : req.file.mimetype
                }
            }
            models.Flash.create(update, (err, item) => {
                if (err) {
                    return res.status(500).send(err);
                } else {
                    res.send({ _id : item._id });
                    cache.del(cacheKey);
                }
            });
        });


    router.route('/:id')
        // UPDATE Flash Item
        .put(upload.single('image'), (req, res) => {
            let update = {
                createDate : new Date,
                title: req.body.title,
                body: req.body.body,
                url: req.body.url,
                order: req.body.order,
                isPublic: req.body.isPublic
            };
            if (req.file) {
                update.img = {
                    data : req.file.buffer,
                    contentType : req.file.mimetype
                }
            }
            let query = { _id : req.body.id };
            models.Flash.findOneAndUpdate(query, { $set : update }, (err, item) => {
                if (err) {
                    return res.status(500).send(err);
                } else {
                    res.send({ ok : true });
                    cache.del(cacheKey);
                }
            });
        })
        // DELETE Flash Item
        .delete((req, res) => {
            let id = req.params['id'];
            models.Flash.remove({ _id : id })
                .exec((err, raw) => {
                    if (err) {
                        return res.status(500).send(err);
                    } else {
                        res.send(raw);
                        cache.del(cacheKey);
                    }
                });
        });

    return router;
}
