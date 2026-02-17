const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on("connect", () => {
  console.log("PostgreSQL connected");
});

// Helper function to set shop context for Row-Level Security
async function setShopContext(client, shopId) {
  if (!shopId) {
    throw new Error('Shop ID is required for tenant isolation');
  }
  await client.query('SELECT set_current_shop($1)', [shopId]);
}

module.exports = { pool, setShopContext };
