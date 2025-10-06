import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import debounce from 'lodash.debounce';
import { useAuth } from '../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';

export default function TradeForm({ onTradeCreated }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    expiry: '',
    index: 'NIFTY',
    strategy: 'STRANGLE',
    optionType: 'CALL',
    strikePrice: '',
    buySell: 'BUY',
    price: '',
  });
  const [error, setError] = useState('');
  const [strikePrices, setStrikePrices] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchStrikePrices = useCallback(
    debounce(async (index, expiry) => {
      if (!index || !expiry) {
        setStrikePrices([]);
        setError('Please select index and expiry');
        return;
      }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(expiry)) {
        setError('Invalid expiry format (use YYYY-MM-DD)');
        setStrikePrices([]);
        return;
      }
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
        const strikes = response.data
          .map((item) => item.strikePrice)
          .filter((strike) => Number.isFinite(strike) && strike > 0);
        if (strikes.length === 0) {
          setError('No strike prices found for this expiry');
          setStrikePrices([22950, 23000, 23100]);
        } else {
          setStrikePrices(strikes);
          setError('');
        }
      } catch (error) {
        if (error.response?.status === 401) {
          setError('Session expired, please log in again');
          logout();
          navigate('/login');
        } else {
          setError('Failed to fetch strike prices: ' + (error.response?.data.error || error.message));
          setStrikePrices([22950, 23000, 23100]);
        }
      } finally {
        setLoading(false);
      }
    }, 500),
    [logout, navigate]
  );

  useEffect(() => {
    fetchStrikePrices(formData.index, formData.expiry);
  }, [formData.index, formData.expiry, fetchStrikePrices]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!strikePrices.includes(Number(formData.strikePrice))) {
      setError('Please select a valid strike price');
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Session expired, please log in again');
      logout();
      navigate('/login');
      return;
    }
    try {
      await axios.post(
        'http://localhost:3001/api/trades',
        {
          ...formData,
          strikePrice: Number(formData.strikePrice),
          price: Number(formData.price),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setFormData({
        expiry: '',
        index: 'NIFTY',
        strategy: 'STRANGLE',
        optionType: 'CALL',
        strikePrice: '',
        buySell: 'BUY',
        price: '',
      });
      setStrikePrices([]);
      setError('');
      onTradeCreated();
    } catch (error) {
      if (error.response?.status === 401) {
        setError('Session expired, please log in again');
        logout();
        navigate('/login');
      } else {
        setError(error.response?.data.error || 'Failed to create trade');
      }
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white p-4 rounded-lg shadow-md">
      {error && <p className="text-red-500">{error}</p>}
      {loading && <p className="text-blue-500">Loading strike prices...</p>}
      <div>
        <label className="block text-sm font-medium">Expiry</label>
        <DatePicker
          selected={formData.expiry ? new Date(formData.expiry) : null}
          onChange={(date) =>
            setFormData({
              ...formData,
              expiry: date ? date.toISOString().split('T')[0] : '',
            })
          }
          dateFormat="yyyy-MM-dd"
          placeholderText="Select expiry date"
          className="w-full p-2 border rounded-md"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium">Index</label>
        <select name="index" value={formData.index} onChange={handleChange} className="w-full p-2 border rounded-md">
          <option value="NIFTY">NIFTY</option>
          <option value="BANKNIFTY">BANKNIFTY</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium">Strategy</label>
        <input
          type="text"
          name="strategy"
          value={formData.strategy}
          onChange={handleChange}
          className="w-full p-2 border rounded-md"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium">Option Type</label>
        <select name="optionType" value={formData.optionType} onChange={handleChange} className="w-full p-2 border rounded-md">
          <option value="CALL">CALL</option>
          <option value="PUT">PUT</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium">Strike Price</label>
        <select
          name="strikePrice"
          value={formData.strikePrice}
          onChange={handleChange}
          className="w-full p-2 border rounded-md"
          required
          disabled={loading || !strikePrices.length}
        >
          <option value="">Select Strike Price</option>
          {strikePrices.map((strike) => (
            <option key={strike} value={strike}>
              {strike}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium">Buy/Sell</label>
        <select name="buySell" value={formData.buySell} onChange={handleChange} className="w-full p-2 border rounded-md">
          <option value="BUY">BUY</option>
          <option value="SELL">SELL</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium">Price</label>
        <input
          type="number"
          name="price"
          value={formData.price}
          onChange={handleChange}
          className="w-full p-2 border rounded-md"
          required
        />
      </div>
      <button
        type="submit"
        className="w-full bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600 disabled:bg-gray-400"
        disabled={loading || !strikePrices.length}
      >
        Create Trade
      </button>
    </form>
  );
}