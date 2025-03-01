import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import filesApi, { File, FileShare, CreateShareRequest } from '../api/files';
import { formatBytes, formatDate, getFileIcon } from '../lib/utils';
import { toast } from '../hooks/useToast';
import Navigation from '../components/Navigation';
import { Button } from '../components/ui/Button';

const Files: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isAnonymousUpload = location.pathname === '/anonymous-upload';
  const isFilesPage = location.pathname === '/files';
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [sharingFile, setSharingFile] = useState<string | null>(null);
  const [shareData, setShareData] = useState<CreateShareRequest>({});
  const [shareResult, setShareResult] = useState<FileShare | null>(null);
  const [anonymousShareResult, setAnonymousShareResult] = useState<FileShare | null>(null);
  const [anonymousShareData, setAnonymousShareData] = useState<{
    code: string;
    expires_in: string;
    download_limit: string;
  }>({
    code: '',
    expires_in: '',
    download_limit: ''
  });
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!isAnonymousUpload) {
      fetchFiles();
    } else {
      setLoading(false);
    }
  }, [isAnonymousUpload]);

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const response = await filesApi.getFiles();
      setFiles(response.files);
    } catch (err: any) {
      setError(err.response?.data?.message || '获取文件列表失败');
      if (err.response?.status === 401) {
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    setUploadingFile(true);
    setError(null);
    
    try {
      if (!isAnonymousUpload) {
        // 已登录用户上传
        const result = await filesApi.uploadFile(file);
        setSuccess(`文件 ${result.name} 上传成功！`);
        fetchFiles();
      } else {
        // 匿名上传
        const options: any = {};
        
        if (anonymousShareData.code) options.code = anonymousShareData.code;
        
        // 验证过期时间
        if (anonymousShareData.expires_in) {
          const expiresIn = parseInt(anonymousShareData.expires_in);
          if (isNaN(expiresIn) || expiresIn <= 0) {
            setError('过期时间必须是大于0的整数');
            setUploadingFile(false);
            return;
          }
          options.expires_in = expiresIn;
        }
        
        // 验证下载限制
        if (anonymousShareData.download_limit) {
          const downloadLimit = parseInt(anonymousShareData.download_limit);
          if (isNaN(downloadLimit) || downloadLimit <= 0) {
            setError('下载次数限制必须是大于0的整数');
            setUploadingFile(false);
            return;
          }
          options.download_limit = downloadLimit;
        }
        
        const result = await filesApi.uploadAnonymousFile(file, options);
        setAnonymousShareResult(result);
        setSuccess(`文件上传成功，已生成分享链接！`);
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || '上传失败，请重试';
      
      // 特殊处理分享码重复的错误
      if (errorMessage.includes('取件码已被使用')) {
        toast({
          title: '分享码已被使用',
          description: errorMessage,
          variant: 'error',
        });
      } else {
        setError(errorMessage);
      }
    } finally {
      setUploadingFile(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    if (!window.confirm('确定要删除此文件吗？')) return;

    try {
      await filesApi.deleteFile(fileId);
      setFiles(files.filter(file => file.id !== fileId));
      toast({
        title: '删除成功',
        description: '文件已成功删除',
        variant: 'success',
      });
    } catch (err: any) {
      setError(err.response?.data?.message || '删除文件失败');
      toast({
        title: '删除失败',
        description: err.response?.data?.message || '删除文件失败',
        variant: 'error',
      });
    }
  };

  const handleDownloadFile = async (fileId: string) => {
    try {
      const blob = await filesApi.downloadFile(fileId);
      const file = files.find(f => f.id === fileId);
      if (!file) return;

      // 创建下载链接
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      setError(err.response?.data?.message || '下载文件失败');
      toast({
        title: '下载失败',
        description: err.response?.data?.message || '下载文件失败',
        variant: 'error',
      });
    }
  };

  const handleShareFile = async (fileId: string) => {
    setSharingFile(fileId);
    setShareData({});
    setShareResult(null);
  };

  const handleShareSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sharingFile) return;

    try {
      const data: CreateShareRequest = {};
      if (shareData.code) data.code = shareData.code;
      
      // 验证过期时间
      if (shareData.expires_in) {
        const expiresIn = Number(shareData.expires_in);
        if (isNaN(expiresIn) || expiresIn <= 0) {
          setError('过期时间必须是大于0的整数');
          return;
        }
        data.expires_in = expiresIn;
      }
      
      // 验证下载限制
      if (shareData.download_limit) {
        const downloadLimit = Number(shareData.download_limit);
        if (isNaN(downloadLimit) || downloadLimit <= 0) {
          setError('下载次数限制必须是大于0的整数');
          return;
        }
        data.download_limit = downloadLimit;
      }

      const result = await filesApi.shareFile(sharingFile, data);
      setShareResult(result);
      toast({
        title: '分享成功',
        description: '文件已成功分享',
        variant: 'success',
      });
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || '分享文件失败';
      
      // 特殊处理分享码重复的错误
      if (errorMessage.includes('取件码已被使用')) {
        toast({
          title: '分享码已被使用',
          description: errorMessage,
          variant: 'error',
        });
      } else {
        setError(errorMessage);
        toast({
          title: '分享失败',
          description: errorMessage,
          variant: 'error',
        });
      }
    }
  };

  const handleShareChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // 验证输入
    if (name === 'expires_in' || name === 'download_limit') {
      // 只允许输入正整数
      if (value && (!/^\d+$/.test(value) || parseInt(value) <= 0)) {
        toast({
          title: '输入错误',
          description: `${name === 'expires_in' ? '过期时间' : '下载次数限制'}必须是大于0的整数`,
          variant: 'error',
        });
        return;
      }
    }
    
    setShareData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const copyShareLink = (code: string) => {
    const link = `${window.location.origin}/s/${code}`;
    navigator.clipboard.writeText(link).then(() => {
      toast({
        title: '复制成功',
        description: '分享链接已复制到剪贴板',
        variant: 'success',
      });
    });
  };

  const handleAnonymousShareChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // 验证输入
    if (name === 'expires_in' || name === 'download_limit') {
      // 只允许输入正整数
      if (value && (!/^\d+$/.test(value) || parseInt(value) <= 0)) {
        toast({
          title: '输入错误',
          description: `${name === 'expires_in' ? '过期时间' : '下载次数限制'}必须是大于0的整数`,
          variant: 'error',
        });
        return;
      }
    }
    
    setAnonymousShareData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (loading && files.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-lg">加载中...</p>
      </div>
    );
  }

  // 匿名上传页面
  if (isAnonymousUpload) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main>
          <div className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
            {error && (
              <div className="mb-4 rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">{error}</h3>
                  </div>
                </div>
              </div>
            )}
            
            {success && (
              <div className="mb-4 rounded-md bg-green-50 p-4">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800">{success}</h3>
                  </div>
                </div>
              </div>
            )}
            
            {anonymousShareResult ? (
              <div className="mb-6 rounded-lg bg-white p-6 shadow">
                <h2 className="mb-4 text-lg font-medium text-green-700">文件上传成功！</h2>
                <div className="rounded-md bg-green-50 p-4">
                  <p className="mb-2 text-sm text-green-800">您的文件已成功上传并生成分享链接：</p>
                  <div className="mb-4 flex items-center rounded-md bg-white p-3 shadow-sm">
                    <span className="mr-2 text-gray-700">{window.location.origin}/s/{anonymousShareResult.code}</span>
                    <button
                      onClick={() => copyShareLink(anonymousShareResult.code)}
                      className="ml-auto rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100"
                    >
                      复制链接
                    </button>
                  </div>
                  <p className="mb-2 text-sm text-green-800">分享码：</p>
                  <div className="mb-4 flex items-center rounded-md bg-white p-3 shadow-sm">
                    <span className="text-xl font-bold text-gray-700">{anonymousShareResult.code}</span>
                    <button
                      onClick={() => navigator.clipboard.writeText(anonymousShareResult.code)}
                      className="ml-auto rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100"
                    >
                      复制代码
                    </button>
                  </div>
                  {anonymousShareResult.file && (
                    <p className="text-sm text-gray-600">
                      文件名：{anonymousShareResult.file.name}
                    </p>
                  )}
                  {anonymousShareResult.expires_at && (
                    <p className="text-sm text-gray-600">
                      过期时间：{formatDate(anonymousShareResult.expires_at)}
                    </p>
                  )}
                  {anonymousShareResult.download_limit && anonymousShareResult.download_limit > 0 && (
                    <p className="text-sm text-gray-600">
                      下载次数限制：{anonymousShareResult.download_limit} 次
                    </p>
                  )}
                  <div className="mt-4">
                    <Button onClick={() => setAnonymousShareResult(null)}>上传新文件</Button>
                    <Button
                      onClick={() => navigate('/')}
                      className="bg-blue-600 text-white hover:bg-blue-700 ml-2"
                    >
                      返回首页
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mb-6 rounded-lg bg-white p-6 shadow">
                <h2 className="mb-4 text-lg font-medium">上传文件并分享</h2>
                <p className="mb-4 text-gray-600">
                  上传文件后将自动生成分享链接，您可以将链接分享给他人，无需注册账号。
                </p>
                
                <div className="mb-6 grid grid-cols-1 gap-6 sm:grid-cols-3">
                  <div className="flex flex-col items-start">
                    <label htmlFor="anonymous-code" className="block w-full text-sm font-medium text-gray-700">
                      自定义分享码 (可选)
                    </label>
                    <input
                      type="text"
                      id="anonymous-code"
                      name="code"
                      className="mt-1 block w-full max-w-[180px] rounded-lg border-2 border-gray-300 py-2.5 px-4 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      value={anonymousShareData.code || ''}
                      onChange={handleAnonymousShareChange}
                      placeholder="留空将自动生成"
                    />
                    <p className="mt-1 w-full max-w-[180px] text-xs text-gray-500">设置便于记忆的分享码</p>
                  </div>
                  <div className="flex flex-col items-start">
                    <label htmlFor="anonymous-expires-in" className="block w-full text-sm font-medium text-gray-700">
                      过期时间 (小时, 可选)
                    </label>
                    <input
                      type="number"
                      id="anonymous-expires-in"
                      name="expires_in"
                      min="1"
                      step="1"
                      className="mt-1 block w-full max-w-[180px] rounded-lg border-2 border-gray-300 py-2.5 px-4 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      value={anonymousShareData.expires_in || ''}
                      onChange={handleAnonymousShareChange}
                      placeholder="默认1小时"
                      onKeyPress={(e) => {
                        // 只允许输入数字
                        if (!/\d/.test(e.key)) {
                          e.preventDefault();
                        }
                      }}
                    />
                    <p className="mt-1 w-full max-w-[180px] text-xs text-gray-500">必须是大于0的整数</p>
                  </div>
                  <div className="flex flex-col items-start">
                    <label htmlFor="anonymous-download-limit" className="block w-full text-sm font-medium text-gray-700">
                      下载次数限制 (可选)
                    </label>
                    <input
                      type="number"
                      id="anonymous-download-limit"
                      name="download_limit"
                      min="1"
                      step="1"
                      className="mt-1 block w-full max-w-[180px] rounded-lg border-2 border-gray-300 py-2.5 px-4 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      value={anonymousShareData.download_limit || ''}
                      onChange={handleAnonymousShareChange}
                      placeholder="默认无限制"
                      onKeyPress={(e) => {
                        // 只允许输入数字
                        if (!/\d/.test(e.key)) {
                          e.preventDefault();
                        }
                      }}
                    />
                    <p className="mt-1 w-full max-w-[180px] text-xs text-gray-500">必须是大于0的整数</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    onChange={handleFileUpload}
                    disabled={uploadingFile}
                  />
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingFile}
                  >
                    {uploadingFile ? '上传中...' : '选择文件'}
                  </Button>
                  <span className="text-sm text-gray-500">选择一个文件上传</span>
                </div>
                
                <div className="mt-6 flex justify-center">
                  <Button
                    onClick={() => navigate('/')}
                    className="bg-blue-600 text-white hover:bg-blue-700"
                  >
                    返回首页
                  </Button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  // 常规文件管理页面
  return (
    <div className="min-h-screen bg-gray-50">
      <main>
        <div className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
          {error && (
            <div className="mb-4 rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">{error}</h3>
                </div>
              </div>
            </div>
          )}
          
          {success && (
            <div className="mb-4 rounded-md bg-green-50 p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">{success}</h3>
                </div>
              </div>
            </div>
          )}

          <div className="mb-6 rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-lg font-medium">上传新文件</h2>
            <div className="flex items-center space-x-4">
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleFileUpload}
                disabled={uploadingFile}
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingFile}
              >
                {uploadingFile ? '上传中...' : '选择文件'}
              </Button>
              <span className="text-sm text-gray-500">选择一个文件上传</span>
            </div>
          </div>

          {sharingFile && (
            <div className="mb-6 rounded-lg bg-white p-6 shadow">
              <h2 className="mb-4 text-lg font-medium">分享文件</h2>
              {shareResult ? (
                <div className="rounded-md bg-green-50 p-4">
                  <h3 className="text-sm font-medium text-green-800">文件已成功分享</h3>
                  <div className="mt-2 text-sm text-green-700">
                    <p>分享链接: {window.location.origin}/s/{shareResult.code}</p>
                    <p>分享码: {shareResult.code}</p>
                  </div>
                  <div className="mt-4">
                    <Button onClick={() => setSharingFile(null)}>关闭</Button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleShareSubmit}>
                  <div className="mb-4 grid grid-cols-1 gap-6 sm:grid-cols-3">
                    <div className="flex flex-col items-start">
                      <label htmlFor="code" className="block w-full text-sm font-medium text-gray-700">
                        自定义分享码 (可选)
                      </label>
                      <input
                        type="text"
                        id="code"
                        name="code"
                        className="mt-1 block w-full max-w-[180px] rounded-lg border-2 border-gray-300 py-2.5 px-4 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        value={shareData.code || ''}
                        onChange={handleShareChange}
                        placeholder="留空将自动生成"
                      />
                      <p className="mt-1 w-full max-w-[180px] text-xs text-gray-500">设置便于记忆的分享码</p>
                    </div>
                    <div className="flex flex-col items-start">
                      <label htmlFor="expires_in" className="block w-full text-sm font-medium text-gray-700">
                        过期时间 (小时, 可选)
                      </label>
                      <input
                        type="number"
                        id="expires_in"
                        name="expires_in"
                        min="1"
                        step="1"
                        className="mt-1 block w-full max-w-[180px] rounded-lg border-2 border-gray-300 py-2.5 px-4 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        value={shareData.expires_in || ''}
                        onChange={handleShareChange}
                        placeholder="默认1小时"
                        onKeyPress={(e) => {
                          // 只允许输入数字
                          if (!/\d/.test(e.key)) {
                            e.preventDefault();
                          }
                        }}
                      />
                      <p className="mt-1 w-full max-w-[180px] text-xs text-gray-500">必须是大于0的整数</p>
                    </div>
                    <div className="flex flex-col items-start">
                      <label htmlFor="download_limit" className="block w-full text-sm font-medium text-gray-700">
                        下载次数限制 (可选)
                      </label>
                      <input
                        type="number"
                        id="download_limit"
                        name="download_limit"
                        min="1"
                        step="1"
                        className="mt-1 block w-full max-w-[180px] rounded-lg border-2 border-gray-300 py-2.5 px-4 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        value={shareData.download_limit || ''}
                        onChange={handleShareChange}
                        placeholder="默认无限制"
                        onKeyPress={(e) => {
                          // 只允许输入数字
                          if (!/\d/.test(e.key)) {
                            e.preventDefault();
                          }
                        }}
                      />
                      <p className="mt-1 w-full max-w-[180px] text-xs text-gray-500">必须是大于0的整数</p>
                    </div>
                  </div>
                  <div className="flex space-x-4">
                    <Button type="submit">创建分享</Button>
                    <Button variant="outline" onClick={() => setSharingFile(null)}>
                      取消
                    </Button>
                  </div>
                </form>
              )}
            </div>
          )}

          <div className="rounded-lg bg-white shadow">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                    >
                      文件名
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                    >
                      大小
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                    >
                      上传时间
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
                    >
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {files.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                        暂无文件
                      </td>
                    </tr>
                  ) : (
                    files.map((file) => (
                      <tr key={file.id}>
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="flex items-center">
                            <span className="mr-2 text-xl">{getFileIcon(file.content_type)}</span>
                            <div className="text-sm font-medium text-gray-900">{file.name}</div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                          {formatBytes(file.size)}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                          {formatDate(file.created_at)}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleDownloadFile(file.id)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              下载
                            </button>
                            <button
                              onClick={() => handleShareFile(file.id)}
                              className="text-green-600 hover:text-green-900"
                            >
                              分享
                            </button>
                            <button
                              onClick={() => handleDeleteFile(file.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              删除
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Files;
