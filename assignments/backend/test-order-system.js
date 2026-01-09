#!/usr/bin/env node
/**
 * Order System Automated Test Script
 * Tests state machine validation and order workflow
 * 
 * Usage:
 *   node test-order-system.js
 * 
 * Requirements:
 *   - Server must be running on http://localhost:3000
 *   - Database must have test data (table, menu items)
 */

const http = require('http');

// Configuration
const BASE_URL = 'http://localhost:3000';
const TEST_TABLE_ID = 'e184f588-458d-4aa2-95ca-4c26aa1e5d65'; // Update with your table ID
const TEST_MENU_ITEM_ID = 'aa80c2ea-10bd-4c91-a954-f2b6d545c43a'; // Update with your menu item ID

// Test results
const results = {
  passed: 0,
  failed: 0,
  errors: []
};

// Helper: Make HTTP request
function makeRequest(method, path, body = null, authToken = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port || 3000,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (authToken) {
      options.headers['Authorization'] = `Bearer ${authToken}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: { raw: data } });
        }
      });
    });

    req.on('error', reject);
    
    if (body) {
      req.write(JSON.stringify(body));
    }
    
    req.end();
  });
}

// Test assertions
function assert(condition, testName) {
  if (condition) {
    console.log(`✅ PASS: ${testName}`);
    results.passed++;
  } else {
    console.log(`❌ FAIL: ${testName}`);
    results.failed++;
    results.errors.push(testName);
  }
}

// Test suite
async function runTests() {
  console.log('🚀 Starting Order System Tests\n');
  console.log('=' .repeat(60));

  let sessionId, orderId, orderItemId;

  // ===== Test 1: Create Session =====
  console.log('\n📋 Test 1: Session Creation');
  try {
    const res = await makeRequest('POST', '/api/sessions', {
      tableId: TEST_TABLE_ID
    });
    
    assert(res.status === 201, 'Session created with status 201');
    assert(res.data.success === true, 'Session response has success=true');
    assert(res.data.data.id, 'Session has ID');
    assert(res.data.data.status === 'active', 'Session status is active');
    
    sessionId = res.data.data.id;
    console.log(`   Session ID: ${sessionId}`);
  } catch (error) {
    console.log(`❌ FAIL: Session creation - ${error.message}`);
    results.failed++;
  }

  // ===== Test 2: Create Order =====
  console.log('\n📋 Test 2: Create Order in Session');
  try {
    const res = await makeRequest('POST', `/api/sessions/${sessionId}/orders`, {
      items: [
        {
          menuItemId: TEST_MENU_ITEM_ID,
          quantity: 2,
          specialInstructions: 'Test order'
        }
      ]
    });
    
    assert(res.status === 201, 'Order created with status 201');
    assert(res.data.success === true, 'Order response has success=true');
    assert(res.data.data.status === 'pending', 'Order status is pending');
    assert(res.data.data.items.length > 0, 'Order has items');
    
    orderId = res.data.data.id;
    orderItemId = res.data.data.items[0].id;
    console.log(`   Order ID: ${orderId}`);
    console.log(`   Order Item ID: ${orderItemId}`);
  } catch (error) {
    console.log(`❌ FAIL: Order creation - ${error.message}`);
    results.failed++;
  }

  // ===== Test 3: Valid State Transitions =====
  console.log('\n📋 Test 3: Valid State Transitions');
  
  // 3.1: pending → accepted
  try {
    const res = await makeRequest('PATCH', `/api/orders/${orderId}/status`, {
      status: 'accepted'
    });
    assert(res.status === 200, 'pending → accepted (valid)');
    assert(res.data.data.status === 'accepted', 'Status updated to accepted');
  } catch (error) {
    console.log(`❌ FAIL: pending → accepted - ${error.message}`);
    results.failed++;
  }

  // 3.2: accepted → preparing
  try {
    const res = await makeRequest('PATCH', `/api/orders/${orderId}/status`, {
      status: 'preparing'
    });
    assert(res.status === 200, 'accepted → preparing (valid)');
    assert(res.data.data.status === 'preparing', 'Status updated to preparing');
  } catch (error) {
    console.log(`❌ FAIL: accepted → preparing - ${error.message}`);
    results.failed++;
  }

  // 3.3: preparing → ready
  try {
    const res = await makeRequest('PATCH', `/api/orders/${orderId}/status`, {
      status: 'ready'
    });
    assert(res.status === 200, 'preparing → ready (valid)');
    assert(res.data.data.status === 'ready', 'Status updated to ready');
  } catch (error) {
    console.log(`❌ FAIL: preparing → ready - ${error.message}`);
    results.failed++;
  }

  // 3.4: ready → served
  try {
    const res = await makeRequest('PATCH', `/api/orders/${orderId}/status`, {
      status: 'served'
    });
    assert(res.status === 200, 'ready → served (valid)');
    assert(res.data.data.status === 'served', 'Status updated to served');
  } catch (error) {
    console.log(`❌ FAIL: ready → served - ${error.message}`);
    results.failed++;
  }

  // 3.5: served → completed
  try {
    const res = await makeRequest('PATCH', `/api/orders/${orderId}/status`, {
      status: 'completed'
    });
    assert(res.status === 200, 'served → completed (valid)');
    assert(res.data.data.status === 'completed', 'Status updated to completed');
  } catch (error) {
    console.log(`❌ FAIL: served → completed - ${error.message}`);
    results.failed++;
  }

  // ===== Test 4: Invalid Transitions (Create new order) =====
  console.log('\n📋 Test 4: Invalid State Transitions (Should Fail)');
  
  // Create new order for invalid transition tests
  let testOrderId;
  try {
    const res = await makeRequest('POST', `/api/sessions/${sessionId}/orders`, {
      items: [{ menuItemId: TEST_MENU_ITEM_ID, quantity: 1 }]
    });
    testOrderId = res.data.data.id;
  } catch (error) {
    console.log(`❌ FAIL: Creating test order - ${error.message}`);
    results.failed++;
  }

  // 4.1: pending → completed (skip workflow)
  try {
    const res = await makeRequest('PATCH', `/api/orders/${testOrderId}/status`, {
      status: 'completed'
    });
    assert(res.status >= 400, 'pending → completed rejected with error status');
    assert(res.data.success === false, 'Response indicates failure');
  } catch (error) {
    console.log(`❌ FAIL: Invalid transition test - ${error.message}`);
    results.failed++;
  }

  // 4.2: pending → preparing (skip accepted)
  try {
    const res = await makeRequest('PATCH', `/api/orders/${testOrderId}/status`, {
      status: 'preparing'
    });
    assert(res.status >= 400, 'pending → preparing rejected');
  } catch (error) {
    console.log(`❌ FAIL: Invalid transition test - ${error.message}`);
    results.failed++;
  }

  // ===== Test 5: Terminal State Protection =====
  console.log('\n📋 Test 5: Terminal State Protection');
  
  // 5.1: Try to modify completed order
  try {
    const res = await makeRequest('PATCH', `/api/orders/${orderId}/status`, {
      status: 'pending'
    });
    assert(res.status >= 400, 'Cannot rollback completed order');
    assert(res.data.message.includes('terminal state') || 
           res.data.message.includes('Invalid transition'), 
           'Error message mentions terminal state');
  } catch (error) {
    console.log(`❌ FAIL: Terminal state test - ${error.message}`);
    results.failed++;
  }

  // ===== Test 6: Order Item Status =====
  console.log('\n📋 Test 6: Order Item Status Transitions');
  
  // Create new order with items
  let itemTestOrderId, itemTestId;
  try {
    const res = await makeRequest('POST', `/api/sessions/${sessionId}/orders`, {
      items: [{ menuItemId: TEST_MENU_ITEM_ID, quantity: 1 }]
    });
    itemTestOrderId = res.data.data.id;
    itemTestId = res.data.data.items[0].id;
    
    // Accept order first so items are confirmed
    await makeRequest('POST', `/api/orders/${itemTestOrderId}/accept`);
  } catch (error) {
    console.log(`❌ FAIL: Setup for item test - ${error.message}`);
    results.failed++;
  }

  // 6.1: confirmed → preparing (after order accepted)
  try {
    const res = await makeRequest('PATCH', `/api/orders/items/${itemTestId}/status`, {
      status: 'preparing'
    });
    assert(res.status === 200, 'Item: confirmed → preparing (valid)');
  } catch (error) {
    console.log(`❌ FAIL: Item transition test - ${error.message}`);
    results.failed++;
  }

  // 6.2: Invalid item transition
  try {
    const res = await makeRequest('PATCH', `/api/orders/items/${itemTestId}/status`, {
      status: 'confirmed'
    });
    assert(res.status >= 400, 'Item: preparing → confirmed rejected (rollback)');
  } catch (error) {
    console.log(`❌ FAIL: Invalid item transition test - ${error.message}`);
    results.failed++;
  }

  // ===== Test 7: Get Session Details =====
  console.log('\n📋 Test 7: Get Session Details');
  try {
    const res = await makeRequest('GET', `/api/sessions/${sessionId}`);
    assert(res.status === 200, 'Get session details successful');
    assert(res.data.data.orders.length >= 3, 'Session has multiple orders');
  } catch (error) {
    console.log(`❌ FAIL: Get session - ${error.message}`);
    results.failed++;
  }

  // ===== Test 8: Complete Session =====
  console.log('\n📋 Test 8: Complete Session');
  try {
    const res = await makeRequest('POST', `/api/sessions/${sessionId}/complete`, {
      paymentMethod: 'cash'
    });
    assert(res.status === 200, 'Session completed successfully');
    assert(res.data.data.status === 'completed', 'Session status is completed');
    assert(res.data.data.payment_status === 'paid', 'Payment status is paid');
  } catch (error) {
    console.log(`❌ FAIL: Complete session - ${error.message}`);
    results.failed++;
  }

  // ===== Print Results =====
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Test Results Summary');
  console.log(`   ✅ Passed: ${results.passed}`);
  console.log(`   ❌ Failed: ${results.failed}`);
  console.log(`   📈 Total:  ${results.passed + results.failed}`);
  console.log(`   🎯 Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);
  
  if (results.errors.length > 0) {
    console.log('\n❌ Failed Tests:');
    results.errors.forEach(err => console.log(`   - ${err}`));
  }

  console.log('\n' + '='.repeat(60));
  
  process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
console.log('⏳ Checking server connection...');
makeRequest('GET', '/api/sessions/table/' + TEST_TABLE_ID)
  .then(() => {
    console.log('✅ Server is running\n');
    return runTests();
  })
  .catch(error => {
    console.error('❌ Cannot connect to server. Please ensure:');
    console.error('   1. Server is running: npm start');
    console.error('   2. Server is on http://localhost:3000');
    console.error(`   Error: ${error.message}`);
    process.exit(1);
  });
