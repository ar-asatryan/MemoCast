var express = require('express');

module.exports = function() {
    
    var router = express.Router();
    
    router.route('/')
        .get(function(req, res) {
            res.render('admin/settings', { layout: 'admin' });
        });
    
    return router;
    
}