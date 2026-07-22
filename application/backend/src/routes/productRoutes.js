
// const express = require("express");

// const router = express.Router();

// const products = [
//   {
//     id: 1,
//     name: "Laptop",
//     price: 75000
//   },
//   {
//     id: 2,
//     name: "Keyboard",
//     price: 2500
//   }
// ];

// // GET /api/products
// router.get("/", (req, res) => {
//   res.status(200).json(products);
// });

// // POST /api/products
// router.post("/", (req, res) => {
//   const { name, price } = req.body;

//   if (!name || !price) {
//     return res.status(400).json({
//       error: "Product name and price are required"
//     });
//   }

//   const newProduct = {
//     id: products.length + 1,
//     name,
//     price
//   };

//   products.push(newProduct);

//   res.status(201).json(newProduct);
// });

// module.exports = router;
const express = require("express");
const pool = require("../db");

const router = express.Router();

// GET /api/products
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM products ORDER BY id"
    );

    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error fetching products:", error);

    res.status(500).json({
      error: "Failed to fetch products"
    });
  }
});

// POST /api/products
router.post("/", async (req, res) => {
  const { name, price } = req.body;

  if (!name || price === undefined) {
    return res.status(400).json({
      error: "Product name and price are required"
    });
  }

  try {
    const result = await pool.query(
      "INSERT INTO products (name, price) VALUES ($1, $2) RETURNING *",
      [name, price]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creating product:", error);

    res.status(500).json({
      error: "Failed to create product"
    });
  }
});

module.exports = router;