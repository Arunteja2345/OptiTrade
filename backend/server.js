import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import tradeRoutes from "./routes/tradeRoutes.js";
import nseRoutes from "./routes/nseRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import { authMiddleware } from "./middlewares/auth.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, ".env") });

const app = express();
app.use(express.json());
app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:3000" }));

console.log("MONGO_URI:", process.env.MONGO_URI);
console.log("PORT:", process.env.PORT);
console.log("JWT_SECRET:", process.env.JWT_SECRET);

app.use("/api/auth", authRoutes);
app.use("/api/trades", authMiddleware, tradeRoutes);
app.use("/api/option-chain", authMiddleware, nseRoutes);

const PORT = process.env.PORT || 3001;

if (!process.env.MONGO_URI || !process.env.JWT_SECRET) {
  console.error("❌ Error: MONGO_URI and JWT_SECRET must be defined in .env file");
  process.exit(1);
}

const connectDB = async () => {
  let retries = 5;
  while (retries) {
    try {
      await mongoose.connect(process.env.MONGO_URI, {
        retryWrites: true,
        w: "majority",
      });
      console.log("✅ MongoDB Connected");
      break;
    } catch (err) {
      console.error("MongoDB connection error:", err);
      retries -= 1;
      if (!retries) process.exit(1);
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
};

connectDB().then(() => {
  app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
});