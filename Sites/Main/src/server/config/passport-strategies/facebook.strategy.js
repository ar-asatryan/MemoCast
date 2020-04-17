let passport = require('passport');
let FacebookStrategy = require('passport-facebook').Strategy;
let models = require('../models');
let settings = require('../settings');

const createUserSession = require('../../helpers/createUserSession');

module.exports = function() {

    let User = models.User;

    passport.use(new FacebookStrategy({ ...settings['passport-facebook'], passReqToCallback: true },
      function(req, accessToken, refreshToken, profile, done) {

        let data = {
            id: profile.id,
            displayName: profile.displayName
        };

        User.findOneAndUpdate(
            { 'facebook-credentials.id': data.id },
            { $set: { 'facebook-credentials': data }},
            { upsert: true, new: true },
            function(err, user) {
                if (user != null) {
                    createUserSession(user, req).then(session => {
                        done(null, session);
                    }).catch(error => {
                        done(null, false, error);
                    })
                } else {
                    done(null, false);
                }
            });
      }
    ));

}
