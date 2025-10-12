import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function TradeList({ trades = [], onTradeUpdated }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [loadingId, setLoadingId] = useState(null);

  const handleCloseTrade = async (tradeId) => {
    console.log("Closing trade:", tradeId);

    const token = localStorage.getItem("token");
    if (!token) {
      alert("Session expired, please log in again");
      logout();
      navigate("/login");
      return;
    }

    setLoadingId(tradeId);
    try {
      await axios.patch(
        `http://localhost:3001/api/trades/${tradeId}/close`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log("Trade closed successfully");
      await onTradeUpdated?.();
    } catch (error) {
      console.error("Error closing trade:", error);
      if (error.response?.status === 401) {
        alert("Session expired, please log in again");
        logout();
        navigate("/login");
      } else {
        alert(error.response?.data?.error || "Failed to close trade");
      }
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div 
    className="bg-white p-4 rounded-xl shadow-lg border border-gray-200 w-full overflow-x-auto">
      <table 
      className="min-w-full text-sm text-gray-700 border border-gray-300 border-collapse table-fixed">
        <thead>
          <tr 
          className="bg-gray-100 text-left">
            {[
              "Index",
              "Expiry",
              "Strike Price",
              "Option Type",
              "Buy/Sell",
              "Price",
              "LTP",
              "Profit Points",
              "Status",
              "Action",
            ].map((head) => (
              <th
                key={head}
                className="p-3 font-semibold text-gray-700 truncate border-b border-gray-300"
              >
                {head}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {trades.length === 0 ? (
            <tr>
              <td
                colSpan="10"
                className="text-center text-gray-500 p-4 border-b border-gray-200"
              >
                No trades available
              </td>
            </tr>
          ) : (
            trades.map((trade) => (
              <tr
                key={trade._id}
                className="border-b hover:bg-gray-50 transition-colors"
              >
                <td className="p-3 truncate border-b border-gray-200">
                  {trade.index}
                </td>
                <td className="p-3 truncate border-b border-gray-200">
                  {trade.expiry || "—"}
                </td>
                <td className="p-3 truncate border-b border-gray-200">
                  {trade.strikePrice}
                </td>
                <td className="p-3 truncate border-b border-gray-200">
                  {trade.optionType}
                </td>
                <td className="p-3 truncate border-b border-gray-200">
                  {trade.buySell}
                </td>
                <td className="p-3 truncate border-b border-gray-200">
                  {trade.price?.toFixed(2) || "0.00"}
                </td>
                <td className="p-3 truncate border-b border-gray-200">
                  {trade.ltp?.toFixed(2) || "N/A"}
                </td>
                <td
                  className={`p-3 font-medium truncate border-b border-gray-200 ${trade.profitPoints > 0
                      ? "text-green-600"
                      : trade.profitPoints < 0
                        ? "text-red-600"
                        : "text-gray-700"
                    }`}
                >
                  {trade.profitPoints != null
                    ? trade.profitPoints.toFixed(2)
                    : "0.00"}
                </td>
                <td className="p-3 truncate border-b border-gray-200">
                  <span
                    className={`px-2 py-1 rounded-md text-xs ${trade.status === "Open"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-green-100 text-green-800"
                      }`}
                  >
                    {trade.status || "Open"}
                  </span>
                </td>
                <td className="p-3 truncate border-b border-gray-200">
                  {trade.status === "Open" && (
                    <button
                      onClick={() => handleCloseTrade(trade._id)}
                      disabled={loadingId === trade._id}
                      className={`px-3 py-1 rounded-md font-medium text-white transition-colors ${loadingId === trade._id
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-red-500 hover:bg-red-600"
                        }`}
                    >
                      {loadingId === trade._id ? "Closing..." : "Close Trade"}
                    </button>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
