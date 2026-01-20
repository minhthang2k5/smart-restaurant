// Load associations first
require('../models/associations');

const qrService = require("./../services/qrService");
const menuItemService = require("../services/menuItemService");
const MenuItem = require('../models/MenuItem');
const MenuCategory = require('../models/MenuCategory');
const MenuItemPhoto = require('../models/MenuItemPhoto');
const ModifierGroup = require('../models/ModifierGroup');
const ModifierOption = require('../models/ModifierOption');
const { Op } = require('sequelize');

exports.verifyAndGetMenu = async (req, res) => {
    try {
        const { token } = req.query;


        if (!token) {
            return res.status(400).json({
                status: "fail",
                message: "Token is required",
            });
        }

        // Use the service to verify the token and get the table
        const table = await qrService.verifyQrToken(token);

        // If successful, respond with table info.
        // In the future, you would also fetch and send menu items here.
        res.status(200).json({
            status: "success",
            data: {
                table: {
                    id: table.id,
                    table_number: table.tableNumber,
                    location: table.location,
                },
                // menuItems: [...] // Add menu items later
            },
        });
    } catch (err) {
        // jwt.verify throws specific errors
        if (
            err.name === "TokenExpiredError" ||
            err.name === "JsonWebTokenError"
        ) {
            return res.status(401).json({
                status: "fail",
                message:
                    "This QR code is invalid or has expired. Please ask staff for assistance.",
            });
        }

        // Handle other errors (e.g., our custom error from the service)
        res.status(401).json({
            status: "fail",
            message: err.message,
        });
    }
};

exports.getPublicMenu = async (req, res) => {
  try {
    const { categoryId, search, chefRecommended, sortBy } = req.query;
    
    console.log('📥 getPublicMenu called with query:', req.query);
    console.log('🔧 sortBy param:', sortBy);

    // If sortBy is 'popularity', use the specialized service
    if (sortBy === 'popularity') {
      const filters = {
        category_id: categoryId,
        name: search,
        status: 'available',
      };

      // Add chef recommended filter if specified
      if (chefRecommended === 'true') {
        filters.is_chef_recommended = true;
      }

      const options = {
        order: 'DESC', // Most popular first
        page: 1,
        limit: 1000, // Get all for frontend filtering
      };

      const result = await menuItemService.getItemsByPopularity(filters, options);
      
      // Get categories
      const categories = await MenuCategory.findAll({
        where: { status: 'active' },
        attributes: ['id', 'name', 'description', 'display_order'],
        order: [['display_order', 'ASC']],
      });

      return res.json({
        success: true,
        data: {
          categories,
          items: result.items,
        },
      });
    }

    // Original logic for other sort options
    // Build where conditions
    const itemWhere = {
      status: 'available',
      is_deleted: false,
    };

    if (search) {
      itemWhere.name = { [Op.like]: `%${search}%` };
    }

    if (chefRecommended === 'true') {
      itemWhere.is_chef_recommended = true;
    }

    const categoryWhere = {
      status: 'active',
    };

    if (categoryId) {
      itemWhere.category_id = categoryId;
    }

    // Get categories with active items
    const categories = await MenuCategory.findAll({
      where: categoryWhere,
      attributes: ['id', 'name', 'description', 'display_order'],
      order: [['display_order', 'ASC']],
    });

    // Determine sort order
    let orderBy = [['name', 'ASC']]; // Default
    if (sortBy === 'price_asc') {
      orderBy = [['price', 'ASC']];
    } else if (sortBy === 'price_desc') {
      orderBy = [['price', 'DESC']];
    } else if (sortBy === 'newest') {
      orderBy = [['created_at', 'DESC']];
    }

    // Get available items with photos
    const items = await MenuItem.findAll({
      where: itemWhere,
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
      include: [
        {
          model: MenuCategory,
          as: 'category',
          attributes: ['id', 'name'],
          where: { status: 'active' },
        },
        {
          model: MenuItemPhoto,
          as: 'photos',
          attributes: ['id', 'url', 'is_primary'],
          separate: true,
          order: [['is_primary', 'DESC']],
        },
      ],
      order: orderBy,
    });

    res.json({
      success: true,
      data: {
        categories,
        items,
      },
    });
  } catch (error) {
    console.error('Get public menu error:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể tải menu',
    });
  }
};

exports.getPublicMenuItem = async (req, res) => {
  try {
    const { itemId } = req.params;

    const item = await MenuItem.findOne({
      where: {
        id: itemId,
        status: 'available',
        is_deleted: false,
      },
      attributes: [
        'id',
        'name',
        'description',
        'price',
        'status',
        'prep_time_minutes',
        'is_chef_recommended',
      ],
      include: [
        {
          model: MenuCategory,
          as: 'category',
          attributes: ['id', 'name', 'status'],
          where: { status: 'active' },
        },
        {
          model: MenuItemPhoto,
          as: 'photos',
          attributes: ['id', 'url', 'is_primary'],
          order: [['is_primary', 'DESC']],
        },
        {
          model: ModifierGroup,
          as: 'modifierGroups',
          through: { attributes: [] },
          attributes: [
            'id',
            'name',
            'selection_type',
            'is_required',
            'min_selections',
            'max_selections',
          ],
          where: { status: 'active' },
          required: false,
          include: [
            {
              model: ModifierOption,
              as: 'options',
              attributes: ['id', 'name', 'price_adjustment'],
              where: { status: 'active' },
              required: false,
            },
          ],
        },
      ],
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Món ăn không tồn tại hoặc không khả dụng',
      });
    }

    res.json({
      success: true,
      data: item,
    });
  } catch (error) {
    console.error('Get public menu item error:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể tải thông tin món ăn',
    });
  }
};

/**
 * Get related menu items (same category)
 * GET /api/menu/items/:itemId/related
 * 
 * Returns items from the same category, excluding the current item
 * Prioritizes chef recommendations and sorts by name
 */
exports.getRelatedItems = async (req, res) => {
  try {
    const { itemId } = req.params;
    const limit = parseInt(req.query.limit) || 4;

    // Call service layer
    const result = await menuItemService.getRelatedItems(itemId, limit);

    res.json({
      success: true,
      data: result.items,
    });
  } catch (error) {
    console.error('Get related items error:', error);
    
    // Handle custom error with statusCode
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Không thể tải các món liên quan',
    });
  }
};

