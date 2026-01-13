const { Op, fn, col, literal } = require("sequelize");
const sequelize = require("../config/database");
const Order = require("../models/Order");
const OrderItem = require("../models/OrderItem");
const MenuItem = require("../models/MenuItem");
const MenuCategory = require("../models/MenuCategory");
const MenuItemPhoto = require("../models/MenuItemPhoto");

/**
 * Report Service
 * Business logic for report generation and analytics
 */
class ReportService {
    /**
     * Get revenue report for a time range with different granularities
     * @param {Date} startDate - Start date of the report
     * @param {Date} endDate - End date of the report
     * @param {string} granularity - 'daily', 'weekly', or 'monthly'
     * @returns {Object} Revenue report data with time series
     */
    async getRevenueReport(startDate, endDate, granularity = "daily") {
        // Build date format based on granularity (PostgreSQL)
        let periodExpression;

        switch (granularity) {
            case "daily":
                periodExpression = literal("created_at::date");
                break;
            case "weekly":
                periodExpression = literal("TO_CHAR(created_at, 'IYYY-IW')");
                break;
            case "monthly":
                periodExpression = literal("TO_CHAR(created_at, 'YYYY-MM')");
                break;
            default:
                periodExpression = literal("created_at::date");
        }

        // Query orders grouped by time period
        const revenueData = await Order.findAll({
            attributes: [
                [periodExpression, "period"],
                [fn("COUNT", col("id")), "orderCount"],
                [fn("SUM", col("total_amount")), "totalRevenue"],
                [fn("AVG", col("total_amount")), "avgOrderValue"],
            ],
            where: {
                status: "completed",
                created_at: {
                    [Op.between]: [startDate, endDate],
                },
            },
            group: [periodExpression],
            order: [[periodExpression, "ASC"]],
            raw: true,
        });

        // Calculate totals
        const totals = await Order.findOne({
            attributes: [
                [fn("COUNT", col("id")), "totalOrders"],
                [fn("SUM", col("total_amount")), "totalRevenue"],
                [fn("AVG", col("total_amount")), "avgOrderValue"],
            ],
            where: {
                status: "completed",
                created_at: {
                    [Op.between]: [startDate, endDate],
                },
            },
            raw: true,
        });

        return {
            granularity,
            period: {
                startDate,
                endDate,
            },
            dataPoints: revenueData.map((item) => ({
                period: item.period,
                orderCount: parseInt(item.orderCount) || 0,
                totalRevenue: parseFloat(item.totalRevenue) || 0,
                avgOrderValue: parseFloat(item.avgOrderValue) || 0,
            })),
            summary: {
                totalOrders: parseInt(totals.totalOrders) || 0,
                totalRevenue: parseFloat(totals.totalRevenue) || 0,
                avgOrderValue: parseFloat(totals.avgOrderValue) || 0,
            },
        };
    }

    /**
     * Get top selling items by revenue in a time range
     * @param {Date} startDate - Start date of the report
     * @param {Date} endDate - End date of the report
     * @param {number} limit - Number of top items to return
     * @returns {Object} Top selling items report
     */
    async getTopSellingItems(startDate, endDate, limit = 10) {
        // Use raw SQL query to avoid GROUP BY issues in PostgreSQL
        const query = `
            SELECT 
                oi.menu_item_id,
                mi.name,
                mi.description,
                mi.price,
                mc.id as category_id,
                mc.name as category_name,
                SUM(oi.quantity) as total_quantity,
                SUM(oi.total_price) as total_revenue,
                COUNT(DISTINCT oi.order_id) as order_count,
                AVG(oi.unit_price) as avg_price,
                (
                    SELECT url 
                    FROM menu_item_photos 
                    WHERE menu_item_id = mi.id 
                    LIMIT 1
                ) as photo_url
            FROM order_items oi
            INNER JOIN orders o ON oi.order_id = o.id
            INNER JOIN menu_items mi ON oi.menu_item_id = mi.id
            LEFT JOIN menu_categories mc ON mi.category_id = mc.id
            WHERE o.status = 'completed'
                AND o.created_at BETWEEN :startDate AND :endDate
            GROUP BY 
                oi.menu_item_id,
                mi.id,
                mi.name,
                mi.description,
                mi.price,
                mc.id,
                mc.name
            ORDER BY total_revenue DESC
            LIMIT :limit
        `;

        const topItems = await sequelize.query(query, {
            replacements: {
                startDate,
                endDate,
                limit,
            },
            type: sequelize.QueryTypes.SELECT,
        });

        // Format the results
        const formattedItems = topItems.map((item, index) => ({
            rank: index + 1,
            menuItemId: item.menu_item_id,
            name: item.name || "Unknown Item",
            description: item.description || "",
            categoryName: item.category_name || "Uncategorized",
            categoryId: item.category_id || null,
            quantitySold: parseInt(item.total_quantity) || 0,
            totalRevenue: parseFloat(item.total_revenue) || 0,
            orderCount: parseInt(item.order_count) || 0,
            avgPrice: parseFloat(item.avg_price) || 0,
            imageUrl: item.photo_url || "/uploads/default-dish.png",
        }));

        return {
            period: {
                startDate,
                endDate,
            },
            items: formattedItems,
            totalItems: formattedItems.length,
        };
    }

    /**
     * Get chart data for analytics dashboard
     * Includes: orders per day, peak hours, and popular items
     * @param {Date} startDate - Start date
     * @param {Date} endDate - End date
     * @returns {Object} Chart data for multiple visualizations
     */
    async getChartData(startDate, endDate) {
        // 1. Orders per day (line chart data)
        const ordersPerDay = await Order.findAll({
            attributes: [
                [literal("created_at::date"), "date"],
                [fn("COUNT", col("id")), "orderCount"],
                [fn("SUM", col("total_amount")), "revenue"],
            ],
            where: {
                status: "completed",
                created_at: {
                    [Op.between]: [startDate, endDate],
                },
            },
            group: [literal("created_at::date")],
            order: [[literal("created_at::date"), "ASC"]],
            raw: true,
        });

        // 2. Peak hours distribution (bar chart data)
        const peakHours = await Order.findAll({
            attributes: [
                [fn("EXTRACT", literal("HOUR FROM created_at")), "hour"],
                [fn("COUNT", col("id")), "orderCount"],
                [fn("SUM", col("total_amount")), "revenue"],
            ],
            where: {
                status: "completed",
                created_at: {
                    [Op.between]: [startDate, endDate],
                },
            },
            group: [fn("EXTRACT", literal("HOUR FROM created_at"))],
            order: [[fn("EXTRACT", literal("HOUR FROM created_at")), "ASC"]],
            raw: true,
        });

        // 3. Popular items (pie chart data) - Use raw SQL to avoid GROUP BY issues
        const popularItemsQuery = `
            SELECT 
                mi.name,
                SUM(oi.quantity) as total_quantity,
                SUM(oi.total_price) as total_revenue
            FROM order_items oi
            INNER JOIN orders o ON oi.order_id = o.id
            INNER JOIN menu_items mi ON oi.menu_item_id = mi.id
            WHERE o.status = 'completed'
                AND o.created_at BETWEEN :startDate AND :endDate
            GROUP BY oi.menu_item_id, mi.name
            ORDER BY total_revenue DESC
            LIMIT 10
        `;

        const popularItems = await sequelize.query(popularItemsQuery, {
            replacements: {
                startDate,
                endDate,
            },
            type: sequelize.QueryTypes.SELECT,
        });

        // Format peak hours with labels
        const formattedPeakHours = peakHours.map((item) => ({
            hour: parseInt(item.hour),
            label: this._formatHourLabel(parseInt(item.hour)),
            orderCount: parseInt(item.orderCount),
            revenue: parseFloat(item.revenue),
        }));

        // Find max order count for percentage calculation
        const maxOrders = Math.max(
            ...formattedPeakHours.map((h) => h.orderCount),
            1
        );

        return {
            ordersPerDay: ordersPerDay.map((item) => ({
                date: item.date,
                orderCount: parseInt(item.orderCount),
                revenue: parseFloat(item.revenue),
            })),
            peakHours: formattedPeakHours.map((item) => ({
                ...item,
                percentage: Math.round((item.orderCount / maxOrders) * 100),
                isPeak: item.orderCount >= maxOrders * 0.8, // 80% of max is considered peak
            })),
            popularItems: popularItems.map((item) => ({
                name: item.name || "Unknown",
                quantity: parseInt(item.total_quantity),
                revenue: parseFloat(item.total_revenue),
            })),
        };
    }

    /**
     * Helper method to format hour as AM/PM label
     * @param {number} hour - Hour in 24h format (0-23)
     * @returns {string} Formatted hour label
     */
    _formatHourLabel(hour) {
        if (hour === 0) return "12 AM";
        if (hour === 12) return "12 PM";
        if (hour < 12) return `${hour} AM`;
        return `${hour - 12} PM`;
    }

    /**
     * Parse period string to date range
     * @param {string} period - Period string ('7days', '30days', 'this_month', etc.)
     * @returns {Object} Start and end dates
     */
    parsePeriod(period) {
        const now = new Date();
        let startDate, endDate;

        switch (period) {
            case "today":
                startDate = new Date(now.setHours(0, 0, 0, 0));
                endDate = new Date(now.setHours(23, 59, 59, 999));
                break;

            case "yesterday":
                startDate = new Date(now.setDate(now.getDate() - 1));
                startDate.setHours(0, 0, 0, 0);
                endDate = new Date(startDate);
                endDate.setHours(23, 59, 59, 999);
                break;

            case "7days":
                endDate = new Date();
                startDate = new Date(now.setDate(now.getDate() - 7));
                break;

            case "30days":
                endDate = new Date();
                startDate = new Date(now.setDate(now.getDate() - 30));
                break;

            case "this_month":
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                endDate.setHours(23, 59, 59, 999);
                break;

            case "last_month":
                startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                endDate = new Date(now.getFullYear(), now.getMonth(), 0);
                endDate.setHours(23, 59, 59, 999);
                break;

            default:
                // Default to last 7 days
                endDate = new Date();
                startDate = new Date(now.setDate(now.getDate() - 7));
        }

        return { startDate, endDate };
    }
}

module.exports = new ReportService();
