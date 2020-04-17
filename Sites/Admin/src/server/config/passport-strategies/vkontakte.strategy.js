var passport = require('passport');
var VKontakteStrategy = require('passport-vkontakte').Strategy;

module.exports = function() {
    
    passport.use(new VKontakteStrategy(
      {
        clientID: '5590277',
        clientSecret: 'QCZhVihGi6fstm4wfjxy',
        callbackURL:  'http://localhost:7886/auth/vk/callback',
        scope: ['status', 'email', 'notify'],
        profileFields: ['email', 'city', 'bdate']
      },
      function myVerifyCallbackFn(accessToken, refreshToken, profile, done) {
          done(null, profile);
      }
    ));
    
}