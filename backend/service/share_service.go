package service

import (
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/zaunist/filebox/backend/config"
	"github.com/zaunist/filebox/backend/model"
	"github.com/zaunist/filebox/backend/utils"
	"gorm.io/gorm"
)

// ShareService 分享服务
type ShareService struct {
	DB        *gorm.DB
	AppConfig *config.AppConfig
}

// CreateShareRequest 创建分享请求
type CreateShareRequest struct {
	FileID        string `json:"file_id" validate:"required"`
	Code          string `json:"code"`
	ExpiresIn     int    `json:"expires_in"`
	DownloadLimit int    `json:"download_limit"`
}

// ShareResponse 分享响应
type ShareResponse struct {
	ID            string    `json:"id"`
	FileID        string    `json:"file_id"`
	FileName      string    `json:"file_name"`
	FileSize      int64     `json:"file_size"`
	ContentType   string    `json:"content_type"`
	Code          string    `json:"code"`
	ExpiresAt     time.Time `json:"expires_at"`
	DownloadLimit int       `json:"download_limit"`
	DownloadCount int       `json:"download_count"`
	CreatedAt     time.Time `json:"created_at"`
}

// CreateShare 创建分享
func (s *ShareService) CreateShare(req CreateShareRequest, userID *uuid.UUID) (*ShareResponse, error) {
	// 查找文件
	var file model.File
	result := s.DB.First(&file, "id = ?", req.FileID)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, errors.New("文件不存在")
		}
		return nil, result.Error
	}

	// 检查文件所有权（如果是注册用户）
	if userID != nil && file.UserID != nil && *file.UserID != *userID {
		return nil, errors.New("无权限分享此文件")
	}

	// 生成或验证取件码
	var code string
	if req.Code != "" {
		// 验证自定义取件码
		if !utils.IsValidCode(req.Code) {
			return nil, errors.New("无效的取件码格式")
		}

		// 检查取件码是否已存在
		var existingShare model.Share
		result = s.DB.Where("code = ?", req.Code).First(&existingShare)
		if result.Error == nil {
			return nil, errors.New("取件码已被使用，请尝试其他取件码")
		} else if !errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, result.Error
		}

		code = req.Code
	} else {
		// 生成随机取件码
		var err error
		for i := 0; i < 5; i++ { // 尝试最多5次
			code, err = utils.GenerateRandomCode(6)
			if err != nil {
				return nil, err
			}

			// 检查是否已存在
			var existingShare model.Share
			result = s.DB.Where("code = ?", code).First(&existingShare)
			if errors.Is(result.Error, gorm.ErrRecordNotFound) {
				break // 找到可用的取件码
			}

			if i == 4 {
				return nil, errors.New("无法生成唯一取件码，请稍后再试")
			}
		}
	}

	// 设置过期时间
	expiresIn := req.ExpiresIn
	if expiresIn <= 0 {
		expiresIn = s.AppConfig.DefaultExpireHours
	}
	expiresAt := time.Now().Add(time.Duration(expiresIn) * time.Hour)

	// 设置下载限制
	downloadLimit := req.DownloadLimit
	if downloadLimit <= 0 {
		downloadLimit = s.AppConfig.DefaultDownloadLimit
	}

	// 创建分享记录
	share := &model.Share{
		ID:            uuid.New(),
		FileID:        file.ID,
		Code:          code,
		ExpiresAt:     expiresAt,
		DownloadLimit: downloadLimit,
		DownloadCount: 0,
		CreatedAt:     time.Now(),
		UpdatedAt:     time.Now(),
	}

	// 保存到数据库
	if err := s.DB.Create(share).Error; err != nil {
		return nil, err
	}

	return &ShareResponse{
		ID:            share.ID.String(),
		FileID:        file.ID.String(),
		FileName:      file.Name,
		FileSize:      file.Size,
		ContentType:   file.ContentType,
		Code:          share.Code,
		ExpiresAt:     share.ExpiresAt,
		DownloadLimit: share.DownloadLimit,
		DownloadCount: share.DownloadCount,
		CreatedAt:     share.CreatedAt,
	}, nil
}

// GetShareByCode 根据取件码获取分享
func (s *ShareService) GetShareByCode(code string) (*model.Share, *model.File, error) {
	var share model.Share

	// 查询分享记录，并预加载文件
	result := s.DB.Preload("File").Where("code = ?", code).First(&share)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, nil, errors.New("取件码无效")
		}
		return nil, nil, result.Error
	}

	// 检查是否过期
	if share.IsExpired() {
		return nil, nil, errors.New("分享已过期或超过下载次数限制")
	}

	return &share, &share.File, nil
}

// IncrementDownloadCount 增加下载次数
func (s *ShareService) IncrementDownloadCount(shareID uuid.UUID) error {
	return s.DB.Model(&model.Share{}).Where("id = ?", shareID).
		UpdateColumn("download_count", gorm.Expr("download_count + ?", 1)).Error
}

// GetUserShares 获取用户的分享列表
func (s *ShareService) GetUserShares(userID string, page, pageSize int) ([]ShareResponse, int64, error) {
	var shares []model.Share
	var total int64

	// 查询用户的文件ID列表
	var fileIDs []uuid.UUID
	if err := s.DB.Model(&model.File{}).Where("user_id = ?", userID).Pluck("id", &fileIDs).Error; err != nil {
		return nil, 0, err
	}

	if len(fileIDs) == 0 {
		return []ShareResponse{}, 0, nil
	}

	// 计算总数
	if err := s.DB.Model(&model.Share{}).Where("file_id IN ?", fileIDs).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// 分页查询
	offset := (page - 1) * pageSize
	if err := s.DB.Preload("File").Where("file_id IN ?", fileIDs).
		Order("created_at DESC").Offset(offset).Limit(pageSize).Find(&shares).Error; err != nil {
		return nil, 0, err
	}

	// 转换为响应格式
	responses := make([]ShareResponse, len(shares))
	for i, share := range shares {
		responses[i] = ShareResponse{
			ID:            share.ID.String(),
			FileID:        share.FileID.String(),
			FileName:      share.File.Name,
			FileSize:      share.File.Size,
			ContentType:   share.File.ContentType,
			Code:          share.Code,
			ExpiresAt:     share.ExpiresAt,
			DownloadLimit: share.DownloadLimit,
			DownloadCount: share.DownloadCount,
			CreatedAt:     share.CreatedAt,
		}
	}

	return responses, total, nil
}

// DeleteShare 删除分享
func (s *ShareService) DeleteShare(shareID string, userID *uuid.UUID) error {
	var share model.Share

	// 查询分享记录
	if err := s.DB.Preload("File").First(&share, "id = ?", shareID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("分享不存在")
		}
		return err
	}

	// 检查权限
	if userID != nil && share.File.UserID != nil && *share.File.UserID != *userID {
		return errors.New("无权限删除此分享")
	}

	// 删除分享
	if err := s.DB.Delete(&share).Error; err != nil {
		return err
	}

	return nil
}
