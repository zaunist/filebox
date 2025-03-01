package filestore

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"io"
	"mime/multipart"
	"os"
	"path/filepath"
	"time"
)

// LocalStorage 本地文件存储实现
type LocalStorage struct {
	BasePath string
	EncKey   []byte // AES-256加密密钥
}

// NewLocalStorage 创建本地文件存储
func NewLocalStorage(basePath string) (*LocalStorage, error) {
	// 确保存储目录存在
	if err := os.MkdirAll(basePath, 0755); err != nil {
		return nil, fmt.Errorf("创建存储目录失败: %w", err)
	}

	// 从环境变量获取加密密钥或生成新密钥
	encKey := os.Getenv("STORAGE_ENC_KEY")
	var key []byte
	if encKey == "" {
		// 生成随机密钥
		key = make([]byte, 32) // AES-256需要32字节密钥
		if _, err := rand.Read(key); err != nil {
			return nil, fmt.Errorf("生成加密密钥失败: %w", err)
		}
		// 在生产环境中，应该将生成的密钥保存起来
		fmt.Printf("警告: 已生成随机加密密钥，请在环境变量STORAGE_ENC_KEY中设置以下密钥: %s\n", hex.EncodeToString(key))
	} else {
		var err error
		key, err = hex.DecodeString(encKey)
		if err != nil || len(key) != 32 {
			return nil, fmt.Errorf("无效的加密密钥: %w", err)
		}
	}

	return &LocalStorage{
		BasePath: basePath,
		EncKey:   key,
	}, nil
}

// Save 保存文件并返回存储路径和哈希值
func (s *LocalStorage) Save(file *multipart.FileHeader) (string, string, error) {
	// 打开上传的文件
	src, err := file.Open()
	if err != nil {
		return "", "", fmt.Errorf("打开上传文件失败: %w", err)
	}
	defer src.Close()

	// 计算文件哈希
	hash := sha256.New()
	if _, err := io.Copy(hash, src); err != nil {
		return "", "", fmt.Errorf("计算文件哈希失败: %w", err)
	}
	fileHash := hex.EncodeToString(hash.Sum(nil))

	// 重置文件指针
	if _, err := src.Seek(0, 0); err != nil {
		return "", "", fmt.Errorf("重置文件指针失败: %w", err)
	}

	// 创建存储目录结构 (按年/月/日)
	now := time.Now()
	dirPath := filepath.Join(s.BasePath, fmt.Sprintf("%d/%02d/%02d", now.Year(), now.Month(), now.Day()))
	if err := os.MkdirAll(dirPath, 0755); err != nil {
		return "", "", fmt.Errorf("创建存储目录失败: %w", err)
	}

	// 生成唯一文件名
	fileName := fmt.Sprintf("%s_%s", fileHash[:8], filepath.Base(file.Filename))
	filePath := filepath.Join(dirPath, fileName)

	// 创建目标文件
	dst, err := os.Create(filePath)
	if err != nil {
		return "", "", fmt.Errorf("创建目标文件失败: %w", err)
	}
	defer dst.Close()

	// 创建加密写入器
	block, err := aes.NewCipher(s.EncKey)
	if err != nil {
		return "", "", fmt.Errorf("创建加密器失败: %w", err)
	}

	// 生成随机IV
	iv := make([]byte, aes.BlockSize)
	if _, err := rand.Read(iv); err != nil {
		return "", "", fmt.Errorf("生成IV失败: %w", err)
	}

	// 写入IV
	if _, err := dst.Write(iv); err != nil {
		return "", "", fmt.Errorf("写入IV失败: %w", err)
	}

	// 创建加密流
	stream := cipher.NewCFBEncrypter(block, iv)
	writer := &cipher.StreamWriter{S: stream, W: dst}

	// 加密并写入文件
	if _, err := io.Copy(writer, src); err != nil {
		return "", "", fmt.Errorf("加密写入文件失败: %w", err)
	}

	// 返回相对路径和哈希值
	relPath, err := filepath.Rel(s.BasePath, filePath)
	if err != nil {
		return "", "", fmt.Errorf("获取相对路径失败: %w", err)
	}

	return relPath, fileHash, nil
}

// Get 获取文件
func (s *LocalStorage) Get(path string) (io.ReadCloser, error) {
	fullPath := filepath.Join(s.BasePath, path)
	file, err := os.Open(fullPath)
	if err != nil {
		return nil, fmt.Errorf("打开文件失败: %w", err)
	}

	// 读取IV
	iv := make([]byte, aes.BlockSize)
	if _, err := file.Read(iv); err != nil {
		file.Close()
		return nil, fmt.Errorf("读取IV失败: %w", err)
	}

	// 创建解密器
	block, err := aes.NewCipher(s.EncKey)
	if err != nil {
		file.Close()
		return nil, fmt.Errorf("创建解密器失败: %w", err)
	}

	// 创建解密流
	stream := cipher.NewCFBDecrypter(block, iv)
	reader := &cipher.StreamReader{S: stream, R: file}

	// 返回一个ReadCloser，关闭时会关闭底层文件
	return &decryptReadCloser{reader: reader, file: file}, nil
}

// Delete 删除文件
func (s *LocalStorage) Delete(path string) error {
	fullPath := filepath.Join(s.BasePath, path)
	if err := os.Remove(fullPath); err != nil {
		return fmt.Errorf("删除文件失败: %w", err)
	}
	return nil
}

// decryptReadCloser 实现io.ReadCloser接口
type decryptReadCloser struct {
	reader io.Reader
	file   *os.File
}

func (d *decryptReadCloser) Read(p []byte) (n int, err error) {
	return d.reader.Read(p)
}

func (d *decryptReadCloser) Close() error {
	return d.file.Close()
}
