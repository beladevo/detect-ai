describe("Content Script", () => {
  describe("Host normalization", () => {
    const normalizeHostname = (value: string): string | null => {
      const trimmed = value.trim();
      if (!trimmed) return null;
      try {
        const parsed = trimmed.includes("://") ? new URL(trimmed) : new URL(`https://${trimmed}`);
        return parsed.hostname.toLowerCase();
      } catch {
        return trimmed.toLowerCase();
      }
    };

    it("should normalize hostnames correctly", () => {
      expect(normalizeHostname("example.com")).toBe("example.com");
      expect(normalizeHostname("EXAMPLE.COM")).toBe("example.com");
      expect(normalizeHostname("https://example.com/path")).toBe("example.com");
      expect(normalizeHostname("http://sub.example.com")).toBe("sub.example.com");
    });

    it("should handle empty strings", () => {
      expect(normalizeHostname("")).toBeNull();
      expect(normalizeHostname("   ")).toBeNull();
    });

    it("should handle URLs with ports", () => {
      expect(normalizeHostname("localhost:3000")).toBe("localhost");
      expect(normalizeHostname("http://localhost:8080/api")).toBe("localhost");
    });
  });

  describe("Host blocking", () => {
    const isHostBlocked = (host: string, blockedSet: Set<string>): boolean => {
      const normalizeHostname = (value: string): string | null => {
        const trimmed = value.trim();
        if (!trimmed) return null;
        try {
          const parsed = trimmed.includes("://") ? new URL(trimmed) : new URL(`https://${trimmed}`);
          return parsed.hostname.toLowerCase();
        } catch {
          return trimmed.toLowerCase();
        }
      };

      const normalized = normalizeHostname(host);
      if (!normalized) return false;
      const candidate = normalized.startsWith("www.") ? normalized.slice(4) : normalized;
      return blockedSet.has(normalized) || blockedSet.has(candidate);
    };

    it("should detect blocked hosts", () => {
      const blockedSet = new Set(["example.com", "blocked.org"]);

      expect(isHostBlocked("example.com", blockedSet)).toBe(true);
      expect(isHostBlocked("www.example.com", blockedSet)).toBe(true);
      expect(isHostBlocked("blocked.org", blockedSet)).toBe(true);
    });

    it("should allow non-blocked hosts", () => {
      const blockedSet = new Set(["example.com"]);

      expect(isHostBlocked("allowed.com", blockedSet)).toBe(false);
      expect(isHostBlocked("sub.example.com", blockedSet)).toBe(false);
    });
  });

  describe("Tooltip creation", () => {
    type BadgeResponse = {
      score?: number;
      confidence?: number;
      presentation?: string;
      retryAfterSeconds?: number;
    };

    const createTooltip = (response: BadgeResponse, fallback: string): string => {
      const parts: string[] = [];
      if (response.score != null) {
        parts.push(`Score ${Number(response.score).toFixed(2)}`);
      }
      if (response.confidence != null) {
        parts.push(`Confidence ${Number(response.confidence).toFixed(2)}`);
      }
      if (response.presentation) {
        parts.push(response.presentation);
      }
      if (response.retryAfterSeconds) {
        parts.push(`Retry in ${response.retryAfterSeconds}s`);
      }
      return parts.length ? parts.join(" | ") : fallback;
    };

    it("should create tooltip with all fields", () => {
      const response = {
        score: 0.95,
        confidence: 0.88,
        presentation: "High confidence AI detection",
      };

      const tooltip = createTooltip(response, "Imagion verdict");
      expect(tooltip).toContain("Score 0.95");
      expect(tooltip).toContain("Confidence 0.88");
      expect(tooltip).toContain("High confidence AI detection");
    });

    it("should return fallback when no data", () => {
      expect(createTooltip({}, "Imagion verdict")).toBe("Imagion verdict");
    });

    it("should include retry info", () => {
      const tooltip = createTooltip({ retryAfterSeconds: 30 }, "fallback");
      expect(tooltip).toContain("Retry in 30s");
    });
  });
});
