package main

import (
	"embed"
	"io/fs"
	"net/http"
	"os"
)

// 使用//go:embed指令嵌入前端文件
// 注意：这里需要在构建前确保frontend_dist目录存在并包含前端构建产物
//
// 如果在开发环境中，可能没有嵌入的文件，会使用本地文件系统
//
//go:embed frontend_dist
var frontendFS embed.FS

// GetFrontendFS 返回前端文件系统
func GetFrontendFS() http.FileSystem {
	// 尝试从嵌入的文件系统中获取frontend_dist子目录
	fsys, err := fs.Sub(frontendFS, "frontend_dist")
	if err != nil {
		// 如果嵌入的文件系统出错，尝试从本地文件系统加载
		if _, err := os.Stat("frontend_dist"); err == nil {
			return http.Dir("frontend_dist")
		}
		// 如果本地文件系统也不存在，返回一个空的文件系统
		return http.FS(fs.FS(frontendFS))
	}
	return http.FS(fsys)
}
