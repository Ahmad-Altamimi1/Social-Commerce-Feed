"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import { Navigation } from "lucide-react";
import { cn } from "@/lib/utils";
import "leaflet/dist/leaflet.css";

type LocationValue = { lat: number; lng: number };
type SearchResult = {
  display_name: string;
  lat: string;
  lon: string;
  name?: string;
  type?: string;
  class?: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    country?: string;
  };
};

interface LocationPickerMapProps {
  value: LocationValue | null;
  onChange: (value: LocationValue) => void;
}

const FALLBACK_CENTER: LocationValue = { lat: 25.2048, lng: 55.2708 };

const markerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function ClickToPick({ onPick }: { onPick: (value: LocationValue) => void }) {
  useMapEvents({
    click(event) {
      onPick({ lat: event.latlng.lat, lng: event.latlng.lng });
    },
  });
  return null;
}

function RecenterMap({
  center,
  zoom,
}: {
  center: LocationValue;
  zoom: number;
}) {
  const map = useMap();
  useEffect(() => {
    map.setView([center.lat, center.lng], zoom, { animate: true });
  }, [map, center.lat, center.lng, zoom]);
  return null;
}

export function LocationPickerMap({ value, onChange }: LocationPickerMapProps) {
  const [center, setCenter] = useState<LocationValue>(value ?? FALLBACK_CENTER);
  const [loadingGps, setLoadingGps] = useState(false);
  const [gpsDenied, setGpsDenied] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!value) return;
    setCenter(value);
  }, [value?.lat, value?.lng]);

  const selected = value ?? null;

  const runSearch = async () => {
    const q = searchText.trim();
    if (!q) {
      setSearchResults([]);
      setSearchError(null);
      return;
    }
    setSearchLoading(true);
    setSearchError(null);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&namedetails=1&extratags=1&limit=8&q=${encodeURIComponent(q)}`,
      );
      if (!res.ok) throw new Error("search failed");
      const data = (await res.json()) as SearchResult[];
      setSearchResults(Array.isArray(data) ? data : []);
    } catch {
      setSearchError("Could not search location right now.");
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = searchText.trim();
    if (!q) {
      setSearchResults([]);
      setSearchError(null);
      setSearchLoading(false);
      return;
    }
    setSearchLoading(true);
    debounceRef.current = setTimeout(() => {
      void runSearch();
    }, 350);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchText]);

  const selectSearchResult = (result: SearchResult) => {
    const lat = Number(result.lat);
    const lng = Number(result.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
    const next = { lat, lng };
    setCenter(next);
    onChange(next);
    setSearchText(result.display_name);
    setSearchResults([]);
  };

  const requestCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGpsDenied(true);
      return;
    }
    setLoadingGps(true);
    setGpsDenied(false);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const next = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setCenter(next);
        onChange(next);
        setLoadingGps(false);
      },
      () => {
        setGpsDenied(true);
        setLoadingGps(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  useEffect(() => {
    if (value) return;
    requestCurrentLocation();
    // run once for initial best effort
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const markerPosition = useMemo(
    () =>
      selected ? ([selected.lat, selected.lng] as [number, number]) : null,
    [selected?.lat, selected?.lng],
  );

  return (
    <div className="space-y-2">
      <div className="relative z-[1200] space-y-2">
        <div className="flex gap-2">
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void runSearch();
              }
            }}
            placeholder="Search places (mall, cafe, district, landmark...)"
            className="flex-1 bg-card border border-border rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
          />
        </div>
        {searchError && (
          <p className="text-[11px] text-amber-600">{searchError}</p>
        )}
        {searchResults.length > 0 && (
          <div className="absolute left-0 right-0 top-full z-[1300] mt-1 rounded-xl border border-border bg-card shadow-xl overflow-hidden max-h-52 overflow-y-auto">
            <p className="px-3 py-2 text-[11px] font-semibold text-muted-foreground border-b border-border bg-muted/40 sticky top-0">
              Place results
            </p>
            {searchResults.map((result, idx) => (
              <button
                type="button"
                key={`${result.lat}-${result.lon}-${idx}`}
                onClick={() => selectSearchResult(result)}
                className="w-full text-left px-3 py-2.5 border-b border-border last:border-b-0 hover:bg-muted/60"
              >
                <p className="text-sm font-semibold text-foreground line-clamp-1">
                  {result.name || result.display_name.split(",")[0]}
                </p>
                <p className="text-[11px] text-muted-foreground line-clamp-1">
                  {(result.type || result.class || "place").replace(/_/g, " ")}
                  {" · "}
                  {result.address?.city ||
                    result.address?.town ||
                    result.address?.village ||
                    result.address?.state ||
                    result.address?.country ||
                    result.display_name}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="relative z-0 h-[260px] w-full overflow-hidden rounded-2xl border border-border">
        <MapContainer
          center={[center.lat, center.lng]}
          zoom={selected ? 16 : 13}
          scrollWheelZoom
          className="h-full w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickToPick onPick={onChange} />
          <RecenterMap center={center} zoom={selected ? 16 : 13} />
          {markerPosition && (
            <Marker
              position={markerPosition}
              icon={markerIcon}
              draggable
              eventHandlers={{
                dragend: (e) => {
                  const latlng = (e.target as L.Marker).getLatLng();
                  onChange({ lat: latlng.lat, lng: latlng.lng });
                },
              }}
            />
          )}
        </MapContainer>
      </div>

      <button
        type="button"
        onClick={requestCurrentLocation}
        disabled={loadingGps}
        className={cn(
          "w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-semibold transition-all active:scale-[0.98]",
          selected
            ? "bg-green-50 border-green-200 text-green-700"
            : "bg-primary/5 border-primary/30 text-primary hover:bg-primary/10",
        )}
      >
        <Navigation className={cn("w-4 h-4", loadingGps && "animate-spin")} />
        {loadingGps
          ? "Getting location..."
          : selected
            ? "Refine with my current location"
            : "Use my current location"}
      </button>

      <p className="text-[11px] text-muted-foreground">
        Tap on the map to place delivery pin, then drag marker for exact spot.
      </p>
      {gpsDenied && (
        <p className="text-[11px] text-amber-600">
          GPS permission denied. Please pick your location manually on the map.
        </p>
      )}
    </div>
  );
}
