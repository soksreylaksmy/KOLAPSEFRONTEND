const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";


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


// =========================================================
// ADMIN TYPES
// =========================================================

export type AdminOverview = {
  customers: number;
  pending_customers: number;
  active_customers: number;
  elders: number;
  cameras: number;
  active_cameras: number;
};

export type AdminCamera = {
  id: number;
  elder_id: number;
  name: string;
  location: string;
  is_active: boolean;
  created_at: string;
};

export type AdminElder = {
  id: number;
  caregiver_id: number;
  name: string;
  age: number;
  gender: string | null;
  room: string;
  notes: string | null;
  photo: string | null;
  created_at: string;
  cameras?: AdminCamera[];
};

export type AdminCustomer = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  plan: "basic" | "vip" | "facility" | null;
  role: "customer";
  setup_status: "pending_setup" | "active" | "suspended";
  auth_provider: string;
  google_connected: boolean;
  is_active: boolean;
  created_at: string;
  elders?: AdminElder[];
};

export type AdminCustomerCreate = {
  name: string;
  email: string;
  phone?: string | null;
  plan?: "basic" | "vip" | "facility" | null;
};

export type AdminCustomerUpdate = {
  name?: string;
  phone?: string | null;
  plan?: "basic" | "vip" | "facility" | null;
  setup_status?: "pending_setup" | "active" | "suspended";
  is_active?: boolean;
};

export type AdminElderCreate = {
  name: string;
  age: number;
  gender?: string | null;
  room: string;
  notes?: string | null;
  photo?: string | null;
};

export type AdminCameraCreate = {
  elder_id: number;
  name: string;
  location: string;
};

export type AdminCameraUpdate = {
  name?: string;
  location?: string;
  is_active?: boolean;
};

export type AdminCameraProvisionResponse = {
  camera: AdminCamera;
  device_key: string;
};

export type AdminDeviceKeyResponse = {
  camera_id: number;
  device_key: string;
  message: string;
};


// =========================================================
// ADMIN REQUEST HELPER
// =========================================================

async function adminRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();

  if (!token) {
    throw new Error("No authentication token");
  }

  const headers = new Headers(options.headers);

  headers.set("Accept", "application/json");
  headers.set("Authorization", `Bearer ${token}`);

  if (options.body) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(
    `${API_URL}/api/v1/admin${path}`,
    {
      ...options,
      headers,
    }
  );

  if (!response.ok) {
    let message = `Admin request failed: ${response.status}`;

    try {
      const errorData = await response.json();

      if (typeof errorData.detail === "string") {
        message = errorData.detail;
      }
    } catch {
      // Keep the default error message.
    }

    throw new Error(message);
  }

  return response.json() as Promise<T>;
}


// =========================================================
// ADMIN OVERVIEW
// =========================================================

export async function getAdminOverview():
  Promise<AdminOverview> {

  return adminRequest<AdminOverview>(
    "/overview"
  );
}


// =========================================================
// ADMIN CUSTOMERS
// =========================================================

export async function getAdminCustomers():
  Promise<AdminCustomer[]> {

  return adminRequest<AdminCustomer[]>(
    "/customers"
  );
}

export async function getAdminCustomer(
  customerId: number
): Promise<AdminCustomer> {

  return adminRequest<AdminCustomer>(
    `/customers/${customerId}`
  );
}

export async function createAdminCustomer(
  payload: AdminCustomerCreate
): Promise<AdminCustomer> {

  return adminRequest<AdminCustomer>(
    "/customers",
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );
}

export async function updateAdminCustomer(
  customerId: number,
  payload: AdminCustomerUpdate
): Promise<AdminCustomer> {

  return adminRequest<AdminCustomer>(
    `/customers/${customerId}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    }
  );
}
export type AdminDeleteCustomerResponse = {
  message: string;
  customer_id: number;
  name: string;
  email: string;
};

export async function deleteAdminCustomer(
  customerId: number
): Promise<AdminDeleteCustomerResponse> {
  return adminRequest<AdminDeleteCustomerResponse>(
    `/customers/${customerId}`,
    {
      method: "DELETE",
    }
  );
}

// =========================================================
// ADMIN ELDERS
// =========================================================

export async function createAdminElder(
  customerId: number,
  payload: AdminElderCreate
): Promise<AdminElder> {

  return adminRequest<AdminElder>(
    `/customers/${customerId}/elders`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );
}

export async function getAdminElder(
  elderId: number
): Promise<AdminElder> {

  return adminRequest<AdminElder>(
    `/elders/${elderId}`
  );
}


// =========================================================
// ADMIN CAMERAS
// =========================================================

export async function createAdminCamera(
  payload: AdminCameraCreate
): Promise<AdminCameraProvisionResponse> {

  return adminRequest<AdminCameraProvisionResponse>(
    "/cameras",
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );
}

export async function updateAdminCamera(
  cameraId: number,
  payload: AdminCameraUpdate
): Promise<AdminCamera> {

  return adminRequest<AdminCamera>(
    `/cameras/${cameraId}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    }
  );
}

export async function rotateAdminCameraDeviceKey(
  cameraId: number
): Promise<AdminDeviceKeyResponse> {

  return adminRequest<AdminDeviceKeyResponse>(
    `/cameras/${cameraId}/rotate-device-key`,
    {
      method: "POST",
    }
  );
}
