package service

import (
	"errors"
	"fmt"
	"io"
	"mime/multipart"
	"time"

	"github.com/google/uuid"
	"github.com/zaunist/filebox/backend/config"
	"github.com/zaunist/filebox/backend/filestore"
	"github.com/zaunist/filebox/backend/model"
	"gorm.io/gorm"
)

// FileService 文件服务
type FileService struct {
	DB        *gorm.DB
	Storage   filestore.FileStorage
	AppConfig *config.AppConfig
}

// FileUploadResponse 文件上传响应
type FileUploadResponse struct {
	ID          string    `json:"id"`
	Name        string    `json:"name"`
	Size        int64     `json:"size"`
	ContentType string    `json:"content_type"`
	Hash        string    `json:"hash"`
	CreatedAt   time.Time `json:"created_at"`
}

// UploadFile 上传文件
func (s *FileService) UploadFile(file *multipart.FileHeader, userID *uuid.UUID) (*FileUploadResponse, error) {
	// 检查文件大小
	var maxSize int64
	if userID == nil {
		maxSize = s.AppConfig.MaxAnonymousFileSize
	} else {
		maxSize = s.AppConfig.MaxFileSize
	}

	if file.Size > maxSize {
		return nil, fmt.Errorf("文件大小超过限制，最大允许 %d 字节", maxSize)
	}

	// 保存文件到存储
	storagePath, hash, err := s.Storage.Save(file)
	if err != nil {
		return nil, err
	}

	// 创建文件记录
	fileModel := &model.File{
		ID:          uuid.New(),
		UserID:      userID,
		Name:        file.Filename,
		Size:        file.Size,
		ContentType: file.Header.Get("Content-Type"),
		StoragePath: storagePath,
		Hash:        hash,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	// 保存到数据库
	if err := s.DB.Create(fileModel).Error; err != nil {
		// 如果数据库保存失败，尝试删除已上传的文件
		_ = s.Storage.Delete(storagePath)
		return nil, err
	}

	return &FileUploadResponse{
		ID:          fileModel.ID.String(),
		Name:        fileModel.Name,
		Size:        fileModel.Size,
		ContentType: fileModel.ContentType,
		Hash:        fileModel.Hash,
		CreatedAt:   fileModel.CreatedAt,
	}, nil
}

// GetFileByID 根据ID获取文件
func (s *FileService) GetFileByID(id string) (*model.File, error) {
	var file model.File
	result := s.DB.First(&file, "id = ?", id)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, errors.New("文件不存在")
		}
		return nil, result.Error
	}
	return &file, nil
}

// GetFileContent 获取文件内容
func (s *FileService) GetFileContent(file *model.File) (io.ReadCloser, error) {
	return s.Storage.Get(file.StoragePath)
}

// DeleteFile 删除文件
func (s *FileService) DeleteFile(id string, userID *uuid.UUID) error {
	var file model.File

	// 查询文件
	query := s.DB.Where("id = ?", id)
	if userID != nil {
		query = query.Where("user_id = ?", userID)
	}

	result := query.First(&file)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return errors.New("文件不存在或无权限删除")
		}
		return result.Error
	}

	// 开始事务
	tx := s.DB.Begin()

	// 删除相关的分享记录
	if err := tx.Where("file_id = ?", file.ID).Delete(&model.Share{}).Error; err != nil {
		tx.Rollback()
		return err
	}

	// 删除文件记录
	if err := tx.Delete(&file).Error; err != nil {
		tx.Rollback()
		return err
	}

	// 提交事务
	if err := tx.Commit().Error; err != nil {
		return err
	}

	// 删除存储中的文件
	if err := s.Storage.Delete(file.StoragePath); err != nil {
		// 即使删除存储文件失败，数据库事务已经提交，所以只记录错误
		fmt.Printf("删除存储文件失败: %v\n", err)
	}

	return nil
}

// GetUserFiles 获取用户的文件列表
func (s *FileService) GetUserFiles(userID string, page, pageSize int) ([]model.File, int64, error) {
	var files []model.File
	var total int64

	// 计算总数
	if err := s.DB.Model(&model.File{}).Where("user_id = ?", userID).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// 分页查询
	offset := (page - 1) * pageSize
	if err := s.DB.Where("user_id = ?", userID).Order("created_at DESC").Offset(offset).Limit(pageSize).Find(&files).Error; err != nil {
		return nil, 0, err
	}

	return files, total, nil
}
