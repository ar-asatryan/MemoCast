var handleSiteErrors = function(err, req, res, next) {
    res.status(500).render('error');
}

module.exports = function(app) {
    
    app.get('/error', function(req, res) {
        res.render('error'); 
    });
    
    app.use(handleSiteErrors);
    
};