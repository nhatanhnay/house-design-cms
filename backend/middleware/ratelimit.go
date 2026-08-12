package middleware

import (
	"net/http"
	"strconv"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

// visitorBucket theo dõi số lần gọi của một IP trong cửa sổ thời gian hiện tại.
type visitorBucket struct {
	count       int
	windowStart time.Time
}

// RateLimit giới hạn số request mỗi IP trong một cửa sổ thời gian.
//
// Dùng cho các endpoint công khai ghi dữ liệu — đặc biệt là form tư vấn, vốn
// không có token, không captcha, nên bot có thể đổ rác thẳng vào hộp thư quản trị.
//
// Bộ đếm nằm trong bộ nhớ tiến trình: đủ cho một instance backend duy nhất như
// hiện tại. Nếu sau này chạy nhiều instance thì cần chuyển sang Redis.
func RateLimit(limit int, window time.Duration) gin.HandlerFunc {
	var (
		mu       sync.Mutex
		visitors = make(map[string]*visitorBucket)
		lastGC   = time.Now()
	)

	return func(c *gin.Context) {
		ip := c.ClientIP()
		now := time.Now()

		mu.Lock()

		// Dọn định kỳ để map không phình theo số IP đã từng ghé.
		if now.Sub(lastGC) > window*4 {
			for key, bucket := range visitors {
				if now.Sub(bucket.windowStart) > window {
					delete(visitors, key)
				}
			}
			lastGC = now
		}

		bucket, exists := visitors[ip]
		if !exists || now.Sub(bucket.windowStart) > window {
			visitors[ip] = &visitorBucket{count: 1, windowStart: now}
			mu.Unlock()
			c.Next()
			return
		}

		bucket.count++
		exceeded := bucket.count > limit
		retryAfter := int(window.Seconds() - now.Sub(bucket.windowStart).Seconds())
		mu.Unlock()

		if exceeded {
			if retryAfter < 1 {
				retryAfter = 1
			}
			c.Header("Retry-After", strconv.Itoa(retryAfter))
			c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{
				"error": "Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau ít phút.",
			})
			return
		}

		c.Next()
	}
}

// PublicCache gắn Cache-Control cho các endpoint đọc công khai.
//
// Frontend trước đây nối ?_t=<timestamp> vào mọi request đọc để "tránh lỗi cache",
// khiến trình duyệt và CDN không tái sử dụng được gì. Cách đúng là để server nói
// rõ dữ liệu sống được bao lâu.
func PublicCache(maxAge time.Duration, staleWhileRevalidate time.Duration) gin.HandlerFunc {
	value := "public, max-age=" + strconv.Itoa(int(maxAge.Seconds())) +
		", stale-while-revalidate=" + strconv.Itoa(int(staleWhileRevalidate.Seconds()))

	return func(c *gin.Context) {
		// Chỉ đặt cho request đọc; POST/PUT/DELETE không được cache.
		if c.Request.Method == http.MethodGet || c.Request.Method == http.MethodHead {
			c.Header("Cache-Control", value)
		}
		c.Next()
	}
}
