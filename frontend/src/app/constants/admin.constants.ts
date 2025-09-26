export const ADMIN_CONSTANTS = {
  // Snackbar durations
  SNACKBAR_DURATION: {
    SHORT: 2000,
    MEDIUM: 3000,
    LONG: 5000
  },

  // Dialog widths
  DIALOG_WIDTH: {
    CATEGORY: '600px',
    POST: '800px'
  },

  // File upload constraints
  FILE_UPLOAD: {
    MAX_SIZE_MB: 5,
    MAX_SIZE_BYTES: 5 * 1024 * 1024,
    SUPPORTED_IMAGE_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    SUPPORTED_VIDEO_TYPES: ['video/mp4', 'video/webm', 'video/ogg']
  },

  // Category icon mapping
  CATEGORY_ICONS: {
    'gioi-thieu': 'info',
    'du-an-thiet-ke': 'architecture',
    'cong-trinh-thuc-te': 'business',
    'dich-vu': 'handyman',
    'tin-tuc': 'newspaper',
    'tuyen-dung': 'work',
    'lien-he': 'contact_page',
    'biet-thu-hien-dai': 'home',
    'nha-pho-hien-dai': 'apartment',
    'van-phong': 'business_center',
    'biet-thu': 'villa',
    'nha-pho': 'home_work',
    'thiet-ke': 'draw',
    'thi-cong': 'construction',
    'tu-van': 'support_agent',
    'default': 'category'
  },

  // URL patterns for conversion
  URL_PATTERNS: {
    LOCALHOST: 'http://localhost:8080/',
    HTTPS_BACKEND: /https:\/\/[^\/]+:8080\//,
    HTTP_BACKEND: /http:\/\/[^\/]+:8080\//
  },

  // Admin sections
  SECTIONS: {
    CATEGORIES: 'categories',
    POSTS: 'posts',
    MEDIA: 'media',
    HOMEPAGE: 'homepage',
    FOOTER: 'footer'
  },

  // Table columns
  POST_COLUMNS: ['id', 'title', 'category', 'published', 'views', 'created_at', 'actions']
} as const;