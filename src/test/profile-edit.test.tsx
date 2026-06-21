import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import Profile from "../pages/Profile";
import { I18nProvider } from "../i18n/context";
import { toast } from "sonner";

const mockUser = { id: "user-123" };
const mockProfile = { id: "user-123", member_number: 42 };

const mockFetch = vi.fn();

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: mockUser,
    profile: mockProfile,
    loading: false,
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useParams: () => ({ memberNumber: "42" }),
  };
});

const supabaseMocks = {
  from: vi.fn(),
};

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: (...args: any[]) => supabaseMocks.from(...args),
    auth: {
      getSession: () =>
        Promise.resolve({
          data: { session: { access_token: "test-token" } },
          error: null,
        }),
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

function setupSupabaseMocks() {
  supabaseMocks.from.mockImplementation((table: string) => {
    if (table === "profiles") {
      return {
        select: () => ({
          eq: () => ({
            maybeSingle: () =>
              Promise.resolve({
                data: {
                  id: "user-123",
                  member_number: 42,
                  location: "Paris, France",
                  questionnaire_languages: ["en", "fr"],
                  notify_new_members: true,
                },
                error: null,
              }),
          }),
        }),
      };
    }
    if (table === "questionnaire_answers") {
      return {
        select: () => ({
          eq: () => ({
            eq: () =>
              Promise.resolve({
                data: [],
                error: null,
              }),
          }),
        }),
      };
    }
    if (table === "conversations") {
      return {
        select: () =>
          Promise.resolve({
            data: [],
            error: null,
          }),
      };
    }
    return { select: () => ({ eq: () => ({}) }) };
  });
}

describe("Profile page - edit questionnaire flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupSupabaseMocks();
    vi.stubGlobal("fetch", mockFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("should show edit button when viewing own profile", async () => {
    render(<Profile />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText(/42/)).toBeInTheDocument();
    });

    const editButton = screen.getByRole("button", { name: /edit/i });
    expect(editButton).toBeInTheDocument();
  });

  it("should open edit dialog when clicking edit button", async () => {
    render(<Profile />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText(/42/)).toBeInTheDocument();
    });

    const editButton = screen.getByRole("button", { name: /edit/i });
    fireEvent.click(editButton);

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    // Should show language selector inside the dialog
    const dialog = screen.getByRole("dialog");
    const enButtons = within(dialog).getAllByText(/EN/);
    expect(enButtons.length).toBeGreaterThanOrEqual(1);
  });

  it("should submit edit request successfully", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, editId: "edit-123" }),
    } as Response);

    render(<Profile />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText(/42/)).toBeInTheDocument();
    });

    const editButton = screen.getByRole("button", { name: /edit/i });
    fireEvent.click(editButton);

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    // Fill all textareas with valid answers
    const textareas = screen.getAllByRole("textbox");
    expect(textareas.length).toBeGreaterThan(0);
    textareas.forEach((ta) => {
      fireEvent.change(ta, { target: { value: "A valid answer here that is more than three characters long." } });
    });

    // Click send button
    const sendButton = screen.getByRole("button", { name: /submit/i });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/functions/v1/submit-questionnaire-edit"),
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            Authorization: expect.stringContaining("Bearer"),
            "Content-Type": "application/json",
          }),
        })
      );
    });

    expect(toast.success).toHaveBeenCalledWith("Edit request sent for admin approval");
  });

  it("should show validation error for short answers", async () => {
    render(<Profile />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText(/42/)).toBeInTheDocument();
    });

    const editButton = screen.getByRole("button", { name: /edit/i });
    fireEvent.click(editButton);

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    // Fill textareas with too-short answers
    const textareas = screen.getAllByRole("textbox");
    textareas.forEach((ta) => {
      fireEvent.change(ta, { target: { value: "ab" } });
    });

    // Click send button
    const sendButton = screen.getByRole("button", { name: /submit/i });
    fireEvent.click(sendButton);

    // Should show error toast
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Please answer all questions (3–200 characters each)");
    });

    expect(mockFetch).not.toHaveBeenCalled();
  });
});
