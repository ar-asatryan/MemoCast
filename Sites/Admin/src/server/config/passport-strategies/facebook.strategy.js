var passport = require('passport');
var FacebookStrategy = require('passport-facebook').Strategy;

module.exports = function() {
    
    passport.use(new FacebookStrategy({
        clientID: '1769375080000943',
        clientSecret: '84c8522fa86580aee46b5f3a2d01742b',
        callbackURL: 'http://localhost:7886/auth/facebook/callback'
      },
      function(accessToken, refreshToken, profile, done) {
        return done(null, profile);
      }
    ));
    
}