const dotenv = require("dotenv");
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const routes = require("./routes/index");

// ✅ Load .env first!
dotenv.config();

// Now connect to MongoDB
const connectDB = require("./config/db");
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

app.use(routes);
app.use("/api/v1", routes);

// Sample Route
app.get("/", (req, res) => {
  res.send("Welcome to ExpressJS!");
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
