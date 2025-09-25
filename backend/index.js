const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config(); 

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/vacation_calendar', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

connectDB();

const holidaySchema = new mongoose.Schema({
  date: { type: String, required: true },
  name: { type: String, required: true },
  description: { type: String, default: '' },
  country: { type: String, required: true },
  year: { type: Number, required: true },
  month: { type: Number, required: true },
  type: { type: String, default: 'national' }
}, {
  timestamps: true
});

holidaySchema.index({ country: 1, year: 1 });
holidaySchema.index({ country: 1, year: 1, month: 1 });
holidaySchema.index({ date: 1 });

const Holiday = mongoose.model('Holiday', holidaySchema);


app.get('/api/holidays/:country/:year', async (req, res) => {
  try {
    const { country, year } = req.params;

    
    const existingHolidays = await Holiday.find({ country: country.toUpperCase(), year: parseInt(year) });
    if (existingHolidays.length > 0) {
      return res.json(existingHolidays);
    }


    const apiKey = process.env.CALENDARIFIC_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'API key missing. Please configure CALENDARIFIC_API_KEY.' });
    }

    const response = await axios.get(`https://calendarific.com/api/v2/holidays`, {
      params: {
        api_key: apiKey,
        country: country.toLowerCase(),
        year: year,
        type: 'national' 
      },
      timeout: 10000
    });

    const holidays = response.data?.response?.holidays || [];

    if (!holidays.length) {
      return res.status(404).json({ error: 'No holidays found from Calendarific.' });
    }

    const formattedHolidays = holidays.map(h => {
      const dateObj = new Date(h.date.iso);
      return {
        date: h.date.iso,
        name: h.name,
        description: h.description || '',
        country: country.toUpperCase(),
        year: dateObj.getFullYear(),
        month: dateObj.getMonth() + 1,
        type: Array.isArray(h.type) ? h.type.join(',') : h.type || 'national'
      };
    });


    const saved = await Holiday.insertMany(formattedHolidays);
    res.json(saved);

  } catch (error) {
    console.error('Holiday fetch error:', error.message || error);
    res.status(500).json({ error: 'Error fetching holidays. Please try again later.' });
  }
});
app.get('/api/holidays/:country/:year/:month', async (req, res) => {
  try {
    const { country, year, month } = req.params;
    const monthNum = parseInt(month);
    const yearNum = parseInt(year);

    
    if (monthNum < 1 || monthNum > 12) {
      return res.status(400).json({ error: 'Month must be between 1 and 12' });
    }


    const existingHolidays = await Holiday.find({ 
      country: country.toUpperCase(), 
      year: yearNum,
      month: monthNum
    });
    
    if (existingHolidays.length > 0) {
      return res.json(existingHolidays);
    }


    const yearHolidays = await Holiday.find({ 
      country: country.toUpperCase(), 
      year: yearNum 
    });

    if (yearHolidays.length > 0) {

      return res.json([]);
    }


    const apiKey = process.env.CALENDARIFIC_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'API key missing. Please configure CALENDARIFIC_API_KEY.' });
    }

    const response = await axios.get(`https://calendarific.com/api/v2/holidays`, {
      params: {
        api_key: apiKey,
        country: country.toLowerCase(),
        year: yearNum,
        type: 'national'
      },
      timeout: 10000
    });

    const holidays = response.data?.response?.holidays || [];

    if (!holidays.length) {
      return res.status(404).json({ error: 'No holidays found from Calendarific.' });
    }

    const formattedHolidays = holidays.map(h => {
      const dateObj = new Date(h.date.iso);
      return {
        date: h.date.iso,
        name: h.name,
        description: h.description || '',
        country: country.toUpperCase(),
        year: dateObj.getFullYear(),
        month: dateObj.getMonth() + 1,
        type: Array.isArray(h.type) ? h.type.join(',') : h.type || 'national'
      };
    });


    await Holiday.insertMany(formattedHolidays);

    const monthlyHolidays = formattedHolidays.filter(h => h.month === monthNum);
    res.json(monthlyHolidays);

  } catch (error) {
    console.error('Monthly holiday fetch error:', error.message || error);
    res.status(500).json({ error: 'Error fetching holidays. Please try again later.' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});