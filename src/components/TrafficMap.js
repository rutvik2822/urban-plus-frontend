// src/components/TrafficMap.js
import React, { useEffect, useState, useRef } from "react";
import tt from "@tomtom-international/web-sdk-maps";
import "@tomtom-international/web-sdk-maps/dist/maps.css";
import { TOMTOM_API_KEY } from "../config";

const TrafficMap = ({ city }) => {
  const [map, setMap] = useState(null);
  const [coords, setCoords] = useState(null);
  const liveMarkerRef = useRef(null);
  const cityMarkerRef = useRef(null);
  const cityCoordsRef = useRef(null);
  const popupTimeoutRef = useRef(null); // ✅ track popup timeout

  // Initialize basic map
  useEffect(() => {
    const mapInstance = tt.map({
      key: TOMTOM_API_KEY,
      container: "traffic-map",
      center: [73.8567, 18.5204], // default Pune
      zoom: 12,
    });

    setMap(mapInstance);
    return () => mapInstance.remove();
  }, []);

  // Detect live location
  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        setCoords({ lat, lon });
      },
      (err) => console.error("Geolocation error:", err)
    );
  }, []);

  // Place marker for live location
  useEffect(() => {
    if (!map || !coords) return;

    const position = [coords.lon, coords.lat];

    if (liveMarkerRef.current) {
      liveMarkerRef.current.setLngLat(position);
    } else {
      const popup = new tt.Popup().setHTML("<b>📍 You are here</b>");
      liveMarkerRef.current = new tt.Marker({ color: "red" })
        .setLngLat(position)
        .setPopup(popup)
        .addTo(map);

      popup.addTo(map);
      // Auto close after 10s
      setTimeout(() => popup.remove(), 10000);
    }

    map.flyTo({ center: position, zoom: 13 });
  }, [coords, map]);

  // Place marker for searched city
  useEffect(() => {
    if (!city || !map) return;

    const fetchCoordinates = async () => {
      try {
        const res = await fetch(
          `https://api.tomtom.com/search/2/geocode/${encodeURIComponent(city)}.json?key=${TOMTOM_API_KEY}`
        );
        const data = await res.json();

        if (data.results && data.results[0]) {
          const { lat, lon } = data.results[0].position;
          const position = [lon, lat];
          cityCoordsRef.current = position;

          const popup = new tt.Popup().setHTML(`<b>🏙️ City: ${city}</b>`);

          if (cityMarkerRef.current) {
            cityMarkerRef.current.setLngLat(position).setPopup(popup);
          } else {
            cityMarkerRef.current = new tt.Marker({ color: "blue" })
              .setLngLat(position)
              .setPopup(popup)
              .addTo(map);
          }

          popup.addTo(map);

          // ✅ Clear previous timeout & auto close after 10s
          if (popupTimeoutRef.current) clearTimeout(popupTimeoutRef.current);
          popupTimeoutRef.current = setTimeout(() => popup.remove(), 10000);

          map.flyTo({ center: position, zoom: 12 });
        }
      } catch (err) {
        console.error("Geocoding failed:", err);
      }
    };

    fetchCoordinates();
  }, [city, map]);

  // Jump to live location
  const goToLiveLocation = () => {
    if (map && coords) {
      const position = [coords.lon, coords.lat];
      map.flyTo({ center: position, zoom: 15 });
      if (liveMarkerRef.current) {
        liveMarkerRef.current.togglePopup();
        // Auto close after 10s
        setTimeout(() => {
          if (liveMarkerRef.current) liveMarkerRef.current.getPopup()?.remove();
        }, 10000);
      }
    }
  };

  // Jump to searched city
  const goToCity = () => {
    if (map && cityCoordsRef.current) {
      map.flyTo({ center: cityCoordsRef.current, zoom: 13 });
      if (cityMarkerRef.current) {
        cityMarkerRef.current.togglePopup();
        // Auto close after 10s
        setTimeout(() => {
          if (cityMarkerRef.current) cityMarkerRef.current.getPopup()?.remove();
        }, 10000);
      }
    }
  };

  return (
    <div className="relative w-full h-[500px] rounded-2xl shadow-lg">
      {/* Map container */}
      <div id="traffic-map" className="w-full h-full rounded-2xl" />

      {/* Floating buttons */}
      <div className="absolute top-3 right-3 flex flex-col gap-2">
        <button
          onClick={goToLiveLocation}
          className="bg-white text-blue-700 px-3 py-2 rounded-lg shadow-md hover:bg-blue-100 transition"
        >
          📍 My Location
        </button>
        <button
          onClick={goToCity}
          className="bg-white text-green-700 px-3 py-2 rounded-lg shadow-md hover:bg-green-100 transition"
        >
          🏙️ City
        </button>
      </div>
    </div>
  );
};

export default TrafficMap;

