// src/App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import CitySelector from './components/CitySelector';
import WeatherCard from './components/WeatherCard';
import AQICard from './components/AQICard';
import ClockCard from './components/ClockCard';
import News from './components/News';
import TrafficMap from './components/TrafficMap';
import SignUp from './components/SignUp';
import Login from './components/Login';
import { motion, AnimatePresence } from 'framer-motion';
import { WEATHER_API_KEY } from './config';
import axios from 'axios';
import { API_BASE_URL } from "./config";

function App() {
  const [city, setCity] = useState('');
  const [cityList, setCityList] = useState([]);
  const [currentLocation, setCurrentLocation] = useState('');
  const [autoDetecting, setAutoDetecting] = useState(false);
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [user, setUser] = useState(null); // ✅ store user info

  // ✅ Fetch user details if token exists
  useEffect(() => {
    if (!token) return;

    const fetchUser = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(res.data); // assuming backend returns { name, email }
      } catch (err) {
        console.error("Failed to fetch user info:", err);
      }
    };

    fetchUser();
  }, [token]);

  // ✅ Fetch cities from DB if logged in
  useEffect(() => {
    if (!token) return;

    const fetchCities = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/user/cities`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.data && Array.isArray(res.data)) {
          setCityList(res.data);
          if (res.data.length > 0) {
            setCity(res.data[0]);
          }
        }
      } catch (err) {
        console.error('Failed to fetch user cities:', err);
      }
    };

    fetchCities();
  }, [token]);

  // Auto-detect current location
  useEffect(() => {
    setAutoDetecting(true);

    if (!navigator.geolocation) {
      console.log('Geolocation not supported.');
      setAutoDetecting(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          const res = await fetch(
            `https://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${WEATHER_API_KEY}`
          );
          const data = await res.json();

          if (data && data[0] && data[0].name) {
            const detectedCity = `${data[0].name}${data[0].state ? ', ' + data[0].state : ''}, ${data[0].country}`;

            setCurrentLocation(detectedCity);
            if (!city) setCity(detectedCity);

            setCityList((prev) => {
              if (!prev.includes(detectedCity)) {
                return [detectedCity, ...prev];
              }
              return prev;
            });
          }
        } catch (err) {
          console.error('Reverse geocoding failed:', err);
        }

        setAutoDetecting(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        setAutoDetecting(false);
      }
    );
  }, [city]);

  const handleAddCity = async (newCity) => {
    if (token) {
      try {
        await axios.post(`${API_BASE_URL}/api/user/add-city`,
          { city: newCity },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } catch (err) {
        console.error('Error saving city:', err);
      }
    }

    setCityList((prev) => {
      if (!prev.includes(newCity)) {
        return [...prev, newCity];
      }
      return prev;
    });

    setCity(newCity);
  };

  // ✅ Updated: Delete from DB + frontend
  const handleDeleteCity = async (cityToRemove) => {
    if (cityToRemove === currentLocation) return;

    if (token) {
      try {
        await axios.delete(`${API_BASE_URL}/api/user/delete-city`, {
          headers: { Authorization: `Bearer ${token}` },
          data: { city: cityToRemove },
        });
      } catch (err) {
        console.error('Error deleting city from DB:', err);
      }
    }

    const updated = cityList.filter((c) => c !== cityToRemove);
    setCityList(updated);

    if (city === cityToRemove) {
      setCity(updated[0] || currentLocation || '');
    }
  };

  // Dashboard JSX
  const Dashboard = () => (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 to-white text-gray-900 font-sans">
      <header className="bg-white shadow p-4 flex flex-col sm:flex-row justify-between items-center">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-2xl font-extrabold tracking-tight text-blue-700">
            Urban+ Smart City Dashboard
          </h1>
          {autoDetecting && (
            <p className="text-sm text-gray-500 animate-pulse">
              Auto-detecting your location...
            </p>
          )}
        </motion.div>

        {/* Right corner - Auth Buttons */}
        <motion.div
          className="mt-2 sm:mt-0 flex gap-4 items-center"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          {!token ? (
            <>
              <Link to="/login" className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                SIGN IN
              </Link>
              <Link to="/signup" className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">
                SIGN UP
              </Link>
            </>
          ) : (
            <>
              {/* ✅ Show user name */}
              {user && user.name && (<span className="text-gray-700 font-semibold"> Welcome, {user.name}</span>)}
              <button
                onClick={() => { 
                  setToken(''); 
                  localStorage.removeItem('token'); 
                  setCityList([]); 
                  setUser(null);
                }}
                className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
              >
                Logout
              </button>
            </>
          )}
        </motion.div>
      </header>

      <main className="p-4">
        {/* ✅ Search bar + Clock on same row */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
          <CitySelector
            selectedCity={city}
            onCityChange={(selected) => setCity(selected)}
            onAddCity={handleAddCity}
          />

          <ClockCard city={city.split(',')[0]} apiKey={WEATHER_API_KEY} />
        </div>

        {/* City List Container */}
        <div className="mb-4 bg-blue-50 p-3 rounded-xl shadow-inner border border-blue-100">
          <div className="flex gap-2 overflow-x-auto pb-2 sm:flex-wrap sm:overflow-x-visible">
            <AnimatePresence>
              {cityList.map((c) => (
                <motion.div
                  key={c}
                  className="flex items-center gap-2 flex-shrink-0"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.3 }}
                >
                  <button
                    type="button"
                    onClick={() => setCity(c)}
                    className={`px-4 py-2 rounded-full text-sm font-medium shadow-md hover:shadow-lg transition-all ${
                      c === city
                        ? 'bg-gradient-to-r from-blue-500 to-blue-700 text-white'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-blue-100'
                    }`}
                  >
                    {c === currentLocation && <span>📍</span>}
                    {c}
                  </button>

                  {c !== currentLocation && (
                    <button
                      type="button"
                      onClick={() => handleDeleteCity(c)}
                      className="w-6 h-6 flex items-center justify-center rounded-full bg-red-100 text-red-500 hover:bg-red-200 hover:text-red-700 transition-all"
                    >
                      ✕
                    </button>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Weather + AQI */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <AQICard city={city.split(',')[0]} />
          <WeatherCard city={city.split(',')[0]} />
        </div>

        {/* News */}
        <motion.div
          className="relative group mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <h2 className="text-xl font-semibold text-blue-800 mb-2 transition-transform group-hover:scale-105">
            📰 Trending News
          </h2>
          <News city={city} />
        </motion.div>

        {/* Map */}
        <motion.div
          className="relative group"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <h2 className="text-xl font-semibold text-green-800 mb-2 transition-transform group-hover:scale-105">
            🗺️ City Map
          </h2>
          <TrafficMap city={city.split(',')[0]} />
        </motion.div>
      </main>
    </div>
  );

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/login" element={<Login setToken={setToken} />} />
      </Routes>
    </Router>
  );
}

export default App;
