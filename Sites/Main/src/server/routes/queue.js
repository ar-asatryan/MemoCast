var express = require('express');

module.exports = function() {
    
    var router = express.Router();
    
    router.route('/')
        .get(function(req, res) {
            res.render('queue/my');
        });
    
    router.route('/:id')
        .get(function(req, res) {
            var queueID = req.params['id'];
            res.render('queue/custom', { queueID: queueID });
        });
    
    return router;
    
};