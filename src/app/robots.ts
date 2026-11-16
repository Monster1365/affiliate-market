import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // 관리자·클릭 추적 리다이렉트·API·검색 결과는 크롤링 제외
      disallow: ["/admin", "/go/", "/api/", "/search"],
    },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
