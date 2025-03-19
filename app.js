import express from "express";
import pkg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pkg;

const app = express();

app.use(express.json());

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

pool.connect((err, client, release) => {
  if (err) {
    console.error("Database connection failed:", err.stack);
  } else {
    console.log("Connected to the database successfully!");
    release();
  }
});

app.get("/api/users", async (req, res) => {
  try {
    let result = await pool.query("SELECT * FROM students");
    console.log("Data fetched successfully");
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Databse error:", error);
    res.status(500).send("Database error");
  }
});

app.post("/api/users/create", async (req, res) => {
  try {
    const { reg_no, s_name } = req.body;
    const newStudent = await pool.query(
      "INSERT INTO students (reg_no,s_name) VALUES ($1, $2) RETURNING *",
      [reg_no, s_name]
    );
    if (newStudent.rows.length === 0) {
      return res.status(400).send("Invalid data");
    } else {
      console.log("Data inserted successfully");
      res.status(200).json(newStudent.rows[0]);
    }
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).send("Database error");
  }
});

app.get("/api/users/data", async (req, res) => {
  try {
    const { filter, value } = req.query;
    let query = await pool.query("SELECT * FROM students");
    console.log(`${filter}:${value}`);
    if (filter && value) {
      query = await pool.query(`SELECT * FROM students WHERE ${filter} = $1`, [
        value,
      ]);
      return res.status(200).json(query.rows);
    } else {
      const query = await pool.query("SELECT * FROM students");
      res.status(200).json(query.rows);
    }
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).send("Database error");
  }
});

app.get("/api/users/:id", async (req, res) => {
  try {
    let parseid = parseInt(req.params.id);
    if (isNaN(parseid)) {
      return res.status(400).send("Invalid id");
    }
    console.log(parseid);

    let result = await pool.query("SELECT * FROM students WHERE s_id = $1", [
      parseid,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).send("user not found");
    }
    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).send("Database error");
  }
});

const port = process.env.PORT || 3030;

app.listen(port, () => {
  console.log(`Server is running on port, ${port}.`);
});
