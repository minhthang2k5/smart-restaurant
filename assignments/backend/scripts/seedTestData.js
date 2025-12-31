require("dotenv").config({ path: "./config.env" });
const sequelize = require("../config/database");
const Table = require("../models/Table");
const MenuCategory = require("../models/MenuCategory");
const MenuItem = require("../models/MenuItem");
const ModifierGroup = require("../models/ModifierGroup");
const ModifierOption = require("../models/ModifierOption");
const { v4: uuidv4 } = require("uuid");

const seedData = async () => {
    try {
        console.log("🌱 Starting database seeding...");

        // Restaurant ID (you can replace with actual restaurant ID)
        const restaurantId = uuidv4();

        // 1. Create Tables
        const table1 = await Table.create({
            id: uuidv4(),
            tableNumber: "T01",
            location: "Ground Floor - Window Side",
            capacity: 4,
            status: "active",
        });
        console.log("✅ Created table:", table1.tableNumber);

        const table2 = await Table.create({
            id: uuidv4(),
            tableNumber: "T02",
            location: "Ground Floor - Center",
            capacity: 2,
            status: "active",
        });
        console.log("✅ Created table:", table2.tableNumber);

        // 2. Create Menu Categories
        const mainDishes = await MenuCategory.create({
            id: uuidv4(),
            restaurantId: restaurantId,
            name: "Main Dishes",
            description: "Our signature main courses",
            displayOrder: 1,
            status: "active",
        });
        console.log("✅ Created category:", mainDishes.name);

        const beverages = await MenuCategory.create({
            id: uuidv4(),
            restaurantId: restaurantId,
            name: "Beverages",
            description: "Fresh drinks and coffee",
            displayOrder: 2,
            status: "active",
        });
        console.log("✅ Created category:", beverages.name);

        // 3. Create Menu Items
        const pho = await MenuItem.create({
            id: uuidv4(),
            categoryId: mainDishes.id,
            restaurantId: restaurantId,
            name: "Phở Bò",
            description: "Traditional Vietnamese beef noodle soup",
            price: 65000,
            prepTimeMinutes: 15,
            status: "available",
            isActive: true,
        });
        console.log("✅ Created menu item:", pho.name);

        const comTam = await MenuItem.create({
            id: uuidv4(),
            categoryId: mainDishes.id,
            restaurantId: restaurantId,
            name: "Cơm Tấm Sườn Bì",
            description: "Broken rice with grilled pork and shredded skin",
            price: 45000,
            prepTimeMinutes: 10,
            status: "available",
            isActive: true,
        });
        console.log("✅ Created menu item:", comTam.name);

        const coffee = await MenuItem.create({
            id: uuidv4(),
            categoryId: beverages.id,
            restaurantId: restaurantId,
            name: "Cà Phê Sữa Đá",
            description: "Vietnamese iced coffee with condensed milk",
            price: 25000,
            prepTimeMinutes: 5,
            status: "available",
            isActive: true,
        });
        console.log("✅ Created menu item:", coffee.name);

        // 4. Create Modifier Groups
        const sizeGroup = await ModifierGroup.create({
            id: uuidv4(),
            restaurantId: restaurantId,
            name: "Size",
            selectionType: "single",
            isRequired: true,
            minSelections: 1,
            maxSelections: 1,
            status: "active",
        });
        console.log("✅ Created modifier group:", sizeGroup.name);

        const toppingsGroup = await ModifierGroup.create({
            id: uuidv4(),
            restaurantId: restaurantId,
            name: "Extra Toppings",
            selectionType: "multiple",
            isRequired: false,
            minSelections: 0,
            maxSelections: 5,
            status: "active",
        });
        console.log("✅ Created modifier group:", toppingsGroup.name);

        // 5. Create Modifier Options
        const sizeRegular = await ModifierOption.create({
            id: uuidv4(),
            groupId: sizeGroup.id,
            name: "Regular",
            priceAdjustment: 0,
            status: "active",
        });
        console.log("✅ Created modifier option:", sizeRegular.name);

        const sizeLarge = await ModifierOption.create({
            id: uuidv4(),
            groupId: sizeGroup.id,
            name: "Large",
            priceAdjustment: 10000,
            status: "active",
        });
        console.log("✅ Created modifier option:", sizeLarge.name);

        const extraMeat = await ModifierOption.create({
            id: uuidv4(),
            groupId: toppingsGroup.id,
            name: "Extra Meat",
            priceAdjustment: 15000,
            status: "active",
        });
        console.log("✅ Created modifier option:", extraMeat.name);

        const extraVeggies = await ModifierOption.create({
            id: uuidv4(),
            groupId: toppingsGroup.id,
            name: "Extra Vegetables",
            priceAdjustment: 5000,
            status: "active",
        });
        console.log("✅ Created modifier option:", extraVeggies.name);

        // Print IDs for testing
        console.log("\n" + "=".repeat(60));
        console.log("📋 TEST DATA IDs - Copy to orders.rest:");
        console.log("=".repeat(60));
        console.log(`@tableId = ${table1.id}`);
        console.log(`@menuItemId1 = ${pho.id}`);
        console.log(`@menuItemId2 = ${comTam.id}`);
        console.log(`@modifierOptionId = ${extraMeat.id}`);
        console.log("=".repeat(60));
        console.log("\n✅ Database seeding completed successfully!");

        process.exit(0);
    } catch (error) {
        console.error("❌ Seeding failed:", error);
        process.exit(1);
    }
};

seedData();
