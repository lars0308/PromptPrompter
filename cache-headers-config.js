/**
 * HTTP Cache Headers Configuration
 *
 * Server-side caching headers to work alongside service worker.
 * Configures browser cache, CDN cache, and cache validation.
 *
 * Apply these headers on your web server (Vercel, Nginx, Express, etc.)
 */

/**
 * Cache header recommendations by file type
 * Format: { pattern: RegExp, headers: { 'Cache-Control': value, ... } }
 */
const CACHE_HEADERS_CONFIG = [
  // Static assets - long cache, cache-bust via filename
  {
    pattern: /\.(js|css|woff2|font)$/,
    headers: {
      'Cache-Control': 'public, max-age=31536000, immutable', // 1 year
      'ETag': true, // Enable ETag for validation
    },
    description: 'Static JavaScript and CSS (versioned filenames)',
  },

  // Images - moderate cache with revalidation
  {
    pattern: /\.(png|jpg|jpeg|gif|webp|svg)$/,
    headers: {
      'Cache-Control': 'public, max-age=604800, stale-while-revalidate=2592000', // 7 days, stale for 30 days
      'ETag': true,
    },
    description: 'Images (safe to serve stale)',
  },

  // HTML pages - short cache with revalidation
  {
    pattern: /\.html$|^\/$|\/[^.]*$/,
    headers: {
      'Cache-Control': 'public, max-age=3600, must-revalidate', // 1 hour, must validate after
      'ETag': true,
    },
    description: 'HTML pages (frequently updated)',
  },

  // API responses - no caching by default
  {
    pattern: /^\/api\//,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate', // Always revalidate
      'Pragma': 'no-cache',
      'Expires': '0',
    },
    description: 'API endpoints (no browser caching)',
  },

  // Sensitive API endpoints - never cache
  {
    pattern: /\/(api\/(auth|logs|errors)\/|\.git\/)/,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '-1',
      'X-Frame-Options': 'DENY',
    },
    description: 'Sensitive endpoints (auth, logging)',
  },

  // Fonts - very long cache
  {
    pattern: /\.(woff2?|ttf|eot)$/,
    headers: {
      'Cache-Control': 'public, max-age=31536000, immutable',
      'ETag': true,
    },
    description: 'Web fonts (rarely change)',
  },

  // Service worker - no caching
  {
    pattern: /service-worker|sw\.js/,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Service-Worker-Allowed': '/',
    },
    description: 'Service worker (always check for updates)',
  },
];

/**
 * Express.js middleware implementation
 */
function cacheHeadersMiddleware() {
  return (req, res, next) => {
    const path = req.path;

    for (const config of CACHE_HEADERS_CONFIG) {
      if (config.pattern.test(path)) {
        Object.entries(config.headers).forEach(([key, value]) => {
          if (value === true) {
            // Skip boolean flags (like ETag: true)
            return;
          }
          res.set(key, value);
        });

        console.log(`[CACHE] ${path} -> ${config.description}`);
        break;
      }
    }

    next();
  };
}

/**
 * Vercel vercel.json configuration
 */
const VERCEL_ROUTES_CONFIG = [
  {
    source: '/app.js',
    headers: [
      {
        key: 'Cache-Control',
        value: 'public, max-age=31536000, immutable',
      },
    ],
  },
  {
    source: '/styles.css',
    headers: [
      {
        key: 'Cache-Control',
        value: 'public, max-age=31536000, immutable',
      },
    ],
  },
  {
    source: '/(.*)\\.woff2?$',
    headers: [
      {
        key: 'Cache-Control',
        value: 'public, max-age=31536000, immutable',
      },
    ],
  },
  {
    source: '/(.*)\\.(?:png|jpg|jpeg|gif|webp|svg)$',
    headers: [
      {
        key: 'Cache-Control',
        value: 'public, max-age=604800, stale-while-revalidate=2592000',
      },
    ],
  },
  {
    source: '/api/(.*)',
    headers: [
      {
        key: 'Cache-Control',
        value: 'no-cache, no-store, must-revalidate',
      },
    ],
  },
  {
    source: '/service-worker-caching.js',
    headers: [
      {
        key: 'Cache-Control',
        value: 'no-cache, no-store, must-revalidate',
      },
      {
        key: 'Service-Worker-Allowed',
        value: '/',
      },
    ],
  },
  {
    source: '/:path((?!.*\\.)[^\\.]*)',
    headers: [
      {
        key: 'Cache-Control',
        value: 'public, max-age=3600, must-revalidate',
      },
    ],
  },
];

/**
 * Nginx configuration
 */
const NGINX_CONFIG = `
# Nginx cache configuration

# Static assets - long cache
location ~* \\.(js|css|woff2|ttf|eot|otf)$ {
  expires 365d;
  add_header Cache-Control "public, max-age=31536000, immutable";
  add_header ETag "\\"$file_mtime-$file_size\\"";
}

# Images - moderate cache with stale-while-revalidate
location ~* \\.(png|jpg|jpeg|gif|webp|svg)$ {
  expires 7d;
  add_header Cache-Control "public, max-age=604800, stale-while-revalidate=2592000";
}

# HTML pages - short cache with revalidation
location ~* \\.html?$ {
  expires 1h;
  add_header Cache-Control "public, max-age=3600, must-revalidate";
  add_header ETag "\\"$file_mtime-$file_size\\"";
}

# Service worker - no caching
location ~* (service-worker|sw\\.js)$ {
  expires -1;
  add_header Cache-Control "no-cache, no-store, must-revalidate";
  add_header Pragma "no-cache";
  add_header Expires "0";
  add_header Service-Worker-Allowed "/";
}

# API - no caching
location /api/ {
  expires -1;
  add_header Cache-Control "no-cache, no-store, must-revalidate";
  add_header Pragma "no-cache";
  add_header Expires "0";
}

# Default pages
location / {
  expires 1h;
  add_header Cache-Control "public, max-age=3600, must-revalidate";
  try_files $uri $uri/ /index.html;
}
`;

/**
 * Cache busting strategy
 */
const CACHE_BUSTING_STRATEGY = {
  implementation: 'Filename versioning',
  examples: [
    'app.v1.2.3.js -> app.v1.2.4.js (after deployment)',
    'styles.abc123.css -> styles.xyz789.css (hash-based)',
  ],
  benefits: [
    'Infinite cache without version conflicts',
    'Automatic busting on each deployment',
    'Reduced server load',
    'Faster page loads for repeat visitors',
  ],
  tools: ['Webpack contenthash', 'Parcel named-chunks', 'Rollup output.entryFileNames'],
};

/**
 * Cache statistics
 */
const CACHE_IMPACT_ANALYSIS = {
  scenario: '100 daily users, 10 requests per session',
  metrics: {
    without_caching: {
      requests_per_day: 1000,
      average_response: '100ms',
      bandwidth_per_day: '100MB',
    },
    with_caching: {
      requests_per_day: 400, // 60% reduction
      average_response: '20ms',
      bandwidth_per_day: '40MB',
      cache_hit_rate: '60%',
    },
    improvements: {
      request_reduction: '60%',
      response_time: '80% faster',
      bandwidth_savings: '60%',
      server_load: '60% reduction',
    },
  },
};

/**
 * Print configuration
 */
function printConfiguration() {
  console.log('Cache Headers Configuration');
  console.log('===========================\n');

  console.log('RECOMMENDED HEADERS:');
  CACHE_HEADERS_CONFIG.forEach((config) => {
    console.log(`\n${config.description}`);
    console.log(`  Pattern: ${config.pattern}`);
    Object.entries(config.headers).forEach(([key, value]) => {
      if (value !== true) {
        console.log(`  ${key}: ${value}`);
      }
    });
  });

  console.log('\n\nCACHE IMPACT:');
  console.log(JSON.stringify(CACHE_IMPACT_ANALYSIS, null, 2));
}

export {
  CACHE_HEADERS_CONFIG,
  VERCEL_ROUTES_CONFIG,
  NGINX_CONFIG,
  CACHE_BUSTING_STRATEGY,
  CACHE_IMPACT_ANALYSIS,
  cacheHeadersMiddleware,
  printConfiguration,
};

export default {
  CACHE_HEADERS_CONFIG,
  VERCEL_ROUTES_CONFIG,
  NGINX_CONFIG,
  cacheHeadersMiddleware,
  printConfiguration,
};
