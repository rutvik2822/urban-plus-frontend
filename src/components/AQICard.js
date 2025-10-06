// src/components/AQICard.js
import React, { useEffect, useState } from 'react';
import { FaSmog } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { WEATHER_API_KEY } from "../config";

const aqiInfo = {
  1: {
    label: 'Good',
    color: 'bg-green-500',
    gradient: 'from-green-100 to-green-50',
    emoji: '😊',
    pm25: '0–50',
    message: 'Air quality is suitable for outdoor activity.',
  },
  2: {
    label: 'Fair',
    color: 'bg-yellow-400',
    gradient: 'from-yellow-100 to-yellow-50',
    emoji: '🙂',
    pm25: '51–100',
    message: 'Air quality is acceptable. Some pollutants may be a concern for sensitive groups.',
  },
  3: {
    label: 'Moderate',
    color: 'bg-orange-400',
    gradient: 'from-orange-100 to-orange-50',
    emoji: '😐',
    pm25: '101–150',
    message: 'Sensitive individuals may experience health effects. Limit prolonged outdoor activity.',
  },
  4: {
    label: 'Poor',
    color: 'bg-red-500',
    gradient: 'from-red-100 to-red-50',
    emoji: '😷',
    pm25: '151–200',
    message: 'Everyone may begin to experience health effects. Avoid outdoor exertion.',
  },
  5: {
    label: 'Very Poor',
    color: 'bg-purple-600',
    gradient: 'from-purple-100 to-purple-50',
    emoji: '☠️',
    pm25: '201+',
    message: 'Health warnings of emergency conditions. Stay indoors.',
  },
};

function AQICard({ city }) {
  const [aqi, setAqi] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!city) return;

    const fetchAQI = async () => {
      setLoading(true);
      setError('');

      try {
        const geoRes = await fetch(
          `https://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=1&appid=${ WEATHER_API_KEY }`
        );
        const geoData = await geoRes.json();

        if (!geoData[0]) throw new Error('Location not found');

        const { lat, lon } = geoData[0];

        const aqiRes = await fetch(
          `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}`
        );
        const aqiData = await aqiRes.json();

        if (aqiData?.list?.[0]) {
          setAqi(aqiData.list[0].main.aqi);
        } else {
          throw new Error('No AQI data found');
        }

        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchAQI();
  }, [city]);

  return (
    <motion.section
      className={`border rounded-xl p-5 shadow-xl transition duration-300 ease-in-out bg-gradient-to-tr ${
        aqi ? aqiInfo[aqi].gradient : 'from-white to-gray-50'
      }`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="flex items-center mb-4">
        <FaSmog className="text-2xl text-gray-700 mr-2" />
        <h2 className="text-xl font-extrabold tracking-tight">Air Quality Index (AQI)</h2>
      </div>

      {loading && <p className="text-sm text-gray-500">Updating AQI for <strong>{city}</strong>...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {aqi && (
        <motion.div
          className="mt-3 space-y-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between">
            <div className="text-4xl font-bold text-gray-800">AQI: {aqi}</div>
            <div
              className={`text-white text-sm font-semibold px-4 py-1 rounded-full ${aqiInfo[aqi].color}`}
              title={`PM2.5: ${aqiInfo[aqi].pm25}`}
            >
              {aqiInfo[aqi].label}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-3xl">{aqiInfo[aqi].emoji}</div>
            <div className="text-sm text-gray-700">PM2.5: {aqiInfo[aqi].pm25}</div>
          </div>

          <p className="text-sm text-gray-800 italic">{aqiInfo[aqi].message}</p>

          {/* AQI Visual Bar */}
          <div className="mt-4">
            <div className="relative w-full h-4 rounded overflow-hidden flex">
              <div className="w-1/5 bg-green-500" />
              <div className="w-1/5 bg-yellow-400" />
              <div className="w-1/5 bg-orange-400" />
              <div className="w-1/5 bg-red-500" />
              <div className="w-1/5 bg-purple-600" />
            </div>

            <div className="flex justify-between text-xs text-gray-600 mt-1 px-1">
              <span>Good</span>
              <span>Fair</span>
              <span>Moderate</span>
              <span>Poor</span>
              <span>Very Poor</span>
            </div>

            <div className="relative h-6 mt-1">
              <motion.div
                className="absolute top-0 w-0 h-0 border-l-8 border-r-8 border-b-8 border-transparent border-b-black"
                initial={{ left: '10%' }}
                animate={{
                  left: `${(aqi - 1) * 20 + 10}%`,
                }}
                transition={{ type: 'spring', stiffness: 140 }}
                style={{ transform: 'translateX(-50%)' }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </motion.section>
  );
}

export default AQICard;



