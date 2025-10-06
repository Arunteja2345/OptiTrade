import { useState, useEffect } from 'react';
  import axios from 'axios';
  import TradeForm from '../components/TradeForm.jsx';
  import TradeList from '../components/TradeList.jsx';
  import OptionChain from '../components/OptionChain.jsx';
  import { useAuth } from '../context/AuthContext.jsx';
  import { useNavigate } from 'react-router-dom';
  import { Bar } from 'react-chartjs-2';
  import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

  ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

  export default function Dashboard() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [trades, setTrades] = useState([]);
    const [summary, setSummary] = useState({ totalTrades: 0, totalPoints: '0.00' });

    const fetchTrades = async () => {
      try {
        const response = await axios.get('http://localhost:3001/api/trades');
        setTrades(response.data);
      } catch (error) {
        console.error('Error fetching trades:', error);
      }
    };

    const fetchSummary = async () => {
      try {
        const response = await axios.get('http://localhost:3001/api/trades/summary');
        setSummary(response.data);
      } catch (error) {
        console.error('Error fetching summary:', error);
      }
    };

    useEffect(() => {
      fetchTrades();
      fetchSummary();
    }, []);

    const handleUpdateLTPs = async () => {
      try {
        const response = await axios.patch('http://localhost:3001/api/trades/update-ltp');
        setTrades(response.data.trades);
      } catch (error) {
        console.error('Error updating LTPs:', error);
      }
    };

    const chartData = {
      labels: trades.map((trade) => `${trade.index} ${trade.strikePrice}`),
      datasets: [
        {
          label: 'Profit Points',
          data: trades.map((trade) => trade.profitPoints),
          backgroundColor: 'rgba(59, 130, 246, 0.5)',
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 1,
        },
      ],
    };

    return (
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">OptiTrade Dashboard</h1>
          <div>
            <span className="mr-4">Welcome, {user?.email}</span>
            <button
              onClick={() => {
                logout();
                navigate('/login');
              }}
              className="bg-red-500 text-white p-2 rounded-md hover:bg-red-600"
            >
              Logout
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h2 className="text-xl font-semibold mb-2">Create Trade</h2>
            <TradeForm onTradeCreated={fetchTrades} />
            <h2 className="text-xl font-semibold mt-4 mb-2">Trades</h2>
            <button
              onClick={handleUpdateLTPs}
              className="mb-4 bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600"
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
                  title: { display: true, text: 'Trade Profit Points' },
                },
              }}
            />
          </div>
          <div>
            <h2 className="text-xl font-semibold mb-2">Option Chain</h2>
            <OptionChain />
          </div>
        </div>
      </div>
    );
  }