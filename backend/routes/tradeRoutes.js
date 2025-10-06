import express from "express";
import {
  createTrade,
  getAllTrades,
  updateTrade,
  getSummary,
  updateLTPs
} from "../controllers/tradeController.js";

const router = express.Router();

router.post("/", createTrade);
router.get("/", getAllTrades);
router.patch("/update-ltp", updateLTPs);
router.patch("/:id", updateTrade);
router.get("/summary", getSummary);

export default router;