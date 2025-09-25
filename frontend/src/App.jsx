import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar, MapPin } from 'lucide-react';

const VacationCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('month'); 
  const [selectedCountry, setSelectedCountry] = useState('IN'); 
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const countries = [
    { code: 'IN', name: 'India' },
    { code: 'GB', name: 'United Kingdom' },
    { code: 'CA', name: 'Canada' },
    { code: 'AU', name: 'Australia' },
    { code: 'DE', name: 'Germany' },
    { code: 'FR', name: 'France' },
    { code: 'JP', name: 'Japan' }
  ];

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  
  const fetchHolidays = async (country, year, month = null) => {
    setLoading(true);
    setError(null);
    try {
      
      const endpoint = month !== null 
        ? `http://localhost:5000/api/holidays/${country}/${year}/${month + 1}` 
        : `http://localhost:5000/api/holidays/${country}/${year}`;
      
      const response = await fetch(endpoint);
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || `HTTP status ${response.status}`);
      }
      const data = await response.json();
      setHolidays(data);
    } catch (err) {
      console.error('Error fetching holidays:', err);
      setError('Failed to fetch holidays from server.');
      setHolidays([]); 
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchHolidays(selectedCountry, currentDate.getFullYear(), currentDate.getMonth());
  }, [selectedCountry]);

  
  useEffect(() => {
    fetchHolidays(selectedCountry, currentDate.getFullYear(), currentDate.getMonth());
  }, [currentDate.getFullYear(), currentDate.getMonth(), selectedCountry]);

  
  const isHoliday = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return holidays.find(holiday => holiday.date === dateStr);
  };

  
  const getHolidaysInWeek = (startDate) => {
    const weekHols = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      const hol = isHoliday(d);
      if (hol) weekHols.push(hol);
    }
    return weekHols;
  };

  
  const getWeekHighlight = (startDate) => {
    const weekHols = getHolidaysInWeek(startDate);
    if (weekHols.length === 0) return '';
    if (weekHols.length === 1) return 'bg-green-100';
    return 'bg-green-300';
  };

  
  const navigateMonth = (dir) => {
    const nd = new Date(currentDate);
    nd.setMonth(currentDate.getMonth() + dir);
    setCurrentDate(nd);
  };


  const navigateWeek = (dir) => {
    const nd = new Date(currentDate);
    nd.setDate(currentDate.getDate() + dir * 7);
    setCurrentDate(nd);
  };

  
  const getCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const start = new Date(firstDay);
    start.setDate(start.getDate() - firstDay.getDay());  

    const days = [];
    const cur = new Date(start);
    while (cur <= lastDay || cur.getDay() !== 0) {
      days.push(new Date(cur));
      cur.setDate(cur.getDate() + 1);
    }
    return days;
  };

  
  const getWeekDays = () => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay()); 
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      days.push(d);
    }
    return days;
  };

  // Render month view
  const renderMonthView = () => {
    const days = getCalendarDays();
    const weeks = [];
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }

    return (
      <div className="bg-white rounded-lg shadow-lg">
        <div className="grid grid-cols-7 gap-1 p-4">
          {weekDays.map(day => (
            <div key={day} className="text-center font-semibold text-gray-600 p-2">
              {day}
            </div>
          ))}

          {weeks.map((week, wIdx) => {
            const weekStart = week[0];
            const weekHighlight = getWeekHighlight(weekStart);

            return week.map((day, dIdx) => {
              const holiday = isHoliday(day);
              const isCurrentMonth = day.getMonth() === currentDate.getMonth();
              return (
                <div
                  key={`${wIdx}-${dIdx}`}
                  className={`
                    min-h-20 p-2 border border-gray-200 relative
                    ${weekHighlight}
                    ${!isCurrentMonth ? 'text-gray-400' : ''}
                    ${holiday ? 'ring-2 ring-red-400' : ''}
                  `}
                >
                  <div className="text-sm font-medium">{day.getDate()}</div>
                  {holiday && (
                    <div className="absolute bottom-1 left-1 right-1">
                      <div className="text-xs bg-red-500 text-white rounded px-1 truncate">
                        {holiday.name}
                      </div>
                    </div>
                  )}
                </div>
              );
            });
          })}
        </div>
      </div>
    );
  };

  
  const renderWeekView = () => {
    const days = getWeekDays();
    const weekStart = days[0];
    const weekHighlight = getWeekHighlight(weekStart);

    return (
      <div className={`bg-white rounded-lg shadow-lg ${weekHighlight} p-4`}>
        <div className="grid grid-cols-7 gap-4">
          {days.map((day, idx) => {
            const holiday = isHoliday(day);
            return (
              <div
                key={idx}
                className={`
                  min-h-32 p-3 border border-gray-200 rounded-lg
                  ${holiday ? 'bg-red-50 border-red-300' : 'bg-gray-50'}
                `}
              >
                <div className="font-semibold text-sm text-gray-600">
                  {weekDays[idx]}
                </div>
                <div className="text-lg font-bold mt-1">{day.getDate()}</div>
                {holiday && (
                  <div className="mt-2">
                    <div className="text-xs bg-red-500 text-white rounded px-2 py-1">
                      {holiday.name}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
              <Calendar className="text-blue-600" />
              Vacation Calendar
            </h1>

            <div className="flex items-center gap-2">
              <MapPin className="text-gray-600" size={20} />
              <select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500"
              >
                {countries.map(c => (
                  <option key={c.code} value={c.code}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setView('month')}
                className={`px-4 py-2 rounded-md transition-colors ${
                  view === 'month' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
                }`}
              >
                Month
              </button>
              <button
                onClick={() => setView('week')}
                className={`px-4 py-2 rounded-md transition-colors ${
                  view === 'week' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
                }`}
              >
                Week
              </button>
            </div>
          </div>

          <div className="flex justify-between items-center mt-6">
            <button
              onClick={() => view === 'month' ? navigateMonth(-1) : navigateWeek(-1)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            >
              <ChevronLeft size={20} />
              {view === 'month' ? 'Prev Month' : 'Prev Week'}
            </button>

            <h2 className="text-xl font-semibold text-gray-800">
              {view === 'month'
                ? `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`
                : `Week of ${currentDate.toDateString()}`
              }
            </h2>

            <button
              onClick={() => view === 'month' ? navigateMonth(1) : navigateWeek(1)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            >
              {view === 'month' ? 'Next Month' : 'Next Week'}
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm">{error}</p>
              </div>
              <div className="ml-auto pl-3">
                <button onClick={() => setError(null)} className="text-yellow-500 hover:text-yellow-700">
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Calendar Display */}
        {loading ? (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <div className="text-gray-500">Loading holidays...</div>
          </div>
        ) : (
          view === 'month' ? renderMonthView() : renderWeekView()
        )}
      </div>
    </div>
  );
};

export default VacationCalendar;