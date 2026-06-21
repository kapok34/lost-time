import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import Apply from "../pages/Apply";
import { AuthProvider } from "../hooks/useAuth";
import { I18nProvider } from "../i18n/context";
import { getQuestions, TOTAL_QUESTIONS, QUESTIONNAIRE_LANGS, QUESTIONNAIRE_LANG_LABELS } from "../data/questions";

// Mock supabase client
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
      getSession: vi.fn(() => Promise.resolve({ data: { session: null } })),
    },
    from: vi.fn(() => ({
      insert: vi.fn(() => ({ error: null })),
    })),
    rpc: vi.fn(() => ({ data: "test-uuid", error: null })),
  },
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <HelmetProvider>
    <BrowserRouter>
      <I18nProvider>
        <AuthProvider>{children}</AuthProvider>
      </I18nProvider>
    </BrowserRouter>
  </HelmetProvider>
);

describe("Application submission flow", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("should have 34 Proust questions in English", () => {
    const questions = getQuestions("en");
    expect(questions).toHaveLength(34);
    expect(questions[0].id).toBe(1);
    expect(questions[33].id).toBe(34);
    expect(questions[12].text).toBe("Your favourite time of the day.");
  });

  it("should have 34 Proust questions in French", () => {
    const questions = getQuestions("fr");
    expect(questions).toHaveLength(34);
    expect(questions[12].text).toBe("Le moment que je préfère.");
  });

  it("should track TOTAL_QUESTIONS as 34", () => {
    expect(TOTAL_QUESTIONS).toBe(34);
  });

  it("should render the apply form with account and questionnaire sections", () => {
    render(<Apply />, { wrapper });
    expect(screen.getByText(/account information/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /questionnaire/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    // Country appears as both a Label and a Select placeholder, so use getAllByText
    expect(screen.getAllByText(/country/i).length).toBeGreaterThan(0);
    expect(screen.getByPlaceholderText(/city/i)).toBeInTheDocument();
  });

  it("should count valid answers correctly", () => {
    const answers: Record<number, string> = {};
    const questions = getQuestions("en");

    const isValid = (a: string) => {
      const len = a.trim().length;
      return len >= 3 && len <= 200;
    };

    // Initially empty
    const emptyCount = questions.filter((q) => isValid(answers[q.id] ?? "")).length;
    expect(emptyCount).toBe(0);

    // Fill 5 answers
    answers[1] = "Virtue answer";
    answers[2] = "Qualities answer";
    answers[3] = "Characteristic answer";
    answers[4] = "Friends answer";
    answers[5] = "Flaw answer";

    const validCount = questions.filter((q) => isValid(answers[q.id] ?? "")).length;
    expect(validCount).toBe(5);
    expect(Math.round((validCount / TOTAL_QUESTIONS) * 100)).toBe(15);

    // Short answer should not count as valid
    answers[6] = "ab";
    const shortCount = questions.filter((q) => isValid(answers[q.id] ?? "")).length;
    expect(shortCount).toBe(5);
  });

  it("should persist draft to localStorage", async () => {
    render(<Apply />, { wrapper });

    const emailInput = screen.getByLabelText(/Email/i);
    fireEvent.change(emailInput, { target: { value: "test@example.com" } });

    await waitFor(() => {
      const draft = localStorage.getItem("salon.apply.draft.v2");
      expect(draft).toContain("test@example.com");
    });
  });

  it("should disable submit when questions are incomplete", async () => {
    render(<Apply />, { wrapper });

    // Fill account fields
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: "test@example.com" } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: "password123" } });
    // Select country via the combobox trigger
    const countrySelect = screen.getAllByRole("combobox")[0];
    fireEvent.click(countrySelect);
    const franceOption = await screen.findByRole("option", { name: "France" });
    fireEvent.click(franceOption);
    fireEvent.change(screen.getByPlaceholderText(/city/i), { target: { value: "Paris" } });

    // Select a questionnaire language from the dropdown
    const langSelect = screen.getByRole("combobox", { name: /questionnaire language/i });
    fireEvent.click(langSelect);
    const englishOption = await screen.findByRole("option", { name: /English/i });
    fireEvent.click(englishOption);

    await waitFor(() => {
      expect(screen.getByText(/Your favourite virtue/i)).toBeInTheDocument();
    });

    const submitBtn = screen.getByRole("button", { name: /submit/i });
    expect(submitBtn).toBeDisabled();
  });

  it("should enable submit after all questions are valid", async () => {
    const { container } = render(<Apply />, { wrapper });

    // Fill account fields
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: "test@example.com" } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: "password123" } });
    const countrySelect = screen.getAllByRole("combobox")[0];
    fireEvent.click(countrySelect);
    const franceOption = await screen.findByRole("option", { name: "France" });
    fireEvent.click(franceOption);
    fireEvent.change(screen.getByPlaceholderText(/city/i), { target: { value: "Paris" } });

    // Select a questionnaire language from the dropdown
    const langSelect = screen.getByRole("combobox", { name: /questionnaire language/i });
    fireEvent.click(langSelect);
    const englishOption = await screen.findByRole("option", { name: /English/i });
    fireEvent.click(englishOption);

    await waitFor(() => {
      expect(screen.getByText(/Your favourite virtue/i)).toBeInTheDocument();
    });

    // Fill all questions with valid answers
    const textareas = container.querySelectorAll("textarea");
    textareas.forEach((ta) => {
      fireEvent.change(ta, { target: { value: "A valid answer here." } });
    });

    const submitBtn = screen.getByRole("button", { name: /submit/i });
    await waitFor(() => {
      expect(submitBtn).not.toBeDisabled();
    });
  });

  it("should compute valid progress as 0% when empty", () => {
    const questions = getQuestions("en");
    const answers: Record<number, string> = {};
    const isValid = (a: string) => {
      const len = a.trim().length;
      return len >= 3 && len <= 200;
    };
    const validCount = questions.filter((q) => isValid(answers[q.id] ?? "")).length;
    expect(validCount).toBe(0);
    expect(Math.round((validCount / TOTAL_QUESTIONS) * 100)).toBe(0);
  });

  it("should compute valid progress as 100% when all answered", () => {
    const questions = getQuestions("en");
    const answers: Record<number, string> = {};
    questions.forEach((q) => {
      answers[q.id] = `Answer for question ${q.id}`;
    });
    const isValid = (a: string) => {
      const len = a.trim().length;
      return len >= 3 && len <= 200;
    };
    const validCount = questions.filter((q) => isValid(answers[q.id] ?? "")).length;
    expect(validCount).toBe(34);
    expect(Math.round((validCount / TOTAL_QUESTIONS) * 100)).toBe(100);
  });
});

describe("Language selection flow", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("should show language prompt before any language is selected", async () => {
    render(<Apply />, { wrapper });

    // The prompt asking to select a language should be visible
    await waitFor(() => {
      expect(
        screen.getByText(/Choose the language in which you would like to answer/i)
      ).toBeInTheDocument();
    });

    // No questions should be visible yet
    expect(screen.queryByText(/Your favourite virtue/i)).not.toBeInTheDocument();
  });

  it("should reveal questions immediately after selecting a language from the dropdown", async () => {
    render(<Apply />, { wrapper });

    // Open the language selector in the header
    const langSelect = screen.getByRole("combobox", { name: /questionnaire language/i });
    fireEvent.click(langSelect);

    // Select English
    const englishOption = await screen.findByRole("option", { name: /English/i });
    fireEvent.click(englishOption);

    // Now the first question should be visible
    await waitFor(() => {
      expect(screen.getByText(/Your favourite virtue/i)).toBeInTheDocument();
    });

    // All 34 English questions should be rendered
    const questions = getQuestions("en");
    expect(screen.getByText(questions[0].text)).toBeInTheDocument();
    expect(screen.getByText(questions[33].text)).toBeInTheDocument();
  });

  it("should persist active language to localStorage", async () => {
    render(<Apply />, { wrapper });

    // Open the language selector and pick French
    const langSelect = screen.getByRole("combobox", { name: /questionnaire language/i });
    fireEvent.click(langSelect);
    const frenchOption = await screen.findByRole("option", { name: /Français/i });
    fireEvent.click(frenchOption);

    await waitFor(() => {
      const draft = localStorage.getItem("salon.apply.draft.v2");
      expect(draft).toBeTruthy();
      const parsed = JSON.parse(draft!);
      expect(parsed.activeLang).toBe("fr");
    });
  });

  it("should restore active language from localStorage on mount", async () => {
    localStorage.setItem(
      "salon.apply.draft.v2",
      JSON.stringify({
        email: "",
        city: "",
        country: "",
        answers: {},
        activeLang: "en",
        completedLangs: [],
      })
    );

    render(<Apply />, { wrapper });

    // Should show questions directly (no prompt)
    await waitFor(() => {
      expect(screen.getByText(/Your favourite virtue/i)).toBeInTheDocument();
    });
  });

  it("should allow switching to another language via the same dropdown", async () => {
    render(<Apply />, { wrapper });

    // Open the language selector and pick English
    const langSelect = screen.getByRole("combobox", { name: /questionnaire language/i });
    fireEvent.click(langSelect);
    const englishOption = await screen.findByRole("option", { name: /English/i });
    fireEvent.click(englishOption);

    await waitFor(() => {
      expect(screen.getByText(/Your favourite virtue/i)).toBeInTheDocument();
    });

    // Open again and switch to French
    fireEvent.click(langSelect);
    const frenchOption = await screen.findByRole("option", { name: /Français/i });
    fireEvent.click(frenchOption);

    // English questions should disappear, French prompt should appear
    await waitFor(() => {
      expect(screen.getByText(/Ma vertu préférée/i)).toBeInTheDocument();
    });
    expect(screen.queryByText(/Your favourite virtue/i)).not.toBeInTheDocument();
  });

  it("should show all 24 languages in the dropdown", async () => {
    render(<Apply />, { wrapper });

    const langSelect = screen.getByRole("combobox", { name: /questionnaire language/i });
    fireEvent.click(langSelect);

    await waitFor(() => {
      QUESTIONNAIRE_LANGS.forEach((l) => {
        expect(
          screen.getByRole("option", { name: new RegExp(QUESTIONNAIRE_LANG_LABELS[l], "i") })
        ).toBeInTheDocument();
      });
    });
  });
});

describe("Questionnaire data integrity", () => {
  it("should have sequential IDs from 1 to 34 in English", () => {
    const questions = getQuestions("en");
    questions.forEach((q, idx) => {
      expect(q.id).toBe(idx + 1);
      expect(q.text.length).toBeGreaterThan(0);
    });
  });

  it("should have sequential IDs from 1 to 34 in French", () => {
    const questions = getQuestions("fr");
    questions.forEach((q, idx) => {
      expect(q.id).toBe(idx + 1);
      expect(q.text.length).toBeGreaterThan(0);
    });
  });

  it("should have matching question IDs across languages", () => {
    const en = getQuestions("en");
    const fr = getQuestions("fr");
    en.forEach((q, idx) => {
      expect(q.id).toBe(fr[idx].id);
    });
  });
});
