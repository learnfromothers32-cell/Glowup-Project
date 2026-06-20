import React, {
  createContext,
  useReducer,
  useEffect,
  useCallback,
  useRef,
} from "react";
import type { UserRole, User } from "../types/auth";
import * as authApi from "../api/auth";
import { setAccessToken } from "../api/axios";
import { signInWithPopup, signOut } from "firebase/auth";
import { getFirebaseAuth, getGoogleProvider, getGithubProvider } from "../config/firebase";

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

type AuthAction =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "LOGIN_SUCCESS"; payload: { user: User } }
  | { type: "LOGOUT" }
  | { type: "RESTORE_SESSION"; payload: { user: User } }
  | { type: "SESSION_VALIDATED"; payload: { user: User } }
  | { type: "UPDATE_USER"; payload: { user: User } };

export interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<User>;
  register: (
    name: string,
    email: string,
    password: string,
    role: UserRole,
  ) => Promise<User>;
  socialLogin: (
    provider: "google" | "apple" | "instagram",
    role?: UserRole,
  ) => Promise<User>;
  logout: () => void;
  updateUser: (user: User) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };
    case "LOGIN_SUCCESS":
      return {
        user: action.payload.user,
        isLoading: false,
        isAuthenticated: true,
      };
    case "LOGOUT":
      return {
        user: null,
        isLoading: false,
        isAuthenticated: false,
      };
    case "RESTORE_SESSION":
      return {
        user: action.payload.user,
        isLoading: true,
        isAuthenticated: true,
      };
    case "SESSION_VALIDATED":
      return {
        user: action.payload.user,
        isLoading: false,
        isAuthenticated: true,
      };
    case "UPDATE_USER":
      return {
        ...state,
        user: action.payload.user,
      };
    default:
      return state;
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(authReducer, {
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });

  // Restore session on mount: validate with server
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await authApi.getMe();
        dispatch({ type: "SESSION_VALIDATED", payload: { user: res.data.user } });
      } catch (err) {
        console.error("[Auth] getMe failed on mount:", err);
        dispatch({ type: "LOGOUT" });
      }
    }, 100);

    return () => clearTimeout(debounceRef.current);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      const res = await authApi.login(email, password);
      const { accessToken, user } = res.data;
      setAccessToken(accessToken);
      dispatch({ type: "LOGIN_SUCCESS", payload: { user } });
      return user;
    } catch (err: any) {
      dispatch({ type: "SET_LOADING", payload: false });
      throw new Error(err.response?.data?.message || "Invalid email or password");
    }
  }, []);

  const register = useCallback(
    async (name: string, email: string, password: string, role: UserRole) => {
      dispatch({ type: "SET_LOADING", payload: true });
      try {
        const res = await authApi.register(name, email, password, role);
        const { accessToken, user } = res.data;
        setAccessToken(accessToken);
        dispatch({ type: "LOGIN_SUCCESS", payload: { user } });
        return user;
      } catch (err: any) {
        dispatch({ type: "SET_LOADING", payload: false });
        throw new Error(err.response?.data?.message || "Registration failed");
      }
    },
    [],
  );

  const socialLogin = useCallback(
    async (provider: "google" | "apple" | "instagram", role: UserRole = "client") => {
      let firebaseProvider;
      if (provider === "github") {
        firebaseProvider = getGithubProvider();
      } else {
        firebaseProvider = getGoogleProvider();
      }
      const result = await signInWithPopup(getFirebaseAuth(), firebaseProvider).catch(
        (err) => {
          console.error("Social Login Error:", err);
          throw new Error("Social login failed");
        },
      );
      dispatch({ type: "SET_LOADING", payload: true });
      try {
        const idToken = await result.user.getIdToken();

        const res = await authApi.socialLogin(idToken, role);
        const { accessToken, user } = res.data;

        setAccessToken(accessToken);
        dispatch({ type: "LOGIN_SUCCESS", payload: { user } });
        return user;
      } catch (err: any) {
        dispatch({ type: "SET_LOADING", payload: false });
        throw new Error(err.response?.data?.message || "Social login failed");
      }
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Proceed with client-side cleanup
    }
    const fbAuth = getFirebaseAuth();
    await signOut(fbAuth).catch(() => {});
    setAccessToken(null);
    dispatch({ type: "LOGOUT" });
  }, []);

  const updateUser = useCallback((user: User) => {
    dispatch({ type: "UPDATE_USER", payload: { user } });
  }, []);

  return (
    <AuthContext.Provider
      value={{ ...state, login, register, socialLogin, logout, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};
