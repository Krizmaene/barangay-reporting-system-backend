const Report = require("../models/Report");
const Notification = require("../models/Notification");


// RESIDENT: Create Report
exports.createReport = async (req, res) => {
  try {
    const { category, description, location, purok, personInvolved } = req.body;

    const report = new Report({
      resident: req.user.id,
      category,
      description,
      location,
      purok,
      personInvolved
    });

    await report.save();

    res.status(201).json(report);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
};


// RESIDENT: Get My Reports
exports.getMyReports = async (req, res) => {
  try {
    const reports = await Report.find({ resident: req.user.id })
      .populate("comments.user", "name")
      .sort({ createdAt: -1 });

    res.json(reports);
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
};


// ADMIN: Get All Reports
exports.getAllReports = async (req, res) => {
  try {
    const { status, category, purok, startDate, endDate } = req.query;

    let filter = {};

    if (status) filter.status = status;
    if (category) filter.category = category;
    if (purok) filter.purok = purok;

    // Date filter
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const reports = await Report.find(filter)
      .populate("resident", "name email")
      .sort({ createdAt: -1 });

    res.json(reports);

  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
};


// ADMIN: Update Status
exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ msg: "Report not found" });
    }

    report.status = status;
    await report.save();

    // Create notification for resident
    await Notification.create({
      user: report.resident,
      message: `Your report status has been updated to ${status}`
    });

    res.json(report);

  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
};


// ADMIN: Add Comment
exports.addComment = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ msg: "Report not found" });
    }

    const comment = {
      user: req.user.id,
      text: req.body.text
    };

    report.comments.push(comment);

    await report.save();

    // Notify resident
    await Notification.create({
      user: report.resident,
      message: "Admin added a comment to your report"
    });

    res.json(report.comments);

  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
};


// ADMIN: Analytics by Purok
exports.getPurokAnalytics = async (req, res) => {
  try {
    const analytics = await Report.aggregate([
      {
        $group: {
          _id: "$purok",
          totalReports: { $sum: 1 }
        }
      },
      {
        $sort: { totalReports: -1 }
      }
    ]);

    res.json(analytics);

  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
};


// ADMIN: Dashboard Summary
exports.getDashboardSummary = async (req, res) => {
  try {

    const totalReports = await Report.countDocuments();

    const pending = await Report.countDocuments({
      status: "pending"
    });

    const inProgress = await Report.countDocuments({
      status: "in_progress"
    });

    const resolved = await Report.countDocuments({
      status: "resolved"
    });

    res.json({
      totalReports,
      pending,
      inProgress,
      resolved
    });

  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
};