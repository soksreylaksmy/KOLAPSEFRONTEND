import { useEffect, useState } from "react";

import "./App.css";

import logo from "./assets/logo.png";

import { useAuth } from "./context/AuthContext";
import { GoogleLogin } from "@react-oauth/google";
import AdminDashboard from "./pages/AdminDashboard";

import {
  getDashboardStats,
  getElders,
  getCurrentActivity,
  getActivitySummary,
  getAlerts,
  getActivityHistory,
  getNotificationChannels,
  connectTelegram,
  updateNotificationChannel,
  getTelegramConfig,
  getElderCameras,
  getCameraStatus,
  getCameraStreamToken,
  getCameraStreamUrl,
  type DashboardStats,
  type Elder,
  type Activity,
  type ActivitySummary,
  type Alert,
  type NotificationChannel,
  type Camera,
  type CameraStatus,
} from "./services/api";
import {
  connectWebSocket,
  disconnectWebSocket,
  type WebSocketMessage,
} from "./services/websocket";
function Icon({ name }: { name: string }) {
  return (
    <span className="material-symbols-outlined">
      {name}
    </span>
  );
}

type Page = "overview" | "activity" | "movement" | "alerts" | "notifications" | "profile" | "settings";
type AuthMode = "signin" | "signup";

const navItems: { id: Page; label: string; icon: string }[] = [
  { id: "overview", label: "Overview", icon: "dashboard" },
  { id: "activity", label: "Activity Monitor", icon: "monitor_heart" },
  { id: "movement", label: "Movement History", icon: "timeline" },
  { id: "alerts", label: "Alert History", icon: "warning" },
  { id: "notifications", label: "Notifications", icon: "notifications" },
];

function Logo() {
  return (
    <div className="logoBox">
      <img src={logo} alt="Logo" className="sidebarLogoImg" />
    </div>
  );
}


function AuthPage({
  mode,
  setMode,
  onLogin,
}: {
  mode: AuthMode;
  setMode: (mode: AuthMode) => void;
  onLogin: () => void;
}) {
  const isSignup = mode === "signup";
  const { login, googleLogin } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (isSignup) {
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }

      setError("Sign up connection will be added next.");
      return;
    }

    setLoading(true);

    try {
      await login(email, password);
      onLogin();
    } catch (error) {
      console.error("Login failed:", error);
      setError(error instanceof Error ? error.message : "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: {
    credential?: string;
  }) => {
    setError("");

    if (!credentialResponse.credential) {
      setError("Google did not return an authentication credential.");
      return;
    }

    setGoogleLoading(true);

    try {
      await googleLogin(credentialResponse.credential);
      onLogin();
    } catch (error) {
      console.error("Google login failed:", error);
      setError(error instanceof Error ? error.message : "Unable to sign in with Google.");
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <main className="authPage">
      <section className="authCard">
        <div className="authLogo">
          <div className="bigLogo">
            <img src={logo} alt="Kolapse logo" />
          </div>
        </div>

        <p className="authSubtitle">
          Monitor and protect with real-time alerts
        </p>

        <form className="authForm" onSubmit={handleSubmit}>
          <label>Email</label>

          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />

          <label>Password</label>

          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />

          {isSignup && (
            <>
              <label>Re-enter password</label>

              <input
                type="password"
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
              />
            </>
          )}

          <div className="authOptions">
            <label className="checkboxText">
              <input type="checkbox" />
              Remember me
            </label>

            <button type="button" className="linkButton">
              Forgot password?
            </button>
          </div>

          <button
            type="submit"
            className="primaryButton"
            disabled={loading || googleLoading}
          >
            {loading
              ? "Signing in..."
              : isSignup
                ? "Sign Up"
                : "Sign In"}
          </button>

          {!isSignup && (
            <>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  margin: "20px 0",
                }}
              >
                <div style={{ height: "1px", background: "#dfe7e3", flex: 1 }} />
                <span style={{ fontSize: "13px", color: "#6b7280" }}>OR</span>
                <div style={{ height: "1px", background: "#dfe7e3", flex: 1 }} />
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  minHeight: "44px",
                  opacity: googleLoading ? 0.6 : 1,
                  pointerEvents: googleLoading ? "none" : "auto",
                }}
              >
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => setError("Google sign-in was unsuccessful.")}
                  text="continue_with"
                  shape="rectangular"
                  size="large"
                  width="320"
                />
              </div>

              {googleLoading && (
                <p
                  style={{
                    textAlign: "center",
                    marginTop: "10px",
                    fontSize: "13px",
                    color: "#6b7280",
                  }}
                >
                  Signing in with Google...
                </p>
              )}
            </>
          )}

          {error && (
            <p
              style={{
                color: "#b42318",
                textAlign: "center",
                marginTop: "12px",
              }}
            >
              {error}
            </p>
          )}
        </form>

        <p className="switchText">
          {isSignup
            ? "Already have an account?"
            : "Don't have an account?"}{" "}

          <button
            type="button"
            className="linkButton"
            onClick={() => {
              setError("");
              setMode(isSignup ? "signin" : "signup");
            }}
          >
            {isSignup ? "Sign in" : "Sign up"}
          </button>
        </p>

        <p className="footerText">
          © 2026 Fall Detection System. All rights reserved.
        </p>
      </section>
    </main>
  );
}
function Sidebar({
  page,
  setPage,
  onLogout,
}: {
  page: Page;
  setPage: (page: Page) => void;
  onLogout: () => void;
}) {
  return (
    <aside className="sidebar">
      <Logo />

      <nav className="navList">
        {navItems.map((item) => (
          <button
            key={item.id}
            className={`navItem ${page === item.id ? "active" : ""}`}
            onClick={() => setPage(item.id)}
          >
            <Icon name={item.icon} />
            {item.label}
          </button>
        ))}
      </nav>

      <div className="sideBottom">
        <button
          className={`bottomButton ${page === "settings" ? "active" : ""}`}
          onClick={() => setPage("settings")}
        >
          <Icon name="settings" /> Settings
        </button>
        <button className="bottomButton logout" onClick={onLogout}>
          <Icon name="logout" /> Logout
        </button>
      </div>
    </aside>
  );
}

function Topbar({ setPage }: { setPage: (page: Page) => void }) {
  return (
    <header className="topbar">
      <div></div>

      <div className="topActions">
        <button
          className="iconButton"
          onClick={() => setPage("notifications")}
          aria-label="Open notifications"
        >
          <Icon name="notifications" />
        </button>

        <button
          className="userButton"
          onClick={() => setPage("profile")}
          aria-label="Open profile"
        >
          <Icon name="person" />
        </button>
      </div>
    </header>
  );
}

function PageHeader({
  title,
  subtitle,
  showBack = false,
  setPage,
}: {
  title: string;
  subtitle: string;
  showBack?: boolean;
  setPage?: (page: Page) => void;
}) {
  return (
    <div className="pageHeader">
      {showBack && (
        <button className="backButton" onClick={() => setPage?.("overview")}>
          ← Back to Overview
        </button>
      )}
      <h1>{title}</h1>
      <p>{subtitle}</p>
    </div>
  );
}

function StatCard({
  icon,
  title,
  value,
  note,
  color,
}: {
  icon: string;
  title: string;
  value: string;
  note: string;
  color: "purple" | "teal" | "orange" | "mint";
}) {
  return (
    <article className={`statCard ${color}`}>
      <div className="statIcon">
  <Icon name={icon} />
</div>
      <p>{title}</p>
      <h2>{value}</h2>
      <small>{note}</small>
    </article>
  );
}

function OverviewMetric({ icon, label, value, note }: { icon: string; label: string; value: string; note: string }) {
  return (
    <article className="ovMetric">
      <span className="ovIcon"><Icon name={icon} /></span>
      <p>{label}</p>
      <strong>{value}</strong>
      <small>{note}</small>
    </article>
  );
}

function LiveCamera({
  elderId,
  className,
  style,
  onCameraChange,
}: {
  elderId: number | null;
  className?: string;
  style?: React.CSSProperties;
  onCameraChange?: (
    camera: Camera | null,
    status: CameraStatus | null
  ) => void;
}) {
  const [camera, setCamera] = useState<Camera | null>(null);
  const [status, setStatus] = useState<CameraStatus | null>(null);
  const [streamUrl, setStreamUrl] = useState("");
  const [message, setMessage] = useState("Loading camera...");

  useEffect(() => {
    let cancelled = false;
    let refreshTimer: number | undefined;
    let statusTimer: number | undefined;

    const notify = (
      nextCamera: Camera | null,
      nextStatus: CameraStatus | null
    ) => {
      onCameraChange?.(nextCamera, nextStatus);
    };

    const loadStatus = async (selectedCamera: Camera) => {
      try {
        const nextStatus = await getCameraStatus(selectedCamera.id);
        if (cancelled) return;

        setStatus(nextStatus);
        notify(selectedCamera, nextStatus);
        setMessage(nextStatus.available ? "" : "Camera Offline");
      } catch (error) {
        console.error("Failed to load camera status:", error);
        if (!cancelled) {
          setStatus(null);
          notify(selectedCamera, null);
        }
      }
    };

    const loadStreamToken = async (selectedCamera: Camera) => {
      try {
        const access = await getCameraStreamToken(selectedCamera.id);
        if (cancelled) return;

        setStreamUrl(
          getCameraStreamUrl(selectedCamera.id, access.stream_token)
        );

        const refreshAfter = Math.max(
          (access.expires_in_seconds - 30) * 1000,
          30000
        );

        refreshTimer = window.setTimeout(() => {
          void loadStreamToken(selectedCamera);
        }, refreshAfter);
      } catch (error) {
        console.error("Failed to get camera stream access:", error);
        if (!cancelled) {
          setStreamUrl("");
          setMessage("Camera access unavailable");
        }
      }
    };

    const loadCamera = async () => {
      if (!elderId) {
        setCamera(null);
        setStatus(null);
        setStreamUrl("");
        setMessage("No patient selected");
        notify(null, null);
        return;
      }

      try {
        const cameras = await getElderCameras(elderId);
        if (cancelled) return;

        if (cameras.length === 0) {
          setCamera(null);
          setStatus(null);
          setStreamUrl("");
          setMessage(
            "Camera Setup Required. Live monitoring will be available after your camera has been inspected and connected by the KOLAPSE team."
          );
          notify(null, null);
          return;
        }

        const selectedCamera = cameras[0];

        setCamera(selectedCamera);
        setMessage("Connecting camera...");
        notify(selectedCamera, null);

        await loadStatus(selectedCamera);
        await loadStreamToken(selectedCamera);

        statusTimer = window.setInterval(() => {
          void loadStatus(selectedCamera);
        }, 5000);
      } catch (error) {
        console.error("Failed to load camera:", error);
        if (!cancelled) {
          setCamera(null);
          setStatus(null);
          setStreamUrl("");
          setMessage("Unable to load camera");
          notify(null, null);
        }
      }
    };

    void loadCamera();

    return () => {
      cancelled = true;
      if (refreshTimer !== undefined) window.clearTimeout(refreshTimer);
      if (statusTimer !== undefined) window.clearInterval(statusTimer);
    };
  }, [elderId]);

  if (!camera || !streamUrl || !status?.available) {
    return (
      <div
        className={className}
        style={{
          ...style,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "24px",
          boxSizing: "border-box",
        }}
      >
        <div>
          <Icon name={camera ? "videocam_off" : "video_camera_front_off"} />
          <p>{message}</p>
          {camera && (
            <small>
              {camera.name} - {camera.location}
            </small>
          )}
        </div>
      </div>
    );
  }

  return (
    <img
      src={streamUrl}
      alt={`${camera.name} live camera`}
      className={className}
      style={style}
      draggable={false}
      onError={() => setMessage("Camera stream unavailable")}
    />
  );
}

function OverviewCameraCard({
  elder,
  activity,
  activitySummary,
  onCameraChange,
}: {
  elder: Elder | null;
  activity: Activity | null;
  activitySummary: ActivitySummary | null;
  onCameraChange?: (
    camera: Camera | null,
    status: CameraStatus | null
  ) => void;
}) {
  const initials = elder?.name
    ? elder.name
        .split(" ")
        .filter(Boolean)
        .map((word) => word.charAt(0))
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "--";

  const currentActivity = activity?.activity ?? "unknown";

  const formattedActivity =
    currentActivity.charAt(0).toUpperCase() +
    currentActivity.slice(1);

  const activityIcon = (() => {
    switch (currentActivity.toLowerCase()) {
      case "standing":
        return "person";

      case "sitting":
        return "chair";

      case "lying":
      case "laying":
        return "bed";

      case "walking":
        return "directions_walk";

      case "falling":
        return "warning";

      default:
        return "monitor_heart";
    }
  })();

  const latestTime = activity?.timestamp
    ? new Date(activity.timestamp).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  const counts = activitySummary?.counts ?? {};

  const items = [
    {
      icon: "person",
      label: "Standing",
      value: String(counts.standing ?? 0),
    },
    {
      icon: "chair",
      label: "Sitting",
      value: String(counts.sitting ?? 0),
    },
    {
      icon: "bed",
      label: "Laying",
      value: String(counts.laying ?? counts.lying ?? 0),
    },
    {
      icon: "directions_walk",
      label: "Walking",
      value: String(counts.walking ?? 0),
    },
    {
      icon: "warning",
      label: "Falling",
      value: String(counts.falling ?? 0),
    },
  ];

  // Fullscreen the whole Real-Time Activity Monitor card
  const handleFullscreen = async () => {
    const monitor =
      document.getElementById("realtime-monitor");

    if (!monitor) return;

    try {
      if (!document.fullscreenElement) {
        await monitor.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error("Fullscreen failed:", error);
    }
  };

  return (
    <section
      id="realtime-monitor"
      className="ovCard ovMonitorCard"
    >
      <header className="ovCardHeader">
        <div>
          <h2>Real-Time Activity Monitor</h2>
          <p>Patient current activity status</p>
        </div>

        <button
          type="button"
          className="ovButton"
          onClick={handleFullscreen}
        >
          Fullscreen
          <Icon name="fullscreen" />
        </button>
      </header>

      <h3>Live Camera</h3>

        <div className="ovCamera">
          <LiveCamera
            elderId={elder?.id ?? null}
            onCameraChange={onCameraChange}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}
          />
        </div>

      <div className="ovPatient">
        <span className="ovAvatar">
          {initials}
        </span>

        <div>
          <div>
            <strong>
              {elder?.name ?? "No patient"}
            </strong>

            <span className="ovNormal">
              {currentActivity.toLowerCase() === "falling"
                ? "Alert"
                : "Normal"}
            </span>
          </div>

          <p>
            {activity?.location ||
              elder?.room ||
              "No room assigned"}
          </p>
        </div>

        <div className="ovActivity">
          <span>
            <Icon name={activityIcon} />
            {formattedActivity}
          </span>

          <small>
            {activity
              ? `Confidence: ${Math.round(
                  activity.confidence * 100
                )}%`
              : "No activity data"}
          </small>

          {latestTime && (
            <small>
              Updated: {latestTime}
            </small>
          )}
        </div>
      </div>

      <h3 className="ovSummaryTitle">
        Today&apos;s Activity Summary
      </h3>

      <div className="ovActivitySummary">
        {items.map((item) => (
          <div key={item.label}>
            <span className="ovSmallIcon">
              <Icon name={item.icon} />
            </span>

            <p>{item.label}</p>

            <strong>
              {item.value}{" "}
              {item.value === "1"
                ? "event"
                : "events"}
            </strong>
          </div>
        ))}
      </div>
    </section>
  );
}
function OverviewActivityLog({
  alerts,
  setPage,
}: {
  alerts: Alert[];
  setPage: (page: Page) => void;
}) {
  const unresolvedCount = alerts.filter(
    (alert) => alert.status === "unresolved"
  ).length;

  // Only show the 3 newest alerts on Overview
  const recentAlerts = alerts.slice(0, 3);

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <section className="ovCard ovLogCard">
      <header className="ovCardHeader">
        <div>
          <h2>Activity Log</h2>

          <p>
            {unresolvedCount} active{" "}
            {unresolvedCount === 1 ? "alert" : "alerts"}
          </p>
        </div>

        <button
          type="button"
          className="ovButton"
          onClick={() => setPage("alerts")}
        >
          View History
          <Icon name="arrow_forward" />
        </button>
      </header>

      <div className="ovLogList">
        {recentAlerts.length === 0 ? (
          <p>No alerts recorded.</p>
        ) : (
          recentAlerts.map((alert) => {
            const isResolved =
              alert.status === "resolved";

            return (
              <article
                className="ovAlert"
                key={alert.id}
              >
                <div className="ovAlertTitle">
                  <span>
                    <Icon name="warning" />
                    Fall Detected
                  </span>

                  <b>
                    {alert.severity === "high"
                      ? "Emergency"
                      : alert.severity}
                  </b>
                </div>

                <p className="ovAlertTime">
                  <Icon name="schedule" />
                  {formatTime(alert.timestamp)}
                </p>

                <p className="ovNotifications">
                  Notifications sent:
                </p>

                <div className="ovAlertActions">
                  <span className="ovTelegram">
                    <Icon name="send" />
                  </span>

                  <span className="ovCall">
                    <Icon name="call" />
                  </span>

                  <button
                    type="button"
                    className="ovButton"
                    onClick={() => setPage("alerts")}
                  >
                    View Details
                    <Icon name="chevron_right" />
                  </button>
                </div>

                <hr />

                {isResolved ? (
                  <div className="ovResponded">
                    <Icon name="check_circle" />

                    <span>
                      <strong>Responded</strong>

                      <small>
                        •{" "}
                        {alert.resolved_at
                          ? formatTime(alert.resolved_at)
                          : "Resolved"}
                      </small>
                    </span>
                  </div>
                ) : (
                  <div className="ovResponded">
                    <Icon name="schedule" />

                    <span>
                      <strong>
                        Awaiting Response
                      </strong>

                      <small>
                        • Unresolved
                      </small>
                    </span>
                  </div>
                )}
              </article>
            );
          })
        )}
      </div>

      <Icon name="keyboard_arrow_down" />
    </section>
  );
}
function OverviewTimeline({
  activityHistory,
  setPage,
}: {
  activityHistory: Activity[];
  setPage: (page: Page) => void;
}) {
  // Use the newest activity date as the displayed date.
  const latestActivity =
    activityHistory.length > 0 ? activityHistory[0] : null;

  const displayDate = latestActivity
    ? new Date(latestActivity.timestamp).toLocaleDateString("en-US", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "No activity data";

  // Only records from the same date as the latest activity
  const latestDate = latestActivity
    ? new Date(latestActivity.timestamp).toDateString()
    : null;

  const todayHistory = activityHistory.filter((item) => {
    return (
      latestDate &&
      new Date(item.timestamp).toDateString() === latestDate
    );
  });

  // Count activities
  const counts = todayHistory.reduce<Record<string, number>>(
    (result, item) => {
      const name = item.activity.toLowerCase();

      result[name] = (result[name] ?? 0) + 1;

      return result;
    },
    {}
  );

  const summary = [
    {
      label: "Sitting",
      value: counts.sitting ?? 0,
    },
    {
      label: "Standing",
      value: counts.standing ?? 0,
    },
    {
      label: "Walking",
      value: counts.walking ?? 0,
    },
    {
      label: "Laying",
      value: counts.laying ?? counts.lying ?? 0,
    },
    {
      label: "Falling",
      value: counts.falling ?? 0,
    },
  ];

  return (
    <section className="ovCard ovTimeline">
      <header className="ovCardHeader">
        <div>
          <h2>24-Hour Activity Timeline</h2>

          <p>
            <Icon name="calendar_today" /> {displayDate}
          </p>
        </div>

        {/* GO TO MOVEMENT HISTORY */}
        <button
          type="button"
          className="ovButton"
          onClick={() => setPage("movement")}
        >
          View Detail
          <Icon name="arrow_forward" />
        </button>
      </header>

      <div className="ovTimelineAxis">
        <span>
          <Icon name="schedule" /> Time
        </span>

        <span>12am</span>
        <span>6am</span>
        <span>12pm</span>
        <span>6pm</span>
        <span>11pm</span>
      </div>

      <div className="ovTimelineRow">
        <strong>Activity</strong>

        <div
          className="ovTimelineBar"
          style={{ position: "relative" }}
        >
          {todayHistory.map((item) => {
            const date = new Date(item.timestamp);

            const hours =
              date.getHours() +
              date.getMinutes() / 60 +
              date.getSeconds() / 3600;

            const position = (hours / 24) * 100;

            return (
              <i
                key={item.id}
                title={`${item.activity} - ${date.toLocaleTimeString(
                  "en-US",
                  {
                    hour: "2-digit",
                    minute: "2-digit",
                  }
                )}`}
                style={{
                  position: "absolute",
                  left: `${position}%`,
                }}
              />
            );
          })}
        </div>
      </div>

      <hr />

      <h3>Today&apos;s Summary</h3>

      <div className="ovTimelineSummary">
        {summary.map((item) => (
          <div key={item.label}>
            <i />

            <span>
              {item.label}

              <strong>
                {item.value}{" "}
                {item.value === 1 ? "event" : "events"}
              </strong>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

 function Overview({
  setPage,
  liveRefresh,
}: {
  setPage: (page: Page) => void;
  liveRefresh: number;
}) {
  const [stats, setStats] =
    useState<DashboardStats | null>(null);

  const [elder, setElder] =
    useState<Elder | null>(null);

  const [activity, setActivity] =
    useState<Activity | null>(null);

  const [activitySummary, setActivitySummary] =
    useState<ActivitySummary | null>(null);

  const [alerts, setAlerts] =
    useState<Alert[]>([]);

  const [activityHistory, setActivityHistory] =
    useState<Activity[]>([]);

  const [overviewCamera, setOverviewCamera] =
    useState<Camera | null>(null);

  const [overviewCameraStatus, setOverviewCameraStatus] =
    useState<CameraStatus | null>(null);

  // Current date for Overview calendar
  const now = new Date();

  const currentMonth = now.toLocaleDateString("en-US", {
  month: "long",
  });

  const currentDay = now.toLocaleDateString("en-US", {
    weekday: "long",
  });

  const currentDate = now.getDate();

  const fullCurrentDate = now.toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        // Dashboard statistics
        const statsData = await getDashboardStats();
        setStats(statsData);

        // Alerts
        const alertsData = await getAlerts();
        setAlerts(alertsData);

        // Elders
        const eldersData = await getElders();

        if (eldersData.length > 0) {
          const firstElder = eldersData[0];

          setElder(firstElder);

          // Current activity
          const activityData =
            await getCurrentActivity(firstElder.id);

          setActivity(activityData);

          // Today's activity summary
          const summaryData =
            await getActivitySummary(firstElder.id);

          setActivitySummary(summaryData);

          // Activity history
          const historyData =
              await getActivityHistory(firstElder.id, 1000);

          setActivityHistory(historyData);
        } else {
          setElder(null);
          setActivity(null);
          setActivitySummary(null);
          setActivityHistory([]);
        }
      } catch (error) {
        console.error(
          "Failed to load overview data:",
          error
        );
      }
    };

    loadData();
  }, [liveRefresh]);

  return (
    <div className="overviewPage">
      <h1>Patient Dashboard</h1>

      <div className="ovStats">
        <OverviewMetric
          icon="group"
          label="Total Patients"
          value={stats ? String(stats.elders) : "..."}
          note="Registered elders"
        />

        <OverviewMetric
          icon="monitor_heart"
          label="Active Camera/ Sensors"
          value={overviewCameraStatus?.available ? "1" : "0"}
          note={
            overviewCamera
              ? overviewCameraStatus?.available
                ? `${overviewCamera.name} connected`
                : `${overviewCamera.name} offline`
              : "Camera setup required"
          }
        />

        <OverviewMetric
          icon="warning"
          label="Alerts"
          value={
            stats
              ? String(stats.alerts_total)
              : "..."
          }
          note={
            stats
              ? `${stats.alerts_resolved} resolved • ${stats.alerts_unresolved} unresolved`
              : "Loading..."
          }
        />

        <article className="ovMetric ovCalendar">
          <div className="ovCalendarTop">
            <span className="ovIcon">
              <Icon name="calendar_today" />
            </span>

            <select
              value={currentMonth}
              aria-label="Current month"
              onChange={() => {}}
            >
              <option value={currentMonth}>
                {currentMonth}
              </option>
            </select>
          </div>

          <strong>{currentDay}</strong>

          <b>{currentDate}</b>

          <p>{fullCurrentDate}</p>

          <Icon name="chevron_right" />
        </article>
      </div>

      <div className="ovLayout">
        <div className="ovLeft">
          <OverviewCameraCard
            elder={elder}
            activity={activity}
            activitySummary={activitySummary}
            onCameraChange={(camera, status) => {
              setOverviewCamera(camera);
              setOverviewCameraStatus(status);
            }}
          />

          <OverviewTimeline
            activityHistory={activityHistory}
            setPage={setPage}
          />
        </div>

        <OverviewActivityLog
          alerts={alerts}
          setPage={setPage}
        />
      </div>
    </div>
  );
}
function ActivityPage({
  setPage,
  liveRefresh,
}: {
  setPage: (page: Page) => void;
  liveRefresh: number;
}) {
  const [elder, setElder] = useState<Elder | null>(null);

  const [activity, setActivity] = useState<Activity | null>(null);

  const [activitySummary, setActivitySummary] =
    useState<ActivitySummary | null>(null);

  useEffect(() => {
    const loadActivityPage = async () => {
      try {
        const eldersData = await getElders();

        if (eldersData.length > 0) {
          const firstElder = eldersData[0];

          setElder(firstElder);

          const currentActivity =
            await getCurrentActivity(firstElder.id);

          setActivity(currentActivity);

          const summaryData =
            await getActivitySummary(firstElder.id);

          setActivitySummary(summaryData);
        } else {
          setElder(null);
          setActivity(null);
          setActivitySummary(null);
        }
      } catch (error) {
        console.error(
          "Failed to load Activity Monitor:",
          error
        );
      }
    };

    loadActivityPage();
  }, [liveRefresh]);

  // -----------------------------
  // Date
  // -----------------------------

  const activityDate = activity?.timestamp
    ? new Date(activity.timestamp)
    : new Date();

  const monthValue = `${activityDate.getFullYear()}-${String(
    activityDate.getMonth() + 1
  ).padStart(2, "0")}`;

  const dateLabel = activityDate.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // -----------------------------
  // Patient initials
  // -----------------------------

  const initials = elder?.name
    ? elder.name
        .split(" ")
        .filter(Boolean)
        .map((word) => word.charAt(0))
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "--";

  // -----------------------------
  // Current activity
  // -----------------------------

  const currentActivity =
    activity?.activity?.toLowerCase() ?? "unknown";

  const formattedActivity =
    currentActivity.charAt(0).toUpperCase() +
    currentActivity.slice(1);

  const activityIcon = (() => {
    switch (currentActivity) {
      case "standing":
        return "person";

      case "sitting":
        return "chair";

      case "lying":
      case "laying":
        return "bed";

      case "walking":
        return "directions_walk";

      case "falling":
        return "warning";

      default:
        return "monitor_heart";
    }
  })();

  // -----------------------------
  // Activity timestamp
  // -----------------------------

  const updatedTime = activity?.timestamp
    ? new Date(activity.timestamp).toLocaleTimeString(
        "en-US",
        {
          hour: "2-digit",
          minute: "2-digit",
        }
      )
    : null;

  // -----------------------------
  // Today's real activity counts
  // -----------------------------

  const counts = activitySummary?.counts ?? {};

  const summary = [
    {
      label: "Standing",
      value: counts.standing ?? 0,
      icon: "person",
    },
    {
      label: "Sitting",
      value: counts.sitting ?? 0,
      icon: "chair",
    },
    {
      label: "Laying",
      value: counts.laying ?? counts.lying ?? 0,
      icon: "bed",
    },
    {
      label: "Walking",
      value: counts.walking ?? 0,
      icon: "directions_walk",
    },
    {
      label: "Falling",
      value: counts.falling ?? 0,
      icon: "warning",
    },
  ];

  return (
    <div className="activityMonitorPage">
      <PageHeader
        title="Activity Monitor"
        subtitle="Real-time monitoring of patient current activity"
        showBack
        setPage={setPage}
      />

      <section
        className="amPanel"
        aria-labelledby="am-heading"
      >
        <header className="amHeading">
          <h2 id="am-heading">
            Real-Time Activity Monitor
          </h2>

          <p>Patient current activity status</p>
        </header>

        <div className="amDateRow">
          <span
            className="amBlueIcon"
            aria-hidden="true"
          >
            <Icon name="calendar_today" />
          </span>

          <div className="amDateDetails">
            <input
              type="month"
              aria-label="Monitoring month"
              value={monthValue}
              readOnly
            />

            <p>{dateLabel}</p>
          </div>
        </div>

        <h3 className="amSectionTitle">
          Live Camera
        </h3>

        <div className="amCamera">
          <LiveCamera
            elderId={elder?.id ?? null}
            className="liveCameraStream"
          />
        </div>

        <div className="amPatient">
          <div
            className="amAvatar"
            aria-hidden="true"
          >
            {initials}
          </div>

          <div className="amPatientDetails">
            <div className="amPatientName">
              <strong>
                {elder?.name ?? "No patient"}
              </strong>

              <span>
                {currentActivity === "falling"
                  ? "Alert"
                  : "Normal"}
              </span>
            </div>

            <p>
              Patient ID: {elder?.id ?? "--"}
            </p>
          </div>

          <div className="amPatientActivity">
            <span className="amActivityBadge">
              <Icon name={activityIcon} />
              {formattedActivity}
            </span>

            <small>
              {updatedTime
                ? `Updated ${updatedTime}`
                : "No activity data"}
            </small>
          </div>
        </div>

        <section
          className="amSummary"
          aria-labelledby="am-summary-heading"
        >
          <h3
            id="am-summary-heading"
            className="amSectionTitle"
          >
            Today&apos;s Activity Summary
          </h3>

          <div className="amSummaryGrid">
            {summary.map((item) => (
              <div
                className="amSummaryItem"
                key={item.label}
              >
                <span
                  className="amBlueIcon"
                  aria-hidden="true"
                >
                  <Icon name={item.icon} />
                </span>

                <p>{item.label}</p>

                <strong>
                  {item.value}{" "}
                  {item.value === 1
                    ? "event"
                    : "events"}
                </strong>
              </div>
            ))}
          </div>
        </section>
      </section>
    </div>
  );
}
function MovementChart({
  activityHistory,
}: {
  activityHistory: Activity[];
}) {
  const today = new Date().toDateString();

  const todayActivities = activityHistory
    .filter(
      (item) =>
        new Date(item.timestamp).toDateString() === today
    )
    .sort(
      (a, b) =>
        new Date(a.timestamp).getTime() -
        new Date(b.timestamp).getTime()
    );

  const getX = (timestamp: string) => {
    const date = new Date(timestamp);

    const hour =
      date.getHours() +
      date.getMinutes() / 60 +
      date.getSeconds() / 3600;

    return 40 + (hour / 24) * 820;
  };

  const getY = (activity: string) => {
    switch (activity.toLowerCase()) {
      case "standing":
        return 60;

      case "walking":
        return 90;

      case "sitting":
        return 130;

      case "laying":
      case "lying":
        return 170;

      case "falling":
        return 210;

      default:
        return 190;
    }
  };

  return (
    <section className="card chartCard">
      <h3>Activity Timeline</h3>

      <p>
        Today&apos;s activity distribution including fall incidents
      </p>

      <svg
        className="lineChart"
        viewBox="0 0 900 260"
      >
        <line
          x1="40"
          y1="220"
          x2="860"
          y2="220"
        />

        <line
          x1="40"
          y1="30"
          x2="40"
          y2="220"
        />

        {todayActivities.map((item) => {
          const x = getX(item.timestamp);
          const y = getY(item.activity);

          return (
            <circle
              key={item.id}
              cx={x}
              cy={y}
              r="7"
            >
              <title>
                {`${item.activity} - ${new Date(
                  item.timestamp
                ).toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}`}
              </title>
            </circle>
          );
        })}

        {todayActivities.length > 1 && (
          <polyline
            points={todayActivities
              .map(
                (item) =>
                  `${getX(item.timestamp)},${getY(
                    item.activity
                  )}`
              )
              .join(" ")}
            className="line tealLine"
          />
        )}

        <text x="40" y="245">
          00:00
        </text>

        <text x="245" y="245">
          06:00
        </text>

        <text x="450" y="245">
          12:00
        </text>

        <text x="655" y="245">
          18:00
        </text>

        <text x="830" y="245">
          23:00
        </text>
      </svg>

      <div className="chartLegend">
        <span>
          <b className="tealDot"></b>
          Activity Event
        </span>

        <span>
          Total Today: {todayActivities.length}
        </span>
      </div>
    </section>
  );
}

function BarChartCard({
  activityHistory,
}: {
  activityHistory: Activity[];
}) {
  const days = [
    "Mon",
    "Tue",
    "Wed",
    "Thu",
    "Fri",
    "Sat",
    "Sun",
  ];

  const now = new Date();

  const startOfWeek = new Date(now);

  const currentDay = startOfWeek.getDay();

  const difference =
    startOfWeek.getDate() -
    currentDay +
    (currentDay === 0 ? -6 : 1);

  startOfWeek.setDate(difference);
  startOfWeek.setHours(0, 0, 0, 0);

  const fallCounts = days.map((_, index) => {
    const dayStart = new Date(startOfWeek);

    dayStart.setDate(
      startOfWeek.getDate() + index
    );

    const dayEnd = new Date(dayStart);
    dayEnd.setHours(23, 59, 59, 999);

    return activityHistory.filter((item) => {
      const timestamp = new Date(item.timestamp);

      return (
        item.activity.toLowerCase() === "falling" &&
        timestamp >= dayStart &&
        timestamp <= dayEnd
      );
    }).length;
  });

  const maxFalls = Math.max(...fallCounts, 1);

  return (
    <section className="card chartCard">
      <h3>Fall Incidents</h3>

      <p>Falls detected during the current week</p>

      <div className="barChart">
        {days.map((day, index) => {
          const count = fallCounts[index];

          const height =
            count === 0
              ? 0
              : Math.max(
                  (count / maxFalls) * 100,
                  10
                );

          return (
            <div
              key={day}
              className="barItem"
            >
              <div
                className="bar"
                style={{
                  height: `${height}%`,
                }}
                title={`${count} ${
                  count === 1 ? "fall" : "falls"
                }`}
              ></div>

              <strong>
                {count > 0 ? count : ""}
              </strong>

              <span>{day}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function MovementPage({
  setPage,
  liveRefresh,
}: {
  setPage: (page: Page) => void;
  liveRefresh: number;
}) {
  const [elder, setElder] = useState<Elder | null>(null);

  const [activityHistory, setActivityHistory] =
    useState<Activity[]>([]);

  useEffect(() => {
    const loadMovementData = async () => {
      try {
        const eldersData = await getElders();

        if (eldersData.length === 0) {
          setElder(null);
          setActivityHistory([]);
          return;
        }

        const firstElder = eldersData[0];

        setElder(firstElder);

        const historyData =
          await getActivityHistory(firstElder.id);

        setActivityHistory(historyData);
      } catch (error) {
        console.error(
          "Failed to load movement history:",
          error
        );
      }
    };

    loadMovementData();
  }, [liveRefresh]);

  // --------------------------------
  // Today's activity records
  // --------------------------------

  const today = new Date().toDateString();

  const todayActivities = activityHistory.filter(
    (item) =>
      new Date(item.timestamp).toDateString() === today
  );

  // Standing + Walking
  const activeEvents = todayActivities.filter((item) => {
    const activity = item.activity.toLowerCase();

    return (
      activity === "standing" ||
      activity === "walking"
    );
  }).length;

  // Sitting + Laying / Lying
  const restEvents = todayActivities.filter((item) => {
    const activity = item.activity.toLowerCase();

    return (
      activity === "sitting" ||
      activity === "laying" ||
      activity === "lying"
    );
  }).length;

  // --------------------------------
  // Falls during current week
  // --------------------------------

  const now = new Date();

  const startOfWeek = new Date(now);

  // Monday = beginning of week
  const day = startOfWeek.getDay();

  const difference =
    startOfWeek.getDate() -
    day +
    (day === 0 ? -6 : 1);

  startOfWeek.setDate(difference);
  startOfWeek.setHours(0, 0, 0, 0);

  const fallsThisWeek = activityHistory.filter((item) => {
    const timestamp = new Date(item.timestamp);

    return (
      item.activity.toLowerCase() === "falling" &&
      timestamp >= startOfWeek &&
      timestamp <= now
    );
  }).length;

  const averageFalls =
    fallsThisWeek > 0
      ? (fallsThisWeek / 7).toFixed(1)
      : "0.0";

  return (
    <>
      <PageHeader
        title="Movement History"
        subtitle={
          elder
            ? `Review ${elder.name}'s activity patterns and trends over time`
            : "Review patient activity patterns and trends over time"
        }
        showBack
        setPage={setPage}
      />

      <div className="statsGrid three">
        <StatCard
          icon="trending_up"
          title="Active Events Today"
          value={String(activeEvents)}
          note="Standing + Walking"
          color="teal"
        />

        <StatCard
          icon="event"
          title="Rest Events Today"
          value={String(restEvents)}
          note="Sitting + Laying"
          color="purple"
        />

        <StatCard
          icon="warning"
          title="Falls (This Week)"
          value={String(fallsThisWeek)}
          note={`Avg: ${averageFalls} per day`}
          color="orange"
        />
      </div>

      <MovementChart
        activityHistory={activityHistory}
      />

      <BarChartCard
        activityHistory={activityHistory}
      />
    </>
  );
}
function AlertHistoryPage({
  setPage,
  liveRefresh,
}: {
  setPage: (page: Page) => void;
  liveRefresh: number;
}) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [elders, setElders] = useState<Elder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAlertHistory = async () => {
      try {
        setLoading(true);

        const [alertsData, eldersData] = await Promise.all([
          getAlerts(100),
          getElders(),
        ]);

        setAlerts(alertsData);
        setElders(eldersData);
      } catch (error) {
        console.error(
          "Failed to load alert history:",
          error
        );
      } finally {
        setLoading(false);
      }
    };

    loadAlertHistory();
  }, [liveRefresh]);

  // -----------------------------
  // Statistics
  // -----------------------------

  const totalAlerts = alerts.length;

  const resolvedAlerts = alerts.filter(
    (alert) =>
      alert.status.toLowerCase() === "resolved"
  ).length;

  const alertsWithResponseTime = alerts.filter(
    (alert) =>
      alert.response_time !== null &&
      alert.response_time !== undefined
  );

  const averageResponseSeconds =
    alertsWithResponseTime.length > 0
      ? alertsWithResponseTime.reduce(
          (total, alert) =>
            total + (alert.response_time ?? 0),
          0
        ) / alertsWithResponseTime.length
      : 0;

  const averageResponseMinutes =
    averageResponseSeconds / 60;

  // -----------------------------
  // Helpers
  // -----------------------------

  const getElder = (elderId: number) => {
    return elders.find(
      (elder) => elder.id === elderId
    );
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString(
      "en-US",
      {
        month: "long",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

  const formatResponseTime = (
    seconds: number | null
  ) => {
    if (
      seconds === null ||
      seconds === undefined
    ) {
      return "Awaiting response";
    }

    if (seconds < 60) {
      return `${seconds.toFixed(1)} sec`;
    }

    return `${(seconds / 60).toFixed(1)} min`;
  };

  const getAlertColor = (alert: Alert) => {
    const severity = alert.severity.toLowerCase();

    if (severity === "high") {
      return "orangeAlert";
    }

    if (severity === "medium") {
      return "purpleAlert";
    }

    return "tealAlert";
  };

  if (loading) {
    return (
      <>
        <PageHeader
          title="Alert History"
          subtitle="Review and manage all alert incidents"
          showBack
          setPage={setPage}
        />

        <section className="card">
          <p>Loading alert history...</p>
        </section>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Alert History"
        subtitle="Review and manage all alert incidents"
        showBack
        setPage={setPage}
      />

      <div className="statsGrid three alertStatsGrid">
        <StatCard
          icon="warning"
          title="Total Alerts"
          value={String(totalAlerts)}
          note="All loaded alerts"
          color="orange"
        />

        <StatCard
          icon="check_circle"
          title="Resolved"
          value={String(resolvedAlerts)}
          note="Resolved alerts"
          color="teal"
        />

        <StatCard
          icon="schedule"
          title="Avg Response Time"
          value={
            alertsWithResponseTime.length > 0
              ? averageResponseMinutes.toFixed(1)
              : "--"
          }
          note="minutes"
          color="purple"
        />
      </div>

      <div className="alertList">
        {alerts.length === 0 ? (
          <section className="card">
            <h3>No Alerts</h3>
            <p>
              No alert incidents have been recorded yet.
            </p>
          </section>
        ) : (
          alerts.map((alert) => {
            const elder = getElder(alert.elder_id);

            const isResolved =
              alert.status.toLowerCase() ===
              "resolved";

            return (
              <article
                key={alert.id}
                className={`alertHistoryItem ${getAlertColor(
                  alert
                )}`}
              >
                <div className="alertIcon">
                  <Icon name="warning" />
                </div>

                <div>
                  <h3>
                    Fall Detected{" "}
                    <span className="levelTag">
                      {alert.severity.toUpperCase()}
                    </span>{" "}
                    <span className="resolvedTag">
                      {isResolved
                        ? "Resolved"
                        : "Unresolved"}
                    </span>
                  </h3>

                  <p>
                    {elder?.name ??
                      `Patient ${alert.elder_id}`}
                  </p>

                  <p>
                    <Icon name="event" />{" "}
                    {formatDate(alert.timestamp)}
                  </p>

                  <p>
                    <Icon name="location_on" />{" "}
                    {elder?.room ||
                      "Location not specified"}
                  </p>

                  <p>
                    <Icon name="schedule" /> Response
                    time:{" "}
                    {formatResponseTime(
                      alert.response_time
                    )}
                  </p>

                  {isResolved &&
                    alert.resolved_at && (
                      <p>
                        <Icon name="check_circle" />{" "}
                        Resolved:{" "}
                        {formatDate(
                          alert.resolved_at
                        )}
                      </p>
                    )}

                  <div className="notificationTags">
                    <span>Telegram</span>
                  </div>

                  <div className="noteBox">
                    <strong>Notes:</strong>

                    <p>
                      {alert.notes ||
                        (isResolved
                          ? "Alert resolved. No notes provided."
                          : "Awaiting caregiver response.")}
                    </p>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>
    </>
  );
}
function NotificationsPage({
  setPage,
  liveRefresh,
}: {
  setPage: (page: Page) => void;
  liveRefresh: number;
}) {
  const [channels, setChannels] =
    useState<NotificationChannel[]>([]);

  const [alerts, setAlerts] =
    useState<Alert[]>([]);

  const [elders, setElders] =
    useState<Elder[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [updatingChannelId, setUpdatingChannelId] =
    useState<number | null>(null);

  const [connectingTelegram, setConnectingTelegram] =
    useState(false);


  // =====================================================
  // LOAD BACKEND DATA
  // =====================================================

  const loadNotifications = async (
    showLoading = true
  ) => {
    try {
      if (showLoading) {
        setLoading(true);
      }

      const [
        channelsData,
        alertsData,
        eldersData,
      ] = await Promise.all([
        getNotificationChannels(),
        getAlerts(100),
        getElders(),
      ]);

      setChannels(channelsData);
      setAlerts(alertsData);
      setElders(eldersData);

    } catch (error) {
      console.error(
        "Failed to load notifications:",
        error
      );

    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };


  useEffect(() => {
  const timer = window.setTimeout(() => {
    void loadNotifications();
  }, 0);

  return () => {
    window.clearTimeout(timer);
  };
}, [liveRefresh]);

  // =====================================================
  // STATISTICS
  // =====================================================

  const activeChannels = channels.filter(
    (channel) => channel.is_active
  ).length;

  const totalSent = channels.reduce(
    (total, channel) =>
      total + (channel.total_sent ?? 0),
    0
  );


  // =====================================================
  // CHANNEL HELPERS
  // =====================================================

  const getChannelName = (type: string) => {
    switch (type.toLowerCase()) {
      case "telegram":
        return "Telegram Bot";

      case "sms":
        return "SMS Alerts";

      case "email":
        return "Email Notifications";

      case "call":
      case "emergency_call":
        return "Emergency Call";

      default:
        return (
          type.charAt(0).toUpperCase() +
          type.slice(1)
        );
    }
  };


  const getConfigDisplay = (
    channel: NotificationChannel
  ) => {
    if (
      channel.type.toLowerCase() === "telegram"
    ) {
      const config = getTelegramConfig(channel);

      if (!config.connected) {
        return "Telegram not connected";
      }

      if (config.username) {
        return `@${config.username}`;
      }

      return "Telegram connected";
    }

    if (!channel.config) {
      return "No configuration";
    }

    try {
      const config = JSON.parse(channel.config);

      return (
        config.username ||
        config.phone ||
        config.email ||
        "Configured"
      );

    } catch {
      return "Configured";
    }
  };


  const isTelegramConnected = (
    channel: NotificationChannel
  ) => {
    if (
      channel.type.toLowerCase() !== "telegram"
    ) {
      return true;
    }

    const config = getTelegramConfig(channel);

    return Boolean(
      config.connected &&
      config.chat_id
    );
  };


  // =====================================================
  // TELEGRAM CONNECT
  // =====================================================

  const handleConnectTelegram = async () => {
    try {
      setConnectingTelegram(true);

      const result = await connectTelegram();

      if (!result.telegram_url) {
        throw new Error(
          "Telegram connection URL was not returned"
        );
      }

      window.open(
        result.telegram_url,
        "_blank",
        "noopener,noreferrer"
      );

      // Refresh channel status for 60 seconds.
      // After the caregiver presses START,
      // the backend changes connected -> true.
      let attempts = 0;

      const interval = window.setInterval(
        async () => {
          attempts += 1;

          try {
            const channelData =
              await getNotificationChannels();

            setChannels(channelData);

            const telegramChannel =
              channelData.find(
                (channel) =>
                  channel.type.toLowerCase() ===
                  "telegram"
              );

            if (
              telegramChannel &&
              isTelegramConnected(
                telegramChannel
              )
            ) {
              window.clearInterval(interval);
              setConnectingTelegram(false);
            }

          } catch (error) {
            console.error(
              "Failed to check Telegram status:",
              error
            );
          }

          if (attempts >= 20) {
            window.clearInterval(interval);
            setConnectingTelegram(false);
          }

        },
        3000
      );

    } catch (error) {
      console.error(
        "Failed to connect Telegram:",
        error
      );

      setConnectingTelegram(false);
    }
  };


  // =====================================================
  // ENABLE / DISABLE CHANNEL
  // =====================================================

  const handleChannelToggle = async (
    channel: NotificationChannel
  ) => {
    const connected =
      isTelegramConnected(channel);

    if (
      channel.type.toLowerCase() === "telegram" &&
      !connected
    ) {
      await handleConnectTelegram();
      return;
    }

    try {
      setUpdatingChannelId(channel.id);

      const updated =
        await updateNotificationChannel(
          channel.id,
          !channel.is_active
        );

      setChannels((previous) =>
        previous.map((item) =>
          item.id === updated.id
            ? updated
            : item
        )
      );

    } catch (error) {
      console.error(
        "Failed to update channel:",
        error
      );

    } finally {
      setUpdatingChannelId(null);
    }
  };


  // =====================================================
  // ELDER HELPERS
  // =====================================================

  const getElderName = (
    elderId: number
  ) => {
    const elder = elders.find(
      (elder) => elder.id === elderId
    );

    return (
      elder?.name ??
      `Elder #${elderId}`
    );
  };


  const getElderRoom = (
    elderId: number
  ) => {
    const elder = elders.find(
      (elder) => elder.id === elderId
    );

    return elder?.room ?? null;
  };


  const recentAlerts =
    alerts.slice(0, 5);


  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <>
        <PageHeader
          title="Notifications"
          subtitle="Manage notification channels and alert preferences"
          showBack
          setPage={setPage}
        />

        <section className="card">
          <p>
            Loading notification settings...
          </p>
        </section>
      </>
    );
  }


  // =====================================================
  // PAGE
  // =====================================================

  return (
    <>
      <PageHeader
        title="Notifications"
        subtitle="Manage notification channels and alert preferences"
        showBack
        setPage={setPage}
      />


      {/* =========================
          STATISTICS
      ========================== */}

      <div className="statsGrid three">

        <StatCard
          icon="motion_sensor_active"
          title="Active Channels"
          value={`${activeChannels}/${channels.length}`}
          note="Notification methods"
          color="purple"
        />

        <StatCard
          icon="notifications_active"
          title="Total Sent"
          value={String(totalSent)}
          note="Recorded by channels"
          color="teal"
        />

        <StatCard
          icon="warning"
          title="Alert Events"
          value={String(alerts.length)}
          note="Loaded alerts"
          color="orange"
        />

      </div>


      {/* =========================
          NOTIFICATION CHANNELS
      ========================== */}

      <section className="card">

        <h3>Notification Channels</h3>

        <p>
          Configure how you want to receive alerts
        </p>


        <div className="channelList">

          {channels.length === 0 ? (

            <div className="channelItem">

              <div>
                <h4>
                  Telegram Bot{" "}
                  <span className="activeTag">
                    Not Connected
                  </span>
                </h4>

                <p>
                  Connect Telegram to receive real-time KOLAPSE fall alerts.
                </p>
              </div>

              <div className="channelStats">
                <p>
                  Status
                  <br />
                  <strong>Not Connected</strong>
                </p>

                <p>
                  Total Sent
                  <br />
                  <strong>0 notifications</strong>
                </p>
              </div>

              <button
                className="configureButton"
                onClick={handleConnectTelegram}
                disabled={connectingTelegram}
              >
                {connectingTelegram
                  ? "Waiting for Telegram..."
                  : "Connect Telegram"}
              </button>

            </div>

          ) : (

            channels.map((channel) => {

              const telegram =
                channel.type.toLowerCase() ===
                "telegram";

              const connected =
                isTelegramConnected(channel);

              const updating =
                updatingChannelId === channel.id;


              return (
                <div
                  className="channelItem"
                  key={channel.id}
                >

                  <div>

                    <h4>
                      {getChannelName(
                        channel.type
                      )}{" "}

                      <span className="activeTag">
                        {telegram && !connected
                          ? "Not Connected"
                          : channel.is_active
                          ? "Active"
                          : "Inactive"}
                      </span>
                    </h4>

                    <p>
                      {getConfigDisplay(
                        channel
                      )}
                    </p>

                  </div>


                  {/* ENABLE / DISABLE */}

                  <label className="switch">

                    <input
                      type="checkbox"
                      checked={
                        connected &&
                        channel.is_active
                      }
                      disabled={updating}
                      onChange={() =>
                        handleChannelToggle(
                          channel
                        )
                      }
                    />

                    <span></span>

                  </label>


                  <div className="channelStats">

                    <p>
                      Status
                      <br />

                      <strong>
                        {!connected
                          ? "Not Connected"
                          : channel.is_active
                          ? "Enabled"
                          : "Disabled"}
                      </strong>
                    </p>


                    <p>
                      Total Sent
                      <br />

                      <strong>
                        {channel.total_sent ?? 0}{" "}
                        notifications
                      </strong>
                    </p>

                  </div>


                  {/* TELEGRAM CONNECT BUTTON */}

                  {telegram && !connected ? (

                    <button
                      className="configureButton"
                      onClick={
                        handleConnectTelegram
                      }
                      disabled={
                        connectingTelegram
                      }
                    >
                      {connectingTelegram
                        ? "Waiting for Telegram..."
                        : "Connect Telegram"}
                    </button>

                  ) : (

                    <button
                      className="configureButton"
                      disabled
                    >
                      Configure Channel
                    </button>

                  )}

                </div>
              );
            })
          )}

        </div>

      </section>


      {/* =========================
          ALERT PREFERENCES
      ========================== */}

      <section className="card">

        <h3>Alert Preferences</h3>

        <p>
          Current KOLAPSE alert behavior
        </p>


        <div className="preferenceList">

          <label>

            <strong>
              Fall Detection Alerts
            </strong>

            <small>
              Immediate notification when a
              fall is detected
            </small>

            <input
              type="checkbox"
              checked
              readOnly
            />

          </label>


          <label>

            <strong>
              Prolonged Inactivity Alerts
            </strong>

            <small>
              Not connected to backend yet
            </small>

            <input
              type="checkbox"
              checked={false}
              readOnly
            />

          </label>


          <label>

            <strong>
              Unusual Movement Alerts
            </strong>

            <small>
              Not connected to backend yet
            </small>

            <input
              type="checkbox"
              checked={false}
              readOnly
            />

          </label>


          <label>

            <strong>
              Daily Summary
            </strong>

            <small>
              Not connected to backend yet
            </small>

            <input
              type="checkbox"
              checked={false}
              readOnly
            />

          </label>

        </div>

      </section>


      {/* =========================
          RECENT ALERTS
      ========================== */}

      <section className="card">

        <h3>
          Recent Alert Notifications
        </h3>

        <p>
          Latest 5 alert events
        </p>


        {recentAlerts.length === 0 ? (

          <p>
            No recent alerts.
          </p>

        ) : (

          recentAlerts.map((alert) => {

            const elderName =
              getElderName(
                alert.elder_id
              );

            const elderRoom =
              getElderRoom(
                alert.elder_id
              );


            return (
              <div
                className="recentNotification"
                key={alert.id}
              >

                <span><Icon name="notifications" /></span>

                <strong>
                  Fall detected — {elderName}

                  {elderRoom
                    ? ` (${elderRoom})`
                    : ""}
                </strong>

                <small>
                  {new Date(
                    alert.timestamp
                  ).toLocaleString(
                    "en-US",
                    {
                      month: "numeric",
                      day: "numeric",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    }
                  )}
                </small>

              </div>
            );
          })
        )}

      </section>
    </>
  );
}

function getSignedInEmail(): string {
  const token = localStorage.getItem("kolapse_token");
  if (!token) return "Signed-in caregiver";

  try {
    const payloadPart = token.split(".")[1];
    if (!payloadPart) return "Signed-in caregiver";

    const normalized = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(
      normalized.length + ((4 - (normalized.length % 4)) % 4),
      "="
    );
    const payload = JSON.parse(atob(padded));

    return payload.email || payload.sub || payload.username || "Signed-in caregiver";
  } catch {
    return "Signed-in caregiver";
  }
}

function ProfilePage({ setPage }: { setPage: (page: Page) => void }) {
  const [elders, setElders] = useState<Elder[]>([]);
  const [cameras, setCameras] = useState<
    Array<{ camera: Camera; status: CameraStatus | null; elderName: string }>
  >([]);
  const [channels, setChannels] = useState<NotificationChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const email = getSignedInEmail();

  useEffect(() => {
    let cancelled = false;

    const loadProfile = async () => {
      setLoading(true);
      setError("");

      try {
        const [elderList, channelList] = await Promise.all([
          getElders(),
          getNotificationChannels().catch(() => [] as NotificationChannel[]),
        ]);

        if (cancelled) return;

        setElders(elderList);
        setChannels(channelList);

        const cameraGroups = await Promise.all(
          elderList.map(async (elder) => {
            try {
              const elderCameras = await getElderCameras(elder.id);

              return Promise.all(
                elderCameras.map(async (camera) => {
                  try {
                    const status = await getCameraStatus(camera.id);
                    return { camera, status, elderName: elder.name };
                  } catch {
                    return { camera, status: null, elderName: elder.name };
                  }
                })
              );
            } catch {
              return [];
            }
          })
        );

        if (!cancelled) setCameras(cameraGroups.flat());
      } catch (profileError) {
        console.error("Failed to load profile:", profileError);
        if (!cancelled) setError("Unable to load profile information.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, []);

  const telegramChannel = channels.find(
    (channel) => channel.type.toLowerCase() === "telegram"
  );
  const telegramConfig = getTelegramConfig(telegramChannel);
  const onlineCameras = cameras.filter((item) => item.status?.available).length;

  const cardStyle: React.CSSProperties = {
    background: "#ffffff",
    borderRadius: "28px",
    padding: "26px",
    boxShadow: "0 4px 10px rgba(16, 24, 40, 0.12)",
  };

  const gridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "20px",
  };

  const rowStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "16px",
    padding: "15px 0",
    borderBottom: "1px solid #eaecf0",
  };

  const badgeStyle = (active: boolean): React.CSSProperties => ({
    display: "inline-flex",
    alignItems: "center",
    padding: "6px 10px",
    borderRadius: "999px",
    background: active ? "#ecfdf3" : "#f2f4f7",
    color: active ? "#027a48" : "#667085",
    fontSize: "12px",
    fontWeight: 700,
    whiteSpace: "nowrap",
  });

  return (
    <div style={{ display: "grid", gap: "24px", width: "100%" }}>
      <PageHeader
        title="Profile"
        subtitle="Your KOLAPSE caregiver account and connected monitoring setup"
        showBack
        setPage={setPage}
      />

      {loading && (
        <section style={cardStyle}>
          <p>Loading profile information...</p>
        </section>
      )}

      {error && (
        <section style={cardStyle}>
          <p style={{ color: "#b42318", margin: 0 }}>{error}</p>
        </section>
      )}

      {!loading && (
        <>
          <section
            style={{
              ...cardStyle,
              display: "flex",
              alignItems: "center",
              gap: "20px",
            }}
          >
            <div
              style={{
                width: "76px",
                height: "76px",
                borderRadius: "50%",
                background: "#0867d1",
                color: "#ffffff",
                display: "grid",
                placeItems: "center",
                flexShrink: 0,
              }}
            >
              <Icon name="person" />
            </div>

            <div style={{ minWidth: 0 }}>
              <p
                style={{
                  margin: "0 0 5px",
                  color: "#667085",
                  fontSize: "13px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                }}
              >
                Caregiver account
              </p>
              <h2
                style={{
                  margin: 0,
                  color: "#101828",
                  fontSize: "24px",
                  overflowWrap: "anywhere",
                }}
              >
                {email}
              </h2>
              <p style={{ margin: "6px 0 0", color: "#667085" }}>
                Authenticated KOLAPSE dashboard user
              </p>
            </div>
          </section>

          <div style={gridStyle}>
            <section style={cardStyle}>
              <Icon name="elderly" />
              <p style={{ color: "#667085" }}>Elder profiles</p>
              <h2 style={{ margin: 0, fontSize: "30px" }}>{elders.length}</h2>
            </section>

            <section style={cardStyle}>
              <Icon name="videocam" />
              <p style={{ color: "#667085" }}>Connected cameras</p>
              <h2 style={{ margin: 0, fontSize: "30px" }}>{cameras.length}</h2>
            </section>

            <section style={cardStyle}>
              <Icon name="sensors" />
              <p style={{ color: "#667085" }}>Cameras online</p>
              <h2 style={{ margin: 0, fontSize: "30px" }}>{onlineCameras}</h2>
            </section>

            <section style={cardStyle}>
              <Icon name="notifications_active" />
              <p style={{ color: "#667085" }}>Telegram alerts</p>
              <h2 style={{ margin: 0, fontSize: "22px" }}>
                {telegramConfig.connected || telegramChannel?.is_active
                  ? "Connected"
                  : "Not connected"}
              </h2>
            </section>
          </div>

          <section style={cardStyle}>
            <h3 style={{ margin: 0 }}>Elders under your care</h3>
            <p style={{ margin: "5px 0 14px", color: "#667085" }}>
              Profiles assigned to this caregiver account
            </p>

            {elders.length === 0 ? (
              <p style={{ color: "#667085" }}>
                No elder profiles are assigned to this account.
              </p>
            ) : (
              elders.map((elder, index) => (
                <div
                  key={elder.id}
                  style={{
                    ...rowStyle,
                    borderBottom:
                      index === elders.length - 1 ? "none" : rowStyle.borderBottom,
                  }}
                >
                  <div>
                    <strong>{elder.name}</strong>
                    <p style={{ margin: "4px 0 0", color: "#667085" }}>
                      {elder.age ? `${elder.age} years` : "Age not set"}
                      {elder.room ? ` · ${elder.room}` : ""}
                    </p>
                  </div>
                  <span style={badgeStyle(true)}>Assigned</span>
                </div>
              ))
            )}
          </section>

          <section style={cardStyle}>
            <h3 style={{ margin: 0 }}>Camera connections</h3>
            <p style={{ margin: "5px 0 14px", color: "#667085" }}>
              Monitoring cameras registered to your elder profiles
            </p>

            {cameras.length === 0 ? (
              <div
                style={{
                  padding: "22px",
                  borderRadius: "16px",
                  background: "#f8fafc",
                }}
              >
                <strong>Camera Setup Required</strong>
                <p style={{ margin: "6px 0 0", color: "#667085" }}>
                  Live monitoring will be available after your camera has been
                  inspected and connected by the KOLAPSE team.
                </p>
              </div>
            ) : (
              cameras.map((item, index) => (
                <div
                  key={item.camera.id}
                  style={{
                    ...rowStyle,
                    borderBottom:
                      index === cameras.length - 1 ? "none" : rowStyle.borderBottom,
                  }}
                >
                  <div>
                    <strong>{item.camera.name}</strong>
                    <p style={{ margin: "4px 0 0", color: "#667085" }}>
                      {item.elderName} · {item.camera.location}
                    </p>
                  </div>
                  <span style={badgeStyle(Boolean(item.status?.available))}>
                    {item.status?.available ? "Online" : "Offline"}
                  </span>
                </div>
              ))
            )}
          </section>

          <section style={cardStyle}>
            <h3 style={{ margin: 0 }}>Notification connection</h3>
            <p style={{ margin: "5px 0 14px", color: "#667085" }}>
              Current caregiver alert channel
            </p>

            <div style={{ ...rowStyle, borderBottom: "none" }}>
              <div>
                <strong>Telegram</strong>
                <p style={{ margin: "4px 0 0", color: "#667085" }}>
                  {telegramConfig.username
                    ? `Connected as ${telegramConfig.username}`
                    : "Fall alerts and caregiver response notifications"}
                </p>
              </div>

              <span
                style={badgeStyle(
                  Boolean(telegramConfig.connected || telegramChannel?.is_active)
                )}
              >
                {telegramConfig.connected || telegramChannel?.is_active
                  ? "Connected"
                  : "Not connected"}
              </span>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function SettingsPage({ setPage }: { setPage: (page: Page) => void }) {
  const cardStyle: React.CSSProperties = {
    background: "#ffffff",
    borderRadius: "28px",
    padding: "26px",
    boxShadow: "0 4px 10px rgba(16, 24, 40, 0.12)",
  };

  const itemStyle: React.CSSProperties = {
    width: "100%",
    display: "flex",
    alignItems: "center",
    gap: "16px",
    padding: "18px",
    border: "1px solid #eaecf0",
    borderRadius: "16px",
    background: "#ffffff",
    textAlign: "left",
    color: "#101828",
    cursor: "pointer",
  };

  return (
    <div
      style={{
        display: "grid",
        gap: "24px",
        width: "100%",
        maxWidth: "980px",
      }}
    >
      <PageHeader
        title="Settings"
        subtitle="Manage your KOLAPSE dashboard preferences and account connections"
        showBack
        setPage={setPage}
      />

      <section style={cardStyle}>
        <h3 style={{ margin: "0 0 6px" }}>Account</h3>
        <p style={{ margin: "0 0 20px", color: "#667085" }}>
          Access your caregiver profile and monitoring information.
        </p>

        <button type="button" style={itemStyle} onClick={() => setPage("profile")}>
          <Icon name="person" />
          <span style={{ flex: 1 }}>
            <strong style={{ display: "block" }}>Profile</strong>
            <small style={{ color: "#667085" }}>
              View your account, elders, cameras and Telegram connection
            </small>
          </span>
          <Icon name="chevron_right" />
        </button>
      </section>

      <section style={cardStyle}>
        <h3 style={{ margin: "0 0 6px" }}>Alerts and notifications</h3>
        <p style={{ margin: "0 0 20px", color: "#667085" }}>
          Manage the notification channels already supported by KOLAPSE.
        </p>

        <button
          type="button"
          style={itemStyle}
          onClick={() => setPage("notifications")}
        >
          <Icon name="notifications" />
          <span style={{ flex: 1 }}>
            <strong style={{ display: "block" }}>Notification settings</strong>
            <small style={{ color: "#667085" }}>
              Configure Telegram and supported alert preferences
            </small>
          </span>
          <Icon name="chevron_right" />
        </button>
      </section>

      <section style={cardStyle}>
        <h3 style={{ margin: "0 0 6px" }}>Security</h3>
        <p style={{ margin: "0 0 18px", color: "#667085" }}>
          Your dashboard is protected by your authenticated KOLAPSE session.
        </p>

        <div
          style={{
            padding: "18px",
            borderRadius: "16px",
            background: "#f8fafc",
            display: "flex",
            alignItems: "center",
            gap: "14px",
          }}
        >
          <Icon name="verified_user" />
          <div>
            <strong>Account authentication active</strong>
            <p style={{ margin: "4px 0 0", color: "#667085" }}>
              Additional account-security controls will appear here when their
              backend endpoints are available.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

function Dashboard() {
  const [page, setPage] = useState<Page>("overview");
  const [liveRefresh, setLiveRefresh] = useState(0);

  const { logout } = useAuth();

  useEffect(() => {
    const handleWebSocketMessage = (message: WebSocketMessage) => {
      console.log("KOLAPSE live event:", message);

     if (
         message.type === "fall_alert" ||
          message.type === "notification_sent" ||
          message.type === "alert_resolved"
        ) {
  console.log(
    "KOLAPSE data changed:",
    message.type
  );

  setLiveRefresh(
    (previous) => previous + 1
  );
    }
    };

    connectWebSocket(handleWebSocketMessage);

    return () => {
      disconnectWebSocket();
    };
  }, []);

  return (
    <div className="dashboard">
      <Sidebar
        page={page}
        setPage={setPage}
        onLogout={logout}
      />

      <main className="mainArea">
        <Topbar setPage={setPage} />

        <div className="content">
          {page === "overview" && (
            <Overview
              setPage={setPage}
              liveRefresh={liveRefresh}
            />
          )}

          {page === "activity" && (
           <ActivityPage
             setPage={setPage}
             liveRefresh={liveRefresh}
            />
)}
          {page === "movement" && (
            <MovementPage
              setPage={setPage}
              liveRefresh={liveRefresh}
              />
)}
          {page === "alerts" && (
            <AlertHistoryPage
             setPage={setPage}
              liveRefresh={liveRefresh}
              />
)}
          {page === "notifications" && (
            <NotificationsPage
              setPage={setPage}
              liveRefresh={liveRefresh}
             />
)}
          {page === "profile" && (
            <ProfilePage setPage={setPage} />
          )}

          {page === "settings" && (
            <SettingsPage setPage={setPage} />
          )}
        </div>
      </main>
    </div>
  );
}
export default function App() {
  const [authMode, setAuthMode] = useState<AuthMode>("signin");

  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading KOLAPSE...</div>;
  }

  if (!user) {
    return (
      <AuthPage
        mode={authMode}
        setMode={setAuthMode}
        onLogin={() => {}}
      />
    );
  }

  if (user.role === "admin") {
    return <AdminDashboard />;
  }

  return <Dashboard />;
}