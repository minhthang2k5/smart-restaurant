require("dotenv").config({ path: "./config.env" });
const sequelize = require("../config/database");

const getTestIds = async () => {
    try {
        const [results] = await sequelize.query(`
            SELECT 
                (SELECT id FROM menu_items WHERE status = 'available' LIMIT 1) as menu_item_id,
                (SELECT id FROM table_sessions WHERE status = 'completed' ORDER BY completed_at DESC LIMIT 1) as session_id,
                (SELECT id FROM users WHERE role = 'customer' LIMIT 1) as customer_id,
                (SELECT id FROM reviews ORDER BY created_at DESC LIMIT 1) as review_id
        `);

        const data = results[0];
        
        console.log("\n" + "=".repeat(60));
        console.log("📋 COPY THESE VALUES TO review-test.rest (lines 10-12):");
        console.log("=".repeat(60));
        console.log(`@testMenuItemId = ${data.menu_item_id || 'NO_MENU_ITEMS_FOUND'}`);
        console.log(`@testSessionId = ${data.session_id || 'NO_COMPLETED_SESSIONS_FOUND'}`);
        console.log(`@testReviewId = ${data.review_id || 'NO_REVIEWS_YET'}`);
        console.log("=".repeat(60));
        console.log("\n🔑 CUSTOMER ID (for reviewRoutes.js fake user):");
        console.log(`   id: '${data.customer_id}',`);
        console.log("=".repeat(60));
        console.log("\n💡 Tips:");
        console.log("   - Auth is DISABLED, no need for tokens");
        console.log("   - If session not found, complete a session first");
        console.log("   - reviewId will appear after you create first review");
        console.log("=".repeat(60) + "\n");
        
        await sequelize.close();
        process.exit(0);
    } catch (error) {
        console.error("❌ Error:", error.message);
        process.exit(1);
    }
};

getTestIds();
