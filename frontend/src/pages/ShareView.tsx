import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import filesApi, { File, FileShare } from '../api/files'
import { useToast } from '../hooks/useToast'
import { formatBytes, formatDate } from '../utils/format'

export default function ShareView() {
  const { code } = useParams<{ code: string }>()
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fileData, setFileData] = useState<{ file: File; share: FileShare } | null>(null)
  const navigate = useNavigate()
  const { toast } = useToast()

  useEffect(() => {
    if (!code) {
      setError('无效的分享链接')
      setLoading(false)
      return
    }

    fetchSharedFile(code)
  }, [code])

  const fetchSharedFile = async (shareCode: string) => {
    try {
      setLoading(true)
      const data = await filesApi.getFileByShareCode(shareCode)
      setFileData(data)
    } catch (error: any) {
      console.error('获取分享文件失败:', error)
      setError(error.response?.data?.message || '无法获取分享文件，可能链接已过期或不存在')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async () => {
    if (!code) return

    try {
      setDownloading(true)
      const blob = await filesApi.downloadSharedFile(code)
      
      // 创建下载链接
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = fileData?.file.name || 'download'
      document.body.appendChild(a)
      a.click()
      
      // 清理
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast({
        variant: 'success',
        title: '下载成功',
        description: '文件已开始下载',
      })
    } catch (error: any) {
      console.error('下载失败:', error)
      toast({
        variant: 'error',
        title: '下载失败',
        description: error.response?.data?.message || '文件下载失败，请稍后重试',
      })
    } finally {
      setDownloading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-lg text-gray-600">加载中...</p>
        </div>
      </div>
    )
  }

  if (error || !fileData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="max-w-md text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">访问错误</h2>
          <p className="text-lg text-gray-600 mb-6">{error || '无法获取分享文件'}</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            返回首页
          </button>
        </div>
      </div>
    )
  }

  const { file, share } = fileData

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-3xl">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold mb-6 text-center">文件分享</h1>
          
          <div className="mb-8 p-6 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">{file.name}</h2>
              <span className="text-sm text-gray-500">{formatBytes(file.size)}</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-sm text-gray-500">文件类型</p>
                <p className="text-gray-800">{file.content_type}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">分享时间</p>
                <p className="text-gray-800">{formatDate(share.created_at)}</p>
              </div>
              {share.expires_at && (
                <div>
                  <p className="text-sm text-gray-500">过期时间</p>
                  <p className="text-gray-800">{formatDate(share.expires_at)}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-500">下载次数</p>
                <p className="text-gray-800">{share.download_count}</p>
              </div>
            </div>
            
            {share.download_limit && (
              <div className="mb-6">
                <p className="text-sm text-gray-500 mb-1">下载限制</p>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full" 
                    style={{ width: `${(share.download_count / share.download_limit) * 100}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  已下载 {share.download_count} / {share.download_limit} 次
                </p>
              </div>
            )}
            
            <div className="flex justify-center">
              <button
                onClick={handleDownload}
                disabled={downloading}
                className={`px-6 py-3 rounded-md text-white font-medium ${
                  downloading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {downloading ? '下载中...' : '下载文件'}
              </button>
            </div>
          </div>
          
          <div className="text-center text-sm text-gray-500">
            <p>通过 FileBox 分享</p>
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 mt-2"
            >
              前往 FileBox 首页
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 