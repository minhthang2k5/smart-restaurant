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
                    primaryPhoto: primaryPhoto || null,
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
}

module.exports = new MenuItemService();
