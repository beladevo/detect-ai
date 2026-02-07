import {
  normalizeImageUrl,
  normalizeHostname,
  isHostBlocked,
  isExcludedDomain,
  extractFileName,
  buildRequestKey,
  maskApiKey,
  formatLimit,
  parseRetryAfter,
} from "../shared/utils";

describe("Utility Functions", () => {
  describe("normalizeImageUrl", () => {
    it("should normalize relative URLs correctly", () => {
      expect(normalizeImageUrl("/images/test.jpg", "https://example.com/page")).toBe(
        "https://example.com/images/test.jpg"
      );
      expect(normalizeImageUrl("test.jpg", "https://example.com/path/page")).toBe(
        "https://example.com/path/test.jpg"
      );
      expect(normalizeImageUrl("https://cdn.example.com/img.png", "https://example.com")).toBe(
        "https://cdn.example.com/img.png"
      );
    });

    it("should return null for invalid URLs", () => {
      expect(normalizeImageUrl("", "https://example.com")).toBeNull();
      expect(normalizeImageUrl("not a url", "")).toBeNull();
    });

    it("should handle data URLs", () => {
      const dataUrl = "data:image/png;base64,iVBORw0KG";
      expect(normalizeImageUrl(dataUrl, "https://example.com")).toBe(dataUrl);
    });
  });

  describe("normalizeHostname", () => {
    it("should extract hostname from URLs", () => {
      expect(normalizeHostname("https://example.com/path")).toBe("example.com");
      expect(normalizeHostname("http://www.example.com")).toBe("www.example.com");
      expect(normalizeHostname("example.com")).toBe("example.com");
    });

    it("should return null for empty input", () => {
      expect(normalizeHostname("")).toBeNull();
      expect(normalizeHostname("   ")).toBeNull();
    });

    it("should handle subdomains", () => {
      expect(normalizeHostname("https://api.example.com")).toBe("api.example.com");
    });
  });

  describe("isHostBlocked", () => {
    it("should detect blocked hosts", () => {
      const blockedSet = new Set(["example.com", "test.org"]);
      expect(isHostBlocked("example.com", blockedSet)).toBe(true);
      expect(isHostBlocked("test.org", blockedSet)).toBe(true);
      expect(isHostBlocked("www.example.com", blockedSet)).toBe(true);
      expect(isHostBlocked("other.com", blockedSet)).toBe(false);
    });

    it("should handle www prefix", () => {
      const blockedSet = new Set(["www.example.com"]);
      expect(isHostBlocked("example.com", blockedSet)).toBe(true);
      expect(isHostBlocked("www.example.com", blockedSet)).toBe(true);
    });
  });

  describe("isExcludedDomain", () => {
    const excludedDomains = ["localhost", "127.0.0.1", "imagion.ai"];

    it("should detect exact matches", () => {
      expect(isExcludedDomain("localhost", excludedDomains)).toBe(true);
      expect(isExcludedDomain("127.0.0.1", excludedDomains)).toBe(true);
      expect(isExcludedDomain("imagion.ai", excludedDomains)).toBe(true);
    });

    it("should detect subdomain matches", () => {
      expect(isExcludedDomain("www.imagion.ai", excludedDomains)).toBe(true);
      expect(isExcludedDomain("app.imagion.ai", excludedDomains)).toBe(true);
    });

    it("should not match unrelated domains", () => {
      expect(isExcludedDomain("example.com", excludedDomains)).toBe(false);
      expect(isExcludedDomain("notimagion.ai", excludedDomains)).toBe(false);
    });
  });

  describe("extractFileName", () => {
    it("should extract filename from URL", () => {
      expect(extractFileName("https://example.com/images/test.jpg")).toBe("test.jpg");
      expect(extractFileName("https://cdn.example.com/path/to/image.png")).toBe("image.png");
    });

    it("should return default for invalid URLs", () => {
      expect(extractFileName("https://example.com/")).toBe("imagion-image.jpg");
      expect(extractFileName("not a url")).toBe("imagion-image.jpg");
    });
  });

  describe("buildRequestKey", () => {
    it("should build request keys correctly", () => {
      expect(buildRequestKey("https://example.com/img.jpg", "api")).toBe(
        "api:https://example.com/img.jpg"
      );
      expect(buildRequestKey("https://example.com/img.jpg", "local")).toBe(
        "local:https://example.com/img.jpg"
      );
    });
  });

  describe("maskApiKey", () => {
    it("should mask long API keys", () => {
      const key = "imag_1234567890abcdefghijklmnopqrstuvwxyz";
      const masked = maskApiKey(key);
      expect(masked).toContain("imag_1234567");
      expect(masked).toContain("...");
      expect(masked).toContain("wxyz");
      expect(masked.length).toBeLessThan(key.length);
    });

    it("should not mask short keys", () => {
      const key = "short";
      expect(maskApiKey(key)).toBe(key);
    });
  });

  describe("formatLimit", () => {
    it("should format numeric limits", () => {
      expect(formatLimit(100)).toBe("100");
      expect(formatLimit(1000)).toContain("1");
      expect(formatLimit(0)).toBe("0");
    });

    it("should return infinity symbol for null/undefined", () => {
      expect(formatLimit(null)).toBe("∞");
      expect(formatLimit(undefined)).toBe("∞");
    });
  });

  describe("parseRetryAfter", () => {
    it("should parse numeric retry-after headers", () => {
      expect(parseRetryAfter("60", 15000)).toBe(60);
      expect(parseRetryAfter("120", 15000)).toBe(120);
    });

    it("should return fallback for invalid headers", () => {
      expect(parseRetryAfter(null, 15000)).toBe(15);
      expect(parseRetryAfter("invalid", 15000)).toBe(15);
      expect(parseRetryAfter("", 15000)).toBe(15);
    });
  });
});
