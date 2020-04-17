var passport = require('passport');
var localStrategy = require('passport-local').Strategy;
var models = require('../models');

var jssha = require('jssha');

const createUserSession = require('../../helpers/createUserSession');

module.exports = function() {

    passport.use(new localStrategy({ passReqToCallback: true },
      function(req, username, password, done) {

          var User = models.User;
          const UserSession = models.UserSession;

          var query = User.where({ 'local-credentials.login' : username.toLowerCase() });

          query.findOne(function(err, usr) {

              var userOK = false;

              if (!err && usr) {
                  var credentials = usr['local-credentials'];
                  if (credentials) {
                      var sha = new jssha("SHA-1", "TEXT");
                      var hash = credentials['hash'];
                      var salt = credentials['salt'];
                      if (hash && salt) {
                          var saltAndPassword = salt + password;
                          sha.update(saltAndPassword);
                          var newHash = sha.getHash('B64');
                          var userOK = newHash === hash;

                          if (userOK) {
                            createUserSession(usr, req).then(session => {
                                done(null, session);
                            }).catch(error => {
                                done(null, false, error);
                            })
                          }
                        
                      }
                  }
              }

              if (!userOK) {
                  return done(null, false, { message: 'Incorrect username or password' });
              }
          });

      }
    ));

}
