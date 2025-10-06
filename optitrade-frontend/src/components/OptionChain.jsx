import { useState, useEffect } from 'react';
  import axios from 'axios';
  import DatePicker from 'react-datepicker';
  import 'react-datepicker/dist/react-datepicker.css';

  export default function OptionChain() {
    const [symbol, setSymbol] = useState('NIFTY');
    const [expiry, setExpiry] = useState('2025-10-28');
    const [optionChain, setOptionChain] = useState([]);
    const [error, setError] = useState('');

    const fetchOptionChain = async () => {
      try {
        const response = await axios.get(
          `http://localhost:3001/api/option-chain/${symbol}${expiry ? `?expiry=${expiry}` : ''}`
        );
        setOptionChain(response.data);
        setError('');
      } catch (error) {
        setError(error.response?.data.error || 'Failed to fetch option chain');
      }
    };

    useEffect(() => {
      fetchOptionChain();
    }, [symbol, expiry]);

    return (
      <div className="bg-white p-4 rounded-lg shadow-md">
        <div className="flex space-x-4 mb-4">
          <div>
            <label className="block text-sm font-medium">Symbol</label>
            <select
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              className="p-2 border rounded-md"
            >
              <option value="NIFTY">NIFTY</option>
              <option value="BANKNIFTY">BANKNIFTY</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">Expiry</label>
            <DatePicker
              selected={expiry ? new Date(expiry) : null}
              onChange={(date) => setExpiry(date ? date.toISOString().split('T')[0] : '')}
              dateFormat="yyyy-MM-dd"
              placeholderText="Select expiry date"
              className="p-2 border rounded-md"
            />
          </div>
          <button
            onClick={fetchOptionChain}
            className="bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600 mt-6"
          >
            Fetch
          </button>
        </div>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <table className="w-full table-auto">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2">Strike Price</th>
              <th className="p-2">Call LTP</th>
              <th className="p-2">Put LTP</th>
            </tr>
          </thead>
          <tbody>
            {optionChain.map((item) => (
              <tr key={item.strikePrice} className="border-t">
                <td className="p-2">{item.strikePrice}</td>
                <td className="p-2">{item.CE?.lastPrice ?? 'N/A'}</td>
                <td className="p-2">{item.PE?.lastPrice ?? 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }