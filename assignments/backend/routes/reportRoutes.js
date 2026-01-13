const express = require("express");
const router = express.Router();
const reportController = require("../controllers/reportController");
const { authenticate, authorize } = require("../middleware/auth");

/**
 * @route   GET /api/reports/revenue
 * @desc    Get revenue report for a time range
 * @access  Private (Admin only)
 * @query   startDate (ISO 8601) or period ('7days', '30days', 'this_month', 'last_month')
 * @query   endDate (ISO 8601)
 * @query   granularity ('daily', 'weekly', 'monthly') - default: 'daily'
 *
 * Examples:
 *   - /api/reports/revenue?period=7days&granularity=daily
 *   - /api/reports/revenue?startDate=2026-01-01&endDate=2026-01-31&granularity=weekly
 *   - /api/reports/revenue?period=this_month&granularity=daily
 */
router.get(
    "/revenue",
    authenticate,
    authorize(["admin", "manager"]),
    reportController.getRevenueReport
);

/**
 * @route   GET /api/reports/top-items
 * @desc    Get top selling items by revenue in a time range
 * @access  Private (Admin only)
 * @query   startDate (ISO 8601) or period
 * @query   endDate (ISO 8601)
 * @query   limit (number) - default: 10, max: 100
 *
 * Examples:
 *   - /api/reports/top-items?period=7days&limit=10
 *   - /api/reports/top-items?startDate=2026-01-01&endDate=2026-01-31&limit=20
 *   - /api/reports/top-items?period=this_month
 */
router.get(
    "/top-items",
    authenticate,
    authorize(["admin", "manager"]),
    reportController.getTopSellingItems
);

/**
 * @route   GET /api/reports/chart-data
 * @desc    Get data for interactive charts (orders/day, peak hours, popular items)
 * @access  Private (Admin only)
 * @query   startDate (ISO 8601) or period
 * @query   endDate (ISO 8601)
 *
 * Returns data for:
 *   - Line chart: Orders per day with revenue
 *   - Bar chart: Peak hours distribution
 *   - Pie/Donut chart: Popular items by revenue
 *
 * Examples:
 *   - /api/reports/chart-data?period=7days
 *   - /api/reports/chart-data?startDate=2026-01-01&endDate=2026-01-31
 *   - /api/reports/chart-data?period=this_month
 */
router.get(
    "/chart-data",
    authenticate,
    authorize(["admin", "manager"]),
    reportController.getChartData
);

module.exports = router;
