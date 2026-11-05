import { useEffect, useState } from "react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function RiderLocation() {
  const [orderId, setOrderId] = useState("");
  const [sharing, setSharing] = useState(false);
  const [message, setMessage] = useState("");
  const [watchId, setWatchId] = useState(null);

  useEffect(() => {
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [watchId]);

  const startSharing = async () => {
    if (!orderId.trim()) {
      setMessage("Order ID enter karo.");
      return;
    }

    if (!navigator.geolocation) {
      setMessage("Is device mein GPS location supported nahi hai.");
      return;
    }

    // Production mein authenticated rider token bhejna zaroori hai.
    const id = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          const response = await fetch(
            `${API}/api/tracking/${encodeURIComponent(orderId)}/location`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ latitude, longitude }),
            }
          );

          const data = await response.json();

          if (!response.ok) {
            setMessage(data.message || "Location update failed.");
            return;
          }

          setMessage(
            `Location updated: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`
          );
        } catch {
          setMessage("Server connection error. GPS update nahi bhej paye.");
        }
      },
      (error) => {
        setMessage(`GPS error: ${error.message}`);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 3000,
        timeout: 15000,
      }
    );

    setWatchId(id);
    setSharing(true);
  };

  const stopSharing = () => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
    }

    setWatchId(null);
    setSharing(false);
    setMessage("Location sharing stopped.");
  };

  return (
    <main className="rider-location">
      <h1>Delivery Rider GPS</h1>
      <p>Delivery ke dauran apni location share karo.</p>

      <label htmlFor="rider-order">Order ID</label>
      <input
        id="rider-order"
        value={orderId}
        onChange={(e) => setOrderId(e.target.value)}
        placeholder="Enter order ID"
        disabled={sharing}
      />

      {!sharing ? (
        <button onClick={startSharing}>Start Location Sharing</button>
      ) : (
        <button onClick={stopSharing}>Stop Sharing</button>
      )}

      <p role="status">{message}</p>
    </main>
  );
}