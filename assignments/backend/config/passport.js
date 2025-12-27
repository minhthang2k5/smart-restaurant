const passport = require("passport");
const JwtStrategy = require("passport-jwt").Strategy;
const ExtractJwt = require("passport-jwt").ExtractJwt;
const LocalStrategy = require("passport-local").Strategy;
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

            if (user) {
                return done(null, user);
            }
            return done(null, false);
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

module.exports = passport;
