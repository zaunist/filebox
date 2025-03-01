import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import authApi, { User } from '../api/auth';
import filesApi, { File, FileListResponse } from '../api/files';
import { useToast } from '../hooks/useToast';
import { formatBytes, formatDate } from '../utils/format';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileList | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        // 首先尝试从localStorage获取用户信息
        const userStr = localStorage.getItem('user');
        if (userStr && userStr !== 'undefined' && userStr !== 'null') {
          try {
            const userData = JSON.parse(userStr);
            if (userData && userData.email) {
              setUser(userData);
              console.log('从localStorage获取的用户信息:', userData);
            }
          } catch (e) {
            console.error('解析localStorage中的用户信息失败:', e);
          }
        }
        
        // 然后从API获取最新的用户信息
        const userData = await authApi.getCurrentUser();
        console.log('从API获取到的用户信息:', userData); // 调试信息
        if (userData && userData.email) {
          setUser(userData);
          // 更新localStorage中的用户信息
          localStorage.setItem('user', JSON.stringify(userData));
        } else {
          console.error('API返回的用户信息不完整:', userData);
        }
      } catch (error) {
        console.error('获取用户信息失败:', error);
        // 如果获取用户信息失败，重定向到登录页
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [navigate]);

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const response = await filesApi.getFiles();
      setFiles(response.files);
    } catch (error: any) {
      console.error('获取文件失败:', error);
      toast({
        variant: 'error',
        title: '获取文件失败',
        description: error.response?.data?.message || '无法获取您的文件列表',
      });
      
      // 如果是401错误，可能是未登录或token过期
      if (error.response?.status === 401) {
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authApi.logout();
      navigate('/login');
    } catch (error) {
      console.error('登出失败', error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile || selectedFile.length === 0) {
      toast({
        variant: 'error',
        title: '请选择文件',
        description: '请先选择要上传的文件',
      });
      return;
    }
    
    try {
      setUploading(true);
      const file = selectedFile[0];
      
      await filesApi.uploadFile(file);
      
      toast({
        variant: 'success',
        title: '上传成功',
        description: '文件已成功上传',
      });
      
      // 重新获取文件列表
      fetchFiles();
      
      // 清空选择的文件
      setSelectedFile(null);
      if (document.getElementById('file-upload') as HTMLInputElement) {
        (document.getElementById('file-upload') as HTMLInputElement).value = '';
      }
    } catch (error: any) {
      console.error('上传失败:', error);
      toast({
        variant: 'error',
        title: '上传失败',
        description: error.response?.data?.message || '文件上传失败，请稍后重试',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    if (!confirm('确定要删除这个文件吗？此操作不可撤销。')) {
      return;
    }
    
    try {
      await filesApi.deleteFile(fileId);
      
      toast({
        variant: 'success',
        title: '删除成功',
        description: '文件已成功删除',
      });
      
      // 更新文件列表
      setFiles(files.filter(file => file.id !== fileId));
    } catch (error: any) {
      console.error('删除失败:', error);
      toast({
        variant: 'error',
        title: '删除失败',
        description: error.response?.data?.message || '文件删除失败，请稍后重试',
      });
    }
  };

  const handleCreateShare = async (fileId: string) => {
    try {
      const response = await filesApi.shareFile(fileId, {});
      
      // 复制分享链接到剪贴板
      const shareUrl = `${window.location.origin}/s/${response.code}`;
      await navigator.clipboard.writeText(shareUrl);
      
      toast({
        variant: 'success',
        title: '创建分享成功',
        description: '分享链接已复制到剪贴板',
      });
    } catch (error: any) {
      console.error('创建分享失败:', error);
      toast({
        variant: 'error',
        title: '创建分享失败',
        description: error.response?.data?.message || '无法创建分享链接，请稍后重试',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-lg">加载中...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main>
        <div className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="text-lg font-medium text-gray-900">我的文件</h2>
              <p className="mt-2 text-sm text-gray-500">管理您上传的所有文件</p>
              <div className="mt-4">
                <Button onClick={() => navigate('/files')}>查看文件</Button>
              </div>
            </div>
            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="text-lg font-medium text-gray-900">分享管理</h2>
              <p className="mt-2 text-sm text-gray-500">管理您分享的文件</p>
              <div className="mt-4">
                <Button onClick={() => navigate('/shared')}>查看分享</Button>
              </div>
            </div>
            {user?.is_admin && (
              <div className="rounded-lg bg-white p-6 shadow">
                <h2 className="text-lg font-medium text-gray-900">管理员面板</h2>
                <p className="mt-2 text-sm text-gray-500">管理系统和用户</p>
                <div className="mt-4">
                  <Button onClick={() => navigate('/admin')}>进入管理</Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard; 