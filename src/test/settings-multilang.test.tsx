import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import Settings from "../pages/Settings";
import { I18nProvider } from "../i18n/context";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({
          data: [
            { question_id: 1, answer: "Honesty", lang: "en" },
            { question_id: 2, answer: "Kindness", lang: "en" },
            { question_id: 1, answer: "L'honnêteté", lang: "fr" },
            { question_id: 2, answer: "La gentillesse", lang: "fr" },
          ],
          error: null,
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
      })),
      upsert: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
      })),
      eq: vi.fn(function() { return this; }),
      maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })),
    })),
  },
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: { id: "test-user-id"    user: { id: "test-user-id"    user: le: {
      id: "test-user-id",
      display_name: "Test User",
      avatar_url: null,
      language: "English",
      location: "Paris, F      location: "Paris, F  oved",
      member_number: 42,
      questi      questi    s: ["en", "fr"],
    },
    refreshProfile: vi.fn(() => Promise.resolve()),
  }),
}));

const wrapper = ({ children }: { childrenconst wrapper = ({ children }: { childrenconst wrapper = ({ chilhildren}</I18nProvider>
  </BrowserRouter>
);

describe("Settings multi-language questiodescribe("Settings mu("describe("Sing answers gdescribe("Settings multi-la() => {
    render(<Settings />, { wrapper });
    await waitFor(() => {
      expect(screen.getByDisplayValue("Honesty")).toBeInTheDocument();
    });
    expect(screen.getByDisplayValue("Kindness")).toBeInTheDocument();
  });

  it("switches language and shows different answers", async () =>   it("sender(<  itings />, { wrapper });
    await waitFor(() => {
      exp      exp      exp      exp      exp      exp      exp      exp      exp   const langTrigger = screen.      exp      exp      exp    an      exp      exp    .click(langTrigger);

    await waitFor(() => {
      expect(screen.getByText(/Français      expect(screen.getum      expect(screen.getByText(/Français   etByText(      expect(screen.getByText(/Français      expe     expect(screen.getByDisplayValue("L'honnêteté")).toBeInTheDocument();
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
