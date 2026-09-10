import { describe, expect, it } from "vitest";
import { sortPostsNewestFirst } from "@/lib/instagram/store";
import type { InstagramFeedPost } from "@/lib/instagram/types";

describe("instagram feed sort", () => {
  it("ordena más reciente primero", () => {
    const posts: InstagramFeedPost[] = [
      {
        id: "a",
        url: "https://instagram.com/p/a",
        thumbnailUrl: "/a.webp",
        isVideo: false,
        caption: "",
        publishedAt: "2025-01-01T00:00:00.000Z",
      },
      {
        id: "b",
        url: "https://instagram.com/p/b",
        thumbnailUrl: "/b.webp",
        isVideo: true,
        caption: "",
        publishedAt: "2026-01-01T00:00:00.000Z",
      },
    ];
    expect(sortPostsNewestFirst(posts).map((p) => p.id)).toEqual(["b", "a"]);
  });
});
