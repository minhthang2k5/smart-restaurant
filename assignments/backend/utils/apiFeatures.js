const { Op } = require("sequelize");

// Helper class to build Sequelize queries
// Supports: filtering by name/category/status, sorting, pagination
class APIFeatures {
    constructor(model, queryString) {
        this.model = model;
        this.queryString = queryString;
        this.queryOptions = {
            where: {},
            order: [],
            limit: undefined,
            offset: undefined,
        };
    }

    // Set base filters (is_deleted)
    filter(baseWhere = {}) {
        this.queryOptions.where = { ...baseWhere };
        return this;
    }

    // Search by name (case-insensitive, partial match)
    search() {
        if (this.queryString.name) {
            this.queryOptions.where.name = {
                [Op.iLike]: `%${this.queryString.name}%`,
            };
        }
        return this;
    }

    // Search across multiple fields (case-insensitive, partial match)
    searchFields(fields, queryParam = "search") {
        if (this.queryString[queryParam] && fields && fields.length > 0) {
            this.queryOptions.where[Op.or] = fields.map((field) => ({
                [field]: {
                    [Op.iLike]: `%${this.queryString[queryParam]}%`,
                },
            }));
        }
        return this;
    }

    // Filter by category_id
    filterByCategory() {
        if (this.queryString.category_id) {
            this.queryOptions.where.category_id = this.queryString.category_id;
        }
        return this;
    }

    // Filter by status
    filterByStatus() {
        if (this.queryString.status) {
            this.queryOptions.where.status = this.queryString.status;
        }
        return this;
    }

    // Generic filter by any field
    filterBy(field, queryParam = field, operator = null) {
        if (this.queryString[queryParam]) {
            if (operator) {
                this.queryOptions.where[field] = {
                    [operator]: this.queryString[queryParam],
                };
            } else {
                this.queryOptions.where[field] = this.queryString[queryParam];
            }
        }
        return this;
    }

    // Sort by one or many fields (comma-separated). Example: sort=price,name&order=ASC
    sort() {
        const defaultOrder = "ASC";

        const allowedFields = [
            "created_at",
            "price",
            "name",
            "prep_time_minutes",
            "status",
        ];

        // Allow multiple fields, same direction for all
        const sortFields = (this.queryString.sort || "created_at")
            .split(",")
            .map((f) => f.trim())
            .filter((f) => Boolean(f));

        const orderInput = (
            this.queryString.order || defaultOrder
        ).toUpperCase();
        const direction = ["ASC", "DESC"].includes(orderInput)
            ? orderInput
            : defaultOrder;

        const order = [];
        for (const field of sortFields) {
            if (allowedFields.includes(field)) {
                order.push([field, direction]);
            }
        }

        // Fallback to created_at DESC if nothing valid was provided
        this.queryOptions.order = order.length
            ? order
            : [["created_at", defaultOrder]];
        return this;
    }

    // Pagination
    paginate() {
        const page = parseInt(this.queryString.page) || 1;
        const limit = parseInt(this.queryString.limit) || 10;
        const offset = (page - 1) * limit;

        this.queryOptions.limit = limit;
        this.queryOptions.offset = offset;

        return this;
    }

    // Get pagination metadata
    getPaginationData(totalCount) {
        const page = parseInt(this.queryString.page) || 1;
        const limit = parseInt(this.queryString.limit) || 10;

        return {
            currentPage: page,
            totalPages: Math.ceil(totalCount / limit),
            totalItems: totalCount,
            itemsPerPage: limit,
        };
    }

    // Execute query
    async execute() {
        return await this.model.findAll(this.queryOptions);
    }

    // Get count for pagination
    async getCount() {
        return await this.model.count({
            where: this.queryOptions.where,
        });
    }
}

module.exports = APIFeatures;
