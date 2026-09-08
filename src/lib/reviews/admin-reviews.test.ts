import { describe, expect, it } from "vitest";
import {
  enrichReviewsForAdmin,
  filterAdminReviews,
  stubCategories,
  stubSentiment,
} from "./admin-reviews";
import type { Testimonial } from "./types";

const sample: Testimonial = {
  id: "1",
  text: "Excelente ubicación y muy limpio, lo recomiendo.",
  image: "",
  name: "Ana",
  starRating: 5,
  source: "google",
  reviewDate: "2026-01-01",
};

describe("admin reviews", () => {
  it("sentiment y categorías stub", () => {
    expect(stubSentiment(sample.text, 5)).toBe("positive");
    expect(stubCategories(sample.text)).toEqual(
      expect.arrayContaining(["location", "cleanliness"]),
    );
  });

  it("filtra por sentiment", () => {
    const rows = enrichReviewsForAdmin([
      sample,
      {
        ...sample,
        id: "2",
        text: "Había ruido y estaba sucio.",
        starRating: 1,
        name: "Bob",
      },
    ]);
    const neg = filterAdminReviews(rows, { sentiment: "negative" });
    expect(neg).toHaveLength(1);
    expect(neg[0]?.name).toBe("Bob");
  });
});
