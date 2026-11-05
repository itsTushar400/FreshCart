
import { useCallback, useEffect, useMemo, useState } from "react";
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
import "./AdminOrderTracking.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

const DEFAULT_CENTER = [28.6139, 77.209];

const riderIcon = L.divIcon({
  className: "fc-map-marker",
  html: '<div class="fc-rider-pin">🚴</div>',
  iconSize: [42, 42],
  iconAnchor: [21, 21],
});

const destinationIcon = L.divIcon({
  className: "fc-map-marker",
  html: '<div class="fc-destination-pin">🏠</div>',
  iconSize: [42, 42],
  iconAnchor: [21, 21],
});

function FitMap({ positions }) {
  const map = useMap();

  useEffect(() => {
    if (positions.length === 1) {
      map.setView(positions[0], 15);
    } else if (positions.length > 1) {
      map.fitBounds(positions, { padding: [40, 40], maxZoom: 15 });
    }
  }, [map, positions]);

  return null;
}

function validCoordinates(lat, lng) {
  return (
    lat != null &&
    lng != null &&
    String(lat).trim() !== "" &&
    String(lng).trim() !== "" &&
    Number.isFinite(Number(lat)) &&
    Number.isFinite(Number(lng)) &&
    Number(lat) >= -90 &&
    Number(lat) <= 90 &&
    Number(lng) >= -180 &&
    Number(lng) <= 180
  );
}

export default function AdminOrderTracking() {
  const [orderId, setOrderId] = useState("");
  const [order, setOrder] = useState(null);
  const [route, setRoute] = useState([]);
  const [eta, setEta] = useState("");
  const [distance, setDistance] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const riderLat = Number(order?.rider_lat);
  const riderLng = Number(order?.rider_lng);
  const destinationLat = Number(order?.destination_lat);
  const destinationLng = Number(order?.destination_lng);

  const hasRider = validCoordinates(order?.rider_lat, order?.rider_lng);
  const hasDestination = validCoordinates(
    order?.destination_lat,
    order?.destination_lng
  );

  const riderPosition = hasRider ? [riderLat, riderLng] : null;
  const destinationPosition = hasDestination
    ? [destinationLat, destinationLng]
    : null;

  const positions = useMemo(
    () =>
      [riderPosition, destinationPosition].filter(Boolean),
    [
      order?.rider_lat,
      order?.rider_lng,
      order?.destination_lat,
      order?.destination_lng,
    ]
  );

  const loadOrder = useCallback(async (id = orderId) => {
    if (!id.trim()) return;

    try {
      const response = await fetch(
        `${API}/api/tracking/${encodeURIComponent(id.trim())}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Order tracking not found");
      }

      setOrder(data);
      setError("");
    } catch (err) {
      setOrder(null);
      setRoute([]);
      setEta("");
      setDistance("");
      setError(err.message || "Unable to load tracking");
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  const searchOrder = async (event) => {
    event.preventDefault();
    setLoading(true);
    setOrder(null);
    setRoute([]);
    setEta("");
    setDistance("");
    setError("");
    await loadOrder(orderId);
  };

  // Refresh rider location every 5 seconds while delivery is active.
  useEffect(() => {
    if (!order || ["delivered", "cancelled"].includes(
      String(order.status || "").toLowerCase()
    )) {
      return;
    }

    const timer = setInterval(() => {
      loadOrder(String(order.order_id ?? orderId));
    }, 5000);

    return () => clearInterval(timer);
  }, [order?.order_id, order?.status, orderId, loadOrder]);

  // Get a road route from the public OSRM demo service.
  useEffect(() => {
    if (!hasRider || !hasDestination) {
      setRoute([]);
      setEta("");
      setDistance("");
      return;
    }

    const controller = new AbortController();

    async function fetchRoute() {
      try {
        const url =
          `https://router.project-osrm.org/route/v1/driving/` +
          `${riderLng},${riderLat};${destinationLng},${destinationLat}` +
          "?overview=full&geometries=geojson";

        const response = await fetch(url, {
          signal: controller.signal,
        });

        if (!response.ok) throw new Error("Route service unavailable");

        const data = await response.json();
        const result = data.routes?.[0];

        if (!result) throw new Error("No road route found");

        // OSRM returns [longitude, latitude]; Leaflet needs [latitude, longitude].
        setRoute(
          result.geometry.coordinates.map(([lng, lat]) => [lat, lng])
        );

        const minutes = Math.ceil(result.duration / 60);
        setEta(
          minutes < 1 ? "Less than 1 min" : `${minutes} min`
        );
        setDistance(
          result.distance >= 1000
            ? `${(result.distance / 1000).toFixed(1)} km`
            : `${Math.round(result.distance)} m`
        );
      } catch (err) {
        if (err.name !== "AbortError") {
          setRoute([]);
          setEta("ETA unavailable");
          setDistance("");
        }
      }
    }

    fetchRoute();

    return () => controller.abort();
  }, [
    hasRider,
    hasDestination,
    riderLat,
    riderLng,
    destinationLat,
    destinationLng,
  ]);

  const center = riderPosition || destinationPosition || DEFAULT_CENTER;

  return (
    <div className="admin-tracking">
      <div className="tracking-heading">
        <div>
          <span className="tracking-eyebrow">FRESHCART ADMIN</span>
          <h1>Live Order Tracking</h1>
          <p>Monitor delivery progress, rider location and ETA.</p>
        </div>
      </div>

      <form className="tracking-search" onSubmit={searchOrder}>
        <input
          value={orderId}
          onChange={(event) => setOrderId(event.target.value)}
          placeholder="Enter order ID"
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? "Searching..." : "Track Order"}
        </button>
      </form>

      {error && <div className="tracking-error">{error}</div>}

      {order && (
        <>
          <div className="tracking-stats">
            <div className="tracking-stat">
              <span>Order ID</span>
              <strong>#{order.order_id}</strong>
            </div>

            <div className="tracking-stat">
              <span>Current Status</span>
              <strong>{order.status || "Pending"}</strong>
            </div>

            <div className="tracking-stat">
              <span>Estimated Travel Time</span>
              <strong>{eta || "Waiting for route..."}</strong>
              {distance && <small>{distance} away</small>}
            </div>
          </div>

          <div className="tracking-map-card">
            <div className="tracking-map-heading">
              <h2>Delivery Map</h2>
              <span>
                {hasRider ? "Rider GPS received" : "Waiting for rider GPS"}
              </span>
            </div>

            <MapContainer
              key={String(order.order_id)}
              center={center}
              zoom={13}
              scrollWheelZoom
              style={{ width: "100%", height: "430px" }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {hasRider && (
                <Marker position={riderPosition} icon={riderIcon}>
                  <Popup>Delivery Rider</Popup>
                </Marker>
              )}

              {hasDestination && (
                <Marker position={destinationPosition} icon={destinationIcon}>
                  <Popup>Customer Destination</Popup>
                </Marker>
              )}

              {route.length > 0 && (
                <Polyline
                  positions={route}
                  pathOptions={{ color: "#16a34a", weight: 5 }}
                />
              )}

              <FitMap positions={positions} />
            </MapContainer>

            {!hasRider && (
              <p className="tracking-map-notice">
                Rider location abhi available nahi hai. GPS coordinates aane
                par map update hoga.
              </p>
            )}

            <div className="tracking-address">
              <strong>Delivery Address</strong>
              <p>{order.delivery_address || "Address unavailable"}</p>
            </div>
          </div>
        </>
      )}

      {!order && !error && (
        <div className="tracking-empty">
          <div className="tracking-empty-icon">⌖</div>
          <h2>Track a delivery</h2>
          <p>
            Enter an order ID above to view its delivery information and map.
          </p>
        </div>
      )}
    </div>
  );
}
