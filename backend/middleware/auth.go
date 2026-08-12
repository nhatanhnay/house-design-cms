package middleware

import (
	"errors"
	"fmt"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

const legacyDefaultSecret = "your-secret-key-change-in-production"

var jwtSecret []byte

// InitJWTSecret đọc JWT_SECRET từ environment.
//
// Phải gọi trong main() SAU config.LoadEnv(): biến package-level được khởi tạo
// trước khi main() chạy, nên không thể đọc .env ở mức khai báo biến.
func InitJWTSecret() error {
	secret := os.Getenv("JWT_SECRET")

	switch {
	case secret == "":
		return errors.New("JWT_SECRET chưa được set - thêm vào backend/.env")
	case secret == legacyDefaultSecret:
		return errors.New("JWT_SECRET vẫn là giá trị mặc định cũ, phải đổi sang giá trị bí mật")
	case len(secret) < 32:
		return fmt.Errorf("JWT_SECRET quá ngắn (%d ký tự), cần ít nhất 32", len(secret))
	}

	jwtSecret = []byte(secret)
	return nil
}

type Claims struct {
	UserID   uint   `json:"user_id"`
	Username string `json:"username"`
	jwt.RegisteredClaims
}

func GenerateToken(userID uint, username string) (string, error) {
	if len(jwtSecret) == 0 {
		return "", errors.New("JWT secret chưa khởi tạo - thiếu gọi InitJWTSecret()")
	}

	claims := &Claims{
		UserID:   userID,
		Username: username,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(jwtSecret)
}

func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header required"})
			c.Abort()
			return
		}

		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		if tokenString == authHeader {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token format"})
			c.Abort()
			return
		}

		claims := &Claims{}
		token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
			if len(jwtSecret) == 0 {
				return nil, errors.New("JWT secret chưa khởi tạo")
			}
			return jwtSecret, nil
		})

		if err != nil || !token.Valid {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
			c.Abort()
			return
		}

		c.Set("user_id", claims.UserID)
		c.Set("admin_id", claims.UserID) // For backward compatibility
		c.Set("username", claims.Username)
		c.Next()
	}
}
