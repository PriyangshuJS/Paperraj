import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const now = new Date();
  const routes: { path: string; priority: number; changeFrequency: "daily" | "weekly" | "monthly" }[] =
    [
      { path: "/", priority: 1, changeFrequency: "daily" },
      { path: "/papers", priority: 0.9, changeFrequency: "daily" },
      { path: "/year-papers", priority: 0.8, changeFrequency: "weekly" },
      { path: "/specimen-papers", priority: 0.8, changeFrequency: "weekly" },
      { path: "/subjects", priority: 0.7, changeFrequency: "weekly" },
      { path: "/classes", priority: 0.7, changeFrequency: "weekly" },
      { path: "/boards", priority: 0.7, changeFrequency: "weekly" },
      { path: "/upload", priority: 0.6, changeFrequency: "monthly" },
      { path: "/teachers", priority: 0.5, changeFrequency: "monthly" },
      { path: "/statistics", priority: 0.5, changeFrequency: "daily" },
      { path: "/about", priority: 0.5, changeFrequency: "monthly" },
      { path: "/contact", priority: 0.5, changeFrequency: "monthly" },
      { path: "/privacy", priority: 0.3, changeFrequency: "monthly" },
      { path: "/terms", priority: 0.3, changeFrequency: "monthly" },
    ];

  return routes.map((route) => ({
    url: `${siteUrl}${route.path}`,
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
