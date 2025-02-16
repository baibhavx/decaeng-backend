import express from "express";
import dotenv from "dotenv";
import incidentRoutes from "./routes/incidents";
import searchRoutes from "./routes/search";  // Import the new search route

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(express.json());

// Routes
app.use("/incidents", incidentRoutes);
app.use("/search", searchRoutes);  // Register the search route

app.get("/", (req, res) => {
  res.send("Incident Management API is running!");
});

app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
});

