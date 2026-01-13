const reportService = require("../services/reportService");

/**
 * Report Controller
 * Handles HTTP requests for analytics and reports
 */
class ReportController {
    /**
     * GET /api/reports/revenue
     * Get revenue report for a time range
     * Query params:
     *   - startDate (ISO 8601) or period ('7days', '30days', 'this_month', 'last_month')
     *   - endDate (ISO 8601)
     *   - granularity ('daily', 'weekly', 'monthly')
     */
    async getRevenueReport(req, res) {
        try {
            const { startDate, endDate, period, granularity = "daily" } =
                req.query;

            let start, end;

            // Parse period or use provided dates
            if (period) {
                const dates = reportService.parsePeriod(period);
                start = dates.startDate;
                end = dates.endDate;
            } else if (startDate && endDate) {
                start = new Date(startDate);
                end = new Date(endDate);

                // Validate dates
                if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                    return res.status(400).json({
                        success: false,
                        message: "Invalid date format. Use ISO 8601 format.",
                    });
                }
            } else {
                // Default to last 7 days
                const dates = reportService.parsePeriod("7days");
                start = dates.startDate;
                end = dates.endDate;
            }

            // Validate date range
            if (start > end) {
                return res.status(400).json({
                    success: false,
                    message: "Start date must be before end date",
                });
            }

            // Validate granularity
            if (!["daily", "weekly", "monthly"].includes(granularity)) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid granularity. Must be 'daily', 'weekly', or 'monthly'",
                });
            }

            const report = await reportService.getRevenueReport(
                start,
                end,
                granularity
            );

            res.json({
                success: true,
                data: report,
            });
        } catch (error) {
            console.error("Error in getRevenueReport:", error);
            res.status(500).json({
                success: false,
                message: "Failed to generate revenue report",
                error:
                    process.env.NODE_ENV === "development"
                        ? error.message
                        : undefined,
            });
        }
    }

    /**
     * GET /api/reports/top-items
     * Get top selling items by revenue
     * Query params:
     *   - startDate (ISO 8601) or period
     *   - endDate (ISO 8601)
     *   - limit (number, default 10)
     */
    async getTopSellingItems(req, res) {
        try {
            const { startDate, endDate, period, limit = 10 } = req.query;

            let start, end;

            // Parse period or use provided dates
            if (period) {
                const dates = reportService.parsePeriod(period);
                start = dates.startDate;
                end = dates.endDate;
            } else if (startDate && endDate) {
                start = new Date(startDate);
                end = new Date(endDate);

                if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                    return res.status(400).json({
                        success: false,
                        message: "Invalid date format. Use ISO 8601 format.",
                    });
                }
            } else {
                // Default to last 7 days
                const dates = reportService.parsePeriod("7days");
                start = dates.startDate;
                end = dates.endDate;
            }

            // Validate date range
            if (start > end) {
                return res.status(400).json({
                    success: false,
                    message: "Start date must be before end date",
                });
            }

            // Validate limit
            const itemLimit = parseInt(limit);
            if (isNaN(itemLimit) || itemLimit < 1 || itemLimit > 100) {
                return res.status(400).json({
                    success: false,
                    message: "Limit must be between 1 and 100",
                });
            }

            const report = await reportService.getTopSellingItems(
                start,
                end,
                itemLimit
            );

            res.json({
                success: true,
                data: report,
            });
        } catch (error) {
            console.error("Error in getTopSellingItems:", error);
            res.status(500).json({
                success: false,
                message: "Failed to generate top selling items report",
                error:
                    process.env.NODE_ENV === "development"
                        ? error.message
                        : undefined,
            });
        }
    }

    /**
     * GET /api/reports/chart-data
     * Get data for interactive charts
     * Returns: orders per day, peak hours, and popular items
     * Query params:
     *   - startDate (ISO 8601) or period
     *   - endDate (ISO 8601)
     */
    async getChartData(req, res) {
        try {
            const { startDate, endDate, period } = req.query;

            let start, end;

            // Parse period or use provided dates
            if (period) {
                const dates = reportService.parsePeriod(period);
                start = dates.startDate;
                end = dates.endDate;
            } else if (startDate && endDate) {
                start = new Date(startDate);
                end = new Date(endDate);

                if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                    return res.status(400).json({
                        success: false,
                        message: "Invalid date format. Use ISO 8601 format.",
                    });
                }
            } else {
                // Default to last 7 days
                const dates = reportService.parsePeriod("7days");
                start = dates.startDate;
                end = dates.endDate;
            }

            // Validate date range
            if (start > end) {
                return res.status(400).json({
                    success: false,
                    message: "Start date must be before end date",
                });
            }

            const chartData = await reportService.getChartData(start, end);

            res.json({
                success: true,
                data: {
                    period: {
                        startDate: start,
                        endDate: end,
                    },
                    charts: chartData,
                },
            });
        } catch (error) {
            console.error("Error in getChartData:", error);
            res.status(500).json({
                success: false,
                message: "Failed to generate chart data",
                error:
                    process.env.NODE_ENV === "development"
                        ? error.message
                        : undefined,
            });
        }
    }
}

module.exports = new ReportController();
