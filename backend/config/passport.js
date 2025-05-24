console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID);
console.log('FACEBOOK_APP_ID:', process.env.FACEBOOK_APP_ID);

const passport = require('passport');
// const GoogleStrategy = require('passport-google-oauth20').Strategy;
// const FacebookStrategy = require('passport-facebook').Strategy;
const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt');
const User = require('../models/User');

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

// Disabled Google OAuth2 Strategy temporarily
// passport.use(new GoogleStrategy({
//   clientID: process.env.GOOGLE_CLIENT_ID,
//   clientSecret: process.env.GOOGLE_CLIENT_SECRET,
//   callbackURL: '/auth/google/callback',
// }, async (accessToken, refreshToken, profile, done) => {
//   try {
//     let user = await User.findOne({ googleId: profile.id });
//     if (!user) {
//       user = await User.create({
//         name: profile.displayName,
//         email: profile.emails[0].value,
//         googleId: profile.id,
//         role: 'user',
//       });
//     }
//     done(null, user);
//   } catch (err) {
//     done(err, null);
//   }
// }));

// Disabled Facebook OAuth2 Strategy temporarily
// passport.use(new FacebookStrategy({
//   clientID: process.env.FACEBOOK_APP_ID,
//   clientSecret: process.env.FACEBOOK_APP_SECRET,
//   callbackURL: '/auth/facebook/callback',
//   profileFields: ['id', 'displayName', 'emails'],
// }, async (accessToken, refreshToken, profile, done) => {
//   try {
//     let user = await User.findOne({ facebookId: profile.id });
//     if (!user) {
//       user = await User.create({
//         name: profile.displayName,
//         email: profile.emails ? profile.emails[0].value : '',
//         facebookId: profile.id,
//         role: 'user',
//       });
//     }
//     done(null, user);
//   } catch (err) {
//     done(err, null);
//   }
// }));

// JWT Strategy for API authentication
const opts = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET || 'default_jwt_secret_key',
};

passport.use(new JwtStrategy(opts, async (jwt_payload, done) => {
  try {
    const user = await User.findById(jwt_payload.id);
    if (user) {
      return done(null, user);
    }
    return done(null, false);
  } catch (err) {
    return done(err, false);
  }
}));
