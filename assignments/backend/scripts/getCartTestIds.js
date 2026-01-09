require("dotenv").config({ path: "./config.env" });
const sequelize = require("../config/database");
const MenuItem = require("../models/MenuItem");
const ModifierOption = require("../models/ModifierOption");
const ModifierGroup = require("../models/ModifierGroup");

const getTestIds = async () => {
    try {
        console.log("🔍 Fetching existing test data IDs...\n");

        // Get menu items
        const items = await MenuItem.findAll({
            where: { status: "available" },
            limit: 10,
            order: [["created_at", "DESC"]],
        });

        // Get modifier options
        const modifiers = await ModifierOption.findAll({
            where: { status: "active" },
            limit: 10,
            order: [["created_at", "DESC"]],
        });

        if (items.length === 0) {
            console.log("❌ No menu items found in database!");
            console.log("   Run: node scripts/seedCartTestData.js first\n");
            process.exit(1);
        }

        console.log("=".repeat(70));
        console.log("📋 AVAILABLE MENU ITEMS - Use these IDs in cart.rest:");
        console.log("=".repeat(70));
        items.forEach((item, index) => {
            console.log(`${(index + 1).toString().padStart(2, " ")}. ${item.name.padEnd(30)} - ${item.id}`);
            console.log(`    Price: ${parseInt(item.price).toLocaleString()}đ`);
        });

        console.log("\n" + "=".repeat(70));
        console.log("⚙️  AVAILABLE MODIFIER OPTIONS - Use these IDs:");
        console.log("=".repeat(70));
        modifiers.forEach((mod, index) => {
            console.log(`${(index + 1).toString().padStart(2, " ")}. ${mod.name.padEnd(20)} - ${mod.id}`);
            if (parseFloat(mod.price_adjustment) > 0) {
                console.log(`    Price: +${parseInt(mod.price_adjustment).toLocaleString()}đ`);
            }
        });

        console.log("\n" + "=".repeat(70));
        console.log("💡 SAMPLE CART REQUEST:");
        console.log("=".repeat(70));
        
        if (items.length >= 2 && modifiers.length >= 2) {
            console.log(`
POST http://localhost:3000/api/cart/summary
Content-Type: application/json

{
  "items": [
    {
      "menu_item_id": "${items[0].id}",
      "quantity": 2,
      "special_instructions": "Không hành",
      "modifiers": [
        {
          "modifier_option_id": "${modifiers[0].id}",
          "quantity": 1
        }
      ]
    },
    {
      "menu_item_id": "${items[1].id}",
      "quantity": 1,
      "modifiers": []
    }
  ]
}
`);
        }

        console.log("=".repeat(70));
        console.log("✅ Ready to test! Copy the IDs above to cart.rest");
        console.log("=".repeat(70));

        process.exit(0);
    } catch (error) {
        console.error("\n❌ Error fetching IDs:", error.message);
        process.exit(1);
    }
};

getTestIds();
