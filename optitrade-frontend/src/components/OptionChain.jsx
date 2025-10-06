import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';

export default function OptionChain() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [optionChain, setOptionChain] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [index] = useState('NIFTY');
  const [expiry] = useState('2025-10-07');

  const fetchOptionChain = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Session expired, please log in again');
      logout();
      navigate('/login');
      return;
    }
    setLoading(true);
    try {
      const response = await axios.get(
        `http://localhost:3001/api/option-chain/${index}?expiry=${expiry}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (Array.isArray(response.data) && response.data.length > 0) {
        setOptionChain(response.data);
        setError('');
      } else {
        setError('No option chain data found for this expiry');
        setOptionChain([]);
      }
    } catch (error) {
      if (error.response?.status === 401) {
        setError('Session expired, please log in again');
        logout();
        navigate('/login');
      } else {
        setError('Failed to fetch option chain: ' + (error.response?.data.error || error.message));
        setOptionChain([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOptionChain();
  }, []);

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-2">Option Chain - {index} (Expiry: {expiry})</h3>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      {loading && <p className="text-blue-500">Loading option chain...</p>}
      {optionChain.length > 0 ? (
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
                <td className="p-2">{item.CE?.lastPrice?.toFixed(2) || 'N/A'}</td>
                <td className="p-2">{item.PE?.lastPrice?.toFixed(2) || 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        !loading && <p className="text-gray-500">No data available</p>
      )}
    </div>
  );
}