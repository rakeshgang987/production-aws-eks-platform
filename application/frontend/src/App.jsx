import { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [products, setProducts] = useState([]);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");

  const fetchProducts = async () => {
    const response = await fetch("http://localhost:3000/api/products");
    const data = await response.json();
    setProducts(data);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const addProduct = async (event) => {
    event.preventDefault();

    await fetch("http://localhost:3000/api/products", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        price: Number(price),
      }),
    });

    setName("");
    setPrice("");

    fetchProducts();
  };

  return (
    <div className="app">
      <h1>Production AWS EKS Platform</h1>

      <p className="subtitle">
        Product Management Dashboard
      </p>

      <form onSubmit={addProduct} className="product-form">
        <input
          type="text"
          placeholder="Product name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
        />

        <input
          type="number"
          placeholder="Price"
          value={price}
          onChange={(event) => setPrice(event.target.value)}
          required
        />

        <button type="submit">
          Add Product
        </button>
      </form>

      <div className="products">
        <h2>Products</h2>

        {products.map((product) => (
          <div className="product-card" key={product.id}>
            <span>{product.name}</span>
            <strong>₹{product.price}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;