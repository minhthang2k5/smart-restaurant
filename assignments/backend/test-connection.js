require("dotenv").config();
const { Client } = require("pg");

console.log("\n========================================");
console.log("🔍 TESTING DATABASE CONNECTION");
console.log("========================================\n");

console.log("📋 Connection Info:");
console.log(`   Host:     ${process.env.DB_HOST}`);
console.log(`   Port:     ${process.env.DB_PORT}`);
console.log(`   Database: ${process.env.DB_NAME}`);
console.log(`   User:     ${process.env.DB_USER}`);
console.log(`   Password: ${"*".repeat(process.env.DB_PASS?.length || 0)}`);
console.log("\n========================================\n");

const client = new Client({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
});

async function testConnection() {
  try {
    console.log("⏳ Connecting to PostgreSQL...\n");

    await client.connect();

    console.log("✅ CONNECTION SUCCESSFUL!\n");

    const result = await client.query("SELECT version()");
    console.log("📊 PostgreSQL Version:");
    console.log(`   ${result.rows[0].version}\n`);

    console.log("========================================");
    console.log("🎉 DATABASE IS READY TO USE!");
    console.log("========================================\n");

    await client.end();
    process.exit(0);
  } catch (error) {
    console.error("❌ CONNECTION FAILED!\n");
    console.error("Error Details:", error.message);
    console.error("\n========================================");
    console.error("🔧 TROUBLESHOOTING:");
    console.error("========================================");
    console.error("1. Check PostgreSQL is running:");
    console.error("   → Open pgAdmin 4");
    console.error("   → Connect to PostgreSQL 16");
    console.error("\n2. Verify .env file:");
    console.error("   → DB_PASS must match PostgreSQL password");
    console.error("   → DB_NAME must be 'smart_restaurant'");
    console.error("\n3. Check database exists:");
    console.error("   → Open pgAdmin 4");
    console.error("   → Look for 'smart_restaurant' in Databases");
    console.error("========================================\n");

    process.exit(1);
  }
}

testConnection();
