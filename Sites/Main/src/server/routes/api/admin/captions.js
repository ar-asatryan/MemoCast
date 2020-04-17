const express = require('express');
const mongoose = require('mongoose');
const models = require('../../../config/models');

const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const router = express.Router();

// video item's captions list
router.route('/item/:id')
    .get(async (req, res) => {
        try {
            const { id } = req.params;
            if (!mongoose.Types.ObjectId.isValid(id)) {
                res.status(400).send(`Incorrect ID format: ${id}`);
            }
            const query = { videoItem: mongoose.Types.ObjectId(id) };
            const items = await models.Captions.find(query)
                .sort({ createDate: 1 })
                .select({ content: 0 })
                .lean();
            res.send(items);
        } catch (err) {
            res.status(500).send(err);
        }
    });

// delete captions by id
router.route('/:id')
    .delete(async (req, res) => {
        try {
            const { id } = req.params;
            if (!mongoose.Types.ObjectId.isValid(id)) {
                res.status(400).send(`Incorrect ID format: ${id}`);
            }
            await models.Captions.findByIdAndRemove(id);
            res.send({ ok: true });
        } catch (err) {
            res.status(500).send(err);
        }
    });

// post new captions
router.route('/')
    .post(upload.single('file'), async (req, res) => {
        try {
            const { videoItem, language } = req.body;
            const { buffer, mimetype } = req.file;
            
            const caption = await models.Captions.create({
                createDate: new Date(),
                videoItem: mongoose.Types.ObjectId(videoItem),
                language,
                content: { data: buffer, contentType: mimetype }
            });

            res.send(caption);

        } catch (err) {
            res.status(500).send(err);
        }
    });

module.exports = router;