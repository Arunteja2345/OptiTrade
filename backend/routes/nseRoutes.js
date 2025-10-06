import express from "express";
import { getOptionChain } from "../controllers/nseController.js";

const router = express.Router();
router.get("/:symbol", getOptionChain);

export default router;