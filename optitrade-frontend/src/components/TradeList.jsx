import { useAuth } from '../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function TradeList({ trades, onTradeUpdated }) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleCloseTrade = async (tradeId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Session expired, please log in again');
      logout();
      navigate('/login');
      return;
    }
    try {
      await axios.patch(
        `http://localhost:3001/api/trades/${tradeId}/close`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onTradeUpdated();
    } catch (error) {
      if (error.response?.status === 401) {
        alert('Session expired, please log in again');
        logout();
        navigate('/login');
      } else {
        alert(error.response?.data.error || 'Failed to close trade');
      }
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <table className="w-full table-auto">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2">Index</th>
            <th className="p-2">Strike Price</th>
            <th className="p-2">Option Type</th>
            <th className="p-2">Buy/Sell</th>
            <th className="p-2">Price</th>
            <th className="p-2">LTP</th>
            <th className="p-2">Profit Points</th>
            <th className="p-2">Status</th>
            <th className="p-2">Action</th>
          </tr>
        </thead>
        <tbody>
          {trades.length === 0 ? (
            <tr>
              <td colSpan="9" className="p-2 text-center text-gray-500">
                No trades available
              </td>
            </tr>
          ) : (
            trades.map((trade) => (
              <tr key={trade._id} className="border-t">
                <td className="p-2">{trade.index}</td>
                <td className="p-2">{trade.strikePrice}</td>
                <td className="p-2">{trade.optionType}</td>
                <td className="p-2">{trade.buySell}</td>
                <td className="p-2">{trade.price?.toFixed(2)}</td>
                <td className="p-2">{trade.ltp?.toFixed(2) || 'N/A'}</td>
                <td className="p-2">{trade.profitPoints != null ? trade.profitPoints.toFixed(2) : '0.00'}</td>
                <td className="p-2">{trade.status || 'open'}</td>
                <td className="p-2">
                  {trade.status === 'Open' && (
                    <button
                      onClick={() => handleCloseTrade(trade._id)}
                      className="bg-red-500 text-white px-2 py-1 rounded-md hover:bg-red-600"
                    >
                      Close Trade
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