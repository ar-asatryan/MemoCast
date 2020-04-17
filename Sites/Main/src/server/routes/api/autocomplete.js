var express = require('express');
var models = require('../../config/models');
var searchModule = require('selectors/search');

module.exports = function() {

    var router = express.Router();
    var VideoTitle = models.VideoTitle;

    router.route('/videos')
        .get(async (req, res) => {

            try {
                var searchString = req.query['search'];

                let limit = parseInt(req.query['limit']);
                const defaultLimit = 6;
                if (isNaN(limit) || (limit < 1)) {
                    limit = defaultLimit;
                }

                let data = await searchModule({
                    searchString,
                    limit: limit,
                    needPresentation: false,
                });

                data = data.map((item) => {
                    let doc = {
                        title: item.title,
                        id: item._id,
                        year: item.year
                    };

                    let url = `/video/${doc.id}`;

                    if (item.titleID && item.titleID != '') {
                        url = `/video/${item.titleID}`;
                    }

                    doc.url = url;

                    return doc;
                });

                res.send(data);
            } catch (err) {
                res.status(500).send(err);
            }
            
        });

    return router;

}
