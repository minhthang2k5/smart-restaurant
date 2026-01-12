require("dotenv").config({ path: "./config.env" });
const sequelize = require("../config/database");

const sessionId = '33a91087-23fe-4305-b4a1-8f178427f916';
const fakeCustomerId = 'd5a36762-d74f-47b9-820f-4393f0d903b5';

(async () => {
    try {
        // Check session details
        const [sessions] = await sequelize.query(`
            SELECT ts.id, ts.customer_id, ts.status, u.email
            FROM table_sessions ts
            LEFT JOIN users u ON ts.customer_id = u.id
            WHERE ts.id = $1
        `, { bind: [sessionId] });

        if (sessions.length === 0) {
            console.log('❌ Session not found!');
            process.exit(1);
        }

        const session = sessions[0];
        console.log('📋 SESSION INFO:');
        console.log('   ID:', session.id);
        console.log('   Customer:', session.customer_id, '(' + (session.email || 'NULL') + ')');
        console.log('   Status:', session.status);
        console.log('');

        // Check if matches fake customer
        console.log('🔑 FAKE CUSTOMER (from reviewRoutes.js):');
        console.log('   ID:', fakeCustomerId);
        console.log('');

        if (session.customer_id === fakeCustomerId) {
            console.log('✅ MATCH! Session belongs to fake customer');
        } else {
            console.log('❌ NO MATCH! Need to update fake customer ID');
            console.log('');
            console.log('🔧 FIX: Update reviewRoutes.js line 26:');
            console.log(`   id: '${session.customer_id}',`);
        }

        // Check items in this session
        const [items] = await sequelize.query(`
            SELECT oi.menu_item_id, mi.name
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.id
            JOIN menu_items mi ON oi.menu_item_id = mi.id
            WHERE o.session_id = $1
        `, { bind: [sessionId] });

        console.log('');
        console.log('🍽️  ITEMS IN SESSION:', items.length);
        items.forEach(item => {
            console.log('   -', item.name, '(' + item.menu_item_id + ')');
        });

        await sequelize.close();
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
})();
