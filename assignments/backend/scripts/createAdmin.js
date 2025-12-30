#!/usr/bin/env node

/**
 * CLI Tool to create admin accounts with email verification
 * 
 * Usage:
 *   npm run create:admin
 * 
 * The admin will receive a verification email and must verify
 * their email address before logging in (same as customer registration).
 */

require("dotenv").config({ path: "./config.env" });
const readline = require("readline");
const User = require("../models/User");
const emailService = require("../services/emailService");
const sequelize = require("../config/database");

// Color codes for terminal output
const colors = {
    reset: "\x1b[0m",
    bright: "\x1b[1m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    cyan: "\x1b[36m",
};

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

/**
 * Prompt user for input
 */
const question = (query) => {
    return new Promise((resolve) => rl.question(query, resolve));
};

/**
 * Validate email format
 */
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

/**
 * Validate password strength
 */
const isValidPassword = (password) => {
    if (password.length < 8) {
        return { valid: false, message: "Password must be at least 8 characters" };
    }
    if (!/[a-z]/.test(password)) {
        return { valid: false, message: "Password must contain at least one lowercase letter" };
    }
    if (!/[A-Z]/.test(password)) {
        return { valid: false, message: "Password must contain at least one uppercase letter" };
    }
    if (!/[0-9]/.test(password)) {
        return { valid: false, message: "Password must contain at least one number" };
    }
    return { valid: true };
};

/**
 * Main function to create admin account
 */
const createAdmin = async () => {
    try {
        // Connect to database
        await sequelize.authenticate();
        await sequelize.sync();

        console.log(`\n${colors.cyan}${colors.bright}=== Create Admin Account ===${colors.reset}\n`);
        console.log(`${colors.yellow}The admin will receive a verification email and must verify`);
        console.log(`their email address before logging in (same as customer registration).${colors.reset}\n`);

        // Get email
        let email;
        while (true) {
            email = await question(`${colors.cyan}Email:${colors.reset} `);
            email = email.trim().toLowerCase();

            if (!email) {
                console.log(`${colors.red}Email is required${colors.reset}\n`);
                continue;
            }

            if (!isValidEmail(email)) {
                console.log(`${colors.red}Invalid email format${colors.reset}\n`);
                continue;
            }

            // Check if email already exists
            const existingUser = await User.findOne({ where: { email } });
            if (existingUser) {
                console.log(`${colors.red}Email already registered${colors.reset}\n`);
                continue;
            }

            break;
        }

        // Get password
        let password;
        while (true) {
            password = await question(`${colors.cyan}Password (min 8 chars, uppercase, lowercase, number):${colors.reset} `);

            if (!password) {
                console.log(`${colors.red}Password is required${colors.reset}\n`);
                continue;
            }

            const validation = isValidPassword(password);
            if (!validation.valid) {
                console.log(`${colors.red}${validation.message}${colors.reset}\n`);
                continue;
            }

            // Confirm password
            const confirmPassword = await question(`${colors.cyan}Confirm Password:${colors.reset} `);
            if (password !== confirmPassword) {
                console.log(`${colors.red}Passwords do not match${colors.reset}\n`);
                continue;
            }

            break;
        }

        // Get first name
        let firstName;
        while (true) {
            firstName = await question(`${colors.cyan}First Name:${colors.reset} `);
            firstName = firstName.trim();

            if (!firstName) {
                console.log(`${colors.red}First name is required${colors.reset}\n`);
                continue;
            }

            if (firstName.length < 2 || firstName.length > 50) {
                console.log(`${colors.red}First name must be 2-50 characters${colors.reset}\n`);
                continue;
            }

            break;
        }

        // Get last name
        let lastName;
        while (true) {
            lastName = await question(`${colors.cyan}Last Name:${colors.reset} `);
            lastName = lastName.trim();

            if (!lastName) {
                console.log(`${colors.red}Last name is required${colors.reset}\n`);
                continue;
            }

            if (lastName.length < 2 || lastName.length > 50) {
                console.log(`${colors.red}Last name must be 2-50 characters${colors.reset}\n`);
                continue;
            }

            break;
        }

        // Confirmation
        console.log(`\n${colors.bright}=== Confirm Details ===${colors.reset}`);
        console.log(`Email:      ${email}`);
        console.log(`First Name: ${firstName}`);
        console.log(`Last Name:  ${lastName}`);
        console.log(`Role:       admin`);
        console.log(`Email Verified: No (will send verification email)\n`);

        const confirm = await question(`${colors.yellow}Create this admin account? (yes/no):${colors.reset} `);

        if (confirm.toLowerCase() !== "yes" && confirm.toLowerCase() !== "y") {
            console.log(`\n${colors.yellow}Admin creation cancelled${colors.reset}`);
            rl.close();
            process.exit(0);
        }

        // Create admin account (same process as customer registration)
        console.log(`\n${colors.cyan}Creating admin account...${colors.reset}`);

        const admin = await User.create({
            email,
            password, // Will be hashed by beforeCreate hook
            firstName,
            lastName,
            role: "admin",
            emailVerified: false, // Requires email verification
            status: "active",
        });

        // Generate verification token
        const verificationToken = admin.generateVerificationToken();
        await admin.save();

        // Send verification email
        console.log(`${colors.cyan}Sending verification email...${colors.reset}`);

        try {
            await emailService.sendVerificationEmail(admin, verificationToken);
            
            console.log(`\n${colors.green}${colors.bright}✅ Admin account created successfully!${colors.reset}`);
            console.log(`\n${colors.bright}Account Details:${colors.reset}`);
            console.log(`ID:              ${admin.id}`);
            console.log(`Email:           ${admin.email}`);
            console.log(`Name:            ${admin.firstName} ${admin.lastName}`);
            console.log(`Role:            ${admin.role}`);
            console.log(`Email Verified:  ${admin.emailVerified ? "Yes" : "No"}`);
            console.log(`Status:          ${admin.status}`);
            console.log(`\n${colors.yellow}${colors.bright}📧 Verification email sent to: ${admin.email}${colors.reset}`);
            console.log(`${colors.yellow}Please check inbox and verify email before logging in.${colors.reset}`);
            console.log(`${colors.yellow}Verification link expires in 24 hours.${colors.reset}\n`);

        } catch (emailError) {
            console.error(`\n${colors.red}${colors.bright}⚠️  Warning: Failed to send verification email${colors.reset}`);
            console.error(`${colors.red}Error: ${emailError.message}${colors.reset}`);
            console.log(`\n${colors.yellow}Admin account created but email not sent.${colors.reset}`);
            console.log(`${colors.yellow}You can manually verify by updating email_verified = true in database.${colors.reset}\n`);
        }

        rl.close();
        process.exit(0);

    } catch (error) {
        console.error(`\n${colors.red}${colors.bright}❌ Error creating admin account:${colors.reset}`);
        console.error(`${colors.red}${error.message}${colors.reset}`);

        if (error.name === "SequelizeValidationError") {
            console.error(`\n${colors.red}Validation Errors:${colors.reset}`);
            error.errors.forEach((err) => {
                console.error(`${colors.red}- ${err.path}: ${err.message}${colors.reset}`);
            });
        }

        rl.close();
        process.exit(1);
    }
};

// Handle Ctrl+C gracefully
rl.on("SIGINT", () => {
    console.log(`\n\n${colors.yellow}Admin creation cancelled${colors.reset}`);
    rl.close();
    process.exit(0);
});

// Run the script
console.log(`${colors.bright}Starting admin creation wizard...${colors.reset}`);
createAdmin();
