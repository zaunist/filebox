import apiClient from './client'
import { User } from './auth'

// 文件类型定义
export interface File {
  id: string
  name: string
  size: number
  content_type: string
  user_id: string
  is_public: boolean
  download_count: number
  created_at: string
  updated_at: string
}

// 文件列表响应
export interface FileListResponse {
  files: File[]
  total: number
  page: number
  limit: number
}

// 文件分享类型
export interface FileShare {
  id: string
  file_id: string
  code: string
  created_at: string
  expires_at?: string
  download_limit?: number
  download_count: number
  file?: File
}

// 分享列表响应
export interface ShareListResponse {
  shares: FileShare[]
  total: number
  page: number
  limit: number
}

// 创建分享请求
export interface CreateShareRequest {
  code?: string
  expires_in?: number
  download_limit?: number
}

// 文件API
const filesApi = {
  // 获取用户文件列表
  getFiles: async (page = 1, limit = 10): Promise<FileListResponse> => {
    const response = await apiClient.get<FileListResponse>('/files', {
      params: { page, limit }
    })
    return response.data
  },

  // 获取单个文件信息
  getFile: async (fileId: string): Promise<File> => {
    const response = await apiClient.get<File>(`/files/${fileId}`)
    return response.data
  },

  // 上传文件
  uploadFile: async (file: Blob, isPublic = false): Promise<File> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('is_public', isPublic.toString())
    
    const response = await apiClient.post<File>('/files', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response.data
  },

  // 匿名上传文件并直接分享
  uploadAnonymousFile: async (file: Blob, options?: CreateShareRequest): Promise<FileShare> => {
    const formData = new FormData()
    formData.append('file', file)
    
    if (options) {
      if (options.code) formData.append('code', options.code)
      if (options.expires_in) formData.append('expires_in', options.expires_in.toString())
      if (options.download_limit) formData.append('download_limit', options.download_limit.toString())
    }

    const response = await apiClient.post('/files/anonymous', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response.data
  },

  // 删除文件
  deleteFile: async (fileId: string): Promise<void> => {
    await apiClient.delete(`/files/${fileId}`)
  },

  // 分享文件
  shareFile: async (fileId: string, options: CreateShareRequest = {}): Promise<FileShare> => {
    const response = await apiClient.post<FileShare>(`/files/${fileId}/share`, options)
    return response.data
  },

  // 获取用户的分享列表
  getShares: async (page = 1, limit = 10): Promise<ShareListResponse> => {
    const response = await apiClient.get<ShareListResponse>('/shares', {
      params: { page, limit }
    })
    return response.data
  },

  // 删除分享
  deleteShare: async (shareId: string): Promise<void> => {
    await apiClient.delete(`/shares/${shareId}`)
  },

  // 通过分享码获取文件
  getFileByShareCode: async (code: string): Promise<{share: FileShare, file: File}> => {
    const response = await apiClient.get<{share: FileShare, file: File}>(`/shares/${code}`)
    return response.data
  },

  // 下载文件
  downloadFile: async (fileId: string): Promise<Blob> => {
    const response = await apiClient.get(`/files/${fileId}/download`, {
      responseType: 'blob'
    })
    return response.data
  },

  // 通过分享码下载文件
  downloadSharedFile: async (code: string): Promise<Blob> => {
    const response = await apiClient.get(`/shares/${code}/download`, {
      responseType: 'blob'
    })
    return response.data
  }
}

export default filesApi