const sequelize = require("../config/database");
const MenuItem = require("../models/MenuItem");
const MenuItemPhoto = require("../models/MenuItemPhoto");
const OrderItem = require("../models/OrderItem");
const Order = require("../models/Order");
const { Op, fn, col, literal } = require("sequelize");

/**
 * Menu Item Service
 * Business logic for menu item operations
 */
class MenuItemService {
    /**
     * Get menu items sorted by popularity (order count)
     * Uses raw SQL query with JOIN to calculate popularity from completed orders
     * 
     * @param {Object} filters - Filter options
     * @param {string} filters.name - Filter by item name (ILIKE)
     * @param {string} filters.category_id - Filter by category ID
     * @param {string} filters.status - Filter by status
     * @param {Object} options - Query options
     * @param {string} options.order - Sort order ('ASC' or 'DESC')
     * @param {number} options.page - Page number (default: 1)
     * @param {number} options.limit - Items per page (default: 10)
     * @returns {Promise<Object>} Items with popularity count and pagination
     */
    async getItemsByPopularity(filters = {}, options = {}) {
        const { name, category_id, status } = filters;
        const { order = 'DESC', page = 1, limit = 10 } = options;

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const offset = (pageNum - 1) * limitNum;
        const sortDirection = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

        // Build WHERE conditions for MenuItem
        const itemWhere = {
            is_deleted: false,
        };

        if (name) {
            itemWhere.name = { [Op.iLike]: `%${name}%` };
        }

        if (category_id) {
            itemWhere.category_id = category_id;
        }

        if (status) {
            itemWhere.status = status;
        }

        // Use Sequelize ORM with subquery for popularity count
        // This approach is more consistent with the codebase
        const { rows: items, count: totalCount } = await MenuItem.findAndCountAll({
            where: itemWhere,
            attributes: [
                'id',
                'name',
                'description',
                'price',
                'status',
                'category_id',
                'prep_time_minutes',
                'is_chef_recommended',
                'created_at',
                'updated_at',
                // Calculate popularity using subquery
                [
                    literal(`(
                        SELECT COUNT(DISTINCT oi.order_id)
                        FROM order_items oi
                        INNER JOIN orders o ON oi.order_id = o.id
                        WHERE oi.menu_item_id = "MenuItem"."id"
                        AND o.status = 'completed'
                    )`),
                    'popularity_count'
                ]
            ],
            order: [
                [literal('popularity_count'), sortDirection],
                ['name', 'ASC']
            ],
            limit: limitNum,
            offset: offset,
            subQuery: false, // Important: disable subquery wrapping
        });

        // Fetch primary photo for each item
        const itemsWithPhotos = await Promise.all(
            items.map(async (item) => {
                const primaryPhoto = await MenuItemPhoto.findOne({
                    where: {
                        menu_item_id: item.id,
                        is_primary: true,
                    },
                    attributes: ["id", "url", "is_primary"],
                });

                return {
                    ...item.toJSON(),
                    popularity_count: parseInt(item.getDataValue('popularity_count') || 0),
                    photos: primaryPhoto ? [primaryPhoto] : [], // Format as array for frontend compatibility
                };
            })
        );

        // Return data with pagination metadata
        return {
            items: itemsWithPhotos,
            pagination: {
                currentPage: pageNum,
                totalPages: Math.ceil(totalCount / limitNum),
                totalItems: totalCount,
                itemsPerPage: limitNum,
            }
        };
    }

    /**
     * Get related menu items from same category
     * Returns items that share the same category as the given item
     * Prioritizes chef recommendations
     * 
     * @param {string} itemId - The ID of the current menu item
     * @param {number} limit - Maximum number of related items to return (default: 4)
     * @returns {Promise<Object>} Object containing related items array
     * @throws {Error} If item not found
     */
    async getRelatedItems(itemId, limit = 4) {
        // 1. Get current item to find its category
        const currentItem = await MenuItem.findOne({
            where: {
                id: itemId,
                is_deleted: false,
            },
            attributes: ['id', 'category_id', 'name'],
        });

        if (!currentItem) {
            const error = new Error('Món ăn không tồn tại');
            error.statusCode = 404;
            throw error;
        }

        // 2. Find items in same category (exclude current item)
        const relatedItems = await MenuItem.findAll({
            where: {
                category_id: currentItem.category_id,
                status: 'available',
                is_deleted: false,
                id: { [Op.ne]: itemId },  // Exclude current item
            },
            attributes: [
                'id',
                'name',
                'description',
                'price',
                'status',
                'prep_time_minutes',
                'is_chef_recommended',
                'category_id',
            ],
            order: [
                // Prioritize chef recommendations first
                ['is_chef_recommended', 'DESC'],
                // Then sort alphabetically
                ['name', 'ASC'],
            ],
            limit: parseInt(limit),
        });

        // 3. Fetch photos for each related item
        const itemsWithPhotos = await Promise.all(
            relatedItems.map(async (item) => {
                const photos = await MenuItemPhoto.findAll({
                    where: { menu_item_id: item.id },
                    attributes: ['id', 'url', 'is_primary'],
                    order: [['is_primary', 'DESC']],
                });

                return {
                    ...item.toJSON(),
                    photos: photos || [],
                };
            })
        );

        return {
            items: itemsWithPhotos,
            currentItemId: itemId,
            categoryId: currentItem.category_id,
        };
    }
}

module.exports = new MenuItemService();

