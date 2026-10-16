const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");
require("dotenv").config();

const schemaPath = path.join(
  __dirname,
  "../../Database/lifepredict_schema.sql"
);

const runDatabaseSetup = async () => {
  let connection;

  try {
    console.log("Connecting to LifePredict database...");

    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: Number(process.env.DB_PORT),
      multipleStatements: true,
    });

    console.log("Database connection successful.");

    const schema = fs.readFileSync(schemaPath, "utf8");

    console.log("Executing LifePredict schema...");

    await connection.query(schema);

    console.log("=================================");
    console.log("LifePredict database setup done!");
    console.log("All tables are ready.");
    console.log("=================================");
  } catch (error) {
  console.error("=================================");
  console.error("DATABASE SETUP FAILED");
  console.error("=================================");
  console.error("Error Code:", error.code);
  console.error("Error Number:", error.errno);
  console.error("Error Message:", error.message);
} finally {
    if (connection) {
      await connection.end();
    }
  }
};

runDatabaseSetup();