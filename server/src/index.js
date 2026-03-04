require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const apiRoutes = require("./routes/api");
const decompressRoutes = require("./routes/decompress");
const errorHandler = require("./middleware/errorHandler");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:3000" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

app.use("/api", apiRoutes);
app.use("/api/decompress", decompressRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
