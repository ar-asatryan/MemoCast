const passport = require('passport');
const models = require('./models');
const cache = require('./cache');
const async = require('async');

module.exports = function(app) {

    app.use(passport.initialize());
    app.use(passport.session());

    var User = models.User;

    passport.serializeUser(function(session, done) {
        done(null, session['_id']);
    });

    passport.deserializeUser(function(obj, done) {
        async.waterfall([
            function (callback) {
                models.UserSession.findById(obj)
                    .populate('user')
                    .lean()
                    .exec(callback);
            },
            function (item, callback) {
                if (!item) {
                  return callback(null, null);
                }
                const { user, ...session } = item;
                user.session = session;
                callback(null, user);
            }
        ], done);
    });

    require('./passport-strategies/local.strategy')();

    require('./passport-strategies/vkontakte.strategy')();

    require('./passport-strategies/facebook.strategy')();

    app.use((req, res, next) => {
        if (req.user) {
            req.user = req.user || req.user.user;
        }
        next();
    })

};
