import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mockFetch = vi.fn();
const envMap = (globalThis as any).Deno.env as { get: (key: string) => string | undefined };
const mockGetUserById = vi.fn();
const mockFrom = vi.fn();

vi.mock("https://deno.land/std@0.168.0/http/server.ts", () => ({
  serve: (_handler: any) => {},
}));

vi.mock("https://esm.sh/@supabase/supabase-js@2.39.3", () => ({
  createClient: vi.fn(() => ({
    from: mockFrom,
    auth: {
      admin: {
        getUserById: mockGetUserById,
      },
    },
  })),
}));

// Import after mocking
import { handler } from "../../supabase/functions/welcome-member/index.ts";

describe("welcome-member edge function", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", mockFetch);
    (globalThis as any).Deno.env._store = {
      RESEND_API_KEY: "re_test_key",
      SUPABASE_URL: "https://test.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "test_service_role",
    };
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete (globalThis as any).Deno.env._store;
  });

  it("returns 400 when member_id is missing", async () => {
    const req = new Request("https://test.supabase.co", {
      method: "POST",
      body: JSON.stringify({}),
    });
    const res = await handler(req);
    expect(res.status).toBe(400);
    expect(await res.text()).toBe("Missing member_id");
  });

  it("returns 404 when profile is not found", async () => {
    mockFrom.mockReturnValue({
      select: vi.fn(() => ({ eq: vi.fn(() => ({ maybeSingle: () => Promise.resolve({ data: null, error: null }) })) })),
    });

    const req = new Request("https://test.supabase.co", {
      method: "POST",
      body: JSON.stringify({ member_id: "non-existent" }),
    });
    const res = await handler(req);
    expect(res.status).toBe(404);
  });

  it("returns 404 when user email is not found", async () => {
    mockFrom.mockReturnValue({
      select: vi.fn(() => ({ eq: vi.fn(() => ({ maybeSingle: () => Promise.resolve({ data: { id: "user-1", display_name: "Test", member_number: 42, language: "en" }, error: null }) })) })),
    });
    mockGetUserById.mockResolvedValue({ data: { user: null }, error: new Error("not found") });

    const req = new Request("https://test.supabase.co", {
      method: "POST",
      body: JSON.stringify({ member_id: "user-1" }),
    });
    const res = await handler(req);
    expect(res.status).toBe(404);
  });

  it("sends an English welcome email when language is en", async () => {
    mockFrom.mockReturnValue({
      select: vi.fn(() => ({ eq: vi.fn(() => ({ maybeSingle: () => Promise.resolve({ data: { id: "user-1", display_name: "Alice", member_number: 7, language: "en" }, error: null }) })) })),
    });
    mockGetUserById.mockResolvedValue({ data: { user: { id: "user-1", email: "alice@example.com" } }, error: null });
    mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({ id: "email-1" }) });

    const req = new Request("https://test.supabase.co", {
      method: "POST",
      body: JSON.stringify({ member_id: "user-1" }),
    });
    const res = await handler(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [, callInit] = mockFetch.mock.calls[0];
    const payload = JSON.parse(callInit.body);

    expect(payload.to).toEqual(["alice@example.com"]);
    expect(payload.subject).toBe("In search of — member #7");
    expect(payload.html).toContain("Hello,");
    expect(payload.html).toContain("member #7");
    expect(payload.html).toContain("https://lost-time.org/delete-account");
    expect(payload.html).toContain("Need to change your location or your answers? Want to add another language?");
    expect(payload.html).toContain("Write to admin@lost-time.org");
  });

  it("sends a French welcome email when language is fr", async () => {
    mockFrom.mockReturnValue({
      select: vi.fn(() => ({ eq: vi.fn(() => ({ maybeSingle: () => Promise.resolve({ data: { id: "user-2", display_name: "Béatrice", member_number: 8, language: "fr" }, error: null }) })) })),
    });
    mockGetUserById.mockResolvedValue({ data: { user: { id: "user-2", email: "beatrice@example.com" } }, error: null });
    mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({ id: "email-2" }) });

    const req = new Request("https://test.supabase.co", {
      method: "POST",
      body: JSON.stringify({ member_id: "user-2" }),
    });
    const res = await handler(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [, callInit] = mockFetch.mock.calls[0];
    const payload = JSON.parse(callInit.body);

    expect(payload.to).toEqual(["beatrice@example.com"]);
    expect(payload.subject).toBe("À la recherche de — membre #8");
    expect(payload.html).toContain("Bonjour,");
    expect(payload.html).toContain("membre #8");
    expect(payload.html).toContain("lost-time.org");
    expect(payload.html).toContain("admin@lost-time.org");
    expect(payload.html).toContain("Bonne recherche.");
  });

  it("sends an Italian welcome email when language is it", async () => {
    mockFrom.mockReturnValue({
      select: vi.fn(() => ({ eq: vi.fn(() => ({ maybeSingle: () => Promise.resolve({ data: { id: "user-3", display_name: "Carlo", member_number: 9, language: "it" }, error: null }) })) })),
    });
    mockGetUserById.mockResolvedValue({ data: { user: { id: "user-3", email: "carlo@example.com" } }, error: null });
    mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({ id: "email-3" }) });

    const req = new Request("https://test.supabase.co", {
      method: "POST",
      body: JSON.stringify({ member_id: "user-3" }),
    });
    const res = await handler(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [, callInit] = mockFetch.mock.calls[0];
    const payload = JSON.parse(callInit.body);

    expect(payload.to).toEqual(["carlo@example.com"]);
    expect(payload.subject).toBe("Alla ricerca di — socio #9");
    expect(payload.html).toContain("Ciao,");
    expect(payload.html).toContain("membro #9");
    expect(payload.html).toContain("admin@lost-time.org");
    expect(payload.html).toContain("Buona ricerca.");
  });

  it("returns 500 when Resend API fails", async () => {
    mockFrom.mockReturnValue({
      select: vi.fn(() => ({ eq: vi.fn(() => ({ maybeSingle: () => Promise.resolve({ data: { id: "user-1", display_name: "Bob", member_number: 3, language: "en" }, error: null }) })) })),
    });
    mockGetUserById.mockResolvedValue({ data: { user: { id: "user-1", email: "bob@example.com" } }, error: null });
    mockFetch.mockResolvedValue({ ok: false, text: () => Promise.resolve("Resend error") });

    const req = new Request("https://test.supabase.co", {
      method: "POST",
      body: JSON.stringify({ member_id: "user-1" }),
    });
    const res = await handler(req);
    expect(res.status).toBe(500);
    expect(await res.text()).toContain("Email failed");
  });
});

describe("welcome_member_on_approve database trigger", () => {
  it("migration file contains the expected trigger function", () => {
    // Read the migration file and verify its contents
    const fs = require("fs");
    const path = require("path");
    const migrationPath = path.join(__dirname, "../../supabase/migrations/20260507000000_welcome_member_on_approve.sql");
    const sql = fs.readFileSync(migrationPath, "utf-8");

    expect(sql).toContain("CREATE OR REPLACE FUNCTION public.welcome_member_on_approve()");
    expect(sql).toContain("IF OLD.status = 'pending' AND NEW.status = 'approved' THEN");
    expect(sql).toContain("welcome-member");
    expect(sql).toContain("CREATE TRIGGER welcome_member_on_approve_trigger");
    expect(sql).toContain("AFTER UPDATE ON public.profiles");
  });
});
