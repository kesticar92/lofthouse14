export type InstagramFeedPost = {
  id: string;
  url: string;
  thumbnailUrl: string;
  isVideo: boolean;
  caption: string;
  publishedAt?: string;
};

export type InstagramFeedSource = "graph" | "store" | "seed";

export type InstagramFeedResult = {
  posts: InstagramFeedPost[];
  source: InstagramFeedSource;
  syncedAt: string | null;
  profileUrl: string;
  graphConfigured: boolean;
};
