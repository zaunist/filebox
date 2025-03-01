package api

import (
	"net/http"

	"github.com/filebox/backend/service"
	"github.com/labstack/echo/v4"
)

// UserHandler 用户处理程序
type UserHandler struct {
	UserService *service.UserService
}

// Register 用户注册
func (h *UserHandler) Register(c echo.Context) error {
	var req service.RegisterRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "无效的请求数据")
	}

	_, err := h.UserService.Register(req)
	if err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	// 注册成功后，自动登录用户
	loginReq := service.LoginRequest{
		Email:    req.Email,
		Password: req.Password,
	}
	token, err := h.UserService.Login(loginReq)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "注册成功但自动登录失败")
	}

	return c.JSON(http.StatusCreated, token)
}

// Login 用户登录
func (h *UserHandler) Login(c echo.Context) error {
	var req service.LoginRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "无效的请求数据")
	}

	token, err := h.UserService.Login(req)
	if err != nil {
		return echo.NewHTTPError(http.StatusUnauthorized, err.Error())
	}

	return c.JSON(http.StatusOK, token)
}

// RefreshToken 刷新令牌
func (h *UserHandler) RefreshToken(c echo.Context) error {
	var req struct {
		RefreshToken string `json:"refresh_token"`
	}
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "无效的请求数据")
	}

	token, err := h.UserService.RefreshToken(req.RefreshToken)
	if err != nil {
		return echo.NewHTTPError(http.StatusUnauthorized, err.Error())
	}

	return c.JSON(http.StatusOK, token)
}

// GetMe 获取当前用户信息
func (h *UserHandler) GetMe(c echo.Context) error {
	userID := c.Get("user_id").(string)
	user, err := h.UserService.GetUserByID(userID)
	if err != nil {
		return echo.NewHTTPError(http.StatusNotFound, err.Error())
	}

	return c.JSON(http.StatusOK, user)
}

// RegisterRoutes 注册路由
func (h *UserHandler) RegisterRoutes(e *echo.Echo, jwtMiddleware echo.MiddlewareFunc) {
	// 公开路由
	e.POST("/api/auth/register", h.Register)
	e.POST("/api/auth/login", h.Login)
	e.POST("/api/auth/refresh", h.RefreshToken)

	// 需要认证的路由
	authGroup := e.Group("/api/auth")
	authGroup.Use(jwtMiddleware)
	authGroup.GET("/me", h.GetMe)
}
