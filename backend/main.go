package main

import (
	"fmt"
	"log"
	"time"

	"github.com/filebox/backend/api"
	"github.com/filebox/backend/config"
	"github.com/filebox/backend/middleware"
	"github.com/filebox/backend/model"
	"github.com/filebox/backend/service"
	"github.com/filebox/backend/storage"
	"github.com/labstack/echo/v4"
	echomiddleware "github.com/labstack/echo/v4/middleware"
)

func main() {
	// 初始化配置
	appConfig := config.NewAppConfig()

	// 初始化数据库
	db := config.NewDatabase()

	// 检查并添加username字段
	if !db.DB.Migrator().HasColumn(&model.User{}, "username") {
		err := db.DB.Migrator().AddColumn(&model.User{}, "username")
		if err != nil {
			log.Fatalf("添加username字段失败: %v", err)
		}
		// 为现有用户设置默认用户名
		db.DB.Exec("UPDATE users SET username = email WHERE username IS NULL OR username = ''")
	}

	// 初始化存储
	localStorage, err := storage.NewLocalStorage(appConfig.StoragePath)
	if err != nil {
		log.Fatalf("初始化存储失败: %v", err)
	}

	// 初始化JWT配置
	jwtConfig := middleware.JWTConfig{
		Secret:                 appConfig.JWTSecret,
		ExpirationHours:        appConfig.JWTExpirationHours,
		RefreshExpirationHours: appConfig.JWTExpirationHours * 24, // 刷新令牌有效期为访问令牌的24倍
	}

	// 初始化服务
	userService := &service.UserService{
		DB:        db.DB,
		JWTConfig: jwtConfig,
	}

	fileService := &service.FileService{
		DB:        db.DB,
		Storage:   localStorage,
		AppConfig: appConfig,
	}

	shareService := &service.ShareService{
		DB:        db.DB,
		AppConfig: appConfig,
	}

	// 创建管理员用户（如果不存在）
	err = userService.CreateAdminUser(appConfig.AdminEmail, appConfig.AdminPassword)
	if err != nil {
		log.Printf("创建管理员用户失败: %v", err)
	} else {
		log.Printf("管理员用户已创建或已存在")
	}

	// 初始化Echo
	e := echo.New()

	// 添加中间件
	e.Use(echomiddleware.Logger())
	e.Use(echomiddleware.Recover())
	e.Use(echomiddleware.CORS())

	// 创建限流器
	rateLimiter := middleware.NewRateLimiter(100, time.Minute) // 每分钟100个请求
	e.Use(middleware.RateLimitMiddleware(rateLimiter))

	// 创建JWT中间件
	jwtMiddleware := middleware.JWTMiddleware(jwtConfig)

	// 创建管理员中间件
	adminMiddleware := middleware.AdminMiddleware()

	// 初始化处理程序
	userHandler := &api.UserHandler{
		UserService: userService,
	}

	fileHandler := &api.FileHandler{
		FileService:  fileService,
		ShareService: shareService,
	}

	shareHandler := &api.ShareHandler{
		ShareService: shareService,
		FileService:  fileService,
	}

	adminHandler := &api.AdminHandler{
		DB: db.DB,
	}

	// 注册路由
	userHandler.RegisterRoutes(e, jwtMiddleware)
	fileHandler.RegisterRoutes(e, jwtMiddleware)
	shareHandler.RegisterRoutes(e, jwtMiddleware)
	adminHandler.RegisterRoutes(e, jwtMiddleware, adminMiddleware)

	// 添加健康检查路由
	e.GET("/health", func(c echo.Context) error {
		return c.JSON(200, map[string]string{
			"status": "ok",
			"time":   time.Now().Format(time.RFC3339),
		})
	})

	// 启动服务器
	port := fmt.Sprintf(":%d", appConfig.Port)
	log.Printf("服务器启动在 http://localhost%s", port)
	if err := e.Start(port); err != nil {
		log.Fatalf("服务器启动失败: %v", err)
	}
}
