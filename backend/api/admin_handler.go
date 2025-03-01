package api

import (
	"net/http"

	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

// AdminHandler 管理员处理程序
type AdminHandler struct {
	DB *gorm.DB
}

// GetStats 获取系统统计信息
func (h *AdminHandler) GetStats(c echo.Context) error {
	var userCount int64
	var fileCount int64
	var shareCount int64

	h.DB.Table("users").Count(&userCount)
	h.DB.Table("files").Count(&fileCount)
	h.DB.Table("shares").Count(&shareCount)

	return c.JSON(http.StatusOK, map[string]interface{}{
		"user_count":  userCount,
		"file_count":  fileCount,
		"share_count": shareCount,
	})
}

// RegisterRoutes 注册路由
func (h *AdminHandler) RegisterRoutes(e *echo.Echo, jwtMiddleware, adminMiddleware echo.MiddlewareFunc) {
	// 需要管理员权限的路由
	adminGroup := e.Group("/api/admin")
	adminGroup.Use(jwtMiddleware)
	adminGroup.Use(adminMiddleware)
	
	adminGroup.GET("/stats", h.GetStats)
} 