import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
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
              { question_id: 1, answer: "L'honnetete", lang: "fr" },
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

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    <I18nProvider>{children}</I18nProvider>
  </BrowserRouter>
);

describe("Settings multi-language questionnaire", () => {
  it("loads existing answers grouped by language", async () => {
    render(<Settings />, { wrapper });
    await waitFor(() => {
      expect(screen.getByDisplayValue("Honesty")).toBeInTheDocument();
    });
    expect(screen.getByDisplayValue("Kindness")).toBeInTheDocument();
  });

  it("switches language and shows different answers", async () => {
    render(<Settings />, { wrapper });
    await waitFor(() => {
      expect(screen.getByDisplayValue("Honesty")).toBeInTheDocument();
    });

    const langTrigger = screen.getByLabelText("Questionnaire language");
    fireEvent.click(langTrigger);

    await waitFor(() => {
      expect(screen.getByText(/Francais \(FR\)/)).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText(/Francais \(FR\)/));

    await waitFor(() => {
      expect(screen.getByDisplayValue("L'honnetete")).toBeInTheDocument();
    });
    expect(screen.getByDisplayValue("La gentillesse")).toBeInTheDocument();
  });

  it("shows progress count for active language", async () => {
    render(<Settings />, { wrapper });
    await waitFor(() => {
      expect(screen.getByText(/2 \/ 34 answered/)).toBeInTheDocument();
    });
  });
});
