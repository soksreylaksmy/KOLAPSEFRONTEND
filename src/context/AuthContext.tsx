import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

type User = {
  id: number;
  name: string;
  email: string;

  role: "admin" | "customer";
  phone: string | null;
  plan: "basic" | "vip" | "facility" | null;
  setup_status: "pending_setup" | "active" | "suspended";

  is_active: boolean;
  created_at: string;
};

type AuthContextType = {
  token: string | null;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  googleLogin: (credential: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("kolapse_token")
  );

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCurrentUser = async (accessToken: string) => {
    const response = await fetch(`${API_URL}/api/v1/users/me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error("Unable to load user");
    }

    const data: User = await response.json();
    setUser(data);
  };

  const saveSession = async (accessToken: string) => {
    localStorage.setItem("kolapse_token", accessToken);
    setToken(accessToken);

    try {
      await fetchCurrentUser(accessToken);
    } catch (error) {
      localStorage.removeItem("kolapse_token");
      setToken(null);
      setUser(null);
      throw error;
    }
  };

  const login = async (email: string, password: string) => {
    const response = await fetch(`${API_URL}/api/v1/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });

    if (!response.ok) {
      let message = "Invalid email or password";

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

    const data = await response.json();

    await saveSession(data.access_token);
  };

  const googleLogin = async (credential: string) => {
    if (!credential) {
      throw new Error("Google did not return an authentication credential");
    }

    const response = await fetch(`${API_URL}/api/v1/auth/google`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        credential,
      }),
    });

    if (!response.ok) {
      let message = "Unable to sign in with Google";

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

    const data = await response.json();

    await saveSession(data.access_token);
  };

  const logout = () => {
    localStorage.removeItem("kolapse_token");
    setToken(null);
    setUser(null);
  };

  useEffect(() => {
    const loadUser = async () => {
      const storedToken = localStorage.getItem("kolapse_token");

      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        await fetchCurrentUser(storedToken);
      } catch {
        localStorage.removeItem("kolapse_token");
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        login,
        googleLogin,
        logout,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
