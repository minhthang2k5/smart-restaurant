const nodemailer = require("nodemailer");

// Create transporter using Gmail SMTP
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || "smtp-relay.brevo.com",
    port: process.env.EMAIL_PORT || 587,
    secure: false, // Use TLS
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, // SMTP ket
    },
});

/**
 * Send email verification link to user
 * @param {Object} user - User object with email, firstName
 * @param {string} token - Verification token
 */
exports.sendVerificationEmail = async (user, token) => {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

    const mailOptions = {
        from:
            process.env.EMAIL_FROM ||
            "Smart Restaurant <noreply@smartrestaurant.com>",
        to: user.email,
        subject: "Verify Your Email - Smart Restaurant",
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
                    .content { padding: 20px; background-color: #f9f9f9; }
                    .button { display: inline-block; padding: 12px 24px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
                    .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Welcome to Smart Restaurant!</h1>
                    </div>
                    <div class="content">
                        <h2>Hello ${user.firstName},</h2>
                        <p>Thank you for registering with Smart Restaurant. To complete your registration, please verify your email address by clicking the button below:</p>
                        <center>
                            <a href="${verificationUrl}" class="button">Verify Email Address</a>
                        </center>
                        <p>Or copy and paste this link in your browser:</p>
                        <p style="word-break: break-all; color: #4CAF50;">${verificationUrl}</p>
                        <p><strong>This link will expire in 24 hours.</strong></p>
                        <p>If you didn't create an account with Smart Restaurant, please ignore this email.</p>
                    </div>
                    <div class="footer">
                        <p>&copy; ${new Date().getFullYear()} Smart Restaurant. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Verification email sent to ${user.email}`);
    } catch (error) {
        console.error("Error sending verification email:", error);
        throw new Error("Failed to send verification email");
    }
};

/**
 * Send password reset email to user
 * @param {Object} user - User object with email, firstName
 * @param {string} token - Reset token
 */
exports.sendPasswordResetEmail = async (user, token) => {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

    const mailOptions = {
        from:
            process.env.EMAIL_FROM ||
            "Smart Restaurant <noreply@smartrestaurant.com>",
        to: user.email,
        subject: "Password Reset Request - Smart Restaurant",
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background-color: #FF5722; color: white; padding: 20px; text-align: center; }
                    .content { padding: 20px; background-color: #f9f9f9; }
                    .button { display: inline-block; padding: 12px 24px; background-color: #FF5722; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
                    .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Password Reset Request</h1>
                    </div>
                    <div class="content">
                        <h2>Hello ${user.firstName},</h2>
                        <p>We received a request to reset your password for your Smart Restaurant account. Click the button below to reset it:</p>
                        <center>
                            <a href="${resetUrl}" class="button">Reset Password</a>
                        </center>
                        <p>Or copy and paste this link in your browser:</p>
                        <p style="word-break: break-all; color: #FF5722;">${resetUrl}</p>
                        <p><strong>This link will expire in 15 minutes.</strong></p>
                        <p>If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
                    </div>
                    <div class="footer">
                        <p>&copy; ${new Date().getFullYear()} Smart Restaurant. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Password reset email sent to ${user.email}`);
    } catch (error) {
        console.error("Error sending password reset email:", error);
        throw new Error("Failed to send password reset email");
    }
};

/**
 * Send welcome email to user after successful verification
 * @param {Object} user - User object with email, firstName
 */
exports.sendWelcomeEmail = async (user) => {
    const mailOptions = {
        from:
            process.env.EMAIL_FROM ||
            "Smart Restaurant <noreply@smartrestaurant.com>",
        to: user.email,
        subject: "Welcome to Smart Restaurant!",
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
                    .content { padding: 20px; background-color: #f9f9f9; }
                    .button { display: inline-block; padding: 12px 24px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
                    .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Welcome to Smart Restaurant!</h1>
                    </div>
                    <div class="content">
                        <h2>Hi ${user.firstName},</h2>
                        <p>Your email has been verified successfully! You can now enjoy all the features of Smart Restaurant.</p>
                        <p>Here's what you can do:</p>
                        <ul>
                            <li>Browse our delicious menu</li>
                            <li>Place orders easily by scanning table QR codes</li>
                            <li>Track your order status in real-time</li>
                            <li>Save your favorite dishes</li>
                        </ul>
                        <center>
                            <a href="${
                                process.env.FRONTEND_URL
                            }/menu" class="button">Browse Menu</a>
                        </center>
                        <p>If you have any questions, feel free to contact our support team.</p>
                        <p>Enjoy your dining experience!</p>
                    </div>
                    <div class="footer">
                        <p>&copy; ${new Date().getFullYear()} Smart Restaurant. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Welcome email sent to ${user.email}`);
    } catch (error) {
        console.error("Error sending welcome email:", error);
        // Don't throw error here, welcome email is not critical
    }
};
