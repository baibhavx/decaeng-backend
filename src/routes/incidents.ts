import express, { Router } from "express";
import { Pool } from "pg";
import dotenv from "dotenv";
import OpenAI from "openai";


dotenv.config();
const router = Router();

// Initialize PostgreSQL connection
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "incident_db",
  password: process.env.POSTGRES_PASSWORD,
  port: 5432,
});

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Function to generate embeddings
async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      input: text,
      model: "text-embedding-ada-002",
    });
    return response.data[0].embedding;
  } catch (error) {
    console.error("❌ Failed to generate embedding:", error);
    throw new Error("Embedding generation failed");
  }
}

// Route: Upload a new incident
// @ts-ignore
router.post("/", async (req, res) => {
  try {
    const { title, description } = req.body;

    if (!title || !description) {
      return res.status(400).json({ error: "Title and description are required." });
    }

    const fullText = `${title} - ${description}`;
    const embedding = await generateEmbedding(fullText);

    const result = await pool.query(
      "INSERT INTO incidents (title, description, embedding) VALUES ($1, $2, $3::vector) RETURNING *",
      [title, description, `[${embedding.join(",")}]`]
    );

    res.status(201).json({
      message: "✅ Incident created successfully!",
      incident: result.rows[0],
    });
  } catch (error) {
    console.error("❌ Error creating incident:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;

