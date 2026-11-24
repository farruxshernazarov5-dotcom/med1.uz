import { describe, it, expect } from "vitest";
import { getEmbedUrl, getInstagramEmbedUrl, isVerticalVideo } from "./mediaLinks";

describe("Instagram public video embeds", () => {
  it("embeds a reel without tracking parameters", () => {
    expect(getEmbedUrl("https://www.instagram.com/reel/ABC_123-/?igsh=tracking")).toBe("https://www.instagram.com/reel/ABC_123-/embed/");
    expect(isVerticalVideo("https://instagram.com/reel/ABC_123/")).toBe(true);
  });
  it("normalizes the shared reels path", () => {
    expect(getInstagramEmbedUrl("https://instagram.com/reels/ABC123/")).toBe("https://www.instagram.com/reel/ABC123/embed/");
  });
  it("rejects lookalike hosts and non-HTTPS links", () => {
    expect(getInstagramEmbedUrl("https://instagram.com.evil.test/reel/ABC123/")).toBeNull();
    expect(getInstagramEmbedUrl("http://instagram.com/reel/ABC123/")).toBeNull();
    expect(getInstagramEmbedUrl("https://instagram.com/username/")).toBeNull();
  });
  it("retains YouTube and Vimeo support", () => {
    expect(getEmbedUrl("https://youtu.be/ABC123")).toBe("https://www.youtube.com/embed/ABC123");
    expect(getEmbedUrl("https://vimeo.com/123456")).toBe("https://player.vimeo.com/video/123456");
  });
});