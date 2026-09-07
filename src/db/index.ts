import mysql from "mysql2/promise";

const pool = await mysql.createPool({
  host: "localhost",
  user: "root",
  database: "db_blogapp_cicipyuk",
});

export default pool