package service

import (
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/zaunist/filebox/middleware"
	"github.com/zaunist/filebox/model"
	"github.com/zaunist/filebox/utils"
	"gorm.io/gorm"
)

// UserService 用户服务
type UserService struct {
	DB        *gorm.DB
	JWTConfig middleware.JWTConfig
}

// RegisterRequest 注册请求
type RegisterRequest struct {
	Username string `json:"username" validate:"required"`
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required,min=8"`
}

// LoginRequest 登录请求
type LoginRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required"`
}

// TokenResponse 令牌响应
type TokenResponse struct {
	AccessToken  string    `json:"access_token"`
	RefreshToken string    `json:"refresh_token"`
	ExpiresAt    time.Time `json:"expires_at"`
	UserID       string    `json:"user_id"`
	Username     string    `json:"username"`
	Email        string    `json:"email"`
	IsAdmin      bool      `json:"is_admin"`
}

// Register 用户注册
func (s *UserService) Register(req RegisterRequest) (*model.User, error) {
	// 验证邮箱格式
	if !utils.ValidateEmail(req.Email) {
		return nil, errors.New("无效的邮箱格式")
	}

	// 验证密码强度
	if !utils.ValidatePassword(req.Password) {
		return nil, errors.New("密码必须至少包含8个字符，且包含字母和数字")
	}

	// 检查邮箱是否已存在
	var existingUser model.User
	result := s.DB.Where("email = ?", req.Email).First(&existingUser)
	if result.Error == nil {
		return nil, errors.New("该邮箱已被注册")
	} else if !errors.Is(result.Error, gorm.ErrRecordNotFound) {
		return nil, result.Error
	}

	// 加密密码
	hashedPassword, err := utils.HashPassword(req.Password)
	if err != nil {
		return nil, err
	}

	// 创建用户
	user := &model.User{
		ID:        uuid.New(),
		Username:  req.Username,
		Email:     req.Email,
		Password:  hashedPassword,
		IsAdmin:   false,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	// 保存用户
	if err := s.DB.Create(user).Error; err != nil {
		return nil, err
	}

	return user, nil
}

// Login 用户登录
func (s *UserService) Login(req LoginRequest) (*TokenResponse, error) {
	// 查找用户
	var user model.User
	result := s.DB.Where("email = ?", req.Email).First(&user)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, errors.New("邮箱或密码错误")
		}
		return nil, result.Error
	}

	// 验证密码
	if !utils.CheckPasswordHash(req.Password, user.Password) {
		return nil, errors.New("邮箱或密码错误")
	}

	// 生成访问令牌
	accessToken, err := middleware.GenerateToken(&user, s.JWTConfig)
	if err != nil {
		return nil, err
	}

	// 生成刷新令牌
	refreshToken, err := middleware.GenerateRefreshToken(&user, s.JWTConfig)
	if err != nil {
		return nil, err
	}

	// 计算过期时间
	expiresAt := time.Now().Add(time.Duration(s.JWTConfig.ExpirationHours) * time.Hour)

	return &TokenResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		ExpiresAt:    expiresAt,
		UserID:       user.ID.String(),
		Username:     user.Username,
		Email:        user.Email,
		IsAdmin:      user.IsAdmin,
	}, nil
}

// RefreshToken 刷新令牌
func (s *UserService) RefreshToken(refreshToken string) (*TokenResponse, error) {
	// 解析刷新令牌
	token, err := middleware.ParseToken(refreshToken, s.JWTConfig.Secret)
	if err != nil {
		return nil, errors.New("无效的刷新令牌")
	}

	// 获取用户ID
	claims, ok := token.Claims.(*middleware.JWTClaims)
	if !ok {
		return nil, errors.New("无效的令牌声明")
	}

	// 查找用户
	var user model.User
	result := s.DB.First(&user, "id = ?", claims.UserID)
	if result.Error != nil {
		return nil, errors.New("用户不存在")
	}

	// 生成新的访问令牌
	accessToken, err := middleware.GenerateToken(&user, s.JWTConfig)
	if err != nil {
		return nil, err
	}

	// 生成新的刷新令牌
	newRefreshToken, err := middleware.GenerateRefreshToken(&user, s.JWTConfig)
	if err != nil {
		return nil, err
	}

	// 计算过期时间
	expiresAt := time.Now().Add(time.Duration(s.JWTConfig.ExpirationHours) * time.Hour)

	return &TokenResponse{
		AccessToken:  accessToken,
		RefreshToken: newRefreshToken,
		ExpiresAt:    expiresAt,
		UserID:       user.ID.String(),
		Username:     user.Username,
		Email:        user.Email,
		IsAdmin:      user.IsAdmin,
	}, nil
}

// GetUserByID 根据ID获取用户
func (s *UserService) GetUserByID(id string) (*model.User, error) {
	var user model.User
	result := s.DB.First(&user, "id = ?", id)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, errors.New("用户不存在")
		}
		return nil, result.Error
	}
	return &user, nil
}

// CreateAdminUser 创建管理员用户
func (s *UserService) CreateAdminUser(email, password string) error {
	// 检查是否已存在管理员
	var adminCount int64
	s.DB.Model(&model.User{}).Where("is_admin = ?", true).Count(&adminCount)
	if adminCount > 0 {
		return errors.New("管理员用户已存在")
	}

	// 加密密码
	hashedPassword, err := utils.HashPassword(password)
	if err != nil {
		return err
	}

	// 创建管理员用户
	admin := &model.User{
		ID:        uuid.New(),
		Username:  "boxer",
		Email:     email,
		Password:  hashedPassword,
		IsAdmin:   true,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	// 保存用户
	if err := s.DB.Create(admin).Error; err != nil {
		return err
	}

	return nil
}
