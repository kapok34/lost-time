import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import Settings from "../pages/Settings";
import { I18nProvider } from "../i18n/context";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() =>
          Promise.resolve({
            data: [
              { question_id: 1, answer: "Honesty", lang: "en" },
              { question_id: 2, answer: "Kindness", lang: "en" },
              { question_id: 1, answer: "L'honnêteté", lang: "fr" },
              { question_id: 2, answer: "La gentillesse", lang: "fr" },
            ],
            error: null,
          })
        ),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
      })),
      upsert: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
      })),
      eq: vi.fn(function () {
        return this;
      }),
      maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })),
    })),
  },
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: { id: "test-user-id", email: "test@example.com" },
    profile: {
      id: "test-user-id",
      display_name: "Test User",
      avatar_url: null,
      language: "English",
      location: "Paris, France",
      status: "approved",
      member_number: 42,
      questionnaire_languages: ["en", "fr"],
    },
    refreshProfile: vi.fn(() => Promise.resolve()),
  }),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    <I18nProvider>{children}</I18nProvider>
  </BrowserRouter>
);

describe("Settings page", () => {
  it("renders profile settings form", async () => {
    render(<Settings />, { wrapper });

    await waitFor(() => {
      expect(screen.getByDisplayValue("Test User")).toBeInTheDocument();
    });
    expect(screen.getByDisplayValue("Paris, France")).toBeInTheDocument();
    expect(screen.getByText("English")).toBeInTheDocument();
  });

  it("renders questionnaire with loaded answers", async () => {
    render(<Settings />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText("Honesty")).toBeInTheDocument();
    });
    expect(screen.getByText("Kindness")).toBeInTheDocument();
  });

  it("shows questionnaire progress count", async () => {
    render(<Settings />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText(/2 \/ 34 answered/)).toBeInTheDocument();
    });
  });
});
