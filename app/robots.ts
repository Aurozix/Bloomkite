import type { MetadataRoute } from 'next'

import { SITE_URL } from '@/lib/seo'

// robots.txt (BRD §13). Allow indexing of public marketing + content pages;
// disallow everything that's behind auth or operationally private.
//
// /api  - server endpoints; nothing useful for crawlers
// /auth - sign-in / sign-up flows
// /admin - admin operations
// /settings, /plans, /advisor/inbox - signed-in private surfaces
//
// /support is allowed since the form helps SEO for "bloomkite contact".

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/auth/',
          '/admin/',
          '/settings',
          '/plans',
          '/plans/',
          '/advisor/',
          '/profile',
          '/profile/',
          '/dashboard',
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
