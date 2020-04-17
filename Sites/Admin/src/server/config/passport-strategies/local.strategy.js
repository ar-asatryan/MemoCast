var passport = require('passport');
var localStrategy = require('passport-local').Strategy;

module.exports = function() {
    
    passport.use(new localStrategy(
      function(username, password, done) {

          if (username == 'username' && password == 'password') {

              var usr = {
                username: username,
                password: password
              };

              return done(null, { username: username, password: password });
          } else {

              return done(null, false);
          }

      }
    ));
    
}