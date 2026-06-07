import React, { useEffect, useRef, useState } from "react";
import { Locate, MapPin, Search } from "lucide-react";

// Check local storage for initial coords or fall back to Middle East / Egypt centroid
const DEFAULT_LAT = 30.0444; 
const DEFAULT_LNG = 31.2357;

interface MapPickerProps {
  currentCoords: { lat: number; lng: number } | null;
  onLocationSelect: (lat: number, lng: number, addressString: string) => void;
  isDarkMode: boolean;
  language: "ar" | "en";
}

export default function MapPicker({ currentCoords, onLocationSelect, isDarkMode, language }: MapPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [loadingMap, setLoadingMap] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [resolvedAddress, setResolvedAddress] = useState("");

  const t = {
    ar: {
      useCurrent: "تحديد موقعي الحالي تلقائياً",
      searchPlaceholder: "ابحث عن منطقة، حي، أو شارع...",
      locating: "جاري تحديد موقعك...",
      dragTip: "اسحب الدبوس لتحديد موقع التوصيل بدقة",
      searchBtn: "بحث",
      resolving: "جاري جلب العنوان الرياضي السكني...",
      searchNoRes: "لم يتم العثور على نتائج، يرجى المحاولة يدوياً على الخريطة",
    },
    en: {
      useCurrent: "Use My Current Location Automatically",
      searchPlaceholder: "Search for area, district, or street...",
      locating: "Locating you...",
      dragTip: "Drag the map-pin to pinpoint exact delivery address",
      searchBtn: "Search",
      resolving: "Fetching neighborhood address...",
      searchNoRes: "No results found, please pinpoint manually on the map",
    }
  }[language];

  // Load Leaflet in browser dynamically
  useEffect(() => {
    let active = true;

    const initLeaflet = async () => {
      // 1. Load CSS
      if (!document.getElementById("leaflet-css-link")) {
        const link = document.createElement("link");
        link.id = "leaflet-css-link";
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
      }

      // 2. Load JS Script
      if (!(window as any).L) {
        await new Promise<void>((resolve) => {
          const script = document.createElement("script");
          script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
          script.async = true;
          script.onload = () => resolve();
          document.body.appendChild(script);
        });
      }

      if (!active) return;
      setLoadingMap(false);
    };

    initLeaflet();
    return () => {
      active = false;
    };
  }, []);

  // Initialize and update the map tiles and marker
  useEffect(() => {
    if (loadingMap || !(window as any).L || !mapContainerRef.current) return;

    const L = (window as any).L;
    const initialLat = currentCoords?.lat || DEFAULT_LAT;
    const initialLng = currentCoords?.lng || DEFAULT_LNG;

    // Clear existing map instance
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    // Fix default marker icon issues in single-imports
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    });

    // Create Map
    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 14,
      zoomControl: false,
    });
    mapRef.current = map;

    // Add Zoom Control at right bottom
    L.control.zoom({ position: "bottomright" }).addTo(map);

    // Apply custom Dark tile server if dark mode, otherwise elegant Streets tiles
    const tileUrl = isDarkMode
      ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

    const attribution = isDarkMode
      ? '&copy; <a href="https://carto.com/">CARTO</a>'
      : '&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>';

    L.tileLayer(tileUrl, { attribution, maxZoom: 19 }).addTo(map);

    // Create marker
    const marker = L.marker([initialLat, initialLng], {
      draggable: true,
    }).addTo(map);
    markerRef.current = marker;

    // Trigger address resolution
    reverseGeocode(initialLat, initialLng);

    // Listen to Drag Events
    marker.on("dragend", () => {
      const pos = marker.getLatLng();
      reverseGeocode(pos.lat, pos.lng);
    });

    // Map click -> Move marker
    map.on("click", (e: any) => {
      const pos = e.latlng;
      marker.setLatLng(pos);
      reverseGeocode(pos.lat, pos.lng);
    });

    // Try auto geolocation on mount if no coords set
    if (!currentCoords) {
      getCurrentDeviceLocation();
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [loadingMap, isDarkMode]);

  // Request current device position
  const getCurrentDeviceLocation = () => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        updateMapPosition(latitude, longitude);
      },
      (err) => {
        console.warn("Geolocation permission denied or timed out:", err);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Move marker & map view, then geocode
  const updateMapPosition = (lat: number, lng: number) => {
    if (mapRef.current && markerRef.current) {
      mapRef.current.setView([lat, lng], 15);
      markerRef.current.setLatLng([lat, lng]);
      reverseGeocode(lat, lng);
    }
  };

  // OSM Nominatim Reverse Geocoding
  const reverseGeocode = async (lat: number, lng: number) => {
    setResolvedAddress(t.resolving);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=${language}`
      );
      if (res.ok) {
        const data = await res.json();
        const display_name = data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
        setResolvedAddress(display_name);
        onLocationSelect(lat, lng, display_name);
      } else {
        throw new Error();
      }
    } catch {
      const fallbackStr = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      setResolvedAddress(fallbackStr);
      onLocationSelect(lat, lng, fallbackStr);
    }
  };

  // Search places via Osm Search
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || !mapRef.current) return;

    setSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1&accept-language=${language}`
      );
      if (res.ok) {
        const results = await res.json();
        if (results && results.length > 0) {
          const { lat, lon } = results[0];
          const newLat = parseFloat(lat);
          const newLng = parseFloat(lon);
          updateMapPosition(newLat, newLng);
        } else {
          alert(t.searchNoRes);
        }
      }
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-white dark:bg-zinc-900 rounded-xl overflow-hidden shadow-inner border border-zinc-200 dark:border-zinc-800" id="delivery-map-picker">
      {/* Search Bar / Geolocation button */}
      <div className="p-3 bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700 flex flex-col gap-2">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full text-sm py-2 pl-9 pr-3 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-zinc-400" />
          </div>
          <button
            type="submit"
            disabled={searching}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors flex items-center gap-1"
          >
            {searching ? "..." : t.searchBtn}
          </button>
        </form>

        <button
          type="button"
          onClick={getCurrentDeviceLocation}
          className="flex items-center justify-center gap-2 w-full py-2 bg-emerald-50 dark:bg-emerald-950 hover:bg-emerald-100 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-400 font-semibold text-xs rounded-lg transition-colors"
        >
          <Locate className="w-4 h-4" />
          <span>{t.useCurrent}</span>
        </button>
      </div>

      {/* Map Surface */}
      <div className="relative flex-1 min-h-[220px]">
        {loadingMap && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-zinc-100 dark:bg-zinc-900 text-zinc-500 text-sm">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mr-2"></div>
            Loading Map Screen...
          </div>
        )}
        <div ref={mapContainerRef} className="w-full h-full" style={{ height: "100%", width: "100%" }} />
      </div>

      {/* Selected Address Area */}
      <div className="p-3.5 bg-zinc-50 dark:bg-zinc-800/60 border-t border-zinc-200 dark:border-zinc-700">
        <div className="flex items-start gap-2.5">
          <MapPin className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0 animate-bounce" />
          <div className="text-left">
            <div className="text-xs text-zinc-400 font-medium tracking-wide uppercase mb-0.5">
              {t.dragTip}
            </div>
            <div className="text-sm font-medium text-zinc-800 dark:text-zinc-200 line-clamp-2">
              {resolvedAddress || "..."}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
