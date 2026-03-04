const express = require("express");
const Report = require("../models/Report");

const router = express.Router();

router.get("/health", (req, res) => {
  res.json({ success: true, message: "API is running" });
});

router.get("/reports", async (req, res, next) => {
  try {
    const reports = await Report.find().sort({ createdAt: -1 });
    res.json({ success: true, data: reports });
  } catch (error) {
    next(error);
  }
});

router.get("/reports/:id", async (req, res, next) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ success: false, message: "Report not found" });
    }
    res.json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
});

router.post("/reports", async (req, res, next) => {
  try {
    const report = await Report.create(req.body);
    res.status(201).json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
});

router.delete("/reports/:id", async (req, res, next) => {
  try {
    const report = await Report.findByIdAndDelete(req.params.id);
    if (!report) {
      return res.status(404).json({ success: false, message: "Report not found" });
    }
    res.json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
