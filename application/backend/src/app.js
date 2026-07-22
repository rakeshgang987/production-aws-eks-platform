const express = require("express");
const cors = require("cors");
const productRoutes = require("./routes/productRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    service: "backend-api",
    timestamp: new Date().toISOString()
  });
});

app.use("/api/products", productRoutes);

module.exports = app;