const express = require("express");
const router = express.Router();
const {
  createReport,
  getMyReports,
  getAllReports,
  updateStatus,
  addComment,
  getPurokAnalytics,
  getDashboardSummary
} = require("../controllers/reportController");

const { protect, authorize } = require("../middleware/authMiddleware");

// Resident Routes
router.post("/", protect, authorize("resident"), createReport);
router.get("/my", protect, authorize("resident"), getMyReports);

// Admin Routes
router.get("/all", protect, authorize("admin"), getAllReports);
router.put("/:id", protect, authorize("admin"), updateStatus);

router.post("/:id/comment", protect, addComment);

router.get("/analytics/purok", protect, authorize("admin"), getPurokAnalytics);

router.get("/analytics/summary", protect, authorize("admin"), getDashboardSummary);

module.exports = router;