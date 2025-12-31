require("dotenv").config({ path: "./config.env" });
const sequelize = require("../config/database");

const getTestIds = async () => {
    try {
        const [results] = await sequelize.query(`
            SELECT 
                (SELECT id FROM tables LIMIT 1) as table_id,
                (SELECT id FROM menu_items LIMIT 1 OFFSET 0) as menu_item_1,
                (SELECT id FROM menu_items LIMIT 1 OFFSET 1) as menu_item_2,
                (SELECT id FROM modifier_options LIMIT 1) as modifier_option
        `);

        const data = results[0];
        
        console.log("\n" + "=".repeat(60));
        console.log("📋 COPY THESE VALUES TO orders.rest:");
        console.log("=".repeat(60));
        console.log(`@tableId = ${data.table_id || 'NO_TABLES'}`);
        console.log(`@menuItemId1 = ${data.menu_item_1 || 'NO_ITEMS'}`);
        console.log(`@menuItemId2 = ${data.menu_item_2 || 'NO_ITEMS'}`);
        console.log(`@modifierOptionId = ${data.modifier_option || 'NO_MODIFIERS'}`);
        console.log("@token = (not_needed - authentication disabled)");
        console.log("@orderId = (create via sessions.rest first)");
        console.log("@orderItemId = (create via sessions.rest first)");
        console.log("=".repeat(60));
        
        await sequelize.close();
        process.exit(0);
    } catch (error) {
        console.error("❌ Error:", error.message);
        process.exit(1);
    }
};

getTestIds();
