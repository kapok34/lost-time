import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import Conversation from "../pages/Conversation";
import { I18nProvider } from "../i18n/context";
import { toast } from "sonner";

// Stable mock references (hoisted vi.mock factories can't read outer vars)
const __mockUser = { id: "user-1" };
const __mockProfile = { id: "user-1", member_number: 7 };

const mockNavigate = vi.fn();

const supabaseMocks = {
  from: vi.fn(),
  rpc: vi.fn(),
  channel: vi.fn(() => ({
    on: vi.fn(() => ({
      on: vi.fn(() => ({
        subscribe: vi.fn(() => ({ unsubscribe: vi.fn() })),
      })),
    })),
  })),
  removeChannel: vi.fn(),
};

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: __mockUser,
    profile: __mockProfile,
    loading: false,
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ id: "conv-1" }),
  };
});

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: (...args: any[]) => supabaseMocks.from(...args),
    rpc: (...args: any[]) => supabaseMocks.rpc(...args),
    channel: (...args: any[]) => supabaseMocks.channel(...args),
    removeChannel: (...args: any[]) => supabaseMocks.removeChannel(...args),
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

function setupSupabaseMocks(hasMessages = false) {
  supabaseMocks.from.mockImplementation((table: string) => {
    if (table === "conversations") {
      return {
        select: () => ({
          eq: () => ({
            maybeSingle: () =>
              Promise.resolve({
                data: {
                  id: "conv-1",
                  member_a: "user-1",
                  member_b: "user-2",
                  status: "active",
                },
                error: null,
              }),
          }),
        }),
      };
    }
    if (table === "profiles") {
      return {
        select: () => ({
          eq: () => ({
            maybeSingle: () =>
              Promise.resolve({
                data: { id: "user-2", member_number: 42 },
                error: null,
              }),
          }),
        }),
      };
    }
    if (table === "messages") {
      return {
        select: () => ({
          eq: () => ({
            order: () =>
              Promise.resolve({
                data: hasMessages
                  ? [
                      {
                        id: "m1",
                        conversation_id: "conv-1",
                        sender_id: "user-2",
                        body: "Hello",
                        created_at: new Date().toISOString(),
                      },
                    ]
                  : [],
                error: null,
              }),
          }),
        }),
      };
    }
    return { select: () => ({ eq: () => ({}) }) };
  });
  supabaseMocks.rpc.mockResolvedValue({ error: null });
}

describe("Conversation cancel functionality", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
    setupSupabaseMocks(false);
  });

  it("shows cancel button when conversation has no messages", async () => {
    render(<Conversation />, { wrapper });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
    });
  });

  it("hides cancel button when conversation has messages", async () => {
    setupSupabaseMocks(true);
    render(<Conversation />, { wrapper });

    await waitFor(() => {
      expect(screen.queryByRole("button", { name: /cancel/i })).not.toBeInTheDocument();
    });
  });

  it("calls cancel_conversation RPC and navigates on cancel click", async () => {
    render(<Conversation />, { wrapper });

    const cancelBtn = await screen.findByRole("button", { name: /cancel/i });
    fireEvent.click(cancelBtn);

    await waitFor(() => {
      expect(supabaseMocks.rpc).toHaveBeenCalledWith("cancel_conversation", {
        _conv_id: "conv-1",
      });
    });

    expect(toast.success).toHaveBeenCalledWith("Correspondence cancelled");
    expect(mockNavigate).toHaveBeenCalledWith("/members");
  });

  it("shows error toast when cancel RPC fails", async () => {
    supabaseMocks.rpc.mockResolvedValueOnce({
      error: { message: "This correspondence has already begun" },
    });
    render(<Conversation />, { wrapper });

    const cancelBtn = await screen.findByRole("button", { name: /cancel/i });
    fireEvent.click(cancelBtn);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "This correspondence has already begun"
      );
    });

    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
