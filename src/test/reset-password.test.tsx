import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import ResetPassword from "../pages/ResetPassword";
import { I18nProvider } from "../i18n/context";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const mockNavigate = vi.fn();
const mockSetSession = vi.fn();
const mockGetSession = vi.fn();
const mockUpdateUser = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: null,
    session: null,
    profile: null,
    isAdmin: false,
    loading: false,
    refreshProfile: vi.fn(),
    signOut: vi.fn(),
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      setSession: vi.fn(),
      getSession: vi.fn(),
      updateUser: vi.fn(),
    },
  },
}));

vi.mock("sonner", async () => {
  const actual = await vi.importActual("sonner");
  return {
    ...actual,
    toast: {
      success: vi.fn(),
      error: vi.fn(),
    },
  };
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    <I18nProvider>{children}</I18nProvider>
  </BrowserRouter>
);

describe("ResetPassword flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({ data: { session: null } });
    mockSetSession.mockResolvedValue({ error: null });
    mockUpdateUser.mockResolvedValue({ error: null });
    (supabase.auth.setSession as ReturnType<typeof vi.fn>).mockImplementation(mockSetSession);
    (supabase.auth.getSession as ReturnType<typeof vi.fn>).mockImplementation(mockGetSession);
    (supabase.auth.updateUser as ReturnType<typeof vi.fn>).mockImplementation(mockUpdateUser);
  });

  it("shows verifying state on initial load", () => {
    render(<ResetPassword />, { wrapper });
    expect(screen.getByText(/verifying your recovery link/i)).toBeInTheDocument();
  });

  it("shows error state when no recovery token is present", async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });
    render(<ResetPassword />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText(/Link invalid/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/This password reset link is invalid or has expired/i)).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /sign in/i }).length).toBeGreaterThanOrEqual(1);
  });

  it("shows error state when token exchange fails", async () => {
    mockSetSession.mockResolvedValue({ error: { message: "Token expired" } });
    window.location.hash = "#access_token=bad-token&type=recovery";
    render(<ResetPassword />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText(/Token expired/i)).toBeInTheDocument();
    });

    window.location.hash = "";
  });

  it("shows form state when token is valid", async () => {
    mockSetSession.mockResolvedValue({ error: null });
    window.location.hash = "#access_token=valid-token&type=recovery";
    render(<ResetPassword />, { wrapper });

    await waitFor(() => {
      expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
    });

    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /save/i })).toBeInTheDocument();
    window.location.hash = "";
  });

  it("shows error toast when passwords do not match", async () => {
    mockSetSession.mockResolvedValue({ error: null });
    window.location.hash = "#access_token=valid-token&type=recovery";
    render(<ResetPassword />, { wrapper });

    await waitFor(() => {
      expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/new password/i), { target: { value: "password123" } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: "different456" } });
    fireEvent.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Passwords do not match.");
    });

    window.location.hash = "";
  });

  it("shows error toast when password is too short", async () => {
    mockSetSession.mockResolvedValue({ error: null });
    window.location.hash = "#access_token=valid-token&type=recovery";
    render(<ResetPassword />, { wrapper });

    await waitFor(() => {
      expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/new password/i), { target: { value: "short" } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: "short" } });
    fireEvent.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Password must be at least 6 characters.");
    });

    window.location.hash = "";
  });

  it("calls updateUser and navigates to login on success", async () => {
    mockSetSession.mockResolvedValue({ error: null });
    mockUpdateUser.mockResolvedValue({ error: null });
    window.location.hash = "#access_token=valid-token&type=recovery";
    render(<ResetPassword />, { wrapper });

    await waitFor(() => {
      expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/new password/i), { target: { value: "newpassword123" } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: "newpassword123" } });
    fireEvent.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => {
      expect(mockUpdateUser).toHaveBeenCalledWith({ password: "newpassword123" });
    });

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("Password updated.");
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/login");
    });

    window.location.hash = "";
  });

  it("shows error toast when updateUser fails", async () => {
    mockSetSession.mockResolvedValue({ error: null });
    mockUpdateUser.mockResolvedValue({ error: { message: "Weak password" } });
    window.location.hash = "#access_token=valid-token&type=recovery";
    render(<ResetPassword />, { wrapper });

    await waitFor(() => {
      expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/new password/i), { target: { value: "newpassword123" } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: "newpassword123" } });
    fireEvent.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Weak password");
    });

    expect(mockNavigate).not.toHaveBeenCalled();
    window.location.hash = "";
  });

  it("navigates to login when error state button is clicked", async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });
    render(<ResetPassword />, { wrapper });

    await waitFor(() => {
      expect(screen.getAllByRole("button", { name: /sign in/i }).length).toBeGreaterThanOrEqual(1);
    });

    fireEvent.click(screen.getAllByRole("button", { name: /sign in/i })[0]);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/login");
    });
  });
});
