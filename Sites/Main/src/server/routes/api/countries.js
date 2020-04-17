var express = require('express');
var countries = require('../../config/countries');

module.exports = function() {

    var router = express.Router();
    
    router.route('/')
        .get(function(req, res) {
            res.send(countries)
        });
    
    return router;
};