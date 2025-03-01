import apiClient from './client'

// 用户类型定义
export interface User {
  id: string
  username?: string
  email: string
  is_admin: boolean
  created_at: string
  updated_at: string
}

// 登录请求参数
export interface LoginRequest {
  email: string
  password: string
}

// 注册请求参数
export interface RegisterRequest {
  username: string
  email: string
  password: string
}

// 登录响应
export interface AuthResponse {
  access_token: string
  refresh_token: string
  expires_at?: string
  user_id?: string
  email?: string
  username?: string
  is_admin?: boolean
  user?: User
}

// 认证相关API
const authApi = {
  // 登录
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/login', data)
    console.log('登录响应:', response.data);
    
    if (response.data && response.data.access_token) {
      // 保存token到本地存储
      localStorage.setItem('token', response.data.access_token)
      localStorage.setItem('refresh_token', response.data.refresh_token)
      
      // 构建用户对象
      const user: User = {
        id: response.data.user_id || '',
        username: response.data.username || '', // 可能为空
        email: response.data.email || '',
        is_admin: response.data.is_admin || false,
        created_at: '',
        updated_at: ''
      };
      
      // 保存用户信息
      localStorage.setItem('user', JSON.stringify(user))
      
      // 返回响应，添加构建的用户对象
      return {
        ...response.data,
        user
      };
    } else {
      console.error('登录响应中缺少必要信息:', response.data);
      throw new Error('登录响应中缺少必要信息');
    }
  },

  // 注册
  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/register', data)
    console.log('注册响应:', response.data);
    
    if (response.data && response.data.access_token) {
      // 保存token到本地存储
      localStorage.setItem('token', response.data.access_token)
      localStorage.setItem('refresh_token', response.data.refresh_token)
      
      // 构建用户对象
      const user: User = {
        id: response.data.user_id || '',
        username: response.data.username || data.username || '', // 使用请求中的用户名作为备选
        email: response.data.email || data.email || '', // 使用请求中的邮箱作为备选
        is_admin: response.data.is_admin || false,
        created_at: '',
        updated_at: ''
      };
      
      // 保存用户信息
      localStorage.setItem('user', JSON.stringify(user))
      
      // 返回响应，添加构建的用户对象
      return {
        ...response.data,
        user
      };
    } else {
      console.error('注册响应中缺少必要信息:', response.data);
      throw new Error('注册响应中缺少必要信息');
    }
  },

  // 获取当前用户信息
  getCurrentUser: async (): Promise<User> => {
    try {
      const response = await apiClient.get<any>('/auth/me')
      console.log('API返回的用户信息:', response.data);
      
      // 检查响应中是否包含必要的用户信息
      if (response.data && response.data.email) {
        // 构建标准的用户对象
        const user: User = {
          id: response.data.id || response.data.user_id || '',
          username: response.data.username || '', // 可能为空
          email: response.data.email || '',
          is_admin: response.data.is_admin || false,
          created_at: response.data.created_at || '',
          updated_at: response.data.updated_at || ''
        };
        
        // 更新本地存储的用户信息
        localStorage.setItem('user', JSON.stringify(user));
        return user;
      } else {
        console.error('API返回的用户信息不完整:', response.data);
        throw new Error('用户信息不完整');
      }
    } catch (error) {
      console.error('获取用户信息失败:', error);
      
      // 尝试从本地存储获取用户信息作为备选
      const userStr = localStorage.getItem('user');
      if (userStr && userStr !== 'undefined' && userStr !== 'null') {
        try {
          const userData = JSON.parse(userStr);
          if (userData && userData.email) {
            console.log('从localStorage获取的备选用户信息:', userData);
            return userData;
          }
        } catch (e) {
          console.error('解析本地存储的用户信息失败:', e);
        }
      }
      
      throw error;
    }
  },

  // 刷新token
  refreshToken: async (): Promise<AuthResponse> => {
    const refreshToken = localStorage.getItem('refresh_token')
    if (!refreshToken) {
      throw new Error('No refresh token available')
    }
    
    const response = await apiClient.post<AuthResponse>('/auth/refresh', {
      refresh_token: refreshToken
    })
    
    // 更新token
    localStorage.setItem('token', response.data.access_token)
    localStorage.setItem('refresh_token', response.data.refresh_token)
    
    return response.data
  },

  // 登出
  logout: async (): Promise<void> => {
    localStorage.removeItem('token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user')
  }
}

export default authApi 