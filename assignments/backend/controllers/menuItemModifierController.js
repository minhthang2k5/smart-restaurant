// Load associations first
require("../models/associations");
const MenuItem = require("../models/MenuItem");
const ModifierGroup = require("../models/ModifierGroup");
const MenuItemModifierGroup = require("../models/MenuItemModifierGroup");
const ModifierOption = require("../models/ModifierOption");

/**
 * Attach modifier groups to a menu item
 * POST /api/admin/menu/items/:id/modifier-groups
 * Body: { groupIds: [uuid1, uuid2, ...] }
 */
exports.attachModifierGroups = async (req, res) => {
  try {
    const { id: menuItemId } = req.params;
    const { groupIds } = req.body;

    // Use fallback for development
    const restaurantId =
      req.user?.restaurantId || "00000000-0000-0000-0000-000000000001";

    // Validation
    if (!groupIds || !Array.isArray(groupIds) || groupIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "groupIds array is required and must not be empty",
      });
    }

    // Verify menu item exists and belongs to restaurant
    const menuItem = await MenuItem.findOne({
      where: {
        id: menuItemId,
        restaurant_id: restaurantId,
        is_deleted: false,
      },
    });

    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: "Menu item not found",
      });
    }

    // Verify all modifier groups exist and belong to restaurant
    const modifierGroups = await ModifierGroup.findAll({
      where: {
        id: groupIds,
        restaurant_id: restaurantId,
        status: "active",
      },
    });

    if (modifierGroups.length !== groupIds.length) {
      return res.status(400).json({
        success: false,
        message: "One or more modifier groups not found or inactive",
      });
    }

    // Remove existing associations
    await MenuItemModifierGroup.destroy({
      where: {
        menu_item_id: menuItemId,
      },
    });

    // Create new associations
    const associations = groupIds.map((groupId) => ({
      menu_item_id: menuItemId,
      group_id: groupId,
    }));

    await MenuItemModifierGroup.bulkCreate(associations);

    // Fetch updated menu item with modifier groups
    const updatedMenuItem = await MenuItem.findOne({
      where: {
        id: menuItemId,
      },
      include: [
        {
          model: ModifierGroup,
          as: "modifierGroups",
          through: {
            attributes: [],
          },
          include: [
            {
              model: ModifierOption,
              as: "options",
              where: { status: "active" },
              required: false,
            },
          ],
        },
      ],
    });

    res.status(200).json({
      success: true,
      message: "Modifier groups attached successfully",
      data: updatedMenuItem,
    });
  } catch (error) {
    console.error("Error attaching modifier groups:", error);
    res.status(500).json({
      success: false,
      message: "Error attaching modifier groups",
      error: error.message,
    });
  }
};

/**
 * Get modifier groups for a menu item
 * GET /api/admin/menu/items/:id/modifier-groups
 */
exports.getMenuItemModifierGroups = async (req, res) => {
  try {
    const { id: menuItemId } = req.params;
    // Use fallback for development
    const restaurantId =
      req.user?.restaurantId || "00000000-0000-0000-0000-000000000001";

    // Verify menu item exists
    const menuItem = await MenuItem.findOne({
      where: {
        id: menuItemId,
        restaurant_id: restaurantId,
        is_deleted: false,
      },
    });

    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: "Menu item not found",
      });
    }

    // Get modifier groups with options via MenuItem include (through table handled by association)
    const menuItemWithGroups = await MenuItem.findOne({
      where: { id: menuItemId },
      include: [
        {
          model: ModifierGroup,
          as: "modifierGroups",
          where: { status: "active" },
          required: false,
          through: {
            attributes: [],
          },
          include: [
            {
              model: ModifierOption,
              as: "options",
              where: { status: "active" },
              required: false,
              order: [["created_at", "ASC"]],
            },
          ],
          order: [["display_order", "ASC"]],
        },
      ],
    });

    const modifierGroups = menuItemWithGroups?.modifierGroups || [];

    res.status(200).json({
      success: true,
      count: modifierGroups.length,
      data: modifierGroups,
    });
  } catch (error) {
    console.error("Error fetching menu item modifier groups:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching menu item modifier groups",
      error: error.message,
    });
  }
};

/**
 * Detach all modifier groups from a menu item
 * DELETE /api/admin/menu/items/:id/modifier-groups
 */
exports.detachAllModifierGroups = async (req, res) => {
  try {
    const { id: menuItemId } = req.params;
    // Use fallback for development
    const restaurantId =
      req.user?.restaurantId || "00000000-0000-0000-0000-000000000001";

    // Verify menu item exists
    const menuItem = await MenuItem.findOne({
      where: {
        id: menuItemId,
        restaurant_id: restaurantId,
        is_deleted: false,
      },
    });

    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: "Menu item not found",
      });
    }

    // Remove all associations
    await MenuItemModifierGroup.destroy({
      where: {
        menu_item_id: menuItemId,
      },
    });

    res.status(200).json({
      success: true,
      message: "All modifier groups detached successfully",
    });
  } catch (error) {
    console.error("Error detaching modifier groups:", error);
    res.status(500).json({
      success: false,
      message: "Error detaching modifier groups",
      error: error.message,
    });
  }
};
