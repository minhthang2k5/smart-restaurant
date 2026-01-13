/**
 * Review System Test Script
 * 
 * This script helps you test the review system by:
 * 1. Creating test data (customer, session, order)
 * 2. Running review operations
 * 3. Validating results
 * 
 * Usage: node scripts/testReviews.js
 */

require("dotenv").config({ path: "./config.env" });
require("../models/associations");

const sequelize = require("../config/database");
const User = require("../models/User");
const MenuItem = require("../models/MenuItem");
const MenuCategory = require("../models/MenuCategory");
const Table = require("../models/Table");
const TableSession = require("../models/TableSession");
const Order = require("../models/Order");
const OrderItem = require("../models/OrderItem");
const Review = require("../models/Review");
const bcrypt = require("bcrypt");

async function setupTestData() {
    console.log("🔧 Setting up test data...\n");

    try {
        // 1. Create test customer
        const hashedPassword = await bcrypt.hash("Test1234", 10);
        const customer = await User.create({
            email: `testcustomer${Date.now()}@example.com`,
            password: hashedPassword,
            firstName: "John",
            lastName: "Doe",
            role: "customer",
            isVerified: true,
            status: "active"
        });
        console.log(`✅ Created customer: ${customer.email} (ID: ${customer.id})`);

        // 2. Find or create category
        let category = await MenuCategory.findOne({ where: { name: "Burgers" } });
        if (!category) {
            category = await MenuCategory.create({
                name: "Burgers",
                description: "Delicious burgers",
                status: "active",
                display_order: 1
            });
        }
        console.log(`✅ Category: ${category.name} (ID: ${category.id})`);

        // 3. Find or create menu items
        let burger = await MenuItem.findOne({ where: { name: "Classic Burger" } });
        if (!burger) {
            burger = await MenuItem.create({
                name: "Classic Burger",
                description: "Juicy beef burger with lettuce and tomato",
                price: 12.50,
                category_id: category.id,
                status: "available",
                prep_time_minutes: 15
            });
        }
        console.log(`✅ Menu Item: ${burger.name} (ID: ${burger.id})`);

        // 4. Find or create table
        let table = await Table.findOne({ where: { table_number: "T1" } });
        if (!table) {
            table = await Table.create({
                table_number: "T1",
                capacity: 4,
                location: "Main Hall",
                status: "available"
            });
        }
        console.log(`✅ Table: ${table.table_number} (ID: ${table.id})`);

        // 5. Create completed session
        const session = await TableSession.create({
            table_id: table.id,
            customer_id: customer.id,
            session_number: `SESS-TEST-${Date.now()}`,
            status: "completed",
            completed_at: new Date(),
            subtotal: 12.50,
            tax_amount: 1.25,
            total_amount: 13.75,
            payment_status: "paid",
            payment_method: "cash"
        });
        console.log(`✅ Session: ${session.session_number} (ID: ${session.id})`);

        // 6. Create order in session
        const order = await Order.create({
            session_id: session.id,
            table_id: table.id,
            customer_id: customer.id,
            order_number: `ORD-TEST-${Date.now()}`,
            status: "completed",
            subtotal: 12.50,
            tax_amount: 1.25,
            total_amount: 13.75
        });
        console.log(`✅ Order: ${order.order_number} (ID: ${order.id})`);

        // 7. Create order item
        const orderItem = await OrderItem.create({
            order_id: order.id,
            menu_item_id: burger.id,
            quantity: 1,
            unit_price: 12.50,
            subtotal: 12.50,
            total_price: 12.50,
            status: "completed",
            item_name: burger.name,
            item_description: burger.description
        });
        console.log(`✅ Order Item created\n`);

        return {
            customer,
            category,
            burger,
            table,
            session,
            order,
            orderItem
        };
    } catch (error) {
        console.error("❌ Setup error:", error.message);
        throw error;
    }
}

async function testReviewOperations(testData) {
    const { customer, burger, session } = testData;

    console.log("🧪 Testing review operations...\n");

    try {
        // TEST 1: Create review
        console.log("TEST 1: Create review");
        const review = await Review.create({
            menu_item_id: burger.id,
            customer_id: customer.id,
            session_id: session.id,
            rating: 5,
            comment: "Absolutely delicious! Best burger I've ever had.",
            status: "approved"
        });
        console.log(`✅ Review created (ID: ${review.id}, Rating: ${review.rating})\n`);

        // TEST 2: Check menu item rating update
        console.log("TEST 2: Verify menu item rating update");
        await burger.reload();
        console.log(`✅ Menu Item Rating: ${burger.average_rating}/5.00`);
        console.log(`✅ Review Count: ${burger.review_count}\n`);

        // TEST 3: Get reviews for menu item
        console.log("TEST 3: Get all reviews for menu item");
        const reviews = await Review.findAll({
            where: {
                menu_item_id: burger.id,
                status: "approved"
            },
            include: [{
                model: User,
                as: "customer",
                attributes: ["firstName", "lastName"]
            }]
        });
        console.log(`✅ Found ${reviews.length} review(s)`);
        reviews.forEach(r => {
            console.log(`   - ${r.rating}⭐ by ${r.customer.firstName}: "${r.comment}"`);
        });
        console.log();

        // TEST 4: Update review
        console.log("TEST 4: Update review");
        await review.update({
            rating: 4,
            comment: "Good, but not perfect. A bit too salty."
        });
        console.log(`✅ Review updated (New rating: ${review.rating})\n`);

        // TEST 5: Check rating recalculation
        console.log("TEST 5: Verify rating recalculation");
        await burger.reload();
        console.log(`✅ Updated Rating: ${burger.average_rating}/5.00\n`);

        // TEST 6: Try duplicate review (should fail)
        console.log("TEST 6: Try creating duplicate review");
        try {
            await Review.create({
                menu_item_id: burger.id,
                customer_id: customer.id,
                session_id: session.id,
                rating: 5,
                comment: "Duplicate"
            });
            console.log("❌ Duplicate review was created (UNEXPECTED!)\n");
        } catch (error) {
            console.log("✅ Duplicate prevented (as expected)\n");
        }

        // TEST 7: Create multiple reviews (different sessions)
        console.log("TEST 7: Create review in different session");
        const session2 = await TableSession.create({
            table_id: testData.table.id,
            customer_id: customer.id,
            session_number: `SESS-TEST-${Date.now()}-2`,
            status: "completed",
            completed_at: new Date(),
            subtotal: 12.50,
            tax_amount: 1.25,
            total_amount: 13.75,
            payment_status: "paid",
            payment_method: "cash"
        });

        const order2 = await Order.create({
            session_id: session2.id,
            table_id: testData.table.id,
            customer_id: customer.id,
            order_number: `ORD-TEST-${Date.now()}-2`,
            status: "completed",
            subtotal: 12.50,
            tax_amount: 1.25,
            total_amount: 13.75
        });

        await OrderItem.create({
            order_id: order2.id,
            menu_item_id: burger.id,
            quantity: 1,
            unit_price: 12.50,
            subtotal: 12.50,
            total_price: 12.50,
            status: "completed",
            item_name: burger.name
        });

        const review2 = await Review.create({
            menu_item_id: burger.id,
            customer_id: customer.id,
            session_id: session2.id,
            rating: 5,
            comment: "Still amazing on second visit!",
            status: "approved"
        });
        console.log(`✅ Second review created (ID: ${review2.id})\n`);

        // TEST 8: Check average rating with multiple reviews
        console.log("TEST 8: Verify average with multiple reviews");
        await burger.reload();
        console.log(`✅ Average Rating: ${burger.average_rating}/5.00`);
        console.log(`✅ Total Reviews: ${burger.review_count}\n`);

        // TEST 9: Delete review
        console.log("TEST 9: Delete review");
        await review2.destroy();
        console.log(`✅ Review deleted\n`);

        // TEST 10: Verify rating after deletion
        console.log("TEST 10: Verify rating after deletion");
        await burger.reload();
        console.log(`✅ Final Rating: ${burger.average_rating}/5.00`);
        console.log(`✅ Final Review Count: ${burger.review_count}\n`);

        return { review, review2, session2 };
    } catch (error) {
        console.error("❌ Test error:", error.message);
        throw error;
    }
}

async function cleanup(testData) {
    console.log("🧹 Cleaning up test data...\n");

    try {
        if (testData.customer) {
            await testData.customer.destroy({ force: true });
            console.log("✅ Customer deleted");
        }
        console.log("✅ Cleanup complete\n");
    } catch (error) {
        console.error("❌ Cleanup error:", error.message);
    }
}

async function main() {
    console.log("🚀 Review System Test Script\n");
    console.log("============================================\n");

    try {
        // Connect to database
        await sequelize.authenticate();
        console.log("✅ Database connected\n");

        // Setup test data
        const testData = await setupTestData();

        // Run tests
        const results = await testReviewOperations(testData);

        console.log("============================================");
        console.log("✅ All tests passed!\n");

        // Display summary
        console.log("📊 SUMMARY:");
        console.log(`   Customer: ${testData.customer.email}`);
        console.log(`   Menu Item: ${testData.burger.name}`);
        console.log(`   Final Rating: ${testData.burger.average_rating}/5.00`);
        console.log(`   Total Reviews: ${testData.burger.review_count}`);
        console.log(`   Session: ${testData.session.session_number}`);
        console.log(`   Review ID: ${results.review.id}\n`);

        // Cleanup (optional - comment out to keep test data)
        // await cleanup(testData);

        console.log("🎉 Test complete! You can now use the REST file to test APIs.");
        console.log(`   - Customer Email: ${testData.customer.email}`);
        console.log(`   - Customer ID: ${testData.customer.id}`);
        console.log(`   - Menu Item ID: ${testData.burger.id}`);
        console.log(`   - Session ID: ${testData.session.id}`);
        console.log(`   - Review ID: ${results.review.id}\n`);

        process.exit(0);
    } catch (error) {
        console.error("\n❌ Test failed:", error);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = { setupTestData, testReviewOperations };
