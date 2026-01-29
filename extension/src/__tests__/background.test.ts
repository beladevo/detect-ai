import { chromeMock } from "../../jest.setup";

describe("Background Service Worker", () => {
  beforeEach(() => {
    jest.resetModules();
  });

  describe("URL normalization", () => {
    it("should normalize relative URLs correctly", () => {
      const normalizeImageUrl = (imageUrl: string, pageUrl: string): string | null => {
        if (!imageUrl) return null;
        try {
          return new URL(imageUrl, pageUrl || undefined).toString();
        } catch {
          return null;
        }
      };

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
      const normalizeImageUrl = (imageUrl: string, _pageUrl: string): string | null => {
        if (!imageUrl) return null;
        try {
          return new URL(imageUrl).toString();
        } catch {
          return null;
        }
      };

      expect(normalizeImageUrl("", "https://example.com")).toBeNull();
    });
  });

  describe("Chrome storage integration", () => {
    it("should call chrome.storage.local.get with defaults", async () => {
      const defaults = {
        imagionApiKey: "",
        imagionDetectionEndpoint: "http://localhost:3000/api/detect",
      };

      chromeMock.storage.local.get.mockImplementation((keys, callback) => {
        callback({ ...defaults });
      });

      await new Promise<void>((resolve) => {
        chrome.storage.local.get(defaults, (items) => {
          expect(items.imagionApiKey).toBe("");
          expect(items.imagionDetectionEndpoint).toBe("http://localhost:3000/api/detect");
          resolve();
        });
      });

      expect(chromeMock.storage.local.get).toHaveBeenCalledWith(defaults, expect.any(Function));
    });
  });

  describe("File name extraction", () => {
    it("should extract filename from URL", () => {
      const extractFileName = (url: string): string => {
        try {
          const parsed = new URL(url);
          const pieces = parsed.pathname.split("/").filter(Boolean);
          const lastSegment = pieces[pieces.length - 1];
          return lastSegment || "imagion-image.jpg";
        } catch {
          return "imagion-image.jpg";
        }
      };

      expect(extractFileName("https://example.com/images/photo.png")).toBe("photo.png");
      expect(extractFileName("https://example.com/path/to/image.jpg")).toBe("image.jpg");
      expect(extractFileName("https://example.com/")).toBe("imagion-image.jpg");
    });
  });
});
