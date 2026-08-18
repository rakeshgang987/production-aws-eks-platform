const request = require("supertest");
const app = require("../src/app");

describe("Backend API", () => {
  test("GET /health should return healthy status", async () => {
    const response = await request(app).get("/health");

    expect(response.statusCode).toBe(200);
    expect(response.body.status).toBe("healthy");
    expect(response.body.service).toBe("backend-api");
  });

  test("GET /api/products should return products", async () => {
    const response = await request(app).get("/api/products");

    expect(response.statusCode).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);

    expect(response.body[0]).toHaveProperty("id");
    expect(response.body[0]).toHaveProperty("name");
    expect(response.body[0]).toHaveProperty("price");
  });
});
afterAll(async () => {
  const pool = require("../src/db");
  await pool.end();
});