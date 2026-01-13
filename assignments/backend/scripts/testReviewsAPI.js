/**
 * Review System API Tests
 * Automated testing script for all review endpoints
 * Run: node scripts/testReviewsAPI.js
 */

require('dotenv').config({ path: './config.env' });

const axios = require('axios');
const bcrypt = require('bcrypt');

const BASE_URL = 'http://localhost:3000/api';
const sequelize = require('../config/database');
const User = require('../models/User');
const MenuItem = require('../models/MenuItem');
const MenuCategory = require('../models/MenuCategory');
const Table = require('../models/Table');
const TableSession = require('../models/TableSession');
const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const Review = require('../models/Review');

let testData = {};
let testResults = {
    passed: 0,
    failed: 0,
    tests: []
};

// Helper function to log test results
function logTest(name, passed, message = '') {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status}: ${name}${message ? ' - ' + message : ''}`);
    testResults.tests.push({ name, passed, message });
    if (passed) testResults.passed++;
    else testResults.failed++;
}

// Helper function to make API calls
async function apiCall(method, endpoint, data = null, token = null) {
    try {
        const config = {
            method,
            url: `${BASE_URL}${endpoint}`,
            headers: {
                'Content-Type': 'application/json'
            }
        };
        
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        
        if (data) {
            config.data = data;
        }
        
        const response = await axios(config);
        return { success: true, data: response.data, status: response.status };
    } catch (error) {
        return {
            success: false,
            error: error.response?.data?.message || error.message,
            status: error.response?.status
        };
    }
}

// Setup test data
async function setupTestData() {
    console.log('\n📦 Setting up test data...\n');
    
    try {
        // Create customer
        const hashedPassword = await bcrypt.hash('password123', 10);
        const customer = await User.create({
            email: `customer_review_${Date.now()}@test.com`,
            password: hashedPassword,
            firstName: 'Review',
            lastName: 'Tester',
            role: 'customer',
            phone: '0901234567'
        });
        testData.customer = customer;
        console.log('✅ Created test customer:', customer.email);
        
        // Create admin
        const admin = await User.create({
            email: `admin_review_${Date.now()}@test.com`,
            password: hashedPassword,
            firstName: 'Admin',
            lastName: 'Tester',
            role: 'admin',
            phone: '0901234568'
        });
        testData.admin = admin;
        console.log('✅ Created test admin:', admin.email);
        
        // Use existing category or create new one
        let category = await MenuCategory.findOne({ where: { status: 'active' } });
        if (!category) {
            throw new Error('No active category found. Please create a category first in the database.');
        }
        testData.category = category;
        console.log('✅ Using existing category:', category.name);
        
        // Create menu items
        const item1 = await MenuItem.create({
            name: `Test Burger Deluxe ${Date.now()}`,
            description: 'A delicious test burger',
            price: 15.99,
            category_id: category.id,
            prep_time_minutes: 15,
            status: 'available',
            is_chef_recommended: false,
            is_deleted: false
        });
        testData.item1 = item1;
        
        const item2 = await MenuItem.create({
            name: `Test Pizza ${Date.now()}`,
            description: 'A tasty test pizza',
            price: 12.99,
            category_id: category.id,
            prep_time_minutes: 20,
            status: 'available',
            is_chef_recommended: false,
            is_deleted: false
        });
        testData.item2 = item2;
        console.log('✅ Created 2 test menu items');
        
        // Use existing table or create new one
        let table = await Table.findOne({ where: { status: 'active' } });
        if (!table) {
            table = await Table.create({
                table_number: 999,
                capacity: 4,
                location: 'Test Area',
                status: 'active'
            });
        }
        testData.table = table;
        console.log('✅ Using table:', table.table_number);
        
        // Create completed session
        const session = await TableSession.create({
            session_number: `TEST-${Date.now()}`,
            table_id: table.id,
            customer_id: customer.id,
            status: 'completed',
            started_at: new Date(Date.now() - 3600000), // 1 hour ago
            completed_at: new Date(),
            subtotal: 28.98,
            total_amount: 28.98,
            payment_status: 'paid'
        });
        testData.session = session;
        console.log('✅ Created completed session');
        
        // Create order with items
        const order = await Order.create({
            table_id: table.id,
            session_id: session.id,
            customer_id: customer.id,
            order_number: `TEST-${Date.now()}`,
            status: 'completed',
            total_amount: 28.98
        });
        testData.order = order;
        
        const orderItem1 = await OrderItem.create({
            order_id: order.id,
            menu_item_id: item1.id,
            quantity: 1,
            unit_price: 15.99,
            subtotal: 15.99,
            status: 'completed'
        });
        
        const orderItem2 = await OrderItem.create({
            order_id: order.id,
            menu_item_id: item2.id,
            quantity: 1,
            unit_price: 12.99,
            subtotal: 12.99,
            status: 'completed'
        });
        console.log('✅ Created order with 2 items');
        
        // Login to get tokens
        const customerLogin = await apiCall('POST', '/auth/login', {
            email: customer.email,
            password: 'password123'
        });
        testData.customerToken = customerLogin.data.token;
        
        const adminLogin = await apiCall('POST', '/auth/login', {
            email: admin.email,
            password: 'password123'
        });
        testData.adminToken = adminLogin.data.token;
        console.log('✅ Got authentication tokens');
        
        console.log('\n✅ Test data setup complete!\n');
        return true;
    } catch (error) {
        console.error('❌ Setup failed:', error.message);
        return false;
    }
}

// Test 1: Public endpoints
async function testPublicEndpoints() {
    console.log('\n📋 Testing PUBLIC ENDPOINTS...\n');
    
    // 1.1 Get reviews (empty initially)
    const result1 = await apiCall('GET', `/menu-items/${testData.item1.id}/reviews`);
    logTest('Get reviews for item', result1.success && result1.data.success);
    
    // 1.2 Get reviews with pagination
    const result2 = await apiCall('GET', `/menu-items/${testData.item1.id}/reviews?page=1&limit=5`);
    logTest('Get reviews with pagination', result2.success);
    
    // 1.3 Get reviews sorted by highest
    const result3 = await apiCall('GET', `/menu-items/${testData.item1.id}/reviews?sort=highest`);
    logTest('Get reviews sorted by highest', result3.success);
    
    // 1.4 Get reviews sorted by lowest
    const result4 = await apiCall('GET', `/menu-items/${testData.item1.id}/reviews?sort=lowest`);
    logTest('Get reviews sorted by lowest', result4.success);
    
    // 1.5 Get reviews sorted by helpful
    const result5 = await apiCall('GET', `/menu-items/${testData.item1.id}/reviews?sort=helpful`);
    logTest('Get reviews sorted by helpful', result5.success);
    
    // 1.6 Get reviews for non-existent item (should fail gracefully)
    const result6 = await apiCall('GET', '/menu-items/00000000-0000-0000-0000-000000000000/reviews');
    logTest('Get reviews for non-existent item', result6.status === 404);
}

// Test 2: Customer endpoints - Create review
async function testCreateReview() {
    console.log('\n📋 Testing CREATE REVIEW...\n');
    
    // 2.1 Create review with 5 stars
    const result1 = await apiCall(
        'POST',
        `/sessions/${testData.session.id}/items/${testData.item1.id}/review`,
        { rating: 5, comment: 'Excellent burger!' },
        testData.customerToken
    );
    logTest('Create review (5 stars with comment)', result1.success);
    if (result1.success) {
        testData.review1 = result1.data.data;
    }
    
    // 2.2 Create review with rating only
    const result2 = await apiCall(
        'POST',
        `/sessions/${testData.session.id}/items/${testData.item2.id}/review`,
        { rating: 4 },
        testData.customerToken
    );
    logTest('Create review (rating only)', result2.success);
    if (result2.success) {
        testData.review2 = result2.data.data;
    }
    
    // 2.3 Try to create duplicate review (should fail)
    const result3 = await apiCall(
        'POST',
        `/sessions/${testData.session.id}/items/${testData.item1.id}/review`,
        { rating: 3, comment: 'Duplicate test' },
        testData.customerToken
    );
    logTest('Prevent duplicate review', !result3.success && result3.status === 400);
    
    // 2.4 Create review with invalid rating (should fail)
    const result4 = await apiCall(
        'POST',
        `/sessions/${testData.session.id}/items/${testData.item1.id}/review`,
        { rating: 6, comment: 'Invalid rating' },
        testData.customerToken
    );
    logTest('Reject invalid rating (>5)', !result4.success && result4.status === 400);
    
    // 2.5 Create review with invalid rating (should fail)
    const result5 = await apiCall(
        'POST',
        `/sessions/${testData.session.id}/items/${testData.item1.id}/review`,
        { rating: 0, comment: 'Invalid rating' },
        testData.customerToken
    );
    logTest('Reject invalid rating (<1)', !result5.success && result5.status === 400);
    
    // 2.6 Create review without rating (should fail)
    const result6 = await apiCall(
        'POST',
        `/sessions/${testData.session.id}/items/${testData.item1.id}/review`,
        { comment: 'No rating' },
        testData.customerToken
    );
    logTest('Reject missing rating', !result6.success && result6.status === 400);
}

// Test 3: Get reviewable sessions
async function testGetReviewableSessions() {
    console.log('\n📋 Testing GET REVIEWABLE SESSIONS...\n');
    
    const result = await apiCall('GET', '/reviews/reviewable-sessions', null, testData.customerToken);
    logTest('Get reviewable sessions', result.success);
    
    if (result.success) {
        const sessions = result.data.data;
        const hasSession = sessions.some(s => s.id === testData.session.id);
        logTest('Session appears in reviewable list', hasSession);
        
        if (sessions.length > 0) {
            const firstSession = sessions[0];
            const hasReviewedFlag = firstSession.orders[0]?.items[0]?.hasOwnProperty('reviewed');
            logTest('Items have "reviewed" flag', hasReviewedFlag);
        }
    }
}

// Test 4: Get my reviews
async function testGetMyReviews() {
    console.log('\n📋 Testing GET MY REVIEWS...\n');
    
    const result = await apiCall('GET', '/reviews/my-reviews', null, testData.customerToken);
    logTest('Get my reviews', result.success);
    
    if (result.success) {
        const reviews = result.data.data;
        logTest('Reviews list returned', Array.isArray(reviews));
        logTest('Created reviews appear in list', reviews.length >= 2);
    }
}

// Test 5: Update review
async function testUpdateReview() {
    console.log('\n📋 Testing UPDATE REVIEW...\n');
    
    if (!testData.review1) {
        console.log('⚠️  No review to update, skipping...');
        return;
    }
    
    // 5.1 Update rating and comment
    const result1 = await apiCall(
        'PUT',
        `/reviews/${testData.review1.id}`,
        { rating: 4, comment: 'Updated: Still good but not perfect' },
        testData.customerToken
    );
    logTest('Update review (rating + comment)', result1.success);
    
    // 5.2 Update rating only
    const result2 = await apiCall(
        'PUT',
        `/reviews/${testData.review1.id}`,
        { rating: 5 },
        testData.customerToken
    );
    logTest('Update review (rating only)', result2.success);
    
    // 5.3 Update comment only
    const result3 = await apiCall(
        'PUT',
        `/reviews/${testData.review1.id}`,
        { comment: 'Updated comment only' },
        testData.customerToken
    );
    logTest('Update review (comment only)', result3.success);
    
    // 5.4 Try to update with invalid rating
    const result4 = await apiCall(
        'PUT',
        `/reviews/${testData.review1.id}`,
        { rating: 10 },
        testData.customerToken
    );
    logTest('Reject invalid rating on update', !result4.success && result4.status === 403);
    
    // 5.5 Try to update non-existent review
    const result5 = await apiCall(
        'PUT',
        '/reviews/00000000-0000-0000-0000-000000000000',
        { rating: 5 },
        testData.customerToken
    );
    logTest('Reject update of non-existent review', !result5.success && result5.status === 404);
}

// Test 6: Delete review
async function testDeleteReview() {
    console.log('\n📋 Testing DELETE REVIEW...\n');
    
    if (!testData.review2) {
        console.log('⚠️  No review to delete, skipping...');
        return;
    }
    
    // 6.1 Customer deletes own review
    const result1 = await apiCall(
        'DELETE',
        `/reviews/${testData.review2.id}`,
        null,
        testData.customerToken
    );
    logTest('Delete own review (customer)', result1.success);
    
    // 6.2 Try to delete already deleted review
    const result2 = await apiCall(
        'DELETE',
        `/reviews/${testData.review2.id}`,
        null,
        testData.customerToken
    );
    logTest('Cannot delete already deleted review', !result2.success && result2.status === 404);
    
    // 6.3 Admin deletes any review
    if (testData.review1) {
        const result3 = await apiCall(
            'DELETE',
            `/reviews/${testData.review1.id}`,
            null,
            testData.adminToken
        );
        logTest('Admin can delete any review', result3.success);
    }
}

// Test 7: Verify public reviews after operations
async function testVerifyPublicReviews() {
    console.log('\n📋 Testing VERIFY PUBLIC REVIEWS...\n');
    
    const result = await apiCall('GET', `/menu-items/${testData.item1.id}/reviews`);
    logTest('Get reviews after CRUD operations', result.success);
    
    if (result.success) {
        const reviews = result.data.data.reviews;
        logTest('Reviews data structure correct', Array.isArray(reviews));
        
        if (reviews.length > 0) {
            const review = reviews[0];
            logTest('Review has customer info', review.customer !== undefined);
            logTest('Review has rating', review.rating !== undefined);
            logTest('Review has helpful_count', review.helpful_count !== undefined);
        }
    }
}

// Test 8: Authorization tests
async function testAuthorization() {
    console.log('\n📋 Testing AUTHORIZATION...\n');
    
    // 8.1 Try to create review without token
    const result1 = await apiCall(
        'POST',
        `/sessions/${testData.session.id}/items/${testData.item1.id}/review`,
        { rating: 5 }
    );
    logTest('Reject create review without auth', !result1.success && result1.status === 401);
    
    // 8.2 Try to get reviewable sessions without token
    const result2 = await apiCall('GET', '/reviews/reviewable-sessions');
    logTest('Reject reviewable sessions without auth', !result2.success && result2.status === 401);
    
    // 8.3 Try to update review without token
    const result3 = await apiCall(
        'PUT',
        '/reviews/00000000-0000-0000-0000-000000000000',
        { rating: 5 }
    );
    logTest('Reject update review without auth', !result3.success && result3.status === 401);
    
    // 8.4 Try to delete review without token
    const result4 = await apiCall('DELETE', '/reviews/00000000-0000-0000-0000-000000000000');
    logTest('Reject delete review without auth', !result4.success && result4.status === 401);
}

// Cleanup function
async function cleanup() {
    console.log('\n🧹 Cleaning up test data...\n');
    
    try {
        // Delete reviews
        await Review.destroy({ where: { customer_id: testData.customer.id }, force: true });
        
        // Delete order items and orders
        await OrderItem.destroy({ where: { order_id: testData.order.id }, force: true });
        await Order.destroy({ where: { id: testData.order.id }, force: true });
        
        // Delete session
        await TableSession.destroy({ where: { id: testData.session.id }, force: true });
        
        // Note: Don't delete table - it was existing or may be used by others
        
        // Delete menu items
        await MenuItem.destroy({ where: { id: [testData.item1.id, testData.item2.id] }, force: true });
        
        // Note: Don't delete category - it was existing
        
        // Delete users
        await User.destroy({ where: { id: testData.customer.id }, force: true });
        await User.destroy({ where: { id: testData.admin.id }, force: true });
        
        console.log('✅ Cleanup complete!');
    } catch (error) {
        console.error('❌ Cleanup error:', error.message);
    }
}

// Print summary
function printSummary() {
    console.log('\n' + '='.repeat(50));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(50));
    console.log(`Total Tests: ${testResults.passed + testResults.failed}`);
    console.log(`✅ Passed: ${testResults.passed}`);
    console.log(`❌ Failed: ${testResults.failed}`);
    console.log(`Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(2)}%`);
    console.log('='.repeat(50));
    
    if (testResults.failed > 0) {
        console.log('\n❌ Failed Tests:');
        testResults.tests
            .filter(t => !t.passed)
            .forEach(t => console.log(`  - ${t.name}${t.message ? ': ' + t.message : ''}`));
    }
}

// Main function
async function runTests() {
    console.log('\n' + '='.repeat(50));
    console.log('🧪 REVIEW SYSTEM API TESTS');
    console.log('='.repeat(50));
    
    try {
        // Connect to database
        await sequelize.authenticate();
        console.log('✅ Database connected');
        
        // Setup
        const setupSuccess = await setupTestData();
        if (!setupSuccess) {
            console.error('❌ Setup failed, aborting tests');
            process.exit(1);
        }
        
        // Run tests
        await testPublicEndpoints();
        await testCreateReview();
        await testGetReviewableSessions();
        await testGetMyReviews();
        await testUpdateReview();
        await testDeleteReview();
        await testVerifyPublicReviews();
        await testAuthorization();
        
        // Print summary
        printSummary();
        
        // Cleanup
        await cleanup();
        
        // Exit
        await sequelize.close();
        process.exit(testResults.failed > 0 ? 1 : 0);
        
    } catch (error) {
        console.error('\n❌ Test execution error:', error);
        await sequelize.close();
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    runTests();
}

module.exports = { runTests };
