package utils

import (
	"crypto/rand"
	"encoding/base64"
	"regexp"
	"strings"
)

// GenerateRandomCode 生成随机分享码
func GenerateRandomCode(length int) (string, error) {
	if length <= 0 {
		length = 8 // 默认长度
	}
	
	// 生成随机字节
	b := make([]byte, length*2) // 生成更多字节以确保有足够的字符
	_, err := rand.Read(b)
	if err != nil {
		return "", err
	}
	
	// 转换为base64
	s := base64.URLEncoding.EncodeToString(b)
	
	// 移除特殊字符并截取所需长度
	s = strings.ReplaceAll(s, "-", "")
	s = strings.ReplaceAll(s, "_", "")
	s = strings.ReplaceAll(s, "=", "")
	
	if len(s) > length {
		s = s[:length]
	}
	
	return s, nil
}

// IsValidCode 验证分享码格式
func IsValidCode(code string) bool {
	// 检查长度
	if len(code) < 6 || len(code) > 16 {
		return false
	}
	
	// 检查格式（只允许字母和数字）
	match, _ := regexp.MatchString("^[a-zA-Z0-9]+$", code)
	return match
} 