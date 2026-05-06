import { useState } from "react";
import { seedTestMembers } from "@/lib/seed";

export const SeedButton = () => {
  const [logs, setLogs] = useState<string[]>([]);
  const onClick = async () => {
    setLogs(["Creating…"]);
    try {
      await seedTestMembers((msg) => setLogs((prev) => [...prev, msg]));
    } catch (e: any) {
      setLogs((prev) => [...prev, "Error: " + (e.message ?? "unknown")]);
    }
  };
  return (
    <div className="fixed bottom-4 right-4 z-50 bg-background border border-border p-3 rounded max-w-xs">
      <button onClick={onClick} className="bg-[hsl(350,55%,35%)] text-white text-xs px-4 py-2 rounded w-full">
        Seed 2 test members
      </button>
      <div className="mt-2 space-y-1">
        {logs.map((l, i) => (
          <p key={i} className="text-[10px] text-muted-foreground leading-tight">{l}</p>
        ))}
      </div>
    </div>
  );
};
