// Load associations first
require('../models/associations');

const qrService = require("./../services/qrService");
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
    const { categoryId, search, chefRecommended } = req.query;

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
      order: [['name', 'ASC']],
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
