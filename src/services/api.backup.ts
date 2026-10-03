const API_URL = "http://127.0.0.1:8000";


// =========================================================
// AUTH HELPER
// =========================================================

function getToken() {
  return localStorage.getItem("kolapse_token");
}

function authHeaders() {
  const token = getToken();

  if (!token) {
    throw new Error("No authentication token");
  }

  return {
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
  };
}


// =========================================================
// DASHBOARD
// =========================================================

export type DashboardStats = {
  elders: number;
  alerts_total: number;
  alerts_unresolved: number;
  alerts_resolved: number;
};

export async function getDashboardStats(): Promise<DashboardStats> {
  const response = await fetch(
    `${API_URL}/api/v1/dashboard/stats`,
    {
      method: "GET",
      headers: authHeaders(),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to load dashboard statistics");
  }

  return response.json();
}


// =========================================================
// ELDERS
// =========================================================

export type Elder = {
  id: number;
  name: string;
  age: number;
  gender: string;
  notes?: string | null;
  room?: string | null;
};

export async function getElders(): Promise<Elder[]> {
  const response = await fetch(
    `${API_URL}/api/v1/elders`,
    {
      method: "GET",
      headers: authHeaders(),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to load elders");
  }

  return response.json();
}


// =========================================================
// CAMERAS
// =========================================================

export type Camera = {
  id: number;
  elder_id: number;
  name: string;
  location: string;
  is_active: boolean;
};

export type CameraStatus = {
  camera_id: number;
  elder_id: number;
  name: string;
  location: string;
  available: boolean;
  frame_count: number;
  last_frame_age_seconds: number | null;
  source: string;
};

export type CameraStreamToken = {
  camera_id: number;
  stream_token: string;
  expires_at: string;
  expires_in_seconds: number;
};


/*
Get all cameras connected to a specific elder.

The backend verifies that the signed-in caregiver
owns the elder.
*/
export async function getElderCameras(
  elderId: number
): Promise<Camera[]> {
  const response = await fetch(
    `${API_URL}/api/v1/camera/elder/${elderId}`,
    {
      method: "GET",
      headers: authHeaders(),
    }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to load cameras: ${response.status}`
    );
  }

  return response.json();
}


/*
Get the current status of one camera.

The backend verifies that the camera belongs
to an elder owned by the signed-in caregiver.
*/
export async function getCameraStatus(
  cameraId: number
): Promise<CameraStatus> {
  const response = await fetch(
    `${API_URL}/api/v1/camera/status/${cameraId}`,
    {
      method: "GET",
      headers: authHeaders(),
    }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to load camera status: ${response.status}`
    );
  }

  return response.json();
}


/*
Request a temporary camera viewing token.

The caregiver does not need to enter or see this token.
The frontend requests it automatically using the
caregiver's normal login JWT.
*/
export async function getCameraStreamToken(
  cameraId: number
): Promise<CameraStreamToken> {
  const response = await fetch(
    `${API_URL}/api/v1/camera/stream-token/${cameraId}`,
    {
      method: "POST",
      headers: authHeaders(),
    }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to get camera stream access: ${response.status}`
    );
  }

  return response.json();
}


/*
Create the final URL used by the live camera <img>.

Only the temporary camera viewing token is placed
in the URL. The caregiver's main JWT is not exposed.
*/
export function getCameraStreamUrl(
  cameraId: number,
  streamToken: string
): string {
  return (
    `${API_URL}/api/v1/camera/stream/${cameraId}` +
    `?stream_token=${encodeURIComponent(streamToken)}`
  );
}


// =========================================================
// ACTIVITY
// =========================================================

export type Activity = {
  id: number;
  elder_id: number;
  activity: string;
  confidence: number;
  location: string | null;
  source: string;
  timestamp: string;
};

export type ActivitySummary = {
  elder_id: number;
  date: string;
  counts: Record<string, number>;
  latest: Activity | null;
};

export async function getActivitySummary(
  elderId: number
): Promise<ActivitySummary> {
  const response = await fetch(
    `${API_URL}/api/v1/activity/summary/${elderId}`,
    {
      method: "GET",
      headers: authHeaders(),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to load activity summary");
  }

  return response.json();
}

export async function getCurrentActivity(
  elderId: number
): Promise<Activity> {
  const response = await fetch(
    `${API_URL}/api/v1/activity/current/${elderId}`,
    {
      method: "GET",
      headers: authHeaders(),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to load current activity");
  }

  return response.json();
}

export async function getActivityHistory(
  elderId: number,
  limit = 100
): Promise<Activity[]> {
  const response = await fetch(
    `${API_URL}/api/v1/activity/history/${elderId}?limit=${limit}`,
    {
      method: "GET",
      headers: authHeaders(),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to load activity history");
  }

  return response.json();
}


// =========================================================
// ALERTS
// =========================================================

export type Alert = {
  id: number;
  elder_id: number;
  activity_log_id: number;
  severity: string;
  status: "resolved" | "unresolved";
  response_time: number | null;
  notes: string | null;
  timestamp: string;
  resolved_at: string | null;
};

export async function getAlerts(
  limit = 100
): Promise<Alert[]> {
  const response = await fetch(
    `${API_URL}/api/v1/alerts?limit=${limit}`,
    {
      method: "GET",
      headers: authHeaders(),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to load alerts");
  }

  return response.json();
}


// =========================================================
// NOTIFICATION CHANNELS
// =========================================================

export type NotificationChannel = {
  id: number;
  user_id: number;
  type: string;
  is_active: boolean;
  config: string;
  total_sent: number;
  created_at: string;
};

export async function getNotificationChannels():
  Promise<NotificationChannel[]> {

  const response = await fetch(
    `${API_URL}/api/v1/notifications/channels`,
    {
      method: "GET",
      headers: authHeaders(),
    }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to load notification channels: ${response.status}`
    );
  }

  return response.json();
}


// =========================================================
// CONNECT TELEGRAM
// =========================================================

export type TelegramConnectResponse = {
  message: string;
  telegram_url: string;
  connected: boolean;
};

export async function connectTelegram():
  Promise<TelegramConnectResponse> {

  const response = await fetch(
    `${API_URL}/api/v1/notifications/telegram/connect`,
    {
      method: "POST",
      headers: authHeaders(),
    }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to connect Telegram: ${response.status}`
    );
  }

  return response.json();
}


// =========================================================
// UPDATE NOTIFICATION CHANNEL
// =========================================================

export async function updateNotificationChannel(
  channelId: number,
  isActive: boolean
): Promise<NotificationChannel> {

  const token = getToken();

  if (!token) {
    throw new Error("No authentication token");
  }

  const response = await fetch(
    `${API_URL}/api/v1/notifications/channels/${channelId}`,
    {
      method: "PUT",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        is_active: isActive,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to update notification channel: ${response.status}`
    );
  }

  return response.json();
}


// =========================================================
// TELEGRAM CONFIG HELPER
// =========================================================

export type TelegramConfig = {
  chat_id?: string;
  username?: string | null;
  connected?: boolean;
  connect_token?: string;
};

export function getTelegramConfig(
  channel: NotificationChannel | undefined
): TelegramConfig {

  if (!channel?.config) {
    return {};
  }

  try {
    return JSON.parse(
      channel.config
    ) as TelegramConfig;
  } catch {
    return {};
  }
}