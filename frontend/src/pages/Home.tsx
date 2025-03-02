import { useNavigate } from 'react-router-dom'
import { useState } from 'react'

export default function Home() {
  const navigate = useNavigate()
  const [shareCode, setShareCode] = useState('')

  const handleViewSharedFile = () => {
    if (shareCode.trim()) {
      navigate(`/s/${shareCode.trim()}`)
    }
  }

  return (
    <div className="bg-white">
      {/* 顶部导航栏 */}
      <header className="absolute inset-x-0 top-0 z-50">
        <nav className="flex items-center justify-between p-6 lg:px-8" aria-label="Global">
          <div className="flex lg:flex-1">
            <a href="/" className="-m-1.5 p-1.5">
              <span className="text-2xl font-bold text-blue-600">FileBox</span>
            </a>
          </div>
          <div className="flex gap-x-4 lg:gap-x-6">
            <button
              onClick={() => navigate('/login')}
              className="text-sm font-semibold leading-6 text-gray-900"
            >
              登录
            </button>
            <button
              onClick={() => navigate('/register')}
              className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              注册
            </button>
          </div>
        </nav>
      </header>

      <div className="relative isolate px-6 pt-14 lg:px-8">
        <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
          <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"></div>
        </div>
        
        <div className="mx-auto max-w-2xl py-32 sm:py-48 lg:py-56">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
              FileBox - 简单、安全的文件分享
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              轻松上传、管理和分享您的文件，设置过期时间和下载限制，保护您的数据安全。
            </p>
            
            {/* 取件码输入框和按钮 */}
            <div className="mt-10">
              <div className="flex items-center justify-center">
                <div className="relative w-full max-w-md">
                  <input
                    type="text"
                    value={shareCode}
                    onChange={(e) => setShareCode(e.target.value)}
                    placeholder="请输入取件码"
                    className="block w-full rounded-md border-0 py-3 pl-4 pr-24 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                  />
                  <button
                    onClick={handleViewSharedFile}
                    className="absolute inset-y-0 right-0 flex items-center px-4 mr-1 my-1 rounded-md bg-blue-600 text-white hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
                  >
                    取件
                  </button>
                </div>
              </div>
              <div className="mt-6">
                <button
                  onClick={() => navigate('/anonymous-upload')}
                  className="rounded-md bg-blue-600 px-5 py-3 text-base font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                >
                  安全寄送
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]">
          <div className="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]"></div>
        </div>
      </div>
      
      <div className="bg-gray-50 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center">
            <h2 className="text-base font-semibold leading-7 text-blue-600">更快、更简单</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              为什么选择 FileBox？
            </p>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              FileBox 提供简单而强大的文件分享功能，让您轻松管理和分享文件。
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-2 lg:gap-y-16">
              <div className="relative pl-16">
                <dt className="text-base font-semibold leading-7 text-gray-900">
                  <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  简单易用
                </dt>
                <dd className="mt-2 text-base leading-7 text-gray-600">
                  直观的用户界面，让您轻松上传、管理和分享文件，无需复杂的操作。
                </dd>
              </div>
              <div className="relative pl-16">
                <dt className="text-base font-semibold leading-7 text-gray-900">
                  <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                    </svg>
                  </div>
                  安全可靠
                </dt>
                <dd className="mt-2 text-base leading-7 text-gray-600">
                  设置过期时间和下载限制，确保您的文件只被授权的人访问。
                </dd>
              </div>
              <div className="relative pl-16">
                <dt className="text-base font-semibold leading-7 text-gray-900">
                  <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                    </svg>
                  </div>
                  快速分享
                </dt>
                <dd className="mt-2 text-base leading-7 text-gray-600">
                  一键生成分享链接，快速分享给朋友、同事或家人。
                </dd>
              </div>
              <div className="relative pl-16">
                <dt className="text-base font-semibold leading-7 text-gray-900">
                  <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" />
                    </svg>
                  </div>
                  多平台支持
                </dt>
                <dd className="mt-2 text-base leading-7 text-gray-600">
                  在任何设备上访问您的文件，包括电脑、平板和手机。
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
      
      <footer className="bg-gray-900">
        <div className="mx-auto max-w-7xl px-6 py-12 md:flex md:items-center md:justify-between lg:px-8">
          <div className="flex flex-col md:flex-row md:justify-between w-full">
            <div className="mb-8 md:mb-0">
              <h3 className="text-sm font-semibold leading-6 text-white">关于作者</h3>
              <ul className="mt-6 space-y-4">
                <li>
                  <a href="https://blog.zaunist.com" target="_blank" rel="noopener noreferrer" className="text-sm leading-6 text-gray-300 hover:text-white">
                    <span className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                      </svg>
                      博客
                    </span>
                  </a>
                </li>
                <li>
                  <a href="https://www.youtube.com/@zaunist" target="_blank" rel="noopener noreferrer" className="text-sm leading-6 text-gray-300 hover:text-white">
                    <span className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      YouTube频道
                    </span>
                  </a>
                </li>
                <li>
                  <a href="https://t.me/real_zaunist" target="_blank" rel="noopener noreferrer" className="text-sm leading-6 text-gray-300 hover:text-white">
                    <span className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                      Telegram群组
                    </span>
                  </a>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-sm font-semibold leading-6 text-white">FileBox</h3>
              <p className="mt-2 text-sm leading-6 text-gray-300">
                简单、安全的临时文件分享解决方案
              </p>
              <p className="mt-4 text-sm leading-6 text-gray-300">
                © {new Date().getFullYear()} FileBox. 保留所有权利。
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
} 