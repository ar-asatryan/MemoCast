let passport = require('passport');
let VKontakteStrategy = require('passport-vkontakte').Strategy;
let models = require('../models');
let settings = require('../settings');

const createUserSession = require('../../helpers/createUserSession');

module.exports = function () {

    let User = models.User;

    passport.use(new VKontakteStrategy({ ...settings['passport-vkontakte'], passReqToCallback: true },
        function myVerifyCallbackFn(req, accessToken, refreshToken, profile, done) {

            let data = {};

            if (profile.id) { data.id = profile.id.toString(); }
            if (profile.username) { data.username = profile.username; }
            if (profile.displayName) { data.displayName = profile.displayName; }
            if (profile.gender) { data.gender = profile.gender; }
            if (profile.profileUrl) { data.url = profile.profileUrl; }
            if (profile.photos) {
                if (profile.photos.length > 0) { data.photo = profile.photos[0].value; }
            }
            if (profile.birthday && profile.birthday !== '') {
                let r = /(\d+)/g
                let matches = profile.birthday.match(r);
                if (matches.length === 3) {
                    let year = parseInt(matches[0]);
                    let month = parseInt(matches[1]) - 1;
                    let day = parseInt(matches[2]);
                    data.birthday = profile.birthday;
                }
            }

            User.findOneAndUpdate({ 'vkontakte-credentials.id': data.id }, { $set: { 'vkontakte-credentials': data } }, { new: true, upsert: true }, function (err, user) {
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
