import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Search,
  CalendarDays,
  Clock,
  CheckCheck,
  ArrowRight,
} from "lucide-react";
import { useResource, Notice, Empty } from "../components/UI";
import { api } from "../services/api";
function PageHeading({ title, description, children }) {
  return (
    <div className="admin-page-heading">
      <div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {children}
    </div>
  );
}
function LoadingError({ loading, error }) {
  return (
    <>
      {loading && (
        <p role="status" className="loading-line">
          Loading…
        </p>
      )}
      <Notice error>{error}</Notice>
    </>
  );
}
function BookingTable({ rows, onStatus }) {
  return (
    <div className="table-scroll">
      <table className="admin-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Service</th>
            <th>Date</th>
            <th>Status</th>
            {onStatus && <th>Contact / Address</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((b) => (
            <tr key={b._id}>
              <td className="record-id">#{b._id.slice(-6).toUpperCase()}</td>
              <td>{b.name}</td>
              <td>{b.serviceName}</td>
              <td>{b.date}</td>
              <td>
                {onStatus ? (
                  <select
                    className={`status-select status-${b.status.toLowerCase()}`}
                    aria-label={`Status for ${b.name}`}
                    value={b.status}
                    onChange={(e) => onStatus(b._id, e.target.value)}
                  >
                    {["Pending", "Confirmed", "Completed", "Cancelled"].map(
                      (s) => (
                        <option key={s}>{s}</option>
                      ),
                    )}
                  </select>
                ) : (
                  <span className={`badge status-${b.status.toLowerCase()}`}>
                    {b.status}
                  </span>
                )}
              </td>
              {onStatus && (
                <td>
                  <a href={`tel:${b.phone}`}>{b.phone}</a>
                  <p className="cell-subtext">
                    {b.address}, {b.city}
                    <br />
                    {b.time}
                  </p>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      {!rows.length && (
        <Empty>No bookings yet. New service requests will appear here.</Empty>
      )}
    </div>
  );
}
export function Dashboard() {
  const { data, loading, error } = useResource("/admin/dashboard", {
    total: 0,
    pending: 0,
    completed: 0,
    recent: [],
    months: [],
  });
  return (
    <>
      <PageHeading
        title="Dashboard"
        description="A little overview of your everyday craftsmanship."
      />
      <LoadingError loading={loading} error={error} />
      <div className="dashboard-stats">
        {[
          { label: "Total Bookings", value: data.total, icon: CalendarDays },
          { label: "Pending", value: data.pending, icon: Clock },
          { label: "Completed", value: data.completed, icon: CheckCheck },
        ].map(({ label, value, icon: Icon }) => (
          <div className="admin-panel stat-card" key={label}>
            <div>
              <span>{label}</span>
              <Icon size={19} />
            </div>
            <strong>{value}</strong>
            <small>
              {label === "Pending"
                ? "Awaiting your attention"
                : label === "Completed"
                  ? "Precious pieces restored"
                  : "All service requests"}
            </small>
          </div>
        ))}
      </div>
      <section className="admin-panel chart-panel">
        <div className="section-heading">
          <h2>Bookings Overview</h2>
          <span className="field-hint">{new Date().getFullYear()}</span>
        </div>
        <div className="chart-wrap">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data.months}
              margin={{ top: 15, right: 15, left: -25, bottom: 0 }}
            >
              <defs>
                <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#eab74e" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#eab74e" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#ecebe6"
              />
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "#697078" }}
              />
              <YAxis
                allowDecimals={false}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "#697078" }}
              />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="bookings"
                name="Bookings"
                stroke="#c38928"
                strokeWidth={2}
                fill="url(#goldGradient)"
                dot={{ r: 3, fill: "#d5a248", stroke: "#fff" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        {!loading && !error && !data.total && (
          <p className="field-hint">
            Your chart will update when customers make their first bookings.
          </p>
        )}
      </section>
      <div className="dashboard-lower">
        <section className="admin-panel">
          <div className="section-heading">
            <h2>Recent Bookings</h2>
            <Link to="/admin/bookings">
              View all <ArrowRight size={13} />
            </Link>
          </div>
          <BookingTable rows={data.recent} />
        </section>
        <aside className="admin-panel quick-actions">
          <h2>Quick Actions</h2>
          {[
            ["Add New Service", "services"],
            ["Update Charges", "repair-charges"],
            ["View Bookings", "bookings"],
            ["Manage Customers", "customers"],
          ].map(([label, path]) => (
            <Link className="button small" key={path} to={`/admin/${path}`}>
              {label}
            </Link>
          ))}
        </aside>
      </div>
    </>
  );
}
export function Bookings() {
  const { data, setData, loading, error } = useResource("/admin/bookings", []);
  const [query, setQuery] = useState(""),
    [filter, setFilter] = useState("All"),
    [actionError, setActionError] = useState("");
  async function update(id, status) {
    setActionError("");
    try {
      const result = await api("/admin/bookings/" + id, {
        method: "PATCH",
        body: { status },
      });
      setData((rows) => rows.map((b) => (b._id === id ? result : b)));
    } catch (e) {
      setActionError(e.message);
    }
  }
  const rows = data.filter(
    (b) =>
      (filter === "All" || b.status === filter) &&
      `${b.name} ${b.phone} ${b.serviceName} ${b._id}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  return (
    <>
      <PageHeading
        title="Bookings"
        description="Manage home visits and keep every repair moving."
      />
      <LoadingError loading={loading} error={error || actionError} />
      <div className="admin-toolbar">
        <SearchBox
          query={query}
          setQuery={setQuery}
          placeholder="Search name, phone, service…"
        />
        <select
          aria-label="Filter status"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          {["All", "Pending", "Confirmed", "Completed", "Cancelled"].map(
            (s) => (
              <option key={s}>{s}</option>
            ),
          )}
        </select>
        <span>{rows.length} bookings</span>
      </div>
      <section className="admin-panel">
        <BookingTable rows={rows} onStatus={update} />
      </section>
    </>
  );
}
function SearchBox({ query, setQuery, placeholder = "Search…" }) {
  return (
    <div className="search-box">
      <Search size={17} />
      <input
        aria-label={placeholder}
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
    </div>
  );
}
export function CatalogManager({ charges = false }) {
  const route = charges ? "repair-charges" : "services";
  const title = charges ? "Repair Charges" : "Services";
  const { data, setData, loading, error } = useResource("/admin/" + route, []);
  const [editing, setEditing] = useState(null),
    [actionError, setActionError] = useState(""),
    [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState(null);
  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setActionError("");
    const fields = Object.fromEntries(new FormData(e.currentTarget));
    const body = charges
      ? { name: fields.name, min: Number(fields.min), max: Number(fields.max) }
      : {
          name: fields.name,
          description: fields.description,
          price: Number(fields.price),
          features: fields.features
            .split("\n")
            .map((x) => x.trim())
            .filter(Boolean),
          imageIndex: Number(fields.imageIndex),
          active: fields.active === "on",
        };
    try {
      const result = await api(
        "/admin/" + route + (editing._id ? "/" + editing._id : ""),
        { method: editing._id ? "PUT" : "POST", body },
      );
      setData((rows) =>
        editing._id
          ? rows.map((r) => (r._id === editing._id ? result : r))
          : [...rows, result],
      );
      setEditing(null);
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBusy(false);
    }
  }
  async function remove() {
    setBusy(true);
    setActionError("");
    try {
      await api("/admin/" + route + "/" + deleting._id, { method: "DELETE" });
      setData((rows) => rows.filter((r) => r._id !== deleting._id));
      setDeleting(null);
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageHeading
        title={title}
        description={
          charges
            ? "Keep your repair pricing clear and up to date."
            : "Curate the care you offer your customers."
        }
      >
        <button
          className="button"
          onClick={() => {
            setActionError("");
            setEditing({ active: true });
          }}
        >
          <Plus size={17} />
          Add {charges ? "Charge" : "Service"}
        </button>
      </PageHeading>
      <LoadingError loading={loading} error={error || actionError} />
      <section className="admin-panel table-scroll">
        <table className="admin-table">
          <thead>
            <tr>
              <th>{charges ? "Repair" : "Service"}</th>
              <th>{charges ? "Minimum (₹)" : "Starting Price (₹)"}</th>
              <th>{charges ? "Maximum (₹)" : "Availability"}</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.map((r) => (
              <tr key={r._id}>
                <td>
                  <strong>{r.name}</strong>
                  {!charges && <p className="cell-subtext">{r.description}</p>}
                </td>
                <td>{charges ? r.min : r.price}</td>
                <td>{charges ? r.max : r.active ? "Active" : "Hidden"}</td>
                <td>
                  <div className="row-actions">
                    <button
                      aria-label={`Edit ${r.name}`}
                      onClick={() => {
                        setActionError("");
                        setEditing(r);
                      }}
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      aria-label={`Delete ${r.name}`}
                      onClick={() => setDeleting(r)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!data.length && !loading && (
          <Empty>No {title.toLowerCase()} yet. Add your first item.</Empty>
        )}
      </section>
      {editing && (
        <Modal
          title={`${editing._id ? "Edit" : "Add"} ${charges ? "Repair Charge" : "Service"}`}
          onClose={() => !busy && setEditing(null)}
        >
          <form onSubmit={save}>
            <label>
              Name
              <input
                name="name"
                defaultValue={editing.name}
                minLength={2}
                maxLength={160}
                required
                autoFocus
              />
            </label>
            {charges ? (
              <div className="form-row">
                <label>
                  Minimum (₹)
                  <input
                    name="min"
                    type="number"
                    min="0"
                    defaultValue={editing.min}
                    required
                  />
                </label>
                <label>
                  Maximum (₹)
                  <input
                    name="max"
                    type="number"
                    min="0"
                    defaultValue={editing.max}
                    required
                  />
                </label>
              </div>
            ) : (
              <>
                <label>
                  Description
                  <textarea
                    name="description"
                    defaultValue={editing.description}
                    maxLength={500}
                  />
                </label>
                <div className="form-row">
                  <label>
                    Starting Price (₹)
                    <input
                      name="price"
                      type="number"
                      min="0"
                      max="1000000"
                      defaultValue={editing.price}
                      required
                    />
                  </label>
                  <label>
                    Photograph
                    <select
                      name="imageIndex"
                      defaultValue={editing.imageIndex || 0}
                    >
                      {[
                        "Ring",
                        "Necklace",
                        "Earrings",
                        "Bangle",
                        "Pendant",
                        "Silver",
                      ].map((x, i) => (
                        <option value={i} key={x}>
                          {x}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <label>
                  Features (one per line)
                  <textarea
                    name="features"
                    defaultValue={editing.features?.join("\n")}
                    placeholder={"Stone fitting\nPolishing"}
                  />
                </label>
                <label className="checkbox-label">
                  <input
                    name="active"
                    type="checkbox"
                    defaultChecked={editing.active}
                  />
                  Show on public services page
                </label>
              </>
            )}
            <Notice error>{actionError}</Notice>
            <button className="button" disabled={busy}>
              {busy ? "Saving…" : "Save Changes"}
            </button>
          </form>
        </Modal>
      )}
      {deleting && (
        <Modal
          title="Delete this item?"
          onClose={() => !busy && setDeleting(null)}
        >
          <p>
            Remove “{deleting.name}” from the catalogue? Existing booking
            history will be preserved.
          </p>
          <Notice error>{actionError}</Notice>
          <div className="flex gap-3 mt-5">
            <button className="button danger" disabled={busy} onClick={remove}>
              {busy ? "Deleting…" : "Delete Item"}
            </button>
            <button
              className="button subtle"
              disabled={busy}
              onClick={() => setDeleting(null)}
            >
              Keep Item
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
function Modal({ title, onClose, children }) {
  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
    >
      <section
        className="modal panel"
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="section-heading">
          <h2>{title}</h2>
          <button aria-label="Close dialog" onClick={onClose}>
            <X size={21} />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}
export function Customers() {
  const { data, loading, error } = useResource("/admin/customers", []);
  const [query, setQuery] = useState("");
  const rows = data.filter((c) =>
    `${c.name} ${c.phone} ${c.city}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  return (
    <>
      <PageHeading
        title="Customers"
        description="The people who trust you with their precious pieces."
      />
      <LoadingError loading={loading} error={error} />
      <div className="admin-toolbar">
        <SearchBox
          query={query}
          setQuery={setQuery}
          placeholder="Search customers…"
        />
        <span>{rows.length} customers</span>
      </div>
      <section className="admin-panel table-scroll">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Phone</th>
              <th>Location</th>
              <th>Bookings</th>
              <th>Latest Requested Date</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c._id}>
                <td>{c.name}</td>
                <td>
                  <a href={`tel:${c.phone}`}>{c.phone}</a>
                </td>
                <td>
                  {c.city}
                  <p className="cell-subtext">{c.address}</p>
                </td>
                <td>{c.bookings}</td>
                <td>{c.lastVisit}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && !loading && (
          <Empty>Customers appear here after their first booking.</Empty>
        )}
      </section>
    </>
  );
}
export function Messages() {
  const { data, setData, loading, error } = useResource("/admin/messages", []);
  const [query, setQuery] = useState(""),
    [actionError, setActionError] = useState("");
  async function update(id, status) {
    setActionError("");
    try {
      const result = await api("/admin/messages/" + id, {
        method: "PATCH",
        body: { status },
      });
      setData((rows) => rows.map((r) => (r._id === id ? result : r)));
    } catch (e) {
      setActionError(e.message);
    }
  }
  const rows = data.filter((m) =>
    `${m.name} ${m.email} ${m.message}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  return (
    <>
      <PageHeading
        title="Messages"
        description="A thoughtful response makes all the difference."
      />
      <LoadingError loading={loading} error={error || actionError} />
      <div className="admin-toolbar">
        <SearchBox
          query={query}
          setQuery={setQuery}
          placeholder="Search messages…"
        />
        <span>{rows.length} enquiries</span>
      </div>
      <div className="message-list">
        {rows.map((m) => (
          <article className="admin-panel message-card" key={m._id}>
            <div className="section-heading">
              <div>
                <h2>{m.name}</h2>
                <a href={`mailto:${m.email}`}>{m.email}</a>
              </div>
              <select
                aria-label={`Message status for ${m.name}`}
                value={m.status}
                onChange={(e) => update(m._id, e.target.value)}
              >
                {["Unread", "Read", "Resolved"].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
            <p className="message-body">{m.message}</p>
            <small>{new Date(m.createdAt).toLocaleString("en-IN")}</small>
          </article>
        ))}
        {!rows.length && !loading && (
          <div className="admin-panel">
            <Empty>No messages to show.</Empty>
          </div>
        )}
      </div>
    </>
  );
}
export function Settings() {
  const { data, loading, error } = useResource("/settings", null);
  const [status, setStatus] = useState({}),
    [busy, setBusy] = useState(false);
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setStatus({});
    try {
      await api("/admin/settings", {
        method: "PUT",
        body: Object.fromEntries(new FormData(e.currentTarget)),
      });
      setStatus({ message: "Business settings updated." });
    } catch (e) {
      setStatus({ error: e.message });
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageHeading
        title="Settings"
        description="Your business details, kept in one place."
      />
      <LoadingError loading={loading} error={error} />
      {data && (
        <form className="admin-panel settings-form" onSubmit={submit}>
          <h2>Business Information</h2>
          {[
            ["name", "Business Name"],
            ["phone", "Contact Number"],
            ["email", "Contact Email"],
            ["address", "Service Location"],
            ["hours", "Business Hours"],
          ].map(([key, label]) => (
            <label key={key}>
              {label}
              <input
                name={key}
                defaultValue={data[key]}
                type={key === "email" ? "email" : "text"}
                minLength={2}
                maxLength={160}
                required
              />
            </label>
          ))}
          <Notice error={!!status.error}>
            {status.error || status.message}
          </Notice>
          <button className="button" disabled={busy}>
            {busy ? "Saving…" : "Save Settings"}
          </button>
        </form>
      )}
    </>
  );
}
