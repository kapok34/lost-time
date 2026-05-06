import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import Apply from "../pages/Apply";
import { AuthProvider } from "../hooks/useAuth";
import { I18nProvider } from "../i18n/context";
import { getQuestions, TOTAL_QUESTIONS } from "../data/questions";

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
  <BrowserRouter>
    <I18nProvider>
      <AuthProvider>{children}</AuthProvider>
    </I18nProvider>
  </BrowserRouter>
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
    expect(screen.getByText(/questionnaire/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/location/i)).toBeInTheDocument();
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
      const draft = localStorage.getItem("salon.apply.draft.v1");
      expect(draft).toContain("test@example.com");
    });
  });

  it("should disable submit when questions are incomplete", async () => {
    const { container } = render(<Apply />, { wrapper });

    // Fill account fields
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: "test@example.com" } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: "password123" } });
    fireEvent.change(screen.getByLabelText(/location/i), { target: { value: "Paris, France" } });

    const submitBtn = screen.getByRole("button", { name: /submit/i });
    expect(submitBtn).toBeDisabled();
  });

  it("should enable submit after all questions are valid", async () => {
    const { container } = render(<Apply />, { wrapper });

    // Fill account fields
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: "test@example.com" } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: "password123" } });
    fireEvent.change(screen.getByLabelText(/location/i), { target: { value: "Paris, France" } });

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
