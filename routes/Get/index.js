const express = require('express');
const backendRoute = require("./backend/index");
const exhibitionRoute = require("./exhibition/index");
const router = express.Router();

router.use("/backend", backendRoute);
router.use("/exhibition", exhibitionRoute);

module.exports = router;