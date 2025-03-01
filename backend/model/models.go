package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// User 用户模型
type User struct {
	ID        uuid.UUID `gorm:"type:uuid;primary_key" json:"id"`
	Username  string    `gorm:"size:50" json:"username"`
	Email     string    `gorm:"size:255;not null;unique" json:"email"`
	Password  string    `gorm:"size:255;not null" json:"-"`
	IsAdmin   bool      `gorm:"default:false" json:"is_admin"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
	Files     []File    `gorm:"foreignKey:UserID" json:"files,omitempty"`
}

// BeforeCreate 创建用户前生成UUID
func (u *User) BeforeCreate(tx *gorm.DB) error {
	if u.ID == uuid.Nil {
		u.ID = uuid.New()
	}
	return nil
}

// File 文件模型
type File struct {
	ID          uuid.UUID  `gorm:"type:uuid;primary_key" json:"id"`
	UserID      *uuid.UUID `gorm:"type:uuid;index" json:"user_id,omitempty"`
	Name        string     `gorm:"size:255;not null" json:"name"`
	Size        int64      `gorm:"not null" json:"size"`
	ContentType string     `gorm:"size:100;not null" json:"content_type"`
	StoragePath string     `gorm:"size:255;not null" json:"-"`
	Hash        string     `gorm:"size:64;not null" json:"hash"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
	Shares      []Share    `gorm:"foreignKey:FileID" json:"shares,omitempty"`
}

// BeforeCreate 创建文件前生成UUID
func (f *File) BeforeCreate(tx *gorm.DB) error {
	if f.ID == uuid.Nil {
		f.ID = uuid.New()
	}
	return nil
}

// Share 分享记录模型
type Share struct {
	ID            uuid.UUID `gorm:"type:uuid;primary_key" json:"id"`
	FileID        uuid.UUID `gorm:"type:uuid;not null;index" json:"file_id"`
	Code          string    `gorm:"size:10;not null;unique" json:"code"`
	ExpiresAt     time.Time `gorm:"not null" json:"expires_at"`
	DownloadLimit int       `gorm:"default:5" json:"download_limit"`
	DownloadCount int       `gorm:"default:0" json:"download_count"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
	File          File      `gorm:"foreignKey:FileID" json:"file,omitempty"`
}

// BeforeCreate 创建分享记录前生成UUID
func (s *Share) BeforeCreate(tx *gorm.DB) error {
	if s.ID == uuid.Nil {
		s.ID = uuid.New()
	}
	return nil
}

// IsExpired 检查分享是否过期
func (s *Share) IsExpired() bool {
	return time.Now().After(s.ExpiresAt) || s.DownloadCount >= s.DownloadLimit
}
