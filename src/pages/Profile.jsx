
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  UserRound,
  Mail,
  Phone,
  MapPin,
  Camera,
  Pencil,
  Save,
  X,
  ShoppingBag,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  LogOut,
} from "lucide-react";
import "./Profile.css";

const emptyProfile = {
  name: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  state: "",
  pincode: "",
  avatar: "",
};

function getSavedUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    return {};
  }
}

function getInitialProfile() {
  const user = getSavedUser();

  return {
    ...emptyProfile,
    ...user,
    name: user.name || user.fullName || "",
    email: user.email || localStorage.getItem("userEmail") || "",
    phone: user.phone || user.mobile || "",
    address: user.address || "",
    city: user.city || "",
    state: user.state || "",
    pincode: user.pincode || "",
    avatar: user.avatar || "",
  };
}

export default function Profile() {
  const [profile, setProfile] = useState(getInitialProfile);
  const [form, setForm] = useState(getInitialProfile);
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState("");
  const [avatarError, setAvatarError] = useState("");
  const fileInputRef = useRef(null);

  useEffect(() => {
    const saved = getInitialProfile();
    setProfile(saved);
    setForm(saved);
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setMessage("");
  };

  const handlePhoto = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setAvatarError("Please select an image file.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setAvatarError("Photo must be smaller than 2 MB.");
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const image = reader.result;

      setForm((previous) => ({
        ...previous,
        avatar: image,
      }));

      setAvatarError("");
      setMessage("");
    };

    reader.onerror = () => {
      setAvatarError("Unable to read this image. Please try again.");
    };

    reader.readAsDataURL(file);
    event.target.value = "";
  };

  const handleSave = (event) => {
    event.preventDefault();

    const cleaned = {
      ...form,
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      address: form.address.trim(),
      city: form.city.trim(),
      state: form.state.trim(),
      pincode: form.pincode.trim(),
    };

    if (!cleaned.name) {
      setMessage("Please enter your name.");
      return;
    }

    if (
      cleaned.email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleaned.email)
    ) {
      setMessage("Please enter a valid email address.");
      return;
    }

    try {
      localStorage.setItem("user", JSON.stringify(cleaned));

      if (cleaned.email) {
        localStorage.setItem("userEmail", cleaned.email);
      }

      setProfile(cleaned);
      setForm(cleaned);
      setEditing(false);
      setMessage("Profile updated successfully!");
    } catch {
      setMessage(
        "Unable to save your profile. The photo may be too large."
      );
    }
  };

  const handleCancel = () => {
    setForm(profile);
    setEditing(false);
    setAvatarError("");
    setMessage("");
  };

  const initials = (profile.name || "Customer")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <main className="profile-page">
      <div className="profile-container">
        <nav className="profile-breadcrumb">
          <Link to="/">Home</Link>
          <span>/</span>
          <span>My Profile</span>
        </nav>

        <section className="profile-welcome">
          <div>
            <span className="profile-eyebrow">
              YOUR FRESHCART ACCOUNT
            </span>
            <h1>My Profile</h1>
            <p>
              Manage your personal information and delivery details
              in one place.
            </p>
          </div>

          <div className="profile-welcome-icon">
            <UserRound size={38} />
          </div>
        </section>

        {message && (
          <div
            className={`profile-message ${
              message.includes("successfully")
                ? "profile-message-success"
                : "profile-message-error"
            }`}
            role="status"
          >
            {message.includes("successfully") ? (
              <CheckCircle2 size={19} />
            ) : (
              <ShieldCheck size={19} />
            )}
            {message}
          </div>
        )}

        <div className="profile-layout">
          <aside className="profile-sidebar">
            <div className="profile-avatar-area">
              <div className="profile-avatar">
                {form.avatar ? (
                  <img src={form.avatar} alt="Profile" />
                ) : (
                  <span>{initials || "C"}</span>
                )}

                <button
                  type="button"
                  className="profile-camera-btn"
                  onClick={() => fileInputRef.current?.click()}
                  aria-label="Upload profile photo"
                  title="Change profile photo"
                >
                  <Camera size={17} />
                </button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhoto}
                hidden
              />

              <h2>{profile.name || "Welcome, Customer"}</h2>
              <p>{profile.email || "Add your email address"}</p>

              {avatarError && (
                <p className="profile-avatar-error">{avatarError}</p>
              )}

              <span className="profile-member-badge">
                <ShieldCheck size={15} />
                FreshCart Member
              </span>
            </div>

            <div className="profile-side-links">
              <div className="profile-side-link profile-side-active">
                <UserRound size={19} />
                <span>Personal Information</span>
              </div>

              <Link to="/my-orders" className="profile-side-link">
                <ShoppingBag size={19} />
                <span>My Orders</span>
                <ArrowRight size={16} className="profile-link-arrow" />
              </Link>

              <Link to="/shop" className="profile-side-link">
                <ShoppingBag size={19} />
                <span>Continue Shopping</span>
                <ArrowRight size={16} className="profile-link-arrow" />
              </Link>
            </div>

            <div className="profile-sidebar-note">
              <ShieldCheck size={21} />
              <div>
                <strong>Your account, your details</strong>
                <p>
                  Keep your contact information up to date for a
                  smoother shopping experience.
                </p>
              </div>
            </div>
          </aside>

          <section className="profile-main-card">
            <div className="profile-card-heading">
              <div>
                <h2>Personal Information</h2>
                <p>Update your personal and contact details.</p>
              </div>

              {!editing && (
                <button
                  type="button"
                  className="profile-edit-btn"
                  onClick={() => {
                    setForm(profile);
                    setEditing(true);
                    setMessage("");
                  }}
                >
                  <Pencil size={16} />
                  Edit Profile
                </button>
              )}
            </div>

            <form onSubmit={handleSave}>
              <div className="profile-form-section">
                <h3>Basic Details</h3>

                <div className="profile-form-grid">
                  <label className="profile-field">
                    <span>Full Name</span>
                    <div className="profile-input-wrap">
                      <UserRound size={18} />
                      <input
                        type="text"
                        name="name"
                        placeholder="Enter your full name"
                        value={form.name}
                        onChange={handleChange}
                        disabled={!editing}
                        required
                      />
                    </div>
                  </label>

                  <label className="profile-field">
                    <span>Email Address</span>
                    <div className="profile-input-wrap">
                      <Mail size={18} />
                      <input
                        type="email"
                        name="email"
                        placeholder="you@example.com"
                        value={form.email}
                        onChange={handleChange}
                        disabled={!editing}
                      />
                    </div>
                  </label>

                  <label className="profile-field">
                    <span>Phone Number</span>
                    <div className="profile-input-wrap">
                      <Phone size={18} />
                      <input
                        type="tel"
                        name="phone"
                        placeholder="Enter phone number"
                        value={form.phone}
                        onChange={handleChange}
                        disabled={!editing}
                        maxLength={15}
                      />
                    </div>
                  </label>
                </div>
              </div>

              <div className="profile-form-section">
                <h3>Delivery Address</h3>

                <div className="profile-form-grid">
                  <label className="profile-field profile-field-full">
                    <span>Street Address</span>
                    <div className="profile-input-wrap profile-input-top">
                      <MapPin size={18} />
                      <textarea
                        name="address"
                        placeholder="House number, street, area..."
                        value={form.address}
                        onChange={handleChange}
                        disabled={!editing}
                        rows={3}
                      />
                    </div>
                  </label>

                  <label className="profile-field">
                    <span>City</span>
                    <input
                      type="text"
                      name="city"
                      placeholder="Your city"
                      value={form.city}
                      onChange={handleChange}
                      disabled={!editing}
                    />
                  </label>

                  <label className="profile-field">
                    <span>State</span>
                    <input
                      type="text"
                      name="state"
                      placeholder="Your state"
                      value={form.state}
                      onChange={handleChange}
                      disabled={!editing}
                    />
                  </label>

                  <label className="profile-field">
                    <span>PIN Code</span>
                    <input
                      type="text"
                      name="pincode"
                      placeholder="6-digit PIN code"
                      value={form.pincode}
                      onChange={handleChange}
                      disabled={!editing}
                      maxLength={6}
                      inputMode="numeric"
                    />
                  </label>
                </div>
              </div>

              {editing && (
                <div className="profile-form-actions">
                  <button
                    type="button"
                    className="profile-cancel-btn"
                    onClick={handleCancel}
                  >
                    <X size={17} />
                    Cancel
                  </button>

                  <button type="submit" className="profile-save-btn">
                    <Save size={17} />
                    Save Changes
                  </button>
                </div>
              )}
            </form>

            <div className="profile-bottom-note">
              <ShieldCheck size={20} />
              <p>
                Your profile changes are saved in this browser.
                For permanent account updates across devices, connect
                this form to your backend API.
              </p>
            </div>
          </section>
        </div>

        <footer className="profile-footer">
          <Link to="/">Back to Home</Link>
          <span>•</span>
          <Link to="/shop">Explore FreshCart</Link>
        </footer>
      </div>
    </main>
  );
}
