
import { useEffect, useState } from "react";
import {
  Store, UserRound, Bell, ShieldCheck, Truck,
  Save, RotateCcw, CheckCircle2, Globe, Mail,
  Phone, MapPin, IndianRupee, PackageCheck
} from "lucide-react";
import "./AdminSettings.css";

const defaultSettings = {
  storeName: "FreshCart",
  email: "support@freshcart.com",
  phone: "",
  address: "",
  currency: "INR",
  taxRate: "0",
  freeShipping: "499",
  deliveryCharge: "40",
  minOrder: "99",
  lowStock: "10",
  adminName: "Administrator",
  adminEmail: "",
  orderNotifications: true,
  stockNotifications: true,
  newsletterNotifications: false,
  maintenanceMode: false,
};

const sections = [
  { id: "store", label: "Store information", icon: Store },
  { id: "orders", label: "Orders & delivery", icon: Truck },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "account", label: "Admin profile", icon: UserRound },
  { id: "security", label: "Store status", icon: ShieldCheck },
];

function SettingField({ label, value, onChange, placeholder, type = "text", hint, min, max, step }) {
  return (
    <label className="fs-field">
      <span>{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        min={min}
        max={max}
        step={step}
      />
      {hint && <small>{hint}</small>}
    </label>
  );
}

function Toggle({ title, description, checked, onChange }) {
  return (
    <div className="fs-toggle-row">
      <div>
        <strong>{title}</strong>
        <p>{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        className={`fs-switch ${checked ? "is-on" : ""}`}
        onClick={() => onChange(!checked)}
      >
        <span />
      </button>
    </div>
  );
}

export default function AdminSettings() {
  const [settings, setSettings] = useState(defaultSettings);
  const [activeSection, setActiveSection] = useState("store");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("freshcart-admin-settings");
      if (stored) {
        setSettings({ ...defaultSettings, ...JSON.parse(stored) });
      }
    } catch {
      // Keep default settings if saved browser data is invalid.
    }
  }, []);

  const update = (key, value) => {
    setSettings((previous) => ({ ...previous, [key]: value }));
    setSaved(false);
  };

  const saveSettings = (event) => {
    event.preventDefault();
    try {
      localStorage.setItem("freshcart-admin-settings", JSON.stringify(settings));
      setSaved(true);
    } catch {
      alert("Settings could not be saved in this browser.");
    }
  };

  const resetSettings = () => {
    if (!window.confirm("Reset all settings to their default values?")) return;
    setSettings(defaultSettings);
    setSaved(false);
  };

  const currentSection = sections.find((item) => item.id === activeSection);

  return (
    <div className="fs-page">
      <header className="fs-header">
        <div>
          <div className="fs-breadcrumb">Store management <span>/</span> Settings</div>
          <h1>Settings</h1>
          <p>Manage your store preferences and administration options.</p>
        </div>
        <button className="fs-save-top" type="button" onClick={saveSettings}>
          <Save size={16} /> Save changes
        </button>
      </header>

      {saved && (
        <div className="fs-success" role="status">
          <CheckCircle2 size={18} />
          Settings saved in this browser.
        </div>
      )}

      <div className="fs-layout">
        <aside className="fs-menu">
          <div className="fs-menu-title">GENERAL SETTINGS</div>
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <button
                key={section.id}
                type="button"
                className={`fs-menu-item ${activeSection === section.id ? "active" : ""}`}
                onClick={() => setActiveSection(section.id)}
              >
                <Icon size={18} />
                <span>{section.label}</span>
              </button>
            );
          })}

          <div className="fs-menu-note">
            <ShieldCheck size={18} />
            <strong>Store preferences</strong>
            <p>Review your settings before saving changes.</p>
          </div>
        </aside>

        <form className="fs-content" onSubmit={saveSettings}>
          <div className="fs-section-heading">
            <div className="fs-section-icon">
              {currentSection && <currentSection.icon size={22} />}
            </div>
            <div>
              <h2>{currentSection?.label}</h2>
              <p>Update your {currentSection?.label.toLowerCase()} preferences below.</p>
            </div>
          </div>

          {activeSection === "store" && (
            <>
              <section className="fs-card">
                <div className="fs-card-heading">
                  <div><h3>Store details</h3><p>Basic information displayed for your business.</p></div>
                  <Store size={19} />
                </div>
                <div className="fs-fields">
                  <SettingField label="Store name" value={settings.storeName} onChange={(v) => update("storeName", v)} placeholder="Your store name" />
                  <SettingField label="Support email" type="email" value={settings.email} onChange={(v) => update("email", v)} placeholder="support@example.com" />
                  <SettingField label="Contact number" type="tel" value={settings.phone} onChange={(v) => update("phone", v)} placeholder="Enter contact number" />
                  <SettingField label="Store address" value={settings.address} onChange={(v) => update("address", v)} placeholder="City, state, postal code" />
                </div>
              </section>

              <section className="fs-card">
                <div className="fs-card-heading">
                  <div><h3>Regional preferences</h3><p>Choose the currency and tax rate used for store calculations.</p></div>
                  <Globe size={19} />
                </div>
                <div className="fs-fields">
                  <label className="fs-field">
                    <span>Store currency</span>
                    <select value={settings.currency} onChange={(e) => update("currency", e.target.value)}>
                      <option value="INR">INR — Indian Rupee (₹)</option>
                      <option value="USD">USD — US Dollar ($)</option>
                      <option value="EUR">EUR — Euro (€)</option>
                      <option value="GBP">GBP — British Pound (£)</option>
                    </select>
                  </label>
                  <SettingField label="Default tax rate (%)" type="number" min="0" max="100" step="0.1" value={settings.taxRate} onChange={(v) => update("taxRate", v)} hint="Set to 0 if tax is not configured." />
                </div>
              </section>
            </>
          )}

          {activeSection === "orders" && (
            <>
              <section className="fs-card">
                <div className="fs-card-heading">
                  <div><h3>Delivery & shipping</h3><p>Configure the delivery amounts displayed in your store.</p></div>
                  <Truck size={19} />
                </div>
                <div className="fs-fields">
                  <SettingField label="Free shipping above (₹)" type="number" min="0" value={settings.freeShipping} onChange={(v) => update("freeShipping", v)} hint="Order value required for free delivery." />
                  <SettingField label="Standard delivery charge (₹)" type="number" min="0" value={settings.deliveryCharge} onChange={(v) => update("deliveryCharge", v)} />
                  <SettingField label="Minimum order value (₹)" type="number" min="0" value={settings.minOrder} onChange={(v) => update("minOrder", v)} />
                </div>
              </section>
              <section className="fs-card">
                <div className="fs-card-heading">
                  <div><h3>Inventory</h3><p>Choose when a product should be flagged as low stock.</p></div>
                  <PackageCheck size={19} />
                </div>
                <div className="fs-fields">
                  <SettingField label="Low-stock threshold (units)" type="number" min="0" value={settings.lowStock} onChange={(v) => update("lowStock", v)} hint="Products at or below this quantity should be reviewed." />
                </div>
              </section>
            </>
          )}

          {activeSection === "notifications" && (
            <section className="fs-card">
              <div className="fs-card-heading">
                <div><h3>Notification preferences</h3><p>Choose which store events you want to keep track of.</p></div>
                <Bell size={19} />
              </div>
              <div className="fs-toggle-list">
                <Toggle title="Order updates" description="Enable preference for new order notifications." checked={settings.orderNotifications} onChange={(v) => update("orderNotifications", v)} />
                <Toggle title="Low-stock alerts" description="Enable preference for inventory warning notifications." checked={settings.stockNotifications} onChange={(v) => update("stockNotifications", v)} />
                <Toggle title="Newsletter updates" description="Enable preference for promotional and newsletter messages." checked={settings.newsletterNotifications} onChange={(v) => update("newsletterNotifications", v)} />
              </div>
              <div className="fs-info"><Bell size={16} /> These preferences are saved locally. Email or push delivery requires backend integration.</div>
            </section>
          )}

          {activeSection === "account" && (
            <section className="fs-card">
              <div className="fs-card-heading">
                <div><h3>Administrator profile</h3><p>Update the profile details displayed in the admin panel.</p></div>
                <UserRound size={19} />
              </div>
              <div className="fs-profile">
                <div className="fs-profile-avatar">A</div>
                <div><strong>{settings.adminName || "Administrator"}</strong><span>Store administrator</span></div>
              </div>
              <div className="fs-fields">
                <SettingField label="Display name" value={settings.adminName} onChange={(v) => update("adminName", v)} placeholder="Administrator" />
                <SettingField label="Admin email" type="email" value={settings.adminEmail} onChange={(v) => update("adminEmail", v)} placeholder="admin@example.com" />
              </div>
              <div className="fs-info"><ShieldCheck size={16} /> This does not change your login credentials. Connect your authentication API to update the actual admin account.</div>
            </section>
          )}

          {activeSection === "security" && (
            <section className="fs-card">
              <div className="fs-card-heading">
                <div><h3>Store availability</h3><p>Control the maintenance preference for your storefront.</p></div>
                <ShieldCheck size={19} />
              </div>
              <Toggle
                title="Maintenance mode preference"
                description="Save a preference to mark the store as under maintenance."
                checked={settings.maintenanceMode}
                onChange={(v) => update("maintenanceMode", v)}
              />
              <div className="fs-info"><ShieldCheck size={16} /> Saving this option does not take the website offline. Connect it to your backend and storefront before using it operationally.</div>
            </section>
          )}

          <div className="fs-actions">
            <button className="fs-reset" type="button" onClick={resetSettings}>
              <RotateCcw size={15} /> Reset defaults
            </button>
            <button className="fs-save" type="submit">
              <Save size={16} /> Save settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
