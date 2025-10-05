// src/components/ClockCard.js
import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

function ClockCard({ city, apiKey, headerMode = false }) {
  const [timeString, setTimeString] = useState("");
  const [dateString, setDateString] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const cityTimeSecRef = useRef(null);
  const intervalRef = useRef(null);
  const timeZoneRef = useRef("UTC");

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!city) return;
    if (!apiKey) {
      setError("Missing API key");
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError("");

    const fetchTimezoneAndStartClock = async () => {
      try {
        // Step 1: Get coordinates & offset from OpenWeather
        const res = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
            city
          )}&appid=${apiKey}`
        );
        const data = await res.json();

        if (cancelled) return;

        if (!res.ok || !data.coord) {
          const msg = data?.message || "Failed to get city info";
          setError(`Error: ${msg}`);
          setLoading(false);
          return;
        }

        const { lon, lat } = data.coord;
        const offsetSeconds = data.timezone;
        const nowUtcSec = Math.floor(Date.now() / 1000);
        cityTimeSecRef.current = nowUtcSec + offsetSeconds;

        // Step 2: Detect actual IANA timezone from coordinates
        const tzRes = await fetch(
          `https://api.api-ninjas.com/v1/timezone?lat=${lat}&lon=${lon}`,
          {
            headers: { "X-Api-Key": "sTQqrv+fLKHLxGtOsU/Npw==A23zBtSnOkl1AkxU" } // Replace with your key
          }
        );
        const tzData = await tzRes.json();
        if (tzData.timezone) {
          timeZoneRef.current = tzData.timezone;
        } else {
          console.warn("Fallback to UTC, timezone detection failed.");
          timeZoneRef.current = "UTC";
        }

        // Step 3: Set initial time/date
        setTimeString(
          new Date(cityTimeSecRef.current * 1000).toLocaleTimeString("en-US", {
            hour12: true,
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            timeZone: timeZoneRef.current
          })
        );
        setDateString(
          new Date(cityTimeSecRef.current * 1000).toLocaleDateString("en-US", {
            weekday: "long",
            day: "numeric",
            month: "short",
            year: "numeric",
            timeZone: timeZoneRef.current
          })
        );

        // Step 4: Start ticking clock
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = setInterval(() => {
          if (cityTimeSecRef.current == null) return;
          cityTimeSecRef.current += 1;
          setTimeString(
            new Date(cityTimeSecRef.current * 1000).toLocaleTimeString(
              "en-US",
              {
                hour12: true,
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                timeZone: timeZoneRef.current
              }
            )
          );
          setDateString(
            new Date(cityTimeSecRef.current * 1000).toLocaleDateString(
              "en-US",
              {
                weekday: "long",
                day: "numeric",
                month: "short",
                year: "numeric",
                timeZone: timeZoneRef.current
              }
            )
          );
        }, 1000);

        setLoading(false);
      } catch (err) {
        if (cancelled) return;
        console.error("ClockCard error:", err);
        setError("Failed to fetch timezone");
        setLoading(false);
      }
    };

    fetchTimezoneAndStartClock();

    return () => {
      cancelled = true;
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [city, apiKey]);

  if (headerMode) {
    return (
      <motion.div
        className="flex flex-col items-end"
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {error ? (
          <p className="text-sm text-red-500">{error}</p>
        ) : (
          <>
            <div className="text-3xl sm:text-4xl font-extrabold text-blue-700 font-mono">
              {timeString || (loading ? "••:••:••" : "—")}
            </div>
            <div className="text-sm text-gray-500">{dateString}</div>
          </>
        )}
      </motion.div>
    );
  }

  return (
    <section className="bg-white p-4 rounded-lg shadow-md flex flex-col items-center">
      <h2 className="text-lg font-semibold mb-2">🕒 Local Time</h2>
      {error ? (
        <p className="text-sm text-red-500">{error}</p>
      ) : (
        <>
          <div className="text-2xl font-bold">
            {timeString || (loading ? "••:••:••" : "—")}
          </div>
          <div className="text-sm text-gray-500">{dateString}</div>
          <div className="text-sm text-gray-500 mt-1">{city}</div>
          {loading && <div className="text-xs text-gray-400 mt-1">Updating…</div>}
        </>
      )}
    </section>
  );
}

export default ClockCard;
