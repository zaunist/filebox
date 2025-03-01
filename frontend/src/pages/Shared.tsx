import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import filesApi, { FileShare } from '../api/files';
import { formatDate } from '../lib/utils';
import { useToast } from '../hooks/useToast';

export default function Shared() {
  const navigate = useNavigate();
  const [shares, setShares] = useState<FileShare[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchShares();
  }, []);

  const fetchShares = async () => {
    try {
      setLoading(true);
      const response = await filesApi.getShares();
      
      // 确保每个分享项都有文件信息
      const sharesWithFileInfo = await Promise.all(response.shares.map(async (share) => {
        // 如果share.file已经存在且有name属性，则直接使用
        if (share.file && share.file.name) {
          return share;
        }
        
        // 否则，尝试获取文件信息
        try {
          const fileInfo = await filesApi.getFile(share.file_id);
          return {
            ...share,
            file: fileInfo
          };
        } catch (error) {
          console.error(`获取文件信息失败，文件ID: ${share.file_id}`, error);
          return share;
        }
      }));
      
      setShares(sharesWithFileInfo);
      setError(null);
    } catch (err: any) {
      console.error('获取共享文件失败:', err);
      setError('获取共享文件失败，请稍后重试');
      toast({
        variant: 'error',
        title: '获取共享文件失败',
        description: '请稍后重试',
      });
      if (err.response?.status === 401) {
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteShare = async (shareId: string) => {
    if (!confirm('确定要删除这个共享链接吗？')) {
      return;
    }

    try {
      await filesApi.deleteShare(shareId);
      setShares(shares.filter(share => share.id !== shareId));
      toast({
        variant: 'success',
        title: '删除成功',
        description: '共享链接已删除',
      });
    } catch (err) {
      console.error('删除共享链接失败:', err);
      toast({
        variant: 'error',
        title: '删除失败',
        description: '无法删除共享链接，请稍后重试',
      });
    }
  };

  const copyShareLink = (shareCode: string) => {
    const shareLink = `${window.location.origin}/s/${shareCode}`;
    navigator.clipboard.writeText(shareLink)
      .then(() => {
        toast({
          variant: 'success',
          title: '复制成功',
          description: '共享链接已复制到剪贴板',
        });
      })
      .catch(() => {
        toast({
          variant: 'error',
          title: '复制失败',
          description: '无法复制链接，请手动复制',
        });
      });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      ) : shares.length === 0 ? (
        <div className="bg-gray-100 p-6 rounded-lg text-center">
          <p className="text-gray-600">您还没有共享任何文件</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded-lg overflow-hidden">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">文件名</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">分享码</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">创建时间</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">过期时间</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">下载次数</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {shares.map((share) => (
                <tr key={share.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {share.file?.name || (
                      <span className="text-yellow-600">
                        {share.file_id ? `文件ID: ${share.file_id}` : '未知文件'}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{share.code}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(share.created_at)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {share.expires_at ? formatDate(share.expires_at) : '永不过期'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{share.download_count}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => copyShareLink(share.code)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      复制链接
                    </button>
                    <button
                      onClick={() => handleDeleteShare(share.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      删除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
} 