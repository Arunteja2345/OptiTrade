import Trade from "../models/Trade.js";
import axios from "axios";
import { parseGrowwOptionChain } from "../utils/parser.js";

export const createTrade = async (req, res) => {
  try {
    const trade = new Trade({ ...req.body, userId: req.user.userId });
    await trade.save();
    res.status(201).json(trade);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const getAllTrades = async (req, res) => {
  const trades = await Trade.find({ userId: req.user.userId });
  res.json(
    trades.map((t) => ({
      ...t.toObject(),
      profitPoints: t.profitPoints,
    }))
  );
};

export const updateTrade = async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const trade = await Trade.findOneAndUpdate(
    { _id: id, userId: req.user.userId },
    updates,
    { new: true }
  );
  if (!trade) return res.status(404).json({ error: "Trade not found" });

  res.json({ ...trade.toObject(), profitPoints: trade.profitPoints });
};

export const getSummary = async (req, res) => {
  const trades = await Trade.find({ userId: req.user.userId });
  let totalPoints = 0;

  trades.forEach((t) => {
    totalPoints += t.profitPoints;
  });

  res.json({
    totalTrades: trades.length,
    totalPoints: totalPoints.toFixed(2),
  });
};

export const updateLTPs = async (req, res) => {
  try {
    const trades = await Trade.find({ userId: req.user.userId, status: "Open" });
    const updatedTrades = [];
    
    // Group trades by index and expiry
    const tradeGroups = {};
    for (const trade of trades) {
      const key = `${trade.index}|${trade.expiry}`;
      if (!tradeGroups[key]) {
        tradeGroups[key] = [];
      }
      tradeGroups[key].push(trade);
    }

    const optionChains = {};
    for (const key in tradeGroups) {
      const [index, expiry] = key.split("|");
      if (!index || !expiry) {
        console.log(`Invalid index or expiry for key: ${key}`);
        continue;
      }

      // Validate and format expiry (expecting YYYY-MM-DD)
      let formattedExpiry;
      try {
        const date = new Date(expiry);
        if (isNaN(date.getTime())) throw new Error("Invalid date");
        formattedExpiry = date.toISOString().split("T")[0]; // YYYY-MM-DD
      } catch (err) {
        console.log(`Invalid expiry format for ${index}: ${expiry}`);
        continue;
      }

      // Construct URL based on index and expiry
      const baseUrl = index === "NIFTY" ? "https://groww.in/options/nifty" : "https://groww.in/options/bank-nifty";
      const url = `${baseUrl}?expiry=${formattedExpiry}`;

      try {
        const config = {
          method: "get",
          url,
          headers: {
            "user-agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36",
            accept:
              "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
          },
        };
        const { data: html } = await axios.request(config);
        console.log(`Fetched option chain for ${index} with expiry ${formattedExpiry}`);
        optionChains[key] = parseGrowwOptionChain(html);
      } catch (err) {
        console.error(`Failed to fetch option chain for ${index} expiry ${formattedExpiry}:`, err.message);
        continue;
      }
    }

    for (const key in tradeGroups) {
      const [index, expiry] = key.split("|");
      const records = optionChains[key];
      if (!records) continue;

      for (const trade of tradeGroups[key]) {
        console.log(
          `Processing trade: ID=${trade._id}, index=${index}, expiry=${expiry}, strike=${trade.strikePrice}, type=${trade.optionType}`
        );
        const item = records.find(
          (r) => Number(r.strikePrice) === Number(trade.strikePrice)
        );
        if (!item) {
          console.log(
            `No record found for ${index} strike=${trade.strikePrice} expiry=${expiry}`
          );
          continue;
        }
        const ltp =
          trade.optionType === "CALL" ? item.CE?.lastPrice : item.PE?.lastPrice;
        if (ltp !== null && ltp !== undefined) {
          trade.ltp = ltp;
          await trade.save();
          updatedTrades.push(trade);
        } else {
          console.log(
            `No LTP found for ${index} strike=${trade.strikePrice} type=${trade.optionType} expiry=${expiry}`
          );
        }
      }
    }

    res.json({
      message: `Updated ${updatedTrades.length} trades`,
      trades: updatedTrades,
    });
  } catch (err) {
    console.error("Error in updateLTPs:", err);
    res.status(500).json({ error: "Failed to update LTPs", details: err.message });
  }
};

export const closeTrade = async (req, res) => {
  try {
    const trade = await Trade.findOne({ _id: req.params.id, userId: req.user.userId });
    if (!trade) return res.status(404).json({ error: 'Trade not found' });
    if (trade.status === 'Closed') return res.status(400).json({ error: 'Trade already closed' });
    
    trade.status = 'Closed';
    await trade.save();
    res.json({ ...trade.toObject({ virtuals: true }), message: 'Trade closed successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};