const passport = require("passport");
const JwtStrategy = require("passport-jwt").Strategy;
const ExtractJwt = require("passport-jwt").ExtractJwt;
const LocalStrategy = require("passport-local").Strategy;
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const { Op } = require("sequelize");
const User = require("../models/User");

// JWT Strategy for protected routes
const jwtOptions = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_AUTH_SECRET,
};

passport.use(
    "jwt",
    new JwtStrategy(jwtOptions, async (payload, done) => {
        try {
            const user = await User.findOne({
                where: { id: payload.id, status: "active" },
                attributes: { exclude: ["password"] },
            });

            if (!user) {
                return done(null, false);
            }

            // Check if user changed password after the token was issued
            if (user.changedPasswordAfter(payload.iat)) {
                return done(null, false);
            }

            return done(null, user);
        } catch (error) {
            console.error("JWT Strategy error:", error);
            return done(error, false);
        }
    })
);

// Local Strategy for email/password login
passport.use(
    "local",
    new LocalStrategy(
        {
            usernameField: "email",
            passwordField: "password",
        },
        async (email, password, done) => {
            try {
                const user = await User.findOne({ where: { email } });

                if (!user) {
                    return done(null, false, {
                        message: "Invalid email or password",
                    });
                }

                // Check if email is verified (for customers only)
                if (user.role === "customer" && !user.emailVerified) {
                    return done(null, false, {
                        message:
                            "Email not verified. Please check your inbox for the verification link.",
                    });
                }

                // Check if account is active
                if (user.status !== "active") {
                    return done(null, false, {
                        message:
                            "Your account is inactive. Please contact support.",
                    });
                }

                // Verify password
                const isMatch = await user.comparePassword(password);
                if (!isMatch) {
                    return done(null, false, {
                        message: "Invalid email or password",
                    });
                }

                // Update last login
                user.lastLogin = new Date();
                await user.save();

                return done(null, user);
            } catch (error) {
                console.error("Local Strategy error:", error);
                return done(error);
            }
        }
    )
);

// Google OAuth Strategy
passport.use(
    "google",
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: "/api/auth/google/callback",
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                const email = profile.emails?.[0]?.value;

                if (!email) {
                    return done(new Error("No email found in Google profile"), false);
                }

                // Find existing user by Google ID or email
                let user = await User.findOne({
                    where: {
                        [Op.or]: [
                            { googleId: profile.id },
                            { email: email }
                        ]
                    }
                });

                if (user) {
                    // Update Google ID if not set
                    if (!user.googleId) {
                        user.googleId = profile.id;
                        user.emailVerified = true;
                        await user.save();
                    }

                    // Update last login
                    user.lastLogin = new Date();
                    await user.save();
                } else {
                    // Create new customer account
                    user = await User.create({
                        email: email,
                        firstName: profile.name?.givenName || "User",
                        lastName: profile.name?.familyName || "GoogleUser",
                        googleId: profile.id,
                        role: "customer",
                        emailVerified: true,
                        password: "GOOGLE_OAUTH_NO_PASSWORD", // Placeholder
                        avatar: profile.photos?.[0]?.value || null,
                        status: "active",
                    });
                }

                return done(null, user);
            } catch (error) {
                console.error("Google OAuth Strategy error:", error);
                return done(error, false);
            }
        }
    )
);

module.exports = passport;
