
import "./TrackOrder.css";
import { useCallback, useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

const defaultCenter = [28.6139, 77.209];

const statusSteps = [
  "Confirmed",
  "Packed",
  "Shipped",
  "Out for Delivery",
  "Delivered",
];

const riderIcon = L.divIcon({
  className: "fc-map-marker",
  html: '<div class="fc-rider-pin">🚚</div>',
  iconSize: [42, 42],
  iconAnchor: [21, 21],
  popupAnchor: [0, -20],
});

const destinationIcon = L.divIcon({
  className: "fc-map-marker",
  html: '<div class="fc-destination-pin">🏠</div>',
  iconSize: [42, 42],
  iconAnchor: [21, 21],
  popupAnchor: [0, -20],
});

function FitMap({ points }) {
  const map = useMap();

  useEffect(() => {
    if (points.length === 1) {
      map.setView(points[0], 15);
    } else if (points.length > 1) {
      map.fitBounds(points, { padding: [40, 40], maxZoom: 15 });
    }
  }, [map, points]);

  return null;
}

export default function TrackOrder() {
  const [orderId, setOrderId] = useState("");
  const [tracking, setTracking] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchTracking = useCallback(async () => {
    if (!orderId.trim()) return;

    try {
      const response = await fetch(
        `${API}/api/tracking/${encodeURIComponent(orderId)}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Tracking details not found");
      }

      setTracking(data);
      setError("");
    } catch (err) {
      setError(err.message || "Tracking load nahi ho payi.");
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  const startTracking = async (event) => {
    event.preventDefault();
    setLoading(true);
    setTracking(null);
    setError("");
    await fetchTracking();
  };

  useEffect(() => {
    if (
      !tracking ||
      ["Delivered", "Cancelled"].includes(tracking.status)
    ) {
      return;
    }

    const timer = setInterval(fetchTracking, 5000);
    return () => clearInterval(timer);
  }, [tracking?.order_id, tracking?.status, fetchTracking]);

  const riderLat =
    tracking?.rider_lat == null ? null : Number(tracking.rider_lat);
  const riderLng =
    tracking?.rider_lng == null ? null : Number(tracking.rider_lng);

  const destinationLat =
    tracking?.destination_lat == null
      ? null
      : Number(tracking.destination_lat);

  const destinationLng =
    tracking?.destination_lng == null
      ? null
      : Number(tracking.destination_lng);

  const hasRider =
    riderLat !== null &&
    riderLng !== null &&
    Number.isFinite(riderLat) &&
    Number.isFinite(riderLng) &&
    riderLat >= -90 &&
    riderLat <= 90 &&
    riderLng >= -180 &&
    riderLng <= 180;

  const hasDestination =
    destinationLat !== null &&
    destinationLng !== null &&
    Number.isFinite(destinationLat) &&
    Number.isFinite(destinationLng) &&
    destinationLat >= -90 &&
    destinationLat <= 90 &&
    destinationLng >= -180 &&
    destinationLng <= 180;

  const points = [
    ...(hasRider ? [[riderLat, riderLng]] : []),
    ...(hasDestination ? [[destinationLat, destinationLng]] : []),
  ];

  const center = points[0] || defaultCenter;

  return (
    <main className="track-order-page">
      <header className="track-header">
        <span className="track-eyebrow">FRESHCART DELIVERY</span>
        <h1>Track Your Order</h1>
        <p>
          Apne order ki delivery progress aur rider ki location dekho.
        </p>
      </header>

      <form className="track-search" onSubmit={startTracking}>
        <input
          value={orderId}
          onChange={(event) => setOrderId(event.target.value)}
          placeholder="Enter your order ID"
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? "Loading..." : "Track Order"}
        </button>
      </form>

      {error && (
        <p className="track-error" role="alert">
          {error}
        </p>
      )}

      {tracking && (
        <section className="tracking-card">
          <div className="tracking-summary">
            <div>
              <span className="muted">Order ID</span>
              <h2>#{tracking.order_id}</h2>
            </div>
            <span className="status-badge">{tracking.status}</span>
          </div>

          <div className="delivery-address">
            <strong>Delivering to</strong>
            <p>{tracking.delivery_address}</p>
          </div>

          {tracking.status === "Delivered" ? (
            <div className="delivery-message">
              Your order has been delivered!
            </div>
          ) : tracking.status === "Cancelled" ? (
            <div className="delivery-message">
              This order has been cancelled.
            </div>
          ) : (
            <>
              <div className="map-heading">
                <h3>Live Delivery Map</h3>
                <span>
                  {hasRider
                    ? "Rider location available"
                    : "Waiting for rider GPS"}
                </span>
              </div>

              <MapContainer
                center={center}
                zoom={hasRider ? 15 : 12}
                scrollWheelZoom={false}
                className="tracking-map"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                  maxZoom={19}
                />

                <FitMap points={points} />

                {hasDestination && (
                  <Marker
                    position={[destinationLat, destinationLng]}
                    icon={destinationIcon}
                  >
                    <Popup>Customer delivery address</Popup>
                  </Marker>
                )}

                {hasRider && (
                  <Marker
                    position={[riderLat, riderLng]}
                    icon={riderIcon}
                  >
                    <Popup>FreshCart delivery rider</Popup>
                  </Marker>
                )}

                {hasRider && hasDestination && (
                  <Polyline
                    positions={[
                      [riderLat, riderLng],
                      [destinationLat, destinationLng],
                    ]}
                    pathOptions={{
                      color: "#16a34a",
                      weight: 5,
                      dashArray: "8 8",
                    }}
                  />
                )}
              </MapContainer>

              <div className="eta-panel">
                <div>
                  <span className="muted">Delivery location</span>
                  <h3>
                    {hasRider
                      ? "Rider GPS is available"
                      : "Waiting for rider location"}
                  </h3>
                  <p>
                    {hasDestination
                      ? "Delivery destination is available."
                      : "Destination coordinates are not available yet."}
                  </p>
                </div>
                <span aria-hidden="true">🚚</span>
              </div>
            </>
          )}

          <div className="tracking-progress">
            <h3>Order Progress</h3>

            {statusSteps.map((step) => {
              const currentIndex = statusSteps.indexOf(tracking.status);
              const stepIndex = statusSteps.indexOf(step);

              const completed =
                tracking.status !== "Cancelled" &&
                currentIndex >= 0 &&
                stepIndex <= currentIndex;

              return (
                <div className="progress-row" key={step}>
                  <span
                    className={
                      completed ? "progress-dot done" : "progress-dot"
                    }
                  >
                    {completed ? "✓" : ""}
                  </span>
                  <span
                    className={
                      completed
                        ? "progress-label done"
                        : "progress-label"
                    }
                  >
                    {step}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </main>
  );
}
