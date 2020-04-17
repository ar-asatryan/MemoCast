var handleSiteErrors = function(err, req, res, next) {
    console.log(err);
    res.status(500).render('helpers/error');
}

module.exports = function(app) {

    app.get('/error', function(req, res) {
        res.render('helpers/error');
    });

    app.use(handleSiteErrors);

};
