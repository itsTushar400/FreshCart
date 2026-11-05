
import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./OrderTrackingMap.css";

function FitMarkers({ points }) {
  const map = useMap();

  useEffect(() => {
    if (points.length > 0) {
      map.fitBounds(points, { padding: [40, 40] });
    }
  }, [map, points]);

  return null;
}

export default function OrderTrackingMap({ orderId, token }) {
  const [tracking, setTracking] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadLocation() {
      try {
        const response = await fetch(
          `/api/tracking/${orderId}`,
          {
            headers: token
              ? { Authorization: `Bearer ${token}` }
              : {}
          }
        );

        if (!response.ok) {
          throw new Error("Tracking location load nahi hui.");
        }

        const data = await response.json();

        // Apne API response ke actual format ke hisaab se
        // data ko yahan adjust karna ho sakta hai.
        const item = data.tracking ?? data.data ?? data;

        if (active) {
          setTracking(item);
          setError("");
        }
      } catch (err) {
        if (active) setError(err.message);
      }
    }

    loadLocation();
    const timer = setInterval(loadLocation, 5000);

    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [orderId, token]);

  const lat = Number(tracking?.rider_lat);
  const lng = Number(tracking?.rider_lng);
  const destLat = Number(tracking?.destination_lat);
  const destLng = Number(tracking?.destination_lng);

  const hasRider = Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    tracking?.rider_lat != null &&
    tracking?.rider_lng != null;

  const hasDestination = Number.isFinite(destLat) &&
    Number.isFinite(destLng) &&
    tracking?.destination_lat != null &&
    tracking?.destination_lng != null;

  if (error && !tracking) return <p>{error}</p>;

  if (!tracking) return <p>Map load ho raha hai...</p>;

  if (!hasRider && !hasDestination) {
    return <p>Abhi map ke liye location available nahi hai.</p>;
  }

  const points = [
    ...(hasRider ? [[lat, lng]] : []),
    ...(hasDestination ? [[destLat, destLng]] : [])
  ];

  return (
    <div>
      <div className="tracking-map-status">
        <strong>Delivery Status:</strong>{" "}
        {tracking.status ?? "Updating"}
      </div>

      {error && <p>{error}</p>}

      <MapContainer
        center={points[0]}
        zoom={14}
        scrollWheelZoom={false}
        className="tracking-map"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        <FitMarkers points={points} />

        {hasRider && (
          <Marker position={[lat, lng]}>
            <Popup>Delivery Rider</Popup>
          </Marker>
        )}

        {hasDestination && (
          <Marker position={[destLat, destLng]}>
            <Popup>Customer Delivery Address</Popup>
          </Marker>
        )}

        {hasRider && hasDestination && (
          <Polyline
            positions={[
              [lat, lng],
              [destLat, destLng]
            ]}
            pathOptions={{ color: "#16a34a", weight: 5 }}
          />
        )}
      </MapContainer>
    </div>
  );
}
