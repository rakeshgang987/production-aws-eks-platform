// // 
// const express = require("express");
// require("dotenv").config();

// const app = express();
// const PORT = process.env.PORT || 3000;

// app.use(express.json());

// app.get("/health", (req, res) => {
//   res.status(200).json({
//     status: "healthy",
//     service: "backend-api",
//     timestamp: new Date().toISOString()
//   });
// });

// app.get("/api/products", (req, res) => {
//   const products = [
//     {
//       id: 1,
//       name: "Laptop",
//       price: 75000
//     },
//     {
//       id: 2,
//       name: "Keyboard",
//       price: 2500
//     }
//   ];

//   res.status(200).json(products);
// });

// app.listen(PORT, () => {
//   console.log(`Backend API running on port ${PORT}`);
// });
const app = require("./app");
require("dotenv").config();

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Backend API running on port ${PORT}`);
});