import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import DeleteAccount from "../pages/DeleteAccount";
import { I18nProvider } from "../i18n/context";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const mockSignOut = vi.fn(() => Promise.resolve());
const mockNavigate = vi.fn();
const mockFetch = vi.fn();

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: { id: "test-user-id", email: "test@example.com" },
    signOut: mockSignOut,
    loading: false,
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
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

describe("DeleteAccount end-to-end flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (supabase.auth.getSession as ReturnType<typeof vi.fn>).mockResolvedValue({ data: { session: { access_token: "test-token" } } });
    mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({ success: true }) });
    vi.stubGlobal("fetch", mockFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders the delete account page with all warning content", () => {
    render(<DeleteAccount />, { wrapper });

    expect(screen.getByText(/Delete your account/i)).toBeInTheDocument();
    expect(screen.getByText(/permanently erase/i)).toBeInTheDocument();
expect(screen.getByText(/Your portrait and avatar/i)).toBeInTheDocument();
    expect(screen.getByText(/Your questionnaire answers/i)).toBeInTheDocument();
    expect(screen.getByText(/All messages you have sent and received/i)).toBeInTheDocument();
    expect(screen.getByText(/All active and archived correspondences/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Delete my account/i })).toBeInTheDocument();
  });

  it("opens confirmation dialog when delete button is clicked", () => {
    render(<DeleteAccount />, { wrapper });

    fireEvent.click(screen.getByRole("button", { name: /Delete my account/i }));

    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    expect(screen.getByText(/Are you sure/i)).toBeInTheDocument();
    expect(screen.getByText(/permanently removed/i)).toBeInTheDocument();
  });

  it("calls the delete-account edge function, signs out, and navigates home on confirm", async () => {
    render(<DeleteAccount />, { wrapper });

    fireEvent.click(screen.getByRole("button", { name: /Delete my account/i }));

    const dialog = screen.getByRole("alertdialog");
    const confirmBtn = within(dialog).getByRole("button", { name: /Delete my account/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/functions/v1/delete-account"),
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer test-token",
          "Content-Type": "application/json",
        }),
      })
    );

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalledTimes(1);
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/");
    });

    expect(toast.success).toHaveBeenCalledWith("Your account has been deleted");
  });

  it("shows an error toast when the edge function returns an error", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: "Server error" }),
    });

    render(<DeleteAccount />, { wrapper });

    fireEvent.click(screen.getByRole("button", { name: /Delete my account/i }));

    const dialog = screen.getByRole("alertdialog");
    const confirmBtn = within(dialog).getByRole("button", { name: /Delete my account/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Server error");
    });

    expect(mockSignOut).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("shows an error toast when the network request fails", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network failure"));

    render(<DeleteAccount />, { wrapper });

    fireEvent.click(screen.getByRole("button", { name: /Delete my account/i }));

    const dialog = screen.getByRole("alertdialog");
    const confirmBtn = within(dialog).getByRole("button", { name: /Delete my account/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Network failure");
    });

    expect(mockSignOut).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("shows an error toast when the user has no active session", async () => {
    (supabase.auth.getSession as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: { session: null } });

    render(<DeleteAccount />, { wrapper });

    fireEvent.click(screen.getByRole("button", { name: /Delete my account/i }));

    const dialog = screen.getByRole("alertdialog");
    const confirmBtn = within(dialog).getByRole("button", { name: /Delete my account/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Not authenticated");
    });

    expect(mockFetch).not.toHaveBeenCalled();
  });
});
