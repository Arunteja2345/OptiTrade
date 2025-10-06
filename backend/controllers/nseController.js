import axios from "axios";
import { parseGrowwOptionChain } from "../utils/parser.js";

let cache = {};
const CACHE_TTL = 5 * 60 * 1000;

export const getOptionChain = async (req, res) => {
  const symbol = req.params.symbol.toUpperCase();
  const expiry = req.query.expiry; // Get expiry from query parameter
  const now = Date.now();

  // Create cache key with symbol and expiry (if provided)
  const cacheKey = expiry ? `${symbol}|${expiry}` : symbol;

  if (cache[cacheKey] && now - cache[cacheKey].timestamp < CACHE_TTL) {
    return res.json(cache[cacheKey].data);
  }

  try {
    let url;
    if (symbol === "NIFTY") {
      url = "https://groww.in/options/nifty";
    } else if (symbol === "BANKNIFTY") {
      url = "https://groww.in/options/bank-nifty";
    } else {
      return res
        .status(400)
        .json({ error: "Only NIFTY and BANKNIFTY supported by Groww scraper" });
    }

    // Append expiry to URL if provided and valid
    if (expiry) {
      try {
        const date = new Date(expiry);
        if (isNaN(date.getTime())) throw new Error("Invalid date");
        const formattedExpiry = date.toISOString().split("T")[0]; // YYYY-MM-DD
        url += `?expiry=${formattedExpiry}`;
      } catch (err) {
        return res.status(400).json({ error: "Invalid expiry format, use YYYY-MM-DD" });
      }
    }

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
    console.log(`Fetched Groww option chain for ${symbol}${expiry ? ` with expiry ${expiry}` : ""}`);

    const parsedRecords = parseGrowwOptionChain(html);

    cache[cacheKey] = { data: parsedRecords, timestamp: now };
    res.json(parsedRecords);
  } catch (error) {
    console.error("Groww scraper error:", error.message);
    res.status(500).json({ error: "Failed to fetch Groww data", details: error.message });
  }
};