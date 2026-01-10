/**
 * WebSocket Configuration with Socket.IO
 * Handles real-time communication for:
 * - Kitchen: New orders, order updates
 * - Customer: Order status tracking
 * - Waiter: Ready notifications
 */

const { Server } = require('socket.io');

let io;

/**
 * Initialize Socket.IO server
 * @param {http.Server} server - HTTP server instance
 * @returns {Server} Socket.IO server instance
 */
function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || '*',
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
      credentials: true
    },
    transports: ['websocket', 'polling']
  });

  console.log('🔌 Socket.IO initialized');

  // ============================================
  // CUSTOMER NAMESPACE - Order tracking
  // ============================================
  const customerNamespace = io.of('/customer');
  
  customerNamespace.on('connection', (socket) => {
    console.log(`✅ Customer connected: ${socket.id}`);

    // Join table room for order updates
    socket.on('join-table', (tableId) => {
      if (!tableId) {
        socket.emit('error', { message: 'Table ID required' });
        return;
      }
      
      socket.join(`table-${tableId}`);
      console.log(`👤 Customer joined room: table-${tableId}`);
      
      socket.emit('joined-table', { 
        tableId, 
        message: 'Connected to table updates' 
      });
    });

    // Leave table room
    socket.on('leave-table', (tableId) => {
      socket.leave(`table-${tableId}`);
      console.log(`👋 Customer left room: table-${tableId}`);
    });

    socket.on('disconnect', () => {
      console.log(`❌ Customer disconnected: ${socket.id}`);
    });

    socket.on('error', (error) => {
      console.error('Customer socket error:', error);
    });
  });

  // ============================================
  // KITCHEN NAMESPACE - New orders and updates
  // ============================================
  const kitchenNamespace = io.of('/kitchen');
  
  kitchenNamespace.on('connection', (socket) => {
    console.log(`✅ Kitchen connected: ${socket.id}`);

    // Join kitchen room
    socket.join('kitchen');
    console.log('🍳 Kitchen joined global kitchen room');

    socket.emit('connected', { 
      message: 'Connected to kitchen display',
      room: 'kitchen'
    });

    // Kitchen can filter by status
    socket.on('filter-by-status', (status) => {
      socket.join(`kitchen-${status}`);
      console.log(`🔍 Kitchen filtering: ${status}`);
    });

    socket.on('disconnect', () => {
      console.log(`❌ Kitchen disconnected: ${socket.id}`);
    });

    socket.on('error', (error) => {
      console.error('Kitchen socket error:', error);
    });
  });

  // ============================================
  // WAITER NAMESPACE - Ready notifications
  // ============================================
  const waiterNamespace = io.of('/waiter');
  
  waiterNamespace.on('connection', (socket) => {
    console.log(`✅ Waiter connected: ${socket.id}`);

    // Join waiter room
    socket.join('waiter');
    console.log('👨‍🍳 Waiter joined global waiter room');

    socket.emit('connected', { 
      message: 'Connected to waiter dashboard',
      room: 'waiter'
    });

    // Waiter can join specific table rooms
    socket.on('watch-table', (tableId) => {
      socket.join(`waiter-table-${tableId}`);
      console.log(`👀 Waiter watching table-${tableId}`);
    });

    socket.on('unwatch-table', (tableId) => {
      socket.leave(`waiter-table-${tableId}`);
      console.log(`👋 Waiter unwatching table-${tableId}`);
    });

    socket.on('disconnect', () => {
      console.log(`❌ Waiter disconnected: ${socket.id}`);
    });

    socket.on('error', (error) => {
      console.error('Waiter socket error:', error);
    });
  });

  // ============================================
  // ADMIN NAMESPACE - System monitoring
  // ============================================
  const adminNamespace = io.of('/admin');
  
  adminNamespace.on('connection', (socket) => {
    console.log(`✅ Admin connected: ${socket.id}`);

    socket.join('admin');
    
    socket.emit('connected', { 
      message: 'Connected to admin dashboard',
      stats: {
        customers: customerNamespace.sockets.size,
        kitchen: kitchenNamespace.sockets.size,
        waiters: waiterNamespace.sockets.size
      }
    });

    socket.on('disconnect', () => {
      console.log(`❌ Admin disconnected: ${socket.id}`);
    });
  });

  return io;
}

/**
 * Get Socket.IO instance
 * @returns {Server} Socket.IO server instance
 */
function getIO() {
  if (!io) {
    throw new Error('Socket.IO not initialized! Call initSocket() first.');
  }
  return io;
}

/**
 * Emit new order to kitchen AND waiter
 * @param {Object} orderData - Order details
 */
function emitNewOrder(orderData) {
  try {
    const io = getIO();
    const eventData = {
      orderId: orderData.id,
      orderNumber: orderData.orderNumber,
      tableNumber: orderData.tableNumber,
      tableId: orderData.tableId,
      items: orderData.items,
      specialInstructions: orderData.specialInstructions,
      totalAmount: orderData.totalAmount,
      status: orderData.status,
      createdAt: orderData.createdAt,
      priority: orderData.priority || 'normal'
    };
    
    // Emit to kitchen
    io.of('/kitchen').to('kitchen').emit('new-order', eventData);
    console.log(`📢 Emitted new-order to kitchen: Order #${orderData.orderNumber}`);
    
    // 🔥 ALSO emit to waiter for order management
    io.of('/waiter').to('waiter').emit('new-order', eventData);
    console.log(`📢 Emitted new-order to waiter: Order #${orderData.orderNumber}`);
    
    return true;
  } catch (error) {
    console.error('❌ Error emitting new-order:', error.message);
    return false;
  }
}

/**
 * Emit order status update to customer AND kitchen
 * @param {string} tableId - Table ID
 * @param {Object} orderData - Order status data
 */
function emitOrderStatusUpdate(tableId, orderData) {
  try {
    const io = getIO();
    const eventData = {
      orderId: orderData.id,
      orderNumber: orderData.orderNumber,
      status: orderData.status,
      previousStatus: orderData.previousStatus,
      updatedAt: new Date(),
      estimatedTime: orderData.estimatedTime
    };
    
    // Emit to customer
    io.of('/customer').to(`table-${tableId}`).emit('order-status-updated', eventData);
    
    // 🔥 ALSO emit to kitchen for real-time status updates
    io.of('/kitchen').to('kitchen').emit('order-status-updated', eventData);
    
    console.log(`📢 Emitted order-status-updated to table-${tableId} & kitchen: ${orderData.status}`);
    return true;
  } catch (error) {
    console.error('❌ Error emitting order-status-updated:', error.message);
    return false;
  }
}

/**
 * Emit order ready notification to waiter
 * @param {Object} orderData - Order details
 */
function emitOrderReady(orderData) {
  try {
    const io = getIO();
    
    // Notify all waiters
    io.of('/waiter').to('waiter').emit('order-ready', {
      orderId: orderData.id,
      orderNumber: orderData.orderNumber,
      tableNumber: orderData.tableNumber,
      tableId: orderData.tableId,
      itemCount: orderData.itemCount,
      readyAt: new Date()
    });
    
    // Also notify customer
    io.of('/customer').to(`table-${orderData.tableId}`).emit('order-ready', {
      orderId: orderData.id,
      orderNumber: orderData.orderNumber,
      message: 'Your order is ready! 🎉',
      readyAt: new Date()
    });
    
    console.log(`📢 Emitted order-ready: Order #${orderData.orderNumber} for Table ${orderData.tableNumber}`);
    return true;
  } catch (error) {
    console.error('❌ Error emitting order-ready:', error.message);
    return false;
  }
}

/**
 * Emit order item status update
 * @param {string} tableId - Table ID
 * @param {Object} itemData - Item status data
 */
function emitItemStatusUpdate(tableId, itemData) {
  try {
    const io = getIO();
    io.of('/customer').to(`table-${tableId}`).emit('item-status-updated', {
      itemId: itemData.id,
      orderId: itemData.orderId,
      orderNumber: itemData.orderNumber,
      menuItemName: itemData.menuItemName,
      quantity: itemData.quantity,
      status: itemData.status,
      previousStatus: itemData.previousStatus,
      updatedAt: new Date()
    });
    
    console.log(`📢 Emitted item-status-updated to table-${tableId}: ${itemData.menuItemName} → ${itemData.status}`);
    return true;
  } catch (error) {
    console.error('❌ Error emitting item-status-updated:', error.message);
    return false;
  }
}

/**
 * Emit session completed to customer
 * @param {string} tableId - Table ID
 * @param {Object} sessionData - Session data
 */
function emitSessionCompleted(tableId, sessionData) {
  try {
    const io = getIO();
    io.of('/customer').to(`table-${tableId}`).emit('session-completed', {
      sessionId: sessionData.id,
      tableNumber: sessionData.tableNumber,
      totalAmount: sessionData.totalAmount,
      paymentStatus: sessionData.paymentStatus,
      completedAt: new Date(),
      message: 'Thank you for dining with us! 🙏'
    });
    
    console.log(`📢 Emitted session-completed to table-${tableId}`);
    return true;
  } catch (error) {
    console.error('❌ Error emitting session-completed:', error.message);
    return false;
  }
}

/**
 * Emit order rejected notification
 * @param {string} tableId - Table ID
 * @param {Object} orderData - Order rejection data
 */
function emitOrderRejected(tableId, orderData) {
  try {
    const io = getIO();
    io.of('/customer').to(`table-${tableId}`).emit('order-rejected', {
      orderId: orderData.id,
      orderNumber: orderData.orderNumber,
      reason: orderData.rejectionReason,
      rejectedAt: new Date(),
      message: 'We apologize, but your order has been rejected.'
    });
    
    console.log(`📢 Emitted order-rejected to table-${tableId}: ${orderData.rejectionReason}`);
    return true;
  } catch (error) {
    console.error('❌ Error emitting order-rejected:', error.message);
    return false;
  }
}

/**
 * Broadcast system message to all clients
 * @param {string} namespace - Namespace to broadcast to
 * @param {string} event - Event name
 * @param {Object} data - Event data
 */
function broadcast(namespace, event, data) {
  try {
    const io = getIO();
    io.of(`/${namespace}`).emit(event, data);
    console.log(`📢 Broadcasted ${event} to ${namespace}`);
    return true;
  } catch (error) {
    console.error(`❌ Error broadcasting to ${namespace}:`, error.message);
    return false;
  }
}

/**
 * Get connection statistics
 * @returns {Object} Connection stats
 */
function getStats() {
  try {
    const io = getIO();
    return {
      customers: io.of('/customer').sockets.size,
      kitchen: io.of('/kitchen').sockets.size,
      waiters: io.of('/waiter').sockets.size,
      admin: io.of('/admin').sockets.size,
      total: io.of('/customer').sockets.size + 
             io.of('/kitchen').sockets.size + 
             io.of('/waiter').sockets.size +
             io.of('/admin').sockets.size
    };
  } catch (error) {
    console.error('❌ Error getting stats:', error.message);
    return null;
  }
}

module.exports = {
  initSocket,
  getIO,
  emitNewOrder,
  emitOrderStatusUpdate,
  emitOrderReady,
  emitItemStatusUpdate,
  emitSessionCompleted,
  emitOrderRejected,
  broadcast,
  getStats
};
