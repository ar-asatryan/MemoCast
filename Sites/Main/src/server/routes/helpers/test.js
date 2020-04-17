var express = require('express');
var models = require('../../config/models');
var presentation = require('../../config/presentation');

module.exports = function() {

    var router = express.Router();

    router.route('/:secret')
        // GET /test handler
        .get(function(req, res) {

            var secret = req.params['secret'];

            res.render('helpers/test', { secret: secret, layout: 'main' });

        }); // .get ...

    return router;
}
