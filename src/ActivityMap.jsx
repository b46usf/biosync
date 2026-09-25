import { useEffect, useMemo, useState } from "react";
import {
  CircleMarker,
  MapContainer,
  Polyline,
  TileLayer,
  useMap,
} from "react-leaflet";
import { MapPin, Route } from "lucide-react";
import "leaflet/dist/leaflet.css";

const DEFAULT_CENTER = [-2.5, 118];
const TILE_URL =
  import.meta.env.VITE_OSM_TILE_URL ||
  "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

function FitRoute({ points }) {
  const map = useMap();
  useEffect(() => {
    if (points.length > 1)
      map.fitBounds(points, { padding: [28, 28], maxZoom: 16 });
    else if (points.length === 1) map.setView(points[0], 16);
  }, [map, points]);
  return null;
}

export default function ActivityMap({
  activities,
  livePoints = [],
  recording = false,
  gpsStatus = "idle",
}) {
  const routes = useMemo(
    () => activities.filter((activity) => activity.route?.length > 1),
    [activities],
  );
  const [selectedId, setSelectedId] = useState("");
  const selectedRoute =
    routes.find((activity) => activity.id === selectedId) || routes[0];
  const points =
    recording && livePoints.length ? livePoints : selectedRoute?.route || [];
  const latLngs = useMemo(
    () => points.map(({ lat, lng }) => [lat, lng]),
    [points],
  );

  return (
    <section
      className="activity-map-card panel"
      aria-label="Peta rute aktivitas"
    >
      <div className="activity-map-heading">
        <div>
          <span className="eyebrow">OPENSTREETMAP</span>
          <h2>
            {recording
              ? "Rute sedang direkam"
              : selectedRoute?.title || "Rute aktivitas"}
          </h2>
          <p>
            {recording
              ? latLngs.length > 1
                ? `${latLngs.length} titik GPS tercatat di perangkat ini.`
                : gpsStatus === "denied"
                  ? "Izin lokasi ditolak. Kamu masih bisa menyimpan durasi aktivitas tanpa rute."
                  : gpsStatus === "unavailable"
                    ? "GPS tidak tersedia. Aktivitas tetap berjalan tanpa data lokasi."
                    : "Menunggu sinyal GPS. Titik rute hanya disimpan setelah aktivitas selesai."
              : selectedRoute
                ? `${selectedRoute.type} · ${selectedRoute.distance}`
                : "Izinkan lokasi saat mulai aktivitas untuk merekam dan melihat rute."}
          </p>
        </div>
        {routes.length > 1 && !recording && (
          <label className="route-select-label">
            <span>Pilih aktivitas</span>
            <select
              value={selectedRoute?.id || ""}
              onChange={(event) => setSelectedId(event.target.value)}
            >
              {routes.map((activity) => (
                <option key={activity.id} value={activity.id}>
                  {activity.title}
                </option>
              ))}
            </select>
          </label>
        )}
        {!routes.length && !recording && (
          <span className="route-map-hint">
            <MapPin size={15} /> GPS hanya aktif saat merekam
          </span>
        )}
      </div>
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={4}
        scrollWheelZoom={false}
        className="activity-leaflet-map"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap contributors</a>'
          url={TILE_URL}
          maxZoom={19}
        />
        {latLngs.length > 0 && (
          <>
            <FitRoute points={latLngs} />
            <CircleMarker
              center={latLngs[0]}
              radius={7}
              pathOptions={{
                color: "#fff",
                weight: 3,
                fillColor: "#16a895",
                fillOpacity: 1,
              }}
            />
            {latLngs.length > 1 && (
              <Polyline
                positions={latLngs}
                pathOptions={{ color: "#16a895", weight: 5, opacity: 0.9 }}
              />
            )}
            {latLngs.length > 1 && (
              <CircleMarker
                center={latLngs.at(-1)}
                radius={7}
                pathOptions={{
                  color: "#fff",
                  weight: 3,
                  fillColor: "#20364a",
                  fillOpacity: 1,
                }}
              />
            )}
          </>
        )}
      </MapContainer>
      <div className="activity-map-footer">
        <Route size={14} />
        <span>
          Koordinat rute dienkripsi di brankas lokal; tile OSM diminta sesuai
          area peta yang dilihat.
        </span>
      </div>
    </section>
  );
}
