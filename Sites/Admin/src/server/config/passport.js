var passport = require('passport');

module.exports = function(app) {
  
    app.use(passport.initialize());
    app.use(passport.session());
    
    passport.serializeUser(function(user, done) {
        done(null, user);
    });

    passport.deserializeUser(function(obj, done) {
        done(null, obj);
    });
    
    require('./passport-strategies/local.strategy')();
    
    require('./passport-strategies/vkontakte.strategy')();
    
    require('./passport-strategies/facebook.strategy')();

};