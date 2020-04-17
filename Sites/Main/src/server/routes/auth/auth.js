var express = require('express');

module.exports = function(app) {
    
    app.use('/auth', require('../auth'));

    // signup page(s)
    app.use('/signup', require('./signup')());
    
    // login page(s)
    app.use('/login', require('./login')());
    
    // password recovery
    app.use('/passwordrecovery', require('./passwordrecovery')());
    
    // logout
    app.get('/logout',
        function(req, res){
            req.logout();
            res.redirect('/');
        }
    );
};