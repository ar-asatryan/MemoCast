module.exports = function(app) {

    // about us page
    app.use('/about', require('./about')());

    // help page
    app.use('/help', require('./help')());

    // feedback page
    app.use('/feedback', require('./feedback')());

    // contacts page
    app.use('/contacts', require('./contacts')());

    // eula
    app.use('/eula', require('./eula')());

    // payment options
    app.use('/paymentoptions', require('./paymentoptions')());

    // privacy
    app.use('/privacy', require('./privacy')());

    // forms templates
    app.use('/forms', require('./forms')());

    // test player
    app.use('/test-player', require('./test-player')());

    // welcome
    app.get('/welcome', function (req, res) {
        res.render('helpers/welcome', { fluid : true, layout : 'main' });
    });

    app.use('/country-block', (req, res, next) => {
        res.status(403).render('helpers/country-block', { layout: null });
    });

    app.use('/test-headers', (req, res, next) => {
        res.json(req.headers);
    })

};
