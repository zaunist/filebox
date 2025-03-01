package filestore

import (
	"io"
	"mime/multipart"
)

// FileStorage 文件存储接口
type FileStorage interface {
	// Save 保存文件并返回存储路径和哈希值
	Save(file *multipart.FileHeader) (string, string, error)

	// Get 获取文件
	Get(path string) (io.ReadCloser, error)

	// Delete 删除文件
	Delete(path string) error
}
