package config

import (
	"os"
	"strconv"
	"time"
)

// AppConfig 应用配置
type AppConfig struct {
	Port                 int
	JWTSecret            string
	JWTExpirationHours   int
	StoragePath          string
	MaxFileSize          int64
	MaxAnonymousFileSize int64
	DefaultExpireHours   int
	DefaultDownloadLimit int
	AdminEmail           string
	AdminPassword        string
}

// NewAppConfig 创建应用配置
func NewAppConfig() *AppConfig {
	return &AppConfig{
		Port:                 getEnvAsInt("PORT", 8080),
		JWTSecret:            getEnv("JWT_SECRET", "your-secret-key-change-in-production"),
		JWTExpirationHours:   getEnvAsInt("JWT_EXPIRATION_HOURS", 24),
		StoragePath:          getEnv("STORAGE_PATH", "./storage"),
		MaxFileSize:          getEnvAsInt64("MAX_FILE_SIZE", 100*1024*1024),          // 100MB
		MaxAnonymousFileSize: getEnvAsInt64("MAX_ANONYMOUS_FILE_SIZE", 50*1024*1024), // 50MB
		DefaultExpireHours:   getEnvAsInt("DEFAULT_EXPIRE_HOURS", 1),
		DefaultDownloadLimit: getEnvAsInt("DEFAULT_DOWNLOAD_LIMIT", 0),
		AdminEmail:           getEnv("ADMIN_EMAIL", "admin@zaunist.com"),
		AdminPassword:        getEnv("ADMIN_PASSWORD", "box123"),
	}
}

// GetDefaultExpiration 获取默认过期时间
func (c *AppConfig) GetDefaultExpiration() time.Time {
	return time.Now().Add(time.Duration(c.DefaultExpireHours) * time.Hour)
}

// 获取环境变量，如果不存在则返回默认值
func getEnv(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}

// 获取环境变量并转换为整数
func getEnvAsInt(key string, defaultValue int) int {
	valueStr := getEnv(key, "")
	if valueStr == "" {
		return defaultValue
	}
	value, err := strconv.Atoi(valueStr)
	if err != nil {
		return defaultValue
	}
	return value
}

// 获取环境变量并转换为int64
func getEnvAsInt64(key string, defaultValue int64) int64 {
	valueStr := getEnv(key, "")
	if valueStr == "" {
		return defaultValue
	}
	value, err := strconv.ParseInt(valueStr, 10, 64)
	if err != nil {
		return defaultValue
	}
	return value
}
