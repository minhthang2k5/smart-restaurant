const nodemailer = require("nodemailer");
const fs = require("fs").promises;
const path = require("path");

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
 * Load and populate email template
 * @param {string} templateName - Name of the HTML template file
 * @param {Object} variables - Variables to replace in template
 * @returns {Promise<string>} - Populated HTML content
 */
const loadEmailTemplate = async (templateName, variables) => {
    try {
        const templatePath = path.join(
            __dirname,
            "../templates/emails",
            templateName
        );
        let html = await fs.readFile(templatePath, "utf-8");

        // Replace all variables in template
        Object.keys(variables).forEach((key) => {
            const placeholder = new RegExp(`{{${key}}}`, "g");
            html = html.replace(placeholder, variables[key]);
        });

        return html;
    } catch (error) {
        console.error(`Error loading email template ${templateName}:`, error);
        throw new Error("Failed to load email template");
    }
};

/**
 * Send email verification link to user
 * @param {Object} user - User object with email, firstName
 * @param {string} token - Verification token
 */
exports.sendVerificationEmail = async (user, token) => {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

    const html = await loadEmailTemplate("verification-email.html", {
        firstName: user.firstName,
        verificationUrl: verificationUrl,
        year: new Date().getFullYear(),
    });

    const mailOptions = {
        from:
            process.env.EMAIL_FROM ||
            "Smart Restaurant <noreply@smartrestaurant.com>",
        to: user.email,
        subject: "Verify Your Email - Smart Restaurant",
        html: html,
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

    const html = await loadEmailTemplate("password-reset-email.html", {
        firstName: user.firstName,
        resetUrl: resetUrl,
        year: new Date().getFullYear(),
    });

    const mailOptions = {
        from:
            process.env.EMAIL_FROM ||
            "Smart Restaurant <noreply@smartrestaurant.com>",
        to: user.email,
        subject: "Password Reset Request - Smart Restaurant",
        html: html,
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
    const html = await loadEmailTemplate("welcome-email.html", {
        firstName: user.firstName,
        menuUrl: `${process.env.FRONTEND_URL}/menu`,
        year: new Date().getFullYear(),
    });

    const mailOptions = {
        from:
            process.env.EMAIL_FROM ||
            "Smart Restaurant <noreply@smartrestaurant.com>",
        to: user.email,
        subject: "Welcome to Smart Restaurant!",
        html: html,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Welcome email sent to ${user.email}`);
    } catch (error) {
        console.error("Error sending welcome email:", error);
        // Don't throw error here, welcome email is not critical
    }
};