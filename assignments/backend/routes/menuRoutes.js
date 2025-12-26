const express = require("express");
const menuController = require("./../controllers/menuController");

const router = express.Router();

router.get("/verify", menuController.verifyAndGetMenu);
router.get('/items', menuController.getPublicMenu);
router.get('/items/:itemId', menuController.getPublicMenuItem);

module.exports = router;
