import { useState, useEffect } from "react";

import axios from "axios";
import TradeForm from "../components/TradeForm.jsx";
import TradeList from "../components/TradeList.jsx";
import OptionChain from "../components/OptionChain.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { Route, Routes, Link, useNavigate } from "react-router-dom";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function Dashboard() {
  const { user, logout, token } = useAuth();
  const navigate = useNavigate();
  const [trades, setTrades] = useState([]);
  const [summary, setSummary] = useState({
    totalTrades: 0,
    totalPoints: "0.00",
  });
  const [error, setError] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchTrades = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Session expired, please log in again");
      logout();
      navigate("/login");
      return;
    }
    try {
      const response = await axios.get("http://localhost:3001/api/trades", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (Array.isArray(response.data)) {
        setTrades(
          response.data.map((trade) => ({
            ...trade,
            profitPoints: trade.profitPoints != null ? trade.profitPoints : 0,
          }))
        );
        setError("");
      } else {
        setError("Invalid trades data received");
      }
    } catch (error) {
      if (error.response?.status === 401) {
        setError("Session expired, please log in again");
        logout();
        navigate("/login");
      } else {
        setError(
          "Failed to fetch trades: " +
            (error.response?.data.error || error.message)
        );
        console.error("Error fetching trades:", error);
      }
    }
  };

  const fetchSummary = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Session expired, please log in again");
      logout();
      navigate("/login");
      return;
    }
    try {
      const response = await axios.get(
        "http://localhost:3001/api/trades/summary",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setSummary(response.data);
    } catch (error) {
      if (error.response?.status === 401) {
        setError("Session expired, please log in again");
        logout();
        navigate("/login");
      } else {
        setError(
          "Failed to fetch summary: " +
            (error.response?.data.error || error.message)
        );
        console.error("Error fetching summary:", error);
      }
    }
  };

  useEffect(() => {
    if (user && localStorage.getItem("token")) {
      fetchTrades();
      fetchSummary();
    } else {
      setError("Please log in to view the dashboard");
      logout();
      navigate("/login");
    }
  }, [user, navigate]);

  const handleUpdateLTPs = async () => {
    if (!token) {
      setError("Session expired, please log in again");
      logout();
      navigate("/login");
      return;
    }
    setIsUpdating(true); // Add loading state
    try {
      const response = await axios.patch(
        `${import.meta.env.VITE_API_URL}/api/trades/update-ltp`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log("Update LTP response:", response.data); // Debug log
      if (response.data?.trades && Array.isArray(response.data.trades)) {
        setTrades(
          response.data.trades.map((trade) => ({
            ...trade,
            profitPoints: trade.profitPoints ?? 0,
          }))
        );
        setError("");
        fetchTrades();
        fetchSummary();
      } else {
        setError(
          response.data?.message ||
            "No trades updated or invalid response format"
        );
        setTrades([]); // Reset trades if none returned
      }
    } catch (error) {
      console.error("Full error:", error);
      if (!error.response) {
        setError("Network error: Unable to reach the server");
      } else if (error.response?.status === 401) {
        setError("Session expired, please log in again");
        logout();
        navigate("/login");
      } else {
        setError(
          `Failed to update LTPs: ${
            error.response?.data?.error || error.message
          }`
        );
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const chartData = {
    labels: trades.map((trade) => `${trade.index} ${trade.strikePrice}`),
    datasets: [
      {
        label: "Profit Points",
        data: trades.map((trade) =>
          trade.profitPoints != null ? trade.profitPoints : 0
        ),
        backgroundColor: "rgba(59, 130, 246, 0.5)",
        borderColor: "rgba(59, 130, 246, 1)",
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">OptiTrade Dashboard</h1>
        <div>
          <span className="mr-4">Welcome, {user?.email || "Guest"}</span>
          <button
            onClick={() => {
              logout();
              navigate("/login");
            }}
            className="bg-red-500 text-white p-2 rounded-md hover:bg-red-600"
          >
            Logout
          </button>
        </div>
      </div>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h2 className="text-xl font-semibold mb-2">Create Trade</h2>
          <TradeForm onTradeCreated={fetchTrades} />
          <h2 className="text-xl font-semibold mt-4 mb-2">Trades</h2>
          <button
            onClick={handleUpdateLTPs}
            className="mb-4 bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600 disabled:bg-gray-400"
            disabled={!trades.length}
          >
            Update LTPs
          </button>

          <TradeList trades={trades} onTradeUpdated={fetchTrades} />
          <h2 className="text-xl font-semibold mt-4 mb-2">Summary</h2>
          <p>Total Trades: {summary.totalTrades}</p>
          <p>Total Profit Points: {summary.totalPoints}</p>
          <h2 className="text-xl font-semibold mt-4 mb-2">Profit Chart</h2>
          <Bar
            data={chartData}
            options={{
              scales: {
                y: { beginAtZero: true },
              },
              plugins: {
                legend: { display: true },
                title: { display: true, text: "Trade Profit Points" },
              },
            }}
          />
        </div>
        <div>
          <Link
            to="/option-chain"
            className="
              inline-block
              bg-gradient-to-r from-blue-500 to-indigo-600
              text-white
              font-semibold
              px-6 py-3
              rounded-xl
              shadow-lg
              hover:from-blue-600 hover:to-indigo-700
              transition
              duration-300
              ease-in-out
              transform
              hover:-translate-y-1
              hover:scale-105
            "
          >
            View Option Chain
          </Link>
        </div>
      </div>
    </div>
  );
}
