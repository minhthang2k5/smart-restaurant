/**
 * Link Modifiers to Existing Menu Items
 * Chạy script này để gắn modifier groups vào menu items đã tạo
 */

require("dotenv").config({ path: "./config.env" });
require("../models/associations");

const MenuItem = require("../models/MenuItem");
const ModifierGroup = require("../models/ModifierGroup");
const MenuItemModifierGroup = require("../models/MenuItemModifierGroup");

async function linkModifiers() {
    try {
        console.log("🔗 Linking Modifiers to Menu Items...\n");

        // 1. Lấy menu items
        const pho = await MenuItem.findOne({ where: { name: "Phở Bò Đặc Biệt" } });
        const comTam = await MenuItem.findOne({ where: { name: "Cơm Tấm Sườn" } });
        const bunBo = await MenuItem.findOne({ where: { name: "Bún Bò Huế" } });
        const caPhe = await MenuItem.findOne({ where: { name: "Cà Phê Sữa Đá" } });

        // 2. Lấy modifier groups
        const sizeGroup = await ModifierGroup.findOne({ where: { name: "Kích cỡ" } });
        const spicyGroup = await ModifierGroup.findOne({ where: { name: "Độ cay" } });
        const toppingsGroup = await ModifierGroup.findOne({ where: { name: "Topping thêm" } });
        const iceGroup = await ModifierGroup.findOne({ where: { name: "Đá" } });

        // Kiểm tra tất cả modifier groups
        const missingGroups = [];
        if (!sizeGroup) missingGroups.push("Kích cỡ");
        if (!spicyGroup) missingGroups.push("Độ cay");
        if (!toppingsGroup) missingGroups.push("Topping thêm");
        if (!iceGroup) missingGroups.push("Đá");

        if (missingGroups.length > 0) {
            console.log("❌ Không tìm thấy các modifier groups:");
            missingGroups.forEach(g => console.log(`   - ${g}`));
            console.log("\n💡 Chạy: node scripts/seedCartTestData.js trước");
            process.exit(1);
        }

        if (!pho) {
            console.log("❌ Không tìm thấy menu items cần thiết!");
            console.log("💡 Chạy: node scripts/seedCartTestData.js trước");
            process.exit(1);
        }

        // 3. Xóa links cũ (nếu có)
        await MenuItemModifierGroup.destroy({ where: {} });
        console.log("🗑️  Đã xóa links cũ\n");

        // 4. Tạo links mới
        let count = 0;

        // Phở Bò - Size + Spicy + Toppings
        if (pho) {
            await MenuItemModifierGroup.bulkCreate([
                { menu_item_id: pho.id, group_id: sizeGroup.id },
                { menu_item_id: pho.id, group_id: spicyGroup.id },
                { menu_item_id: pho.id, group_id: toppingsGroup.id },
            ]);
            console.log(`✅ ${pho.name} → Size, Spicy, Toppings`);
            count += 3;
        }

        // Cơm Tấm - Size + Toppings
        if (comTam) {
            await MenuItemModifierGroup.bulkCreate([
                { menu_item_id: comTam.id, group_id: sizeGroup.id },
                { menu_item_id: comTam.id, group_id: toppingsGroup.id },
            ]);
            console.log(`✅ ${comTam.name} → Size, Toppings`);
            count += 2;
        }

        // Bún Bò Huế - Size + Spicy + Toppings
        if (bunBo) {
            await MenuItemModifierGroup.bulkCreate([
                { menu_item_id: bunBo.id, group_id: sizeGroup.id },
                { menu_item_id: bunBo.id, group_id: spicyGroup.id },
                { menu_item_id: bunBo.id, group_id: toppingsGroup.id },
            ]);
            console.log(`✅ ${bunBo.name} → Size, Spicy, Toppings`);
            count += 3;
        }

        // Cà Phê - Size + Ice
        if (caPhe) {
            await MenuItemModifierGroup.bulkCreate([
                { menu_item_id: caPhe.id, group_id: sizeGroup.id },
                { menu_item_id: caPhe.id, group_id: iceGroup.id },
            ]);
            console.log(`✅ ${caPhe.name} → Size, Ice`);
            count += 2;
        }

        console.log(`\n✅ Đã link ${count} modifier groups vào menu items!`);
        console.log("\n📋 Test IDs (dùng trong cart.rest):");
        console.log(`Phở Bò: ${pho?.id || "N/A"}`);
        console.log(`Cơm Tấm: ${comTam?.id || "N/A"}`);
        console.log(`Bún Bò: ${bunBo?.id || "N/A"}`);
        console.log(`Cà Phê: ${caPhe?.id || "N/A"}`);

        process.exit(0);
    } catch (error) {
        console.error("❌ Lỗi:", error);
        process.exit(1);
    }
}

linkModifiers();
