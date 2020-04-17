var express = require('express');
var languages = require('../../config/languages');

module.exports = function() {

    var router = express.Router();
    
    router.route('/')
        .get(function(req, res) {
            res.send(languages)
        });
    
    return router;
};