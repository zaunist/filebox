package config

import (
	"fmt"
	"log"
	"os"
	"time"

	"github.com/zaunist/filebox/model"
	"gorm.io/driver/postgres"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// Database 配置
type Database struct {
	DB *gorm.DB
}

// NewDatabase 初始化数据库连接
func NewDatabase() *Database {
	var db *gorm.DB
	var err error

	// 配置日志
	newLogger := logger.New(
		log.New(os.Stdout, "\r\n", log.LstdFlags),
		logger.Config{
			SlowThreshold:             time.Second,
			LogLevel:                  logger.Info,
			IgnoreRecordNotFoundError: true,
			Colorful:                  true,
		},
	)

	// 根据环境变量选择数据库
	dbType := os.Getenv("DB_TYPE")
	if dbType == "" {
		dbType = "sqlite" // 默认使用SQLite
	}

	switch dbType {
	case "postgres":
		dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=disable TimeZone=Asia/Shanghai",
			getEnv("DB_HOST", "localhost"),
			getEnv("DB_USER", "postgres"),
			getEnv("DB_PASSWORD", "postgres"),
			getEnv("DB_NAME", "filebox"),
			getEnv("DB_PORT", "5432"),
		)
		db, err = gorm.Open(postgres.Open(dsn), &gorm.Config{
			Logger: newLogger,
		})
	case "sqlite":
		dbPath := getEnv("DB_PATH", "filebox.db")
		db, err = gorm.Open(sqlite.Open(dbPath), &gorm.Config{
			Logger: newLogger,
		})
	default:
		log.Fatalf("不支持的数据库类型: %s", dbType)
	}

	if err != nil {
		log.Fatalf("数据库连接失败: %v", err)
	}

	// 自动迁移数据库结构
	err = db.AutoMigrate(&model.User{}, &model.File{}, &model.Share{})
	if err != nil {
		log.Fatalf("数据库迁移失败: %v", err)
	}

	return &Database{DB: db}
}

// 这里删除了重复的getEnv函数
