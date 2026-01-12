require('dotenv').config({ path: './config.env' });
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    port: parseInt(process.env.DB_PORT)
});

async function runMigration() {
    const migrationFile = path.join(__dirname, '../migrations/20260108_add_momo_payment_fields.sql');
    
    try {
        console.log('📋 Reading migration file...');
        const sql = fs.readFileSync(migrationFile, 'utf8');
        
        console.log('🚀 Running migration...');
        await pool.query(sql);
        
        console.log('✅ Migration completed successfully!');
        console.log('');
        console.log('Added columns to table_sessions:');
        console.log('  - momo_request_id');
        console.log('  - momo_order_id');
        console.log('  - momo_transaction_id');
        console.log('  - momo_payment_status');
        console.log('  - momo_payment_amount');
        console.log('  - momo_payment_time');
        console.log('  - momo_response_code');
        console.log('  - momo_signature');
        console.log('  - momo_extra_data');
        console.log('  - momo_error_message');
        console.log('  - momo_raw_response');
        
    } catch (error) {
        if (error.message.includes('already exists')) {
            console.log('ℹ️  Migration already applied (columns exist)');
        } else {
            console.error('❌ Migration failed:', error.message);
            process.exit(1);
        }
    } finally {
        await pool.end();
    }
}

runMigration();
