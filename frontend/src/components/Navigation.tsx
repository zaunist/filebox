import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import authApi from '../api/auth'

interface NavigationProps {
  username?: string
}

export default function Navigation({ username }: NavigationProps) {
  const location = useLocation()
  const navigate = useNavigate()
  
  const handleLogout = async () => {
    try {
      await authApi.logout()
      navigate('/login')
    } catch (error) {
      console.error('登出失败', error)
    }
  }

  // 如果当前页面是登录、注册或首页，不显示导航栏
  if (location.pathname === '/login' || location.pathname === '/register' || location.pathname === '/' || location.pathname === '/anonymous-upload') {
    return null
  }

  // 如果是分享链接页面，显示简化版导航栏
  if (location.pathname.startsWith('/s/')) {
    return (
      <nav className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between">
            <div className="flex">
              <div className="flex flex-shrink-0 items-center">
                <Link to="/" className="text-xl font-bold text-blue-600">FileBox</Link>
              </div>
            </div>
            <div className="flex items-center">
              {username ? (
                <>
                  <span className="mr-4 text-sm text-gray-700">
                    欢迎, {username}
                  </span>
                  <Link 
                    to="/dashboard" 
                    className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100"
                  >
                    进入仪表盘
                  </Link>
                </>
              ) : (
                <>
                  <Link 
                    to="/login" 
                    className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 mr-2"
                  >
                    登录
                  </Link>
                  <Link 
                    to="/register" 
                    className="px-3 py-2 rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700"
                  >
                    注册
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>
    )
  }

  return (
    <nav className="bg-white shadow">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between">
          <div className="flex">
            <div className="flex flex-shrink-0 items-center">
              <Link to="/dashboard" className="text-xl font-bold text-blue-600">FileBox</Link>
            </div>
            <div className="ml-6 flex items-center space-x-4">
              <Link 
                to="/dashboard" 
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  location.pathname === '/dashboard' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                仪表盘
              </Link>
              <Link 
                to="/files" 
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  location.pathname === '/files' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                我的文件
              </Link>
              <Link 
                to="/shared" 
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  location.pathname === '/shared' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                共享管理
              </Link>
            </div>
          </div>
          <div className="flex items-center">
            {username && (
              <span className="mr-4 text-sm text-gray-700">
                欢迎, {username}
              </span>
            )}
            <button
              onClick={handleLogout}
              className="rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
            >
              登出
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
} 