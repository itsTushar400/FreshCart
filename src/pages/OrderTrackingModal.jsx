
import { useEffect, useState, useCallback } from "react";
import {
  MapPin,
  X,
  Package,
  Truck,
  CheckCircle,
  Clock,
  RefreshCw,
  MapPinned,
} from "lucide-react";
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
import "./OrderTrackingModal.css";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

const DEFAULT_CENTER = [20.5937, 78.9629];

function isValidCoordinate(lat, lng) {
  return (
    lat !== null &&
    lat !== undefined &&
    lat !== "" &&
    lng !== null &&
    lng !== undefined &&
    lng !== "" &&
    Number.isFinite(Number(lat)) &&
    Number.isFinite(Number(lng)) &&
    Number(lat) >= -90 &&
    Number(lat) <= 90 &&
    Number(lng) >= -180 &&
    Number(lng) <= 180
  );
}

function makeIcon(emoji, className) {
  return L.divIcon({
    className: "otm-marker-shell",
    html: `<div class="otm-marker ${className}">${emoji}</div>`,
    iconSize: [42, 42],
    iconAnchor: [21, 21],
  });
}

const riderIcon = makeIcon("🚚", "otm-rider-pin");
const destinationIcon = makeIcon("🏠", "otm-destination-pin");

function MapResize({ points }) {
  const map = useMap();

  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();

      if (points.length === 1) {
        map.setView(points[0], 14);
      } else if (points.length > 1) {
        map.fitBounds(points, {
          padding: [35, 35],
          maxZoom: 15,
        });
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [map, points]);

  return null;
}

function normaliseStatus(status) {
  const value = String(status || "pending").toLowerCase();

  if (value === "processing") return "confirmed";
  if (value === "complete" || value === "completed") {
    return "delivered";
  }
  if (value === "out_for_delivery") return "shipped";

  return value;
}

function statusLabel(status) {
  const labels = {
    pending: "Order Placed",
    confirmed: "Confirmed",
    packed: "Packed",
    shipped: "On the Way",
    delivered: "Delivered",
    cancelled: "Cancelled",
  };

  return labels[normaliseStatus(status)] || String(status || "Pending");
}

function statusProgress(status) {
  const value = normaliseStatus(status);

  if (value === "delivered") return 4;
  if (value === "shipped") return 3;
  if (value === "packed") return 2;
  if (value === "confirmed") return 1;

  return 0;
}

export default function OrderTrackingModal({ order, onClose }) {
  const [tracking, setTracking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [route, setRoute] = useState([]);
  const [eta, setEta] = useState("");
  const [distance, setDistance] = useState("");

  const orderId = order?.id ?? order?.order_id;

  const loadTracking = useCallback(async () => {
    if (!orderId) {
      setLoading(false);
      setError("Order ID is missing.");
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `${API_URL}/api/tracking/${encodeURIComponent(orderId)}`,
        {
          headers: {
            Accept: "application/json",
            ...(token
              ? { Authorization: `Bearer ${token}` }
              : {}),
          },
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message ||
            `Tracking API returned ${response.status}.`
        );
      }

      setTracking(data.tracking || data.order || data);
      setError("");
    } catch (err) {
      setTracking(null);
      setError(
        err.message ||
          "Tracking details are not available right now."
      );
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    loadTracking();

    const status = normaliseStatus(order?.status);

    if (["delivered", "cancelled"].includes(status)) {
      return undefined;
    }

    const timer = setInterval(loadTracking, 10000);

    return () => clearInterval(timer);
  }, [loadTracking, order?.status]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose?.();
    };

    document.addEventListener("keydown", handleKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  const riderLat =
    tracking?.rider_lat ?? tracking?.riderLat ?? null;
  const riderLng =
    tracking?.rider_lng ?? tracking?.riderLng ?? null;

  const destinationLat =
    tracking?.destination_lat ??
    tracking?.destinationLat ??
    order?.destination_lat ??
    null;

  const destinationLng =
    tracking?.destination_lng ??
    tracking?.destinationLng ??
    order?.destination_lng ??
    null;

  const hasRider = isValidCoordinate(riderLat, riderLng);
  const hasDestination = isValidCoordinate(
    destinationLat,
    destinationLng
  );

  const riderPosition = hasRider
    ? [Number(riderLat), Number(riderLng)]
    : null;

  const destinationPosition = hasDestination
    ? [Number(destinationLat), Number(destinationLng)]
    : null;

  const points = [
    riderPosition,
    destinationPosition,
  ].filter(Boolean);

  const center =
    riderPosition ||
    destinationPosition ||
    DEFAULT_CENTER;

  const currentStatus =
    tracking?.status || order?.status || "pending";

  const progress = statusProgress(currentStatus);

  const address =
    tracking?.delivery_address ||
    tracking?.address ||
    order?.delivery_address ||
    order?.address ||
    "Delivery address not available";

  useEffect(() => {
    if (!hasRider || !hasDestination) {
      setRoute([]);
      setEta("");
      setDistance("");
      return undefined;
    }

    const controller = new AbortController();

    async function fetchRoute() {
      try {
        const url =
          "https://router.project-osrm.org/route/v1/driving/" +
          `${Number(riderLng)},${Number(riderLat)};` +
          `${Number(destinationLng)},${Number(destinationLat)}` +
          "?overview=full&geometries=geojson";

        const response = await fetch(url, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Route service unavailable.");
        }

        const data = await response.json();
        const result = data.routes?.[0];

        if (!result) {
          throw new Error("No route found.");
        }

        setRoute(
          result.geometry.coordinates.map(([lng, lat]) => [
            lat,
            lng,
          ])
        );

        setEta(
          `${Math.max(1, Math.ceil(result.duration / 60))} min`
        );

        setDistance(
          result.distance >= 1000
            ? `${(result.distance / 1000).toFixed(1)} km`
            : `${Math.round(result.distance)} m`
        );
      } catch (err) {
        if (err.name !== "AbortError") {
          setRoute([]);
          setEta("Unavailable");
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

  const steps = [
    { label: "Placed", icon: Package },
    { label: "Confirmed", icon: CheckCircle },
    { label: "Packed", icon: Package },
    { label: "Shipped", icon: Truck },
    { label: "Delivered", icon: CheckCircle },
  ];

  return (
    <div
      className="otm-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose?.();
        }
      }}
    >
      <section
        className="otm-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="otm-title"
      >
        <header className="otm-header">
          <div className="otm-heading">
            <span className="otm-heading-icon">
              <MapPinned size={22} />
            </span>

            <div>
              <h2 id="otm-title">Track Your Order</h2>
              <p className="otm-subtitle">
                Order #{orderId}
              </p>
            </div>
          </div>

          <button
            type="button"
            className="otm-close"
            onClick={onClose}
            aria-label="Close tracking popup"
          >
            <X size={21} />
          </button>
        </header>

        <div className="otm-body">
          <div className="otm-status-row">
            <div className="otm-status-icon">
              {progress >= 3 ? (
                <Truck size={24} />
              ) : progress === 2 ? (
                <Package size={24} />
              ) : (
                <Clock size={24} />
              )}
            </div>

            <div className="otm-status-copy">
              <span className="otm-label">
                CURRENT ORDER STATUS
              </span>

              <h3>{statusLabel(currentStatus)}</h3>

              <p>
                {progress === 4
                  ? "Your order has been delivered."
                  : progress === 3
                  ? "Your order is on the way."
                  : "Your order status will update as it progresses."}
              </p>
            </div>

            <button
              type="button"
              className="otm-refresh"
              onClick={loadTracking}
              disabled={loading}
              aria-label="Refresh tracking information"
              title="Refresh tracking"
            >
              <RefreshCw
                size={17}
                className={loading ? "otm-spinning" : ""}
              />
            </button>
          </div>

          <div className="otm-progress">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              const active = index <= progress;

              return (
                <div
                  key={step.label}
                  className={`otm-step ${active ? "active" : ""}`}
                >
                  <div className="otm-step-icon">
                    <StepIcon size={16} />
                  </div>
                  <span>{step.label}</span>
                </div>
              );
            })}
          </div>

          <div className="otm-map-heading">
            <h3>
              <MapPin size={18} />
              Delivery Map
            </h3>

            <span className="otm-map-badge">
              {hasRider ? "Rider located" : "Location pending"}
            </span>
          </div>

          <div className="otm-map-wrap">
            <MapContainer
              center={center}
              zoom={points.length ? 13 : 4}
              scrollWheelZoom
              className="otm-map"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              <MapResize points={points} />

              {riderPosition && (
                <Marker position={riderPosition} icon={riderIcon}>
                  <Popup>Delivery rider</Popup>
                </Marker>
              )}

              {destinationPosition && (
                <Marker
                  position={destinationPosition}
                  icon={destinationIcon}
                >
                  <Popup>Delivery destination</Popup>
                </Marker>
              )}

              {route.length > 0 && (
                <Polyline
                  positions={route}
                  pathOptions={{
                    color: "#159447",
                    weight: 5,
                    opacity: 0.85,
                  }}
                />
              )}
            </MapContainer>

            {!hasRider && (
              <div className="otm-map-message">
                <MapPin size={25} />
                <strong>
                  {loading
                    ? "Loading tracking..."
                    : "Rider location not available"}
                </strong>
                <span>
                  Live location will appear when the backend
                  provides valid GPS coordinates.
                </span>
              </div>
            )}
          </div>

          {eta && (
            <div className="otm-route-info">
              <span>
                <Truck size={17} /> Estimated time: <strong>{eta}</strong>
              </span>
              {distance && <span>Distance: <strong>{distance}</strong></span>}
            </div>
          )}

          {error && (
            <div className="otm-error" role="status">
              {error}
            </div>
          )}

          {!hasDestination && (
            <p className="otm-note">
              Destination GPS coordinates are not available for
              this order yet. The route will appear when coordinates
              are provided by the backend.
            </p>
          )}

          <div className="otm-info-grid">
            <div className="otm-info-card">
              <span className="otm-label">
                <MapPin size={15} /> DELIVERY ADDRESS
              </span>
              <p className="otm-address">{address}</p>
            </div>

            <div className="otm-info-card">
              <span className="otm-label">
                <Package size={15} /> ORDER NUMBER
              </span>
              <p>#{orderId}</p>
            </div>
          </div>
        </div>

        <footer className="otm-footer">
          <span>
            {loading
              ? "Updating tracking..."
              : "Tracking checks for updates every 10 seconds"}
          </span>

          <button
            type="button"
            className="otm-done-btn"
            onClick={onClose}
          >
            Close
          </button>
        </footer>
      </section>
    </div>
  );
}
