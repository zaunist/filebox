import { Routes, Route } from 'react-router-dom'
import { ToastProvider } from './components/ui/Toast'
import { Toaster } from './hooks/useToast'
import { useState, useEffect } from 'react'
import authApi from './api/auth'

// 导入页面组件
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Files from './pages/Files'
import Shared from './pages/Shared'
import ShareView from './pages/ShareView'
import NotFound from './pages/NotFound'
import Navigation from './components/Navigation'

function App() {
  const [username, setUsername] = useState<string | undefined>(undefined)

  useEffect(() => {
    // 尝试获取当前用户信息
    const fetchCurrentUser = async () => {
      try {
        // 首先尝试从localStorage获取用户信息
        const userStr = localStorage.getItem('user');
        if (userStr && userStr !== 'undefined' && userStr !== 'null') {
          try {
            const userData = JSON.parse(userStr);
            if (userData && userData.email) {
              setUsername(userData.username || userData.email);
              console.log('从localStorage获取的用户名:', userData.username || userData.email);
            }
          } catch (e) {
            console.error('解析localStorage中的用户信息失败:', e);
          }
        }
        
        // 然后从API获取最新的用户信息
        const response = await authApi.getCurrentUser()
        console.log('从API获取的用户信息:', response);
        if (response && response.email) {
          setUsername(response.username || response.email)
          // 更新localStorage中的用户信息
          localStorage.setItem('user', JSON.stringify(response));
        } else {
          console.error('API返回的用户信息不完整:', response);
        }
      } catch (error) {
        console.error('获取用户信息失败', error)
      }
    }

    if (localStorage.getItem('token')) {
      fetchCurrentUser()
    }
  }, [])

  return (
    <>
      <ToastProvider>
        <Navigation username={username} />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/files" element={<Files />} />
          <Route path="/shared" element={<Shared />} />
          <Route path="/s/:code" element={<ShareView />} />
          <Route path="/anonymous-upload" element={<Files />} />
          <Route path="/admin" element={<div>管理员页面 - 即将推出</div>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Toaster />
      </ToastProvider>
    </>
  )
}

export default App
