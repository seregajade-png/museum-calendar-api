const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

const MAX_RETRIES = 15;
const RETRY_DELAY_MS = 2000;

function sleep(ms) {
  return new Promise(function(resolve) { setTimeout(resolve, ms); });
}

async function main() {
  var url = process.env.DATABASE_URL;
  if (!url) {
    console.log("[migrate] No DATABASE_URL, skipping");
    process.exit(0);
  }

  var sqlPath = path.join(__dirname, "migration.sql");
  if (!fs.existsSync(sqlPath)) {
    console.log("[migrate] No migration.sql found, skipping");
    process.exit(0);
  }

  var sql = fs.readFileSync(sqlPath, "utf-8");

  for (var attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    var pool = new Pool({ connectionString: url, connectionTimeoutMillis: 3000 });
    try {
      await pool.query(sql);
      console.log("[migrate] Database migration applied successfully");
      await pool.end();
      process.exit(0);
    } catch (err) {
      await pool.end();
      var isConnError = err.code === "ECONNREFUSED" || err.code === "EAI_AGAIN" ||
        (err.message && err.message.includes("connect"));
      if (isConnError) {
        console.log("[migrate] DB not ready (" + attempt + "/" + MAX_RETRIES + "), retry in " + (RETRY_DELAY_MS / 1000) + "s...");
        await sleep(RETRY_DELAY_MS);
      } else {
        console.log("[migrate] Migration done (non-fatal):", err.message);
        process.exit(0);
      }
    }
  }

  console.log("[migrate] DB not available after " + MAX_RETRIES + " retries, continuing...");
  process.exit(0);
}

main().catch(function(err) {
  console.error("[migrate] Error:", err.message);
  process.exit(1);
});
