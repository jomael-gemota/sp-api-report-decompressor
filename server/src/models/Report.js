const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Report name is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending",
    },
    originalFileName: {
      type: String,
      required: true,
    },
    outputFileName: {
      type: String,
    },
    fileSize: {
      type: Number,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Report", reportSchema);
