package api

import (
	"net/http"
	"strconv"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
	"github.com/zaunist/filebox/backend/service"
)

// FileHandler 文件处理程序
type FileHandler struct {
	FileService  *service.FileService
	ShareService *service.ShareService
}

// UploadFile 上传文件
func (h *FileHandler) UploadFile(c echo.Context) error {
	userIDStr := c.Get("user_id").(string)
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "无效的用户ID")
	}

	// 获取文件
	file, err := c.FormFile("file")
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "无效的文件")
	}

	// 上传文件
	fileInfo, err := h.FileService.UploadFile(file, &userID)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	return c.JSON(http.StatusCreated, fileInfo)
}

// UploadAnonymousFile 匿名上传文件并直接分享
func (h *FileHandler) UploadAnonymousFile(c echo.Context) error {
	// 获取文件
	file, err := c.FormFile("file")
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "无效的文件")
	}

	// 匿名上传文件（不关联用户ID）
	fileInfo, err := h.FileService.UploadFile(file, nil)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	// 获取分享参数
	code := c.FormValue("code")
	expiresIn, _ := strconv.Atoi(c.FormValue("expires_in"))
	downloadLimit, _ := strconv.Atoi(c.FormValue("download_limit"))

	// 创建分享请求
	createReq := service.CreateShareRequest{
		FileID:        fileInfo.ID,
		Code:          code,
		ExpiresIn:     expiresIn,
		DownloadLimit: downloadLimit,
	}

	// 创建分享（不关联用户ID）
	share, err := h.ShareService.CreateShare(createReq, nil)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	return c.JSON(http.StatusCreated, share)
}

// GetFiles 获取用户文件列表
func (h *FileHandler) GetFiles(c echo.Context) error {
	userID := c.Get("user_id").(string)

	// 获取分页参数
	page, _ := strconv.Atoi(c.QueryParam("page"))
	if page <= 0 {
		page = 1
	}

	limit, _ := strconv.Atoi(c.QueryParam("limit"))
	if limit <= 0 || limit > 100 {
		limit = 10
	}

	// 获取文件列表
	files, total, err := h.FileService.GetUserFiles(userID, page, limit)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"files": files,
		"total": total,
		"page":  page,
		"limit": limit,
	})
}

// GetFile 获取文件信息
func (h *FileHandler) GetFile(c echo.Context) error {
	userID := c.Get("user_id").(string)
	fileID := c.Param("id")

	// 获取文件信息
	file, err := h.FileService.GetFileByID(fileID)
	if err != nil {
		return echo.NewHTTPError(http.StatusNotFound, err.Error())
	}

	// 检查权限
	if file.UserID != nil {
		userUUID, err := uuid.Parse(userID)
		if err != nil {
			return echo.NewHTTPError(http.StatusBadRequest, "无效的用户ID")
		}

		if *file.UserID != userUUID {
			return echo.NewHTTPError(http.StatusForbidden, "无权访问此文件")
		}
	}

	return c.JSON(http.StatusOK, file)
}

// DownloadFile 下载文件
func (h *FileHandler) DownloadFile(c echo.Context) error {
	userID := c.Get("user_id").(string)
	fileID := c.Param("id")

	// 获取文件信息
	file, err := h.FileService.GetFileByID(fileID)
	if err != nil {
		return echo.NewHTTPError(http.StatusNotFound, err.Error())
	}

	// 检查权限
	if file.UserID != nil {
		userUUID, err := uuid.Parse(userID)
		if err != nil {
			return echo.NewHTTPError(http.StatusBadRequest, "无效的用户ID")
		}

		if *file.UserID != userUUID {
			return echo.NewHTTPError(http.StatusForbidden, "无权访问此文件")
		}
	}

	// 获取文件内容
	fileData, err := h.FileService.GetFileContent(file)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}
	defer fileData.Close()

	// 设置响应头
	c.Response().Header().Set(echo.HeaderContentDisposition, "attachment; filename="+file.Name)
	c.Response().Header().Set(echo.HeaderContentType, file.ContentType)
	c.Response().Header().Set(echo.HeaderContentLength, strconv.FormatInt(file.Size, 10))

	// 发送文件
	return c.Stream(http.StatusOK, file.ContentType, fileData)
}

// DeleteFile 删除文件
func (h *FileHandler) DeleteFile(c echo.Context) error {
	userIDStr := c.Get("user_id").(string)
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "无效的用户ID")
	}

	fileID := c.Param("id")

	// 删除文件
	err = h.FileService.DeleteFile(fileID, &userID)
	if err != nil {
		return echo.NewHTTPError(http.StatusNotFound, err.Error())
	}

	return c.NoContent(http.StatusNoContent)
}

// RegisterRoutes 注册路由
func (h *FileHandler) RegisterRoutes(e *echo.Echo, jwtMiddleware echo.MiddlewareFunc) {
	// 公开路由 - 匿名上传
	e.POST("/api/files/anonymous", h.UploadAnonymousFile)

	// 需要认证的路由
	fileGroup := e.Group("/api/files")
	fileGroup.Use(jwtMiddleware)
	fileGroup.POST("", h.UploadFile)
	fileGroup.GET("", h.GetFiles)
	fileGroup.GET("/:id", h.GetFile)
	fileGroup.GET("/:id/download", h.DownloadFile)
	fileGroup.DELETE("/:id", h.DeleteFile)
}
