import mongoose from "mongoose";

const tradeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  date: { type: Date, default: Date.now },
  expiry: { type: String, required: true },
  index: { type: String, default: "NIFTY" },
  strategy: { type: String, default: "STRANGLE" },
  optionType: { type: String, enum: ["CALL", "PUT"], required: true },
  strikePrice: { type: Number, required: true },
  buySell: { type: String, enum: ["BUY", "SELL"], required: true },
  price: { type: Number, required: true },
  ltp: { type: Number, default: 0 },
  status: { type: String, enum: ["Open", "Closed"], default: "Open" },
});

tradeSchema.virtual('profitPoints').get(function () {
  if (this.ltp == null || this.price == null) return 0;
  return this.buySell === 'BUY' ? this.ltp - this.price : this.price - this.ltp;
});

export default mongoose.model('Trade', tradeSchema);