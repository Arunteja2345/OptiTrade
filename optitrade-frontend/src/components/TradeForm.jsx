 import { useState, useEffect } from 'react';
  import axios from 'axios';
  import DatePicker from 'react-datepicker';
  import 'react-datepicker/dist/react-datepicker.css';

  export default function TradeForm({ onTradeCreated }) {
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

    const fetchStrikePrices = async () => {
      if (!formData.index || !formData.expiry) return;
      try {
        const response = await axios.get(
          `http://localhost:3001/api/option-chain/${formData.index}?expiry=${formData.expiry}`
        );
        setStrikePrices(response.data.map((item) => item.strikePrice));
        setError('');
      } catch (error) {
        setError('Failed to fetch strike prices');
      }
    };

    useEffect(() => {
      fetchStrikePrices();
    }, [formData.index, formData.expiry]);

    const handleSubmit = async (e) => {
      e.preventDefault();
      if (!strikePrices.includes(Number(formData.strikePrice))) {
        setError('Invalid strike price');
        return;
      }
      try {
        await axios.post('http://localhost:3001/api/trades', {
          ...formData,
          strikePrice: Number(formData.strikePrice),
          price: Number(formData.price),
        });
        setFormData({
          expiry: '',
          index: 'NIFTY',
          strategy: 'STRANGLE',
          optionType: 'CALL',
          strikePrice: '',
          buySell: 'BUY',
          price: '',
        });
        onTradeCreated();
      } catch (error) {
        setError(error.response?.data.error || 'Failed to create trade');
      }
    };

    const handleChange = (e) => {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4 bg-white p-4 rounded-lg shadow-md">
        {error && <p className="text-red-500">{error}</p>}
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
        <button type="submit" className="w-full bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600">
          Create Trade
        </button>
      </form>
    );
  }