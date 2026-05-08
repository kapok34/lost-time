import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mockFetch = vi.fn();
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

import { handler } from "../../supabase/functions/notify-member/index.ts";

describe("notify-member edge function", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", mockFetch);
    (globalThis as any).Deno.env._store = {
      RESEND_API_KEY: "re_test_key",
      SUPABASE_URL: "https://test.supabase.co",
      SUPABASE_SECRET_KEYS: JSON.stringify({ default: "test_service_role" }),
    };
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete (globalThis as any).Deno.env._store;
  });

  function mockFromImpl(
    senderLang: string,
    recipientLang: string,
    opts?: { convActive?: boolean; convError?: boolean; selfMessage?: boolean }
  ) {
    return (table: string) => {
      if (table === "conversations") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: () => {
                if (opts?.convError) {
                  return Promise.resolve({ data: null, error: new Error("not found") });
                }
                if (opts?.selfMessage) {
                  return Promise.resolve({
                    data: { id: "conv-1", member_a: "same-id", member_b: "same-id", status: "active" },
                    error: null,
                  });
                }
                return Promise.resolve({
                  data: {
                    id: "conv-1",
                    member_a: "sender-id",
                    member_b: "recipient-id",
                    status: opts?.convActive === false ? "ended" : "active",
                  },
                  error: null,
                });
              },
            })),
          })),
        };
      }
      if (table === "profiles") {
        return {
          select: vi.fn((cols: string) => ({
            eq: vi.fn((field: string, value: string) => ({
              maybeSingle: () => {
                if (value === "sender-id") {
                  return Promise.resolve({
                    data: { id: "sender-id", member_number: 42, language: senderLang },
                    error: null,
                  });
                }
                if (value === "recipient-id") {
                  return Promise.resolve({
                    data: { id: "recipient-id", language: recipientLang },
                    error: null,
                  });
                }
                return Promise.resolve({ data: null, error: null });
              },
            })),
          })),
        };
      }
      return {};
    };
  }

  it("returns 500 when RESEND_API_KEY is missing", async () => {
    delete (globalThis as any).Deno.env._store.RESEND_API_KEY;

    const req = new Request("https://test.supabase.co", {
      method: "POST",
      body: JSON.stringify({ message_id: "m1", conversation_id: "conv-1", sender_id: "sender-id", body: "Hello" }),
    });
    const res = await handler(req);
    expect(res.status).toBe(500);
    expect(await res.text()).toBe("RESEND_API_KEY not configured");
  });

  it("returns 404 when conversation is not found", async () => {
    mockFrom.mockImplementation(mockFromImpl("en", "en", { convError: true }));

    const req = new Request("https://test.supabase.co", {
      method: "POST",
      body: JSON.stringify({ message_id: "m1", conversation_id: "conv-1", sender_id: "sender-id", body: "Hello" }),
    });
    const res = await handler(req);
    expect(res.status).toBe(404);
    expect(await res.text()).toBe("Conversation not found");
  });

  it("returns 200 and skips when conversation is not active", async () => {
    mockFrom.mockImplementation(mockFromImpl("en", "en", { convActive: false }));

    const req = new Request("https://test.supabase.co", {
      method: "POST",
      body: JSON.stringify({ message_id: "m1", conversation_id: "conv-1", sender_id: "sender-id", body: "Hello" }),
    });
    const res = await handler(req);
    expect(res.status).toBe(200);
    expect(await res.text()).toBe("Conversation not active");
  });

  it("returns 200 and skips self-messages", async () => {
    mockFrom.mockImplementation(mockFromImpl("en", "en", { selfMessage: true }));

    const req = new Request("https://test.supabase.co", {
      method: "POST",
      body: JSON.stringify({ message_id: "m1", conversation_id: "conv-1", sender_id: "same-id", body: "Hello" }),
    });
    const res = await handler(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.skipped).toBe(true);
    expect(json.reason).toBe("self-message");
  });

  it("returns 404 when recipient email is not found", async () => {
    mockFrom.mockImplementation(mockFromImpl("en", "en"));
    mockGetUserById.mockResolvedValue({ data: { user: null }, error: new Error("not found") });

    const req = new Request("https://test.supabase.co", {
      method: "POST",
      body: JSON.stringify({ message_id: "m1", conversation_id: "conv-1", sender_id: "sender-id", body: "Hello" }),
    });
    const res = await handler(req);
    expect(res.status).toBe(404);
    expect(await res.text()).toBe("Recipient email not found");
  });

  it("sends an English notification email when recipient language is en", async () => {
    mockFrom.mockImplementation(mockFromImpl("fr", "en"));
    mockGetUserById.mockResolvedValue({
      data: { user: { id: "recipient-id", email: "alice@example.com" } },
      error: null,
    });
    mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({ id: "email-1" }) });

    const req = new Request("https://test.supabase.co", {
      method: "POST",
      body: JSON.stringify({ message_id: "m1", conversation_id: "conv-1", sender_id: "sender-id", body: "Hello there!" }),
    });
    const res = await handler(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [, callInit] = mockFetch.mock.calls[0];
    const payload = JSON.parse(callInit.body);

    expect(payload.to).toEqual(["alice@example.com"]);
    expect(payload.subject).toBe("New message from member #42");
    expect(payload.html).toContain("Hello,");
    expect(payload.html).toContain("You have received a new message from");
    expect(payload.html).toContain("member #42");
    expect(payload.html).toContain("Open correspondence");
    expect(payload.html).toContain("may end this correspondence if you do not reply within 34 hours");
    expect(payload.html).toContain("You may end this correspondence only after you have replied");
    expect(payload.html).toContain("— lost time");
  });

  it("sends a French notification email when recipient language is fr", async () => {
    mockFrom.mockImplementation(mockFromImpl("en", "fr"));
    mockGetUserById.mockResolvedValue({
      data: { user: { id: "recipient-id", email: "beatrice@example.com" } },
      error: null,
    });
    mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({ id: "email-2" }) });

    const req = new Request("https://test.supabase.co", {
      method: "POST",
      body: JSON.stringify({ message_id: "m2", conversation_id: "conv-1", sender_id: "sender-id", body: "Salut!" }),
    });
    const res = await handler(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [, callInit] = mockFetch.mock.calls[0];
    const payload = JSON.parse(callInit.body);

    expect(payload.to).toEqual(["beatrice@example.com"]);
    expect(payload.subject).toBe("Nouveau message du membre #42");
    expect(payload.html).toContain("Bonjour,");
    expect(payload.html).toContain("Tu as reçu un nouveau message de la part de");
    expect(payload.html).toContain("membre #42");
    expect(payload.html).toContain("Ouvrir la correspondance");
    expect(payload.html).toContain("Sans réponse de ta part sous 34 heures");
    expect(payload.html).toContain("Tu ne peux mettre fin à cette correspondance qu'après avoir répondu");
    expect(payload.html).toContain("— lost time");
  });

  it("sends an Italian notification email when recipient language is it", async () => {
    mockFrom.mockImplementation(mockFromImpl("en", "it"));
    mockGetUserById.mockResolvedValue({
      data: { user: { id: "recipient-id", email: "carlo@example.com" } },
      error: null,
    });
    mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({ id: "email-3" }) });

    const req = new Request("https://test.supabase.co", {
      method: "POST",
      body: JSON.stringify({ message_id: "m3", conversation_id: "conv-1", sender_id: "sender-id", body: "Ciao!" }),
    });
    const res = await handler(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [, callInit] = mockFetch.mock.calls[0];
    const payload = JSON.parse(callInit.body);

    expect(payload.to).toEqual(["carlo@example.com"]);
    expect(payload.subject).toBe("Nuovo messaggio dal socio #42");
    expect(payload.html).toContain("Ciao,");
    expect(payload.html).toContain("Hai ricevuto un nuovo messaggio da");
    expect(payload.html).toContain("socio #42");
    expect(payload.html).toContain("Apri la corrispondenza");
    expect(payload.html).toContain("Se non rispondi entro 34 ore");
    expect(payload.html).toContain("Puoi terminare questa corrispondenza solo dopo aver risposto");
    expect(payload.html).toContain("— lost time");
  });

  it("defaults to English when recipient language is unsupported", async () => {
    mockFrom.mockImplementation(mockFromImpl("en", "es"));
    mockGetUserById.mockResolvedValue({
      data: { user: { id: "recipient-id", email: "juan@example.com" } },
      error: null,
    });
    mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({ id: "email-4" }) });

    const req = new Request("https://test.supabase.co", {
      method: "POST",
      body: JSON.stringify({ message_id: "m4", conversation_id: "conv-1", sender_id: "sender-id", body: "Hola!" }),
    });
    const res = await handler(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [, callInit] = mockFetch.mock.calls[0];
    const payload = JSON.parse(callInit.body);

    expect(payload.subject).toBe("New message from member #42");
    expect(payload.html).toContain("Hello,");
  });

  it("returns 500 when Resend API fails", async () => {
    mockFrom.mockImplementation(mockFromImpl("en", "en"));
    mockGetUserById.mockResolvedValue({
      data: { user: { id: "recipient-id", email: "fail@example.com" } },
      error: null,
    });
    mockFetch.mockResolvedValue({ ok: false, text: () => Promise.resolve("Resend error") });

    const req = new Request("https://test.supabase.co", {
      method: "POST",
      body: JSON.stringify({ message_id: "m5", conversation_id: "conv-1", sender_id: "sender-id", body: "Hello" }),
    });
    const res = await handler(req);
    expect(res.status).toBe(500);
    expect(await res.text()).toContain("Email failed");
  });
});
