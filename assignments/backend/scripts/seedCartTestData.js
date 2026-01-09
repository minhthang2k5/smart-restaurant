require("dotenv").config({ path: "./config.env" });
const sequelize = require("../config/database");
const MenuCategory = require("../models/MenuCategory");
const MenuItem = require("../models/MenuItem");
const ModifierGroup = require("../models/ModifierGroup");
const ModifierOption = require("../models/ModifierOption");
const MenuItemModifierGroup = require("../models/MenuItemModifierGroup");
const { v4: uuidv4 } = require("uuid");

const seedCartTestData = async () => {
    try {
        console.log("🌱 Starting Cart Test Data Seeding...\n");

        const restaurantId = uuidv4();

        // ============================================
        // 1. Create Categories
        // ============================================
        console.log("📁 Creating Categories...");
        
        const appetizers = await MenuCategory.create({
            id: uuidv4(),
            restaurantId: restaurantId,
            name: "Appetizers",
            description: "Start your meal right",
            displayOrder: 1,
            status: "active",
        });
        console.log(`  ✅ ${appetizers.name}`);

        const mainCourses = await MenuCategory.create({
            id: uuidv4(),
            restaurantId: restaurantId,
            name: "Main Courses",
            description: "Our signature dishes",
            displayOrder: 2,
            status: "active",
        });
        console.log(`  ✅ ${mainCourses.name}`);

        const beverages = await MenuCategory.create({
            id: uuidv4(),
            restaurantId: restaurantId,
            name: "Beverages",
            description: "Refreshing drinks",
            displayOrder: 3,
            status: "active",
        });
        console.log(`  ✅ ${beverages.name}`);

        const desserts = await MenuCategory.create({
            id: uuidv4(),
            restaurantId: restaurantId,
            name: "Desserts",
            description: "Sweet endings",
            displayOrder: 4,
            status: "active",
        });
        console.log(`  ✅ ${desserts.name}\n`);

        // ============================================
        // 2. Create Menu Items
        // ============================================
        console.log("🍽️  Creating Menu Items...");

        const items = [];

        // Appetizers
        items.push(await MenuItem.create({
            id: uuidv4(),
            category_id: appetizers.id,
            restaurant_id: restaurantId,
            name: "Gỏi Cuốn",
            description: "Fresh spring rolls with shrimp and vegetables",
            price: 35000,
            prep_time_minutes: 5,
            status: "available",
        }));

        items.push(await MenuItem.create({
            id: uuidv4(),
            category_id: appetizers.id,
            restaurant_id: restaurantId,
            name: "Nem Rán",
            description: "Crispy fried spring rolls",
            price: 40000,
            prep_time_minutes: 8,
            status: "available",
        }));

        // Main Courses
        items.push(await MenuItem.create({
            id: uuidv4(),
            category_id: mainCourses.id,
            restaurant_id: restaurantId,
            name: "Phở Bò Đặc Biệt",
            description: "Special beef pho with all the toppings",
            price: 75000,
            prep_time_minutes: 15,
            status: "available",
        }));

        items.push(await MenuItem.create({
            id: uuidv4(),
            category_id: mainCourses.id,
            restaurant_id: restaurantId,
            name: "Cơm Tấm Sườn",
            description: "Broken rice with grilled pork chop",
            price: 55000,
            prep_time_minutes: 12,
            status: "available",
        }));

        items.push(await MenuItem.create({
            id: uuidv4(),
            category_id: mainCourses.id,
            restaurant_id: restaurantId,
            name: "Bún Bò Huế",
            description: "Spicy beef noodle soup from Hue",
            price: 65000,
            prep_time_minutes: 15,
            status: "available",
        }));

        // Beverages
        items.push(await MenuItem.create({
            id: uuidv4(),
            category_id: beverages.id,
            restaurant_id: restaurantId,
            name: "Cà Phê Sữa Đá",
            description: "Vietnamese iced coffee with condensed milk",
            price: 30000,
            prep_time_minutes: 5,
            status: "available",
        }));

        items.push(await MenuItem.create({
            id: uuidv4(),
            category_id: beverages.id,
            restaurant_id: restaurantId,
            name: "Trà Đá",
            description: "Iced tea",
            price: 10000,
            prep_time_minutes: 2,
            status: "available",
        }));

        items.push(await MenuItem.create({
            id: uuidv4(),
            category_id: beverages.id,
            restaurant_id: restaurantId,
            name: "Nước Chanh",
            description: "Fresh lemonade",
            price: 20000,
            prep_time_minutes: 3,
            status: "available",
        }));

        // Desserts
        items.push(await MenuItem.create({
            id: uuidv4(),
            category_id: desserts.id,
            restaurant_id: restaurantId,
            name: "Chè Ba Màu",
            description: "Three-color dessert",
            price: 25000,
            prep_time_minutes: 5,
            status: "available",
        }));

        items.push(await MenuItem.create({
            id: uuidv4(),
            category_id: desserts.id,
            restaurant_id: restaurantId,
            name: "Bánh Flan",
            description: "Caramel custard",
            price: 20000,
            prep_time_minutes: 3,
            status: "available",
        }));

        items.forEach(item => console.log(`  ✅ ${item.name} - ${item.price.toLocaleString()}đ`));
        console.log("");

        // ============================================
        // 3. Create Modifier Groups
        // ============================================
        console.log("🔧 Creating Modifier Groups...");

        const sizeGroup = await ModifierGroup.create({
            id: uuidv4(),
            restaurant_id: restaurantId,
            name: "Kích cỡ",
            selection_type: "single",
            is_required: true,
            min_selections: 1,
            max_selections: 1,
            status: "active",
        });
        console.log(`  ✅ ${sizeGroup.name} (Required)`);

        const spicyGroup = await ModifierGroup.create({
            id: uuidv4(),
            restaurant_id: restaurantId,
            name: "Độ cay",
            selection_type: "single",
            is_required: false,
            min_selections: 0,
            max_selections: 1,
            status: "active",
        });
        console.log(`  ✅ ${spicyGroup.name} (Optional)`);

        const toppingsGroup = await ModifierGroup.create({
            id: uuidv4(),
            restaurant_id: restaurantId,
            name: "Topping thêm",
            selection_type: "multiple",
            is_required: false,
            min_selections: 0,
            max_selections: 5,
            status: "active",
        });
        console.log(`  ✅ ${toppingsGroup.name} (Multiple)`);

        const iceGroup = await ModifierGroup.create({
            id: uuidv4(),
            restaurant_id: restaurantId,
            name: "Đá",
            selection_type: "single",
            is_required: false,
            min_selections: 0,
            max_selections: 1,
            status: "active",
        });
        console.log(`  ✅ ${iceGroup.name} (Optional)\n`);

        // ============================================
        // 4. Create Modifier Options
        // ============================================
        console.log("⚙️  Creating Modifier Options...");

        const modifierOptions = [];

        // Size options
        const sizeOptions = [
            { name: "Nhỏ", price: 0 },
            { name: "Vừa", price: 5000 },
            { name: "Lớn", price: 10000 },
        ];
        for (const opt of sizeOptions) {
            const option = await ModifierOption.create({
                id: uuidv4(),
                group_id: sizeGroup.id,
                name: opt.name,
                price_adjustment: opt.price,
                status: "active",
            });
            modifierOptions.push(option);
            console.log(`  ✅ ${sizeGroup.name} - ${option.name} (+${opt.price.toLocaleString()}đ)`);
        }

        // Spicy level options
        const spicyOptions = [
            { name: "Không cay", price: 0 },
            { name: "Ít cay", price: 0 },
            { name: "Vừa cay", price: 0 },
            { name: "Cay nồng", price: 0 },
        ];
        for (const opt of spicyOptions) {
            const option = await ModifierOption.create({
                id: uuidv4(),
                group_id: spicyGroup.id,
                name: opt.name,
                price_adjustment: opt.price,
                status: "active",
            });
            modifierOptions.push(option);
            console.log(`  ✅ ${spicyGroup.name} - ${option.name}`);
        }

        // Toppings options
        const toppingOptions = [
            { name: "Thịt bò thêm", price: 20000 },
            { name: "Trứng", price: 10000 },
            { name: "Rau thêm", price: 5000 },
            { name: "Giò thêm", price: 15000 },
            { name: "Nem chua", price: 12000 },
        ];
        for (const opt of toppingOptions) {
            const option = await ModifierOption.create({
                id: uuidv4(),
                group_id: toppingsGroup.id,
                name: opt.name,
                price_adjustment: opt.price,
                status: "active",
            });
            modifierOptions.push(option);
            console.log(`  ✅ ${toppingsGroup.name} - ${option.name} (+${opt.price.toLocaleString()}đ)`);
        }

        // Ice options
        const iceOptions = [
            { name: "Nhiều đá", price: 0 },
            { name: "Ít đá", price: 0 },
            { name: "Không đá", price: 0 },
        ];
        for (const opt of iceOptions) {
            const option = await ModifierOption.create({
                id: uuidv4(),
                group_id: iceGroup.id,
                name: opt.name,
                price_adjustment: opt.price,
                status: "active",
            });
            modifierOptions.push(option);
            console.log(`  ✅ ${iceGroup.name} - ${option.name}`);
        }
        console.log("");

        // ============================================
        // 5. Link Modifiers to Menu Items
        // ============================================
        console.log("🔗 Linking Modifiers to Menu Items...");

        // Phở Bò - Size + Spicy + Toppings
        await MenuItemModifierGroup.create({
            menu_item_id: items[2].id, // Phở Bò
            group_id: sizeGroup.id,
        });
        await MenuItemModifierGroup.create({
            menu_item_id: items[2].id,
            group_id: spicyGroup.id,
        });
        await MenuItemModifierGroup.create({
            menu_item_id: items[2].id,
            group_id: toppingsGroup.id,
        });
        console.log(`  ✅ ${items[2].name} → Size, Spicy, Toppings`);

        // Cơm Tấm - Size + Toppings
        await MenuItemModifierGroup.create({
            menu_item_id: items[3].id, // Cơm Tấm
            group_id: sizeGroup.id,
        });
        await MenuItemModifierGroup.create({
            menu_item_id: items[3].id,
            group_id: toppingsGroup.id,
        });
        console.log(`  ✅ ${items[3].name} → Size, Toppings`);

        // Bún Bò Huế - Size + Spicy + Toppings
        await MenuItemModifierGroup.create({
            menu_item_id: items[4].id, // Bún Bò Huế
            group_id: sizeGroup.id,
        });
        await MenuItemModifierGroup.create({
            menu_item_id: items[4].id,
            group_id: spicyGroup.id,
        });
        await MenuItemModifierGroup.create({
            menu_item_id: items[4].id,
            group_id: toppingsGroup.id,
        });
        console.log(`  ✅ ${items[4].name} → Size, Spicy, Toppings`);

        // Cà Phê - Size + Ice
        await MenuItemModifierGroup.create({
            menu_item_id: items[5].id, // Cà Phê
            group_id: sizeGroup.id,
        });
        await MenuItemModifierGroup.create({
            menu_item_id: items[5].id,
            group_id: iceGroup.id,
        });
        console.log(`  ✅ ${items[5].name} → Size, Ice`);

        // Nước Chanh - Size + Ice
        await MenuItemModifierGroup.create({
            menu_item_id: items[7].id, // Nước Chanh
            group_id: sizeGroup.id,
        });
        await MenuItemModifierGroup.create({
            menu_item_id: items[7].id,
            group_id: iceGroup.id,
        });
        console.log(`  ✅ ${items[7].name} → Size, Ice\n`);

        // ============================================
        // 6. Print Test IDs
        // ============================================
        console.log("=".repeat(70));
        console.log("📋 TEST IDs - Copy these to cart.rest file:");
        console.log("=".repeat(70));
        console.log("\n# Menu Item IDs:");
        items.forEach((item, index) => {
            console.log(`# ${index + 1}. ${item.name.padEnd(25)} - ID: ${item.id}`);
        });
        
        console.log("\n# Modifier Option IDs (first 5 for quick testing):");
        modifierOptions.slice(0, 5).forEach((opt, index) => {
            console.log(`# ${index + 1}. ${opt.name.padEnd(15)} - ID: ${opt.id}`);
        });

        console.log("\n" + "=".repeat(70));
        console.log("💡 Quick Test Cart Example:");
        console.log("=".repeat(70));
        console.log(`
{
  "items": [
    {
      "menu_item_id": "${items[2].id}",  // Phở Bò Đặc Biệt
      "quantity": 2,
      "special_instructions": "Không hành",
      "modifiers": [
        {
          "modifier_option_id": "${modifierOptions[1].id}",  // Vừa
          "quantity": 1
        },
        {
          "modifier_option_id": "${modifierOptions[4].id}",  // Ít cay
          "quantity": 1
        }
      ]
    },
    {
      "menu_item_id": "${items[5].id}",  // Cà Phê Sữa Đá
      "quantity": 1,
      "modifiers": [
        {
          "modifier_option_id": "${modifierOptions[2].id}",  // Lớn
          "quantity": 1
        }
      ]
    }
  ]
}`);

        console.log("\n" + "=".repeat(70));
        console.log("✅ Cart test data seeding completed successfully!");
        console.log("=".repeat(70));
        console.log("\n🚀 Next Steps:");
        console.log("   1. Copy the test IDs above");
        console.log("   2. Update menu_item_id and modifier_option_id in cart.rest");
        console.log("   3. Start server: npm start");
        console.log("   4. Test cart APIs using REST Client extension\n");

        process.exit(0);
    } catch (error) {
        console.error("\n❌ Seeding failed:", error.message);
        console.error(error);
        process.exit(1);
    }
};

// Run seeder
seedCartTestData();
