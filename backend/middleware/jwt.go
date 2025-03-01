package middleware

import (
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/labstack/echo/v4"
	"github.com/zaunist/filebox/model"
)

// JWTConfig JWT配置
type JWTConfig struct {
	Secret                 string
	ExpirationHours        int
	RefreshExpirationHours int
}

// JWTClaims JWT声明
type JWTClaims struct {
	UserID  string `json:"user_id"`
	Email   string `json:"email"`
	IsAdmin bool   `json:"is_admin"`
	jwt.RegisteredClaims
}

// GenerateToken 生成JWT令牌
func GenerateToken(user *model.User, config JWTConfig) (string, error) {
	// 设置过期时间
	expirationTime := time.Now().Add(time.Duration(config.ExpirationHours) * time.Hour)

	// 创建声明
	claims := &JWTClaims{
		UserID:  user.ID.String(),
		Email:   user.Email,
		IsAdmin: user.IsAdmin,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
			Issuer:    "filebox",
			Subject:   user.ID.String(),
		},
	}

	// 创建令牌
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	// 签名令牌
	tokenString, err := token.SignedString([]byte(config.Secret))
	if err != nil {
		return "", err
	}

	return tokenString, nil
}

// GenerateRefreshToken 生成刷新令牌
func GenerateRefreshToken(user *model.User, config JWTConfig) (string, error) {
	// 设置过期时间（通常比访问令牌长）
	expirationTime := time.Now().Add(time.Duration(config.RefreshExpirationHours) * time.Hour)

	// 创建声明
	claims := &JWTClaims{
		UserID:  user.ID.String(),
		Email:   user.Email,
		IsAdmin: user.IsAdmin,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
			Issuer:    "filebox",
			Subject:   user.ID.String(),
		},
	}

	// 创建令牌
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	// 签名令牌
	tokenString, err := token.SignedString([]byte(config.Secret))
	if err != nil {
		return "", err
	}

	return tokenString, nil
}

// ParseToken 解析JWT令牌
func ParseToken(tokenString string, secret string) (*jwt.Token, error) {
	// 解析令牌
	token, err := jwt.ParseWithClaims(tokenString, &JWTClaims{}, func(token *jwt.Token) (interface{}, error) {
		// 验证签名方法
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(secret), nil
	})

	if err != nil {
		return nil, err
	}

	return token, nil
}

// JWTMiddleware 创建JWT中间件
func JWTMiddleware(config JWTConfig) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			// 从请求头获取令牌
			authHeader := c.Request().Header.Get("Authorization")
			if authHeader == "" {
				return echo.NewHTTPError(http.StatusUnauthorized, "缺少Authorization头")
			}

			// 检查Bearer前缀
			parts := strings.Split(authHeader, " ")
			if len(parts) != 2 || parts[0] != "Bearer" {
				return echo.NewHTTPError(http.StatusUnauthorized, "无效的Authorization格式")
			}

			tokenString := parts[1]

			// 解析令牌
			token, err := ParseToken(tokenString, config.Secret)
			if err != nil {
				return echo.NewHTTPError(http.StatusUnauthorized, "无效的令牌")
			}

			// 验证令牌
			if !token.Valid {
				return echo.NewHTTPError(http.StatusUnauthorized, "令牌已过期或无效")
			}

			// 获取声明
			claims, ok := token.Claims.(*JWTClaims)
			if !ok {
				return echo.NewHTTPError(http.StatusUnauthorized, "无效的令牌声明")
			}

			// 将用户信息存储在上下文中
			c.Set("user_id", claims.UserID)
			c.Set("email", claims.Email)
			c.Set("is_admin", claims.IsAdmin)

			return next(c)
		}
	}
}

// AdminMiddleware 创建管理员中间件
func AdminMiddleware() echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			// 从上下文获取管理员标志
			isAdmin, ok := c.Get("is_admin").(bool)
			if !ok || !isAdmin {
				return echo.NewHTTPError(http.StatusForbidden, "需要管理员权限")
			}

			return next(c)
		}
	}
}
