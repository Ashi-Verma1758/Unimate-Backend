import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/user.model.js';

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/api/auth/google/callback"
}, async (accessToken, refreshToken, profile, done) => {
    try {
        let user = await User.findOne({ googleId: profile.id });

        if (!user) {
            // Try matching existing account by email
            const email = profile.emails?.[0]?.value || null;
            user = await User.findOne({ email });

            if (user) {
                user.googleId = profile.id;
                await user.save();
            } else {
                // Create new incomplete profile
                user = await User.create({
                    googleId: profile.id,
                    name: profile.displayName,
                    email,
                    avatar: profile.photos?.[0]?.value || null,
                    incomplete: true // 🚀 flag for "needs profile completion"
                });
            }
        }

        return done(null, user);
    } catch (err) {
        return done(err, null);
    }
}));

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
