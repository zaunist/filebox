package api

import (
	"net/http"
	"strconv"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
	"github.com/zaunist/filebox/service"
)

// ShareHandler 分享处理程序
type ShareHandler struct {
	ShareService *service.ShareService
	FileService  *service.FileService
}

// CreateShare 创建分享
func (h *ShareHandler) CreateShare(c echo.Context) error {
	userIDStr := c.Get("user_id").(string)
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "无效的用户ID")
	}

	fileID := c.Param("id")

	// 获取参数
	var req struct {
		Code          string `json:"code"`
		ExpiresIn     int    `json:"expires_in"`
		DownloadLimit int    `json:"download_limit"`
	}
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "无效的请求数据")
	}

	// 创建分享请求
	createReq := service.CreateShareRequest{
		FileID:        fileID,
		Code:          req.Code,
		ExpiresIn:     req.ExpiresIn,
		DownloadLimit: req.DownloadLimit,
	}

	// 创建分享
	share, err := h.ShareService.CreateShare(createReq, &userID)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	return c.JSON(http.StatusCreated, share)
}

// GetShares 获取用户的分享列表
func (h *ShareHandler) GetShares(c echo.Context) error {
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

	// 获取分享列表
	shares, total, err := h.ShareService.GetUserShares(userID, page, limit)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"shares": shares,
		"total":  total,
		"page":   page,
		"limit":  limit,
	})
}

// GetShareByCode 通过分享码获取分享信息
func (h *ShareHandler) GetShareByCode(c echo.Context) error {
	code := c.Param("code")

	// 获取分享信息
	share, file, err := h.ShareService.GetShareByCode(code)
	if err != nil {
		return echo.NewHTTPError(http.StatusNotFound, err.Error())
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"share": share,
		"file": map[string]interface{}{
			"id":           file.ID.String(),
			"name":         file.Name,
			"size":         file.Size,
			"content_type": file.ContentType,
			"created_at":   file.CreatedAt,
		},
	})
}

// DownloadSharedFile 下载分享的文件
func (h *ShareHandler) DownloadSharedFile(c echo.Context) error {
	code := c.Param("code")

	// 获取分享信息
	share, file, err := h.ShareService.GetShareByCode(code)
	if err != nil {
		return echo.NewHTTPError(http.StatusNotFound, err.Error())
	}

	// 获取文件内容
	fileData, err := h.FileService.GetFileContent(file)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}
	defer fileData.Close()

	// 增加下载次数
	if err := h.ShareService.IncrementDownloadCount(share.ID); err != nil {
		// 只记录错误，不影响下载
		c.Logger().Error(err)
	}

	// 设置响应头
	c.Response().Header().Set(echo.HeaderContentDisposition, "attachment; filename="+file.Name)
	c.Response().Header().Set(echo.HeaderContentType, file.ContentType)
	c.Response().Header().Set(echo.HeaderContentLength, strconv.FormatInt(file.Size, 10))

	// 发送文件
	return c.Stream(http.StatusOK, file.ContentType, fileData)
}

// DeleteShare 删除分享
func (h *ShareHandler) DeleteShare(c echo.Context) error {
	userIDStr := c.Get("user_id").(string)
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "无效的用户ID")
	}

	shareID := c.Param("id")

	// 删除分享
	err = h.ShareService.DeleteShare(shareID, &userID)
	if err != nil {
		return echo.NewHTTPError(http.StatusNotFound, err.Error())
	}

	return c.NoContent(http.StatusNoContent)
}

// RegisterRoutes 注册路由
func (h *ShareHandler) RegisterRoutes(e *echo.Echo, jwtMiddleware echo.MiddlewareFunc) {
	// 公开路由
	e.GET("/api/shares/:code", h.GetShareByCode)
	e.GET("/api/shares/:code/download", h.DownloadSharedFile)

	// 需要认证的路由
	shareGroup := e.Group("/api/files/:id/share")
	shareGroup.Use(jwtMiddleware)
	shareGroup.POST("", h.CreateShare)

	userShareGroup := e.Group("/api/shares")
	userShareGroup.Use(jwtMiddleware)
	userShareGroup.GET("", h.GetShares)
	userShareGroup.DELETE("/:id", h.DeleteShare)
}
