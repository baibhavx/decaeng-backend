import express, { Router, Request, Response } from "express";
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

// Function to generate an AI resolution using OpenAI GPT
async function generateResolution(query: string, incidents: {title: string; description: string}[]): Promise<string> {
  const messages: ChatCompletionMessageParamp[] = [
    { role: "system", content: "You are an AI incident response assistant. Given past incidents, suggest a resolution for the current issue." },
    { role: "user", content: `User query: "${query}"\n\nRelevant past incidents:\n${incidents.map((i, idx) => `${idx + 1}. ${i.title} - ${i.description}`).join("\n")}\n\nWhat should be the resolution?` },
  ];

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // Uses OpenAI's latest GPT-4-turbo model
      messages,
      max_tokens: 300,
    });

    return response.choices[0].message.content || "No resolution found.";
  } catch (error) {
    console.error("❌ Error generating AI resolution:", error);
    return "AI resolution generation failed.";
  }
}

// Route: Search for similar incidents and generate AI resolution
router.post("/", async (req: Request, res: Response) => {
  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({ error: "Query text is required." });
    }

    // Generate embedding for the search query
    const queryEmbedding = await generateEmbedding(query);
    const formattedEmbedding = `[${queryEmbedding.join(",")}]`;

    // Perform similarity search using cosine distance
    const result = await pool.query(
      `SELECT id, title, description, embedding <=> $1 AS similarity
       FROM incidents
       ORDER BY similarity ASC
       LIMIT 5;`,  // Fetch top 5 similar incidents
      [formattedEmbedding]
    );

    const similarIncidents = result.rows;

    // Generate an AI-powered resolution based on retrieved incidents
    const aiResolution = await generateResolution(query, similarIncidents);

    res.json({
      query,
      results: similarIncidents,
      resolution: aiResolution,
    });
  } catch (error) {
    console.error("❌ Error searching incidents:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;

