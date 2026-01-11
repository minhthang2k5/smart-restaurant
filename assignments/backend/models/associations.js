const MenuItem = require("./MenuItem");
const MenuCategory = require("./MenuCategory");
const MenuItemPhoto = require("./MenuItemPhoto");
const ModifierGroup = require("./ModifierGroup");
const ModifierOption = require("./ModifierOption");
const MenuItemModifierGroup = require("./MenuItemModifierGroup");
const Order = require("./Order");
const OrderItem = require("./OrderItem");
const OrderItemModifier = require("./OrderItemModifier");
const TableSession = require("./TableSession");
const Table = require("./Table");
const User = require("./User");
const PaymentTransaction = require("./PaymentTransaction");

// ==================== MENU ASSOCIATIONS ====================

// MenuItem belongs to MenuCategory
MenuItem.belongsTo(MenuCategory, {
    foreignKey: "category_id",
    as: "category",
});

// MenuCategory has many MenuItems
MenuCategory.hasMany(MenuItem, {
    foreignKey: "category_id",
    as: "items",
});

// MenuItem has many MenuItemPhotos
MenuItem.hasMany(MenuItemPhoto, {
    foreignKey: "menu_item_id",
    as: "photos",
    onDelete: "CASCADE",
});

// MenuItemPhoto belongs to MenuItem
MenuItemPhoto.belongsTo(MenuItem, {
    foreignKey: "menu_item_id",
    as: "menuItem",
});

// ModifierGroup has many ModifierOptions
ModifierGroup.hasMany(ModifierOption, {
    foreignKey: "group_id",
    as: "options",
    onDelete: "CASCADE",
});

// ModifierOption belongs to ModifierGroup
ModifierOption.belongsTo(ModifierGroup, {
    foreignKey: "group_id",
    as: "group",
});

// MenuItem belongsToMany ModifierGroup (many-to-many)
MenuItem.belongsToMany(ModifierGroup, {
    through: MenuItemModifierGroup,
    foreignKey: "menu_item_id",
    otherKey: "group_id",
    as: "modifierGroups",
});

// ModifierGroup belongsToMany MenuItem (many-to-many)
ModifierGroup.belongsToMany(MenuItem, {
    through: MenuItemModifierGroup,
    foreignKey: "group_id",
    otherKey: "menu_item_id",
    as: "menuItems",
});

// ==================== ORDER ASSOCIATIONS ====================

// TableSession belongs to Table
TableSession.belongsTo(Table, {
    foreignKey: "table_id",
    as: "table",
});

// Table has many TableSessions
Table.hasMany(TableSession, {
    foreignKey: "table_id",
    as: "sessions",
});

// TableSession belongs to User (customer)
TableSession.belongsTo(User, {
    foreignKey: "customer_id",
    as: "customer",
});

// User has many TableSessions as customer
User.hasMany(TableSession, {
    foreignKey: "customer_id",
    as: "sessionsAsCustomer",
});

// TableSession has many Orders
TableSession.hasMany(Order, {
    foreignKey: "session_id",
    as: "orders",
});

// Order belongs to TableSession
Order.belongsTo(TableSession, {
    foreignKey: "session_id",
    as: "tableSession",
});

// Order belongs to Table
Order.belongsTo(Table, {
    foreignKey: "table_id",
    as: "table",
});

// Table has many Orders
Table.hasMany(Order, {
    foreignKey: "table_id",
    as: "orders",
});

// Order belongs to User (customer)
Order.belongsTo(User, {
    foreignKey: "customer_id",
    as: "customer",
});

// User has many Orders as customer
User.hasMany(Order, {
    foreignKey: "customer_id",
    as: "ordersAsCustomer",
});

// Order belongs to User (waiter)
Order.belongsTo(User, {
    foreignKey: "waiter_id",
    as: "waiter",
});

// User has many Orders as waiter
User.hasMany(Order, {
    foreignKey: "waiter_id",
    as: "ordersAsWaiter",
});

// Order has many OrderItems
Order.hasMany(OrderItem, {
    foreignKey: "order_id",
    as: "items",
    onDelete: "CASCADE",
});

// OrderItem belongs to Order
OrderItem.belongsTo(Order, {
    foreignKey: "order_id",
    as: "order",
});

// OrderItem belongs to MenuItem
OrderItem.belongsTo(MenuItem, {
    foreignKey: "menu_item_id",
    as: "menuItem",
});

// MenuItem has many OrderItems
MenuItem.hasMany(OrderItem, {
    foreignKey: "menu_item_id",
    as: "orderItems",
});

// OrderItem has many OrderItemModifiers
OrderItem.hasMany(OrderItemModifier, {
    foreignKey: "order_item_id",
    as: "modifiers",
    onDelete: "CASCADE",
});

// OrderItemModifier belongs to OrderItem
OrderItemModifier.belongsTo(OrderItem, {
    foreignKey: "order_item_id",
    as: "orderItem",
});

// OrderItemModifier belongs to ModifierGroup
OrderItemModifier.belongsTo(ModifierGroup, {
    foreignKey: "modifier_group_id",
    as: "modifierGroup",
});

// OrderItemModifier belongs to ModifierOption
OrderItemModifier.belongsTo(ModifierOption, {
    foreignKey: "modifier_option_id",
    as: "modifierOption",
});

// Order <-> MenuItem (through OrderItem)
Order.belongsToMany(MenuItem, {
    through: OrderItem,
    foreignKey: "order_id",
    otherKey: "menu_item_id",
    as: "menuItems"
});
MenuItem.belongsToMany(Order, {
    through: OrderItem,
    foreignKey: "menu_item_id",
    otherKey: "order_id",
    as: "orders"
});


// ==================== PAYMENT ASSOCIATIONS ====================

// TableSession has many PaymentTransactions
TableSession.hasMany(PaymentTransaction, {
    foreignKey: "table_session_id",
    as: "payment_transactions",
    onDelete: "CASCADE",
});

// PaymentTransaction belongs to TableSession
PaymentTransaction.belongsTo(TableSession, {
    foreignKey: "table_session_id",
    as: "tableSession",
});

module.exports = {
    MenuItem,
    MenuCategory,
    MenuItemPhoto,
    ModifierGroup,
    ModifierOption,
    MenuItemModifierGroup,
    TableSession,
    Order,
    OrderItem,
    OrderItemModifier,
    Table,
    User,
    PaymentTransaction,
};

