import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import authApi from '../api/auth'
import { useToast } from '../hooks/useToast'

// 密码验证函数
const isValidPassword = (password: string): boolean => {
  return password.length >= 8 && /[A-Za-z]/.test(password) && /[0-9]/.test(password);
};

export default function Register() {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordTouched, setPasswordTouched] = useState(false)
  const navigate = useNavigate()
  const { toast } = useToast()

  // 当密码变化时验证密码
  useEffect(() => {
    if (passwordTouched) {
      if (password.length === 0) {
        setPasswordError('密码不能为空');
      } else if (password.length < 8) {
        setPasswordError('密码长度至少为8位');
      } else if (!/[A-Za-z]/.test(password)) {
        setPasswordError('密码必须包含字母');
      } else if (!/[0-9]/.test(password)) {
        setPasswordError('密码必须包含数字');
      } else {
        setPasswordError('');
      }
    }
  }, [password, passwordTouched]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!username || !email || !password) {
      toast({
        variant: 'error',
        title: '输入错误',
        description: '请填写所有必填字段',
      })
      return
    }
    
    if (password !== confirmPassword) {
      toast({
        variant: 'error',
        title: '密码不匹配',
        description: '两次输入的密码不一致',
      })
      return
    }
    
    // 验证密码强度
    if (!isValidPassword(password)) {
      toast({
        variant: 'error',
        title: '密码不符合要求',
        description: '密码必须至少包含8个字符，且包含字母和数字',
      })
      return
    }
    
    try {
      setLoading(true)
      await authApi.register({ username, email, password })
      toast({
        variant: 'success',
        title: '注册成功',
        description: '您的账号已创建成功！',
      })
      navigate('/dashboard')
    } catch (error: any) {
      console.error('注册失败:', error)
      toast({
        variant: 'error',
        title: '注册失败',
        description: error.response?.data?.message || '注册失败，请稍后重试',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            注册新账号
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            已有账号？{' '}
            <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
              登录
            </Link>
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4 rounded-md shadow-sm">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                用户名
              </label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                className="relative block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                placeholder="用户名"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="email-address" className="block text-sm font-medium text-gray-700">
                邮箱地址
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="relative block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                placeholder="邮箱地址"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                密码
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                className={`relative block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 ring-1 ring-inset ${
                  passwordError && passwordTouched ? 'ring-red-500' : 'ring-gray-300'
                } placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6`}
                placeholder="密码（至少8位，包含字母和数字）"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => setPasswordTouched(true)}
              />
              {passwordError && passwordTouched && (
                <p className="mt-1 text-sm text-red-600">{passwordError}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">密码必须至少包含8个字符，且包含字母和数字</p>
            </div>
            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">
                确认密码
              </label>
              <input
                id="confirm-password"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                className={`relative block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 ring-1 ring-inset ${
                  password !== confirmPassword && confirmPassword ? 'ring-red-500' : 'ring-gray-300'
                } placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6`}
                placeholder="确认密码"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              {password !== confirmPassword && confirmPassword && (
                <p className="mt-1 text-sm text-red-600">两次输入的密码不一致</p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading || !!passwordError || password !== confirmPassword}
              className={`group relative flex w-full justify-center rounded-md bg-blue-600 py-2 px-3 text-sm font-semibold text-white hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
                (loading || !!passwordError || password !== confirmPassword) ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {loading ? '注册中...' : '注册'}
            </button>
          </div>
          
          <div className="mt-4 text-center">
            <Link 
              to="/" 
              className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              返回首页
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
} 