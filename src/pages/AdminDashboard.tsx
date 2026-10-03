import { useEffect, useMemo, useState } from "react";

import logo from "../assets/logo.png";
import { useAuth } from "../context/AuthContext";
import {
  createAdminCamera,
  createAdminCustomer,
  createAdminElder,
  deleteAdminCustomer,
  getAdminCustomer,
  getAdminCustomers,
  getAdminOverview,
  rotateAdminCameraDeviceKey,
  updateAdminCamera,
  updateAdminCustomer,
  type AdminCamera,
  type AdminCustomer,
  type AdminOverview,
} from "../services/api";

import "./AdminDashboard.css";

type AdminPage = "overview" | "customers" | "setup";
type Plan = "basic" | "vip" | "facility";
type SetupStatus = "pending_setup" | "active" | "suspended";

function Icon({ name }: { name: string }) {
  return <span className="material-symbols-outlined">{name}</span>;
}

const emptyOverview: AdminOverview = {
  customers: 0,
  pending_customers: 0,
  active_customers: 0,
  elders: 0,
  cameras: 0,
  active_cameras: 0,
};

function planLabel(plan: AdminCustomer["plan"]) {
  if (!plan) return "Not selected";
  return plan.charAt(0).toUpperCase() + plan.slice(1);
}

function setupLabel(status: AdminCustomer["setup_status"]) {
  if (status === "active") return "Active";
  if (status === "suspended") return "Suspended";
  return "Pending Setup";
}

function formatDate(value?: string | null) {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function AdminSidebar({
  page,
  setPage,
  onLogout,
  adminName,
}: {
  page: AdminPage;
  setPage: (page: AdminPage) => void;
  onLogout: () => void;
  adminName: string;
}) {
  return (
    <aside className="adminSidebar">
      <div className="adminLogoBox">
        <img src={logo} alt="KOLAPSE" className="adminLogo" />
      </div>

      <div className="adminNavLabel">Administration</div>

      <nav className="adminNav">
        <button
          className={`adminNavItem ${page === "overview" ? "active" : ""}`}
          onClick={() => setPage("overview")}
        >
          <Icon name="dashboard" />
          <span>Overview</span>
        </button>

        <button
          className={`adminNavItem ${page === "customers" ? "active" : ""}`}
          onClick={() => setPage("customers")}
        >
          <Icon name="group" />
          <span>Customers</span>
        </button>

        <button
          className={`adminNavItem ${page === "setup" ? "active" : ""}`}
          onClick={() => setPage("setup")}
        >
          <Icon name="person_add" />
          <span>Customer Setup</span>
        </button>
      </nav>

      <div className="adminSidebarBottom">
        <div className="adminIdentity">
          <div className="adminIdentityAvatar">
            <Icon name="admin_panel_settings" />
          </div>
          <div>
            <strong>{adminName}</strong>
            <span>Administrator</span>
          </div>
        </div>

        <button className="adminLogout" onClick={onLogout}>
          <Icon name="logout" />
          <span>Log out</span>
        </button>
      </div>
    </aside>
  );
}

function AdminTopbar({
  adminName,
  onRefresh,
  refreshing,
}: {
  adminName: string;
  onRefresh: () => void;
  refreshing: boolean;
}) {
  return (
    <header className="adminTopbar">
      <div>
        <span className="adminEyebrow">KOLAPSE Administration</span>
        <h2>Welcome back, {adminName}</h2>
      </div>

      <div className="adminTopActions">
        <button
          className="adminRefresh"
          onClick={onRefresh}
          disabled={refreshing}
          title="Refresh admin data"
        >
          <Icon name="refresh" />
          <span>{refreshing ? "Refreshing" : "Refresh"}</span>
        </button>

        <button className="adminBell" title="Notifications">
          <Icon name="notifications" />
        </button>

        <div className="adminProfileIcon" title={adminName}>
          <Icon name="person" />
        </div>
      </div>
    </header>
  );
}

function MetricCard({
  icon,
  label,
  value,
  note,
}: {
  icon: string;
  label: string;
  value: number;
  note: string;
}) {
  return (
    <article className="adminMetric">
      <div className="adminMetricIcon">
        <Icon name={icon} />
      </div>
      <p>{label}</p>
      <strong>{value}</strong>
      <small>{note}</small>
    </article>
  );
}

function StatusBadge({ status }: { status: AdminCustomer["setup_status"] }) {
  return (
    <span className={`adminStatus adminStatus-${status}`}>
      {setupLabel(status)}
    </span>
  );
}

function OverviewPage({
  overview,
  customers,
  onManage,
  onViewCustomers,
}: {
  overview: AdminOverview;
  customers: AdminCustomer[];
  onManage: (customer: AdminCustomer) => void;
  onViewCustomers: () => void;
}) {
  const recent = customers.slice(0, 5);

  return (
    <div className="adminPage">
      <div className="adminPageHeader">
        <h1>Admin Overview</h1>
        <p>
          Manage KOLAPSE customers, elderly profiles, service setup, and
          registered cameras.
        </p>
      </div>

      <section className="adminMetricsGrid">
        <MetricCard
          icon="group"
          label="Customers"
          value={overview.customers}
          note="Registered customer accounts"
        />
        <MetricCard
          icon="pending_actions"
          label="Pending Setup"
          value={overview.pending_customers}
          note="Customers awaiting setup"
        />
        <MetricCard
          icon="verified"
          label="Active Customers"
          value={overview.active_customers}
          note="Completed service setup"
        />
        <MetricCard
          icon="elderly"
          label="Elders"
          value={overview.elders}
          note="Registered elderly profiles"
        />
        <MetricCard
          icon="videocam"
          label="Cameras"
          value={overview.cameras}
          note="Registered camera devices"
        />
        <MetricCard
          icon="sensors"
          label="Active Cameras"
          value={overview.active_cameras}
          note="Currently enabled cameras"
        />
      </section>

      <section className="adminCard adminRecentCard">
        <div className="adminCardHeader">
          <div>
            <h2>Recent Customers</h2>
            <p>Latest customer accounts created by the KOLAPSE team.</p>
          </div>
          <button className="adminOutlineButton" onClick={onViewCustomers}>
            View Customers
          </button>
        </div>

        {recent.length === 0 ? (
          <div className="adminEmpty">
            <Icon name="group" />
            <h3>No customers yet</h3>
            <p>Create the first customer from Customer Setup.</p>
          </div>
        ) : (
          <div className="adminTableWrap">
            <table className="adminTable">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Plan</th>
                  <th>Google</th>
                  <th>Setup</th>
                  <th>Elders</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((customer) => (
                  <tr key={customer.id}>
                    <td>
                      <strong>{customer.name}</strong>
                      <span>{customer.email}</span>
                    </td>
                    <td>{planLabel(customer.plan)}</td>
                    <td>
                      {customer.google_connected ? "Connected" : "Not connected"}
                    </td>
                    <td>
                      <StatusBadge status={customer.setup_status} />
                    </td>
                    <td>{customer.elders?.length ?? 0}</td>
                    <td>
                      <button
                        className="adminSmallButton"
                        onClick={() => onManage(customer)}
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function CustomersPage({
  customers,
  onManage,
  onCreate,
}: {
  customers: AdminCustomer[];
  onManage: (customer: AdminCustomer) => void;
  onCreate: () => void;
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (customer) =>
        customer.name.toLowerCase().includes(q) ||
        customer.email.toLowerCase().includes(q) ||
        (customer.phone ?? "").toLowerCase().includes(q)
    );
  }, [customers, query]);

  return (
    <div className="adminPage">
      <div className="adminPageHeader adminPageHeaderRow">
        <div>
          <h1>Customers</h1>
          <p>View and manage all KOLAPSE customer accounts.</p>
        </div>
        <button className="adminPrimaryButton" onClick={onCreate}>
          <Icon name="person_add" />
          <span>Add Customer</span>
        </button>
      </div>

      <section className="adminCard">
        <div className="adminToolbar">
          <div className="adminSearch">
            <Icon name="search" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search customer name, email, or phone"
            />
          </div>
          <span>{filtered.length} customers</span>
        </div>

        <div className="adminTableWrap">
          <table className="adminTable">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Phone</th>
                <th>Plan</th>
                <th>Google</th>
                <th>Setup</th>
                <th>Elders</th>
                <th>Created</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((customer) => (
                <tr key={customer.id}>
                  <td>
                    <strong>{customer.name}</strong>
                    <span>{customer.email}</span>
                  </td>
                  <td>{customer.phone || "Not provided"}</td>
                  <td>{planLabel(customer.plan)}</td>
                  <td>
                    {customer.google_connected ? "Connected" : "Not connected"}
                  </td>
                  <td>
                    <StatusBadge status={customer.setup_status} />
                  </td>
                  <td>{customer.elders?.length ?? 0}</td>
                  <td>{formatDate(customer.created_at)}</td>
                  <td>
                    <button
                      className="adminSmallButton"
                      onClick={() => onManage(customer)}
                    >
                      Manage
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="adminEmpty">
            <Icon name="search_off" />
            <h3>No customers found</h3>
            <p>Try another search or create a new customer.</p>
          </div>
        )}
      </section>
    </div>
  );
}

function CreateCustomerForm({
  onCreated,
}: {
  onCreated: (customer: AdminCustomer) => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [plan, setPlan] = useState<Plan | "">("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setSaving(true);

    try {
      const customer = await createAdminCustomer({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || null,
        plan: plan || null,
      });
      setName("");
      setEmail("");
      setPhone("");
      setPlan("");
      onCreated(customer);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create customer");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="adminCard">
      <div className="adminCardHeader">
        <div>
          <h2>Create Customer</h2>
          <p>
            Create the approved customer account before the customer signs in
            with Google.
          </p>
        </div>
        <div className="adminStepNumber">1</div>
      </div>

      <form className="adminForm" onSubmit={submit}>
        <label>
          <span>Full name</span>
          <input
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Customer full name"
          />
        </label>

        <label>
          <span>Email</span>
          <input
            required
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="customer@example.com"
          />
        </label>

        <label>
          <span>Phone</span>
          <input
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="Optional phone number"
          />
        </label>

        <label>
          <span>Service plan</span>
          <select
            value={plan}
            onChange={(event) => setPlan(event.target.value as Plan | "")}
          >
            <option value="">Select later</option>
            <option value="basic">Basic</option>
            <option value="vip">VIP</option>
            <option value="facility">Facility</option>
          </select>
        </label>

        {error && <div className="adminError">{error}</div>}

        <button className="adminPrimaryButton adminFormSubmit" disabled={saving}>
          <Icon name="person_add" />
          <span>{saving ? "Creating" : "Create Customer"}</span>
        </button>
      </form>
    </section>
  );
}

function CustomerManager({
  customer,
  onChanged,
  onDeleted,
}: {
  customer: AdminCustomer;
  onChanged: (customer: AdminCustomer) => void;
  onDeleted: (customerId: number) => void;
}) {
  const [current, setCurrent] = useState(customer);
  const [plan, setPlan] = useState<AdminCustomer["plan"]>(customer.plan);
  const [setupStatus, setSetupStatus] = useState<SetupStatus>(
    customer.setup_status
  );
  const [savingCustomer, setSavingCustomer] = useState(false);
  const [deletingCustomer, setDeletingCustomer] = useState(false);

  const [elderName, setElderName] = useState("");
  const [elderAge, setElderAge] = useState("");
  const [elderGender, setElderGender] = useState("");
  const [elderRoom, setElderRoom] = useState("");
  const [elderNotes, setElderNotes] = useState("");
  const [savingElder, setSavingElder] = useState(false);

  const [cameraElderId, setCameraElderId] = useState("");
  const [cameraName, setCameraName] = useState("");
  const [cameraLocation, setCameraLocation] = useState("");
  const [savingCamera, setSavingCamera] = useState(false);

  const [deviceKey, setDeviceKey] = useState("");
  const [deviceKeyCameraName, setDeviceKeyCameraName] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setCurrent(customer);
    setPlan(customer.plan);
    setSetupStatus(customer.setup_status);
    setCameraElderId(customer.elders?.[0]?.id?.toString() ?? "");
  }, [customer]);

  async function reloadCustomer() {
    const fresh = await getAdminCustomer(current.id);
    setCurrent(fresh);
    setPlan(fresh.plan);
    setSetupStatus(fresh.setup_status);
    onChanged(fresh);
    return fresh;
  }

  async function saveCustomer() {
    setSavingCustomer(true);
    setError("");
    try {
      await updateAdminCustomer(current.id, {
        plan,
        setup_status: setupStatus,
      });
      await reloadCustomer();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update customer");
    } finally {
      setSavingCustomer(false);
    }
  }

  async function removeCustomer() {
    const confirmed = window.confirm(
      `Delete ${current.name}? This permanently deletes the customer account and all related elder profiles, cameras, activity records, alerts, and notification settings.`
    );

    if (!confirmed) return;

    setDeletingCustomer(true);
    setError("");

    try {
      await deleteAdminCustomer(current.id);
      onDeleted(current.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete customer");
    } finally {
      setDeletingCustomer(false);
    }
  }

  async function addElder(event: React.FormEvent) {
    event.preventDefault();
    setSavingElder(true);
    setError("");
    try {
      await createAdminElder(current.id, {
        name: elderName.trim(),
        age: Number(elderAge),
        gender: elderGender.trim() || null,
        room: elderRoom.trim(),
        notes: elderNotes.trim() || null,
        photo: null,
      });
      setElderName("");
      setElderAge("");
      setElderGender("");
      setElderRoom("");
      setElderNotes("");
      const fresh = await reloadCustomer();
      if (!cameraElderId && fresh.elders?.[0]) {
        setCameraElderId(String(fresh.elders[0].id));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add elder");
    } finally {
      setSavingElder(false);
    }
  }

  async function addCamera(event: React.FormEvent) {
    event.preventDefault();
    if (!cameraElderId) return;

    setSavingCamera(true);
    setError("");
    setDeviceKey("");

    try {
      const response = await createAdminCamera({
        elder_id: Number(cameraElderId),
        name: cameraName.trim(),
        location: cameraLocation.trim(),
      });
      setDeviceKey(response.device_key);
      setDeviceKeyCameraName(response.camera.name);
      setCameraName("");
      setCameraLocation("");
      await reloadCustomer();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to register camera");
    } finally {
      setSavingCamera(false);
    }
  }

  async function toggleCamera(camera: AdminCamera) {
    setError("");
    try {
      await updateAdminCamera(camera.id, {
        is_active: !camera.is_active,
      });
      await reloadCustomer();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update camera");
    }
  }

  async function rotateKey(camera: AdminCamera) {
    const confirmed = window.confirm(
      `Rotate the device key for ${camera.name}? The old key will stop working.`
    );
    if (!confirmed) return;

    setError("");
    try {
      const response = await rotateAdminCameraDeviceKey(camera.id);
      setDeviceKey(response.device_key);
      setDeviceKeyCameraName(camera.name);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to rotate device key");
    }
  }

  async function copyDeviceKey() {
    if (!deviceKey) return;
    await navigator.clipboard.writeText(deviceKey);
  }

  const elders = current.elders ?? [];

  return (
    <div className="adminSetupStack">
      <section className="adminCard">
        <div className="adminCardHeader">
          <div>
            <span className="adminSectionKicker">Selected customer</span>
            <h2>{current.name}</h2>
            <p>{current.email}</p>
          </div>
          <StatusBadge status={current.setup_status} />
        </div>

        <div className="adminCustomerSummary">
          <div>
            <span>Phone</span>
            <strong>{current.phone || "Not provided"}</strong>
          </div>
          <div>
            <span>Google account</span>
            <strong>
              {current.google_connected ? "Connected" : "Not connected yet"}
            </strong>
          </div>
          <div>
            <span>Elders</span>
            <strong>{elders.length}</strong>
          </div>
          <div>
            <span>Created</span>
            <strong>{formatDate(current.created_at)}</strong>
          </div>
        </div>

        <div className="adminInlineForm">
          <label>
            <span>Service plan</span>
            <select
              value={plan ?? ""}
              onChange={(event) =>
                setPlan((event.target.value || null) as AdminCustomer["plan"])
              }
            >
              <option value="">Not selected</option>
              <option value="basic">Basic</option>
              <option value="vip">VIP</option>
              <option value="facility">Facility</option>
            </select>
          </label>

          <label>
            <span>Setup status</span>
            <select
              value={setupStatus}
              onChange={(event) =>
                setSetupStatus(event.target.value as SetupStatus)
              }
            >
              <option value="pending_setup">Pending Setup</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>
          </label>

          <div className="adminCustomerActions">
            <button
              className="adminPrimaryButton"
              onClick={saveCustomer}
              disabled={savingCustomer || deletingCustomer}
            >
              <Icon name="save" />
              <span>{savingCustomer ? "Saving" : "Save Customer"}</span>
            </button>
            <button
              className="adminDangerButton"
              onClick={removeCustomer}
              disabled={savingCustomer || deletingCustomer}
            >
              <Icon name="delete" />
              <span>{deletingCustomer ? "Deleting" : "Delete Customer"}</span>
            </button>
          </div>
        </div>
      </section>

      <section className="adminCard">
        <div className="adminCardHeader">
          <div>
            <h2>Add Elder Profile</h2>
            <p>Register the elderly person who will use KOLAPSE monitoring.</p>
          </div>
          <div className="adminStepNumber">2</div>
        </div>

        <form className="adminForm adminFormWide" onSubmit={addElder}>
          <label>
            <span>Elder name</span>
            <input
              required
              value={elderName}
              onChange={(event) => setElderName(event.target.value)}
              placeholder="Full name"
            />
          </label>

          <label>
            <span>Age</span>
            <input
              required
              min="1"
              max="130"
              type="number"
              value={elderAge}
              onChange={(event) => setElderAge(event.target.value)}
              placeholder="Age"
            />
          </label>

          <label>
            <span>Gender</span>
            <input
              value={elderGender}
              onChange={(event) => setElderGender(event.target.value)}
              placeholder="Optional"
            />
          </label>

          <label>
            <span>Room</span>
            <input
              required
              value={elderRoom}
              onChange={(event) => setElderRoom(event.target.value)}
              placeholder="Example: Room 101"
            />
          </label>

          <label className="adminFullField">
            <span>Notes</span>
            <textarea
              value={elderNotes}
              onChange={(event) => setElderNotes(event.target.value)}
              placeholder="Optional care or setup notes"
            />
          </label>

          <button className="adminPrimaryButton adminFormSubmit" disabled={savingElder}>
            <Icon name="elderly" />
            <span>{savingElder ? "Adding" : "Add Elder"}</span>
          </button>
        </form>

        {elders.length > 0 && (
          <div className="adminElderList">
            {elders.map((elder) => (
              <article className="adminElderItem" key={elder.id}>
                <div className="adminElderIcon">
                  <Icon name="elderly" />
                </div>
                <div>
                  <strong>{elder.name}</strong>
                  <span>
                    Age {elder.age} · {elder.room}
                  </span>
                </div>
                <span>{elder.cameras?.length ?? 0} cameras</span>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="adminCard">
        <div className="adminCardHeader">
          <div>
            <h2>Register Camera</h2>
            <p>
              Provision a camera for an elder. The generated device key is for
              KOLAPSE technical setup, not for the customer.
            </p>
          </div>
          <div className="adminStepNumber">3</div>
        </div>

        {elders.length === 0 ? (
          <div className="adminInfo">
            Add an elder profile before registering a camera.
          </div>
        ) : (
          <form className="adminForm" onSubmit={addCamera}>
            <label>
              <span>Elder</span>
              <select
                required
                value={cameraElderId}
                onChange={(event) => setCameraElderId(event.target.value)}
              >
                <option value="">Select elder</option>
                {elders.map((elder) => (
                  <option key={elder.id} value={elder.id}>
                    {elder.name} - {elder.room}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Camera name</span>
              <input
                required
                value={cameraName}
                onChange={(event) => setCameraName(event.target.value)}
                placeholder="Example: Room 101 Camera"
              />
            </label>

            <label>
              <span>Location</span>
              <input
                required
                value={cameraLocation}
                onChange={(event) => setCameraLocation(event.target.value)}
                placeholder="Example: Bedroom"
              />
            </label>

            <button
              className="adminPrimaryButton adminFormSubmit"
              disabled={savingCamera}
            >
              <Icon name="videocam" />
              <span>{savingCamera ? "Registering" : "Register Camera"}</span>
            </button>
          </form>
        )}

        {deviceKey && (
          <div className="adminDeviceKey">
            <div>
              <Icon name="key" />
              <div>
                <strong>Device key generated for {deviceKeyCameraName}</strong>
                <p>
                  Copy this key now and store it securely for camera
                  provisioning.
                </p>
              </div>
            </div>
            <code>{deviceKey}</code>
            <button className="adminOutlineButton" onClick={copyDeviceKey}>
              <Icon name="content_copy" />
              <span>Copy Key</span>
            </button>
          </div>
        )}

        {elders.flatMap((elder) => elder.cameras ?? []).length > 0 && (
          <div className="adminCameraList">
            {elders.flatMap((elder) =>
              (elder.cameras ?? []).map((camera) => (
                <article className="adminCameraItem" key={camera.id}>
                  <div className="adminCameraIcon">
                    <Icon name="videocam" />
                  </div>
                  <div className="adminCameraText">
                    <strong>{camera.name}</strong>
                    <span>
                      {camera.location} ·{" "}
                      {elders.find((item) => item.id === camera.elder_id)?.name ??
                        "Elder"}
                    </span>
                  </div>
                  <span
                    className={`adminCameraState ${
                      camera.is_active ? "active" : "inactive"
                    }`}
                  >
                    {camera.is_active ? "Active" : "Inactive"}
                  </span>
                  <button
                    className="adminSmallButton"
                    onClick={() => toggleCamera(camera)}
                  >
                    {camera.is_active ? "Disable" : "Enable"}
                  </button>
                  <button
                    className="adminSmallButton"
                    onClick={() => rotateKey(camera)}
                  >
                    Rotate Key
                  </button>
                </article>
              ))
            )}
          </div>
        )}
      </section>

      {error && <div className="adminError adminStickyError">{error}</div>}
    </div>
  );
}

function SetupPage({
  customers,
  selectedCustomer,
  onSelect,
  onCustomerCreated,
  onCustomerChanged,
  onCustomerDeleted,
}: {
  customers: AdminCustomer[];
  selectedCustomer: AdminCustomer | null;
  onSelect: (customer: AdminCustomer) => void;
  onCustomerCreated: (customer: AdminCustomer) => void;
  onCustomerChanged: (customer: AdminCustomer) => void;
  onCustomerDeleted: (customerId: number) => void;
}) {
  return (
    <div className="adminPage">
      <div className="adminPageHeader">
        <h1>Customer Setup</h1>
        <p>
          Create a customer, register their elder profile, and provision the
          monitoring camera.
        </p>
      </div>

      <div className="adminSetupIntro">
        <div>
          <Icon name="person_add" />
          <span>Create Customer</span>
        </div>
        <i />
        <div>
          <Icon name="elderly" />
          <span>Add Elder</span>
        </div>
        <i />
        <div>
          <Icon name="videocam" />
          <span>Register Camera</span>
        </div>
      </div>

      <CreateCustomerForm onCreated={onCustomerCreated} />

      {customers.length > 0 && (
        <section className="adminCard adminSelectCustomer">
          <div>
            <h2>Continue Customer Setup</h2>
            <p>Select an existing customer to manage their service setup.</p>
          </div>

          <select
            value={selectedCustomer?.id ?? ""}
            onChange={(event) => {
              const customer = customers.find(
                (item) => item.id === Number(event.target.value)
              );
              if (customer) onSelect(customer);
            }}
          >
            <option value="">Select customer</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name} - {customer.email}
              </option>
            ))}
          </select>
        </section>
      )}

      {selectedCustomer && (
        <CustomerManager
          customer={selectedCustomer}
          onChanged={onCustomerChanged}
          onDeleted={onCustomerDeleted}
        />
      )}
    </div>
  );
}

export default function AdminDashboard() {
  const { user, logout } = useAuth();

  const [page, setPage] = useState<AdminPage>("overview");
  const [overview, setOverview] = useState<AdminOverview>(emptyOverview);
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [selectedCustomer, setSelectedCustomer] =
    useState<AdminCustomer | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const adminName = user?.name || "Administrator";

  async function loadAdminData(showRefresh = false) {
    if (showRefresh) setRefreshing(true);
    setError("");

    try {
      const [overviewData, customerData] = await Promise.all([
        getAdminOverview(),
        getAdminCustomers(),
      ]);
      setOverview(overviewData);
      setCustomers(customerData);

      if (selectedCustomer) {
        const match = customerData.find(
          (customer) => customer.id === selectedCustomer.id
        );
        if (match) setSelectedCustomer(match);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load admin dashboard"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void loadAdminData();
  }, []);

  async function manageCustomer(customer: AdminCustomer) {
    setError("");
    try {
      const fresh = await getAdminCustomer(customer.id);
      setSelectedCustomer(fresh);
      setPage("setup");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load customer");
    }
  }

  async function customerCreated(customer: AdminCustomer) {
    await loadAdminData();
    await manageCustomer(customer);
  }

  async function customerChanged(customer: AdminCustomer) {
    setSelectedCustomer(customer);
    await loadAdminData();
  }

  async function customerDeleted(customerId: number) {
    setSelectedCustomer((current) =>
      current?.id === customerId ? null : current
    );
    await loadAdminData();
    setPage("customers");
  }

  if (loading) {
    return (
      <div className="adminLoadingPage">
        <div className="adminLoadingCard">
          <img src={logo} alt="KOLAPSE" />
          <div className="adminLoader" />
          <p>Loading administration dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="adminDashboard">
      <AdminSidebar
        page={page}
        setPage={setPage}
        onLogout={logout}
        adminName={adminName}
      />

      <main className="adminMain">
        <AdminTopbar
          adminName={adminName}
          onRefresh={() => void loadAdminData(true)}
          refreshing={refreshing}
        />

        <div className="adminContent">
          {error && <div className="adminError">{error}</div>}

          {page === "overview" && (
            <OverviewPage
              overview={overview}
              customers={customers}
              onManage={manageCustomer}
              onViewCustomers={() => setPage("customers")}
            />
          )}

          {page === "customers" && (
            <CustomersPage
              customers={customers}
              onManage={manageCustomer}
              onCreate={() => {
                setSelectedCustomer(null);
                setPage("setup");
              }}
            />
          )}

          {page === "setup" && (
            <SetupPage
              customers={customers}
              selectedCustomer={selectedCustomer}
              onSelect={(customer) => void manageCustomer(customer)}
              onCustomerCreated={(customer) => void customerCreated(customer)}
              onCustomerChanged={(customer) => void customerChanged(customer)}
              onCustomerDeleted={(customerId) => void customerDeleted(customerId)}
            />
          )}
        </div>
      </main>
    </div>
  );
}
