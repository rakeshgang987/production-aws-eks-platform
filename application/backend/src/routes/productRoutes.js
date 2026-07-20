// const express = require("express");

// const router = express.Router();

// router.get("/", (req, res) => {
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

// module.exports = router;
const express = require("express");

const router = express.Router();

const products = [
  {
    id: 1,
    name: "Laptop",
    price: 75000
  },
  {
    id: 2,
    name: "Keyboard",
    price: 2500
  }
];

// GET /api/products
router.get("/", (req, res) => {
  res.status(200).json(products);
});

// POST /api/products
router.post("/", (req, res) => {
  const { name, price } = req.body;

  if (!name || !price) {
    return res.status(400).json({
      error: "Product name and price are required"
    });
  }

  const newProduct = {
    id: products.length + 1,
    name,
    price
  };

  products.push(newProduct);

  res.status(201).json(newProduct);
});

module.exports = router;