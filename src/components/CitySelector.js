// src/components/CitySelector.js
import React, { useState, useEffect } from 'react';

const CitySelector = ({ selectedCity, onCityChange, onAddCity }) => {
  const [search, setSearch] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [activeIndex, setActiveIndex] = useState(-1);

  useEffect(() => {
    if (search.length > 2) {
      const API_KEY = '71e7b244e95e5067b1d96a9771efdcfb';
      fetch(
        `https://api.openweathermap.org/geo/1.0/direct?q=${search}&limit=5&appid=${API_KEY}`
      )
        .then((res) => res.json())
        .then((data) => {
          if (data) {
            setSuggestions(
              data.map(
                (c) =>
                  `${c.name}${c.state ? ', ' + c.state : ''}, ${c.country}`
              )
            );
          }
        })
        .catch((err) => console.error('Error fetching city suggestions:', err));
    } else {
      setSuggestions([]);
      setActiveIndex(-1);
    }
  }, [search]);

  const handleSelect = (city) => {
    setSearch('');
    setSuggestions([]);
    setActiveIndex(-1);
    if (onAddCity) onAddCity(city);
    if (onCityChange) onCityChange(city);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0) {
        handleSelect(suggestions[activeIndex]);
      } else if (search.trim() !== '') {
        handleSelect(search.trim());
      }
    }
  };

  return (
    <div className="relative w-full max-w-md mb-4">
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Search for a city..."
        className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring focus:border-blue-300"
      />

      {suggestions.length > 0 && (
        <ul className="absolute bg-white border rounded shadow-lg mt-1 w-full z-50 max-h-60 overflow-y-auto">
          {suggestions.map((city, index) => (
            <li
              key={index}
              className={`px-4 py-2 cursor-pointer ${
                index === activeIndex ? 'bg-blue-100' : 'hover:bg-gray-100'
              }`}
              onClick={() => handleSelect(city)}
            >
              {city}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default CitySelector;




