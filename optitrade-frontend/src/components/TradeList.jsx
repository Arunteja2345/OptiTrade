import { useState } from 'react';
import axios from 'axios';

export default function TradeList({ trades, onTradeUpdated }) {
  const [editTradeId, setEditTradeId] = useState(null);
  const [strikePrice, setStrikePrice] = useState('');

  const handleUpdate = async (id) => {
    try {
      await axios.patch(`http://localhost:3001/api/trades/${id}`, { strikePrice: Number(strikePrice) });
      setEditTradeId(null);
      setStrikePrice('');
      onTradeUpdated();
    } catch (error) {
      console.error('Error updating trade:', error);
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <table className="w-full table-auto">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2">Expiry</th>
            <th className="p-2">Index</th>
            <th className="p-2">Option Type</th>
            <th className="p-2">Strike Price</th>
            <th className="p-2">Buy/Sell</th>
            <th className="p-2">Price</th>
            <th className="p-2">LTP</th>
            <th className="p-2">Profit Points</th>
            <th className="p-2">Status</th>
            <th className="p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {trades.map((trade) => (
            <tr key={trade._id} className="border-t">
              <td className="p-2">{trade.expiry}</td>
              <td className="p-2">{trade.index}</td>
              <td className="p-2">{trade.optionType}</td>
              <td className="p-2">
                {editTradeId === trade._id ? (
                  <input
                    type="number"
                    value={strikePrice}
                    onChange={(e) => setStrikePrice(e.target.value)}
                    className="w-full p-1 border rounded-md"
                  />
                ) : (
                  trade.strikePrice
                )}
              </td>
              <td className="p-2">{trade.buySell}</td>
              <td className="p-2">{trade.price}</td>
              <td className="p-2">{trade.ltp}</td>
              <td className="p-2">{trade.profitPoints}</td>
              <td className="p-2">{trade.status}</td>
              <td className="p-2">
                {editTradeId === trade._id ? (
                  <div>
                    <button
                      onClick={() => handleUpdate(trade._id)}
                      className="bg-green-500 text-white p-1 rounded-md mr-2"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditTradeId(null)}
                      className="bg-gray-500 text-white p-1 rounded-md"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setEditTradeId(trade._id);
                      setStrikePrice(trade.strikePrice);
                    }}
                    className="bg-blue-500 text-white p-1 rounded-md"
                  >
                    Edit
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}