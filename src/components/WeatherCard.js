// src/components/WeatherCard.js
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { WiHumidity, WiBarometer, WiSunrise, WiSunset, WiStrongWind, WiDirectionUp } from "react-icons/wi";
import { BsEye } from "react-icons/bs";
import { WEATHER_API_KEY } from "../config";

function WeatherCard({ city }) {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [displayTemp, setDisplayTemp] = useState(0);

  useEffect(() => {
    if (!city) return;

    const fetchWeather = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=metric&appid=${WEATHER_API_KEY}`
        );
        const data = await res.json();
        if (data.cod !== 200) throw new Error(data.message || 'Failed to fetch weather');

        setWeather(data);
        setDisplayTemp(0);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, [city]);

  useEffect(() => {
    if (weather?.main?.temp) {
      let current = 0;
      const target = Math.round(weather.main.temp);
      const step = target > 40 ? 2 : 1;
      const interval = setInterval(() => {
        current += step;
        if (current >= target) {
          clearInterval(interval);
          setDisplayTemp(target);
        } else {
          setDisplayTemp(current);
        }
      }, 30);
      return () => clearInterval(interval);
    }
  }, [weather]);

  const getWeatherBackground = (type) => {
    switch (type) {
      case 'Clear':        return 'from-yellow-300 to-yellow-500';
      case 'Clouds':       return 'from-gray-300 to-gray-500';
      case 'Rain':         return 'from-blue-400 to-blue-600';
      case 'Thunderstorm': return 'from-purple-600 to-indigo-900';
      case 'Snow':         return 'from-white to-blue-200';
      case 'Mist':
      case 'Haze':
      case 'Fog':          return 'from-gray-200 to-gray-400';
      default:             return 'from-green-200 to-blue-400';
    }
  };

  const formatLocalTimeFromUtc = (utcSeconds, offsetSeconds) => {
    const ms = (utcSeconds + offsetSeconds) * 1000;
    return new Date(ms).toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'UTC',
    });
  };

  const nowUtc = Math.floor(Date.now() / 1000);
  const isDaytime = weather
    ? nowUtc >= weather.sys.sunrise && nowUtc < weather.sys.sunset
    : true;

  let rainIntensity = 'light';
  const desc = weather?.weather?.[0]?.description?.toLowerCase();
  if (desc?.includes('heavy')) rainIntensity = 'heavy';
  else if (desc?.includes('moderate')) rainIntensity = 'moderate';

  // 🌬 Wind speed & direction
  const windDirection = weather?.wind?.deg ?? 0;
  const windSpeedKmh = weather?.wind?.speed ? (weather.wind.speed * 3.6).toFixed(1) : null;

  const getCompassFullName = (deg) => {
    if (deg >= 337.5 || deg < 22.5) return "North";
    if (deg >= 22.5 && deg < 67.5) return "North-East";
    if (deg >= 67.5 && deg < 112.5) return "East";
    if (deg >= 112.5 && deg < 157.5) return "South-East";
    if (deg >= 157.5 && deg < 202.5) return "South";
    if (deg >= 202.5 && deg < 247.5) return "South-West";
    if (deg >= 247.5 && deg < 292.5) return "West";
    if (deg >= 292.5 && deg < 337.5) return "North-West";
    return "Unknown";
  };

  const oppositeDirection = (deg) => (deg + 180) % 360;

  return (
    <motion.section
      className={`relative p-6 rounded-2xl shadow-2xl transition-all duration-500 bg-gradient-to-r ${
        weather ? getWeatherBackground(weather.weather[0].main) : 'from-gray-300 to-gray-500'
      } text-white overflow-hidden`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7 }}
    >
      <h2 className="text-2xl font-bold mb-5 tracking-wider drop-shadow-sm">
        Weather in {city}
      </h2>

      {loading && <p className="text-white text-sm animate-pulse">Fetching weather data...</p>}
      {error && <p className="text-red-100 text-sm">{error}</p>}

      {/* Effects */}
      {weather?.weather?.[0]?.main === 'Rain' && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          {Array.from({ length: rainIntensity === 'heavy' ? 80 : rainIntensity === 'moderate' ? 50 : 25 })
            .map((_, i) => (
            <div
              key={i}
              className="raindrop"
              style={{
                left: `${Math.random() * 100}%`,
                animationDuration: rainIntensity === 'heavy' ? '0.5s' : rainIntensity === 'moderate' ? '1s' : '2s',
                animationDelay: `${Math.random() * 2}s`,
              }}
            />
          ))}
        </div>
      )}

      {weather?.weather?.[0]?.main === 'Thunderstorm' && <div className="lightning"></div>}
      {weather?.weather?.[0]?.main === 'Snow' && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          {Array.from({ length: 40 }).map((_, i) => (
            <div
              key={i}
              className="snowflake"
              style={{
                left: `${Math.random() * 100}%`,
                animationDuration: `${3 + Math.random() * 3}s`,
                animationDelay: `${Math.random() * 3}s`,
              }}
            >
              ❄️
            </div>
          ))}
        </div>
      )}

      {/* Main Weather Info */}
      {!loading && weather && (
        <div className="transition-all transform duration-500 relative z-10 space-y-4">
          <div className="flex items-center space-x-6">
            <div
              className={`w-20 h-20 rounded-full flex items-center justify-center shadow-inner
               ${isDaytime ? 'bg-yellow-200/30' : 'bg-indigo-900/30'}`}
            >
              <img
                src={`https://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png`}
                alt="Weather Icon"
                className="w-16 h-16 drop-shadow-lg"
              />
            </div>
            <div>
              <h3 className="text-5xl font-extrabold">{displayTemp}°C</h3>
              <p className="capitalize text-lg">{weather.weather[0].description}</p>
              <p className="text-sm opacity-90">Feels like: {Math.round(weather.main.feels_like)}°C</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <p className="flex items-center"><WiHumidity className="mr-2 text-xl" /> Humidity: {weather.main.humidity}%</p>
            <p className="flex items-center"><WiStrongWind className="mr-2 text-xl" /> Wind: {windSpeedKmh} km/h from {getCompassFullName(windDirection)} to {getCompassFullName(oppositeDirection(windDirection))}</p>
            <p className="flex items-center"><WiBarometer className="mr-2 text-xl" /> Pressure: {weather.main.pressure} hPa</p>
            <p className="flex items-center"><BsEye className="mr-2 text-lg" /> Visibility: {weather.visibility != null ? (weather.visibility / 1000).toFixed(1) : '—'} km</p>
            <p className="flex items-center"><WiSunrise className="mr-2 text-xl" /> Sunrise: {formatLocalTimeFromUtc(weather.sys.sunrise, weather.timezone)}</p>
            <p className="flex items-center"><WiSunset className="mr-2 text-xl" /> Sunset: {formatLocalTimeFromUtc(weather.sys.sunset, weather.timezone)}</p>
          </div>

          {/* Wind direction arrow (animated & swaying) */}
          <div className="flex items-center text-sm">
            <motion.div
              animate={{
                rotate: windDirection, // Base rotation according to wind direction
                transition: { type: "spring", stiffness: 100, damping: 12 }
              }}
            >
              <motion.div
                animate={{
                  rotate: [0, 3, -3, 0], // Gentle sway
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <WiDirectionUp className="text-2xl" />
              </motion.div>
            </motion.div>
            Wind Direction: {windDirection}° ({getCompassFullName(windDirection)})
          </div>

        </div>
      )}
    </motion.section>
  );
}

export default WeatherCard;
