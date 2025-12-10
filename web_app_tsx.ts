import { useState, useEffect } from 'react';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import Logs from './pages/Logs';
import { Menu, X } from 'lucide-react';

export default function App() {
  const [authed, setAuthed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'settings' | 'logs'>('dashboard');
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const p = localStorage.getItem('monitor_auth');
    if (p === '1') {
      setAuthed(true);
    }
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">加载中...</div>
      </div>
    );
  }

  if (!authed) {
    return (
      <AuthForm
        onOk={() => {
          localStorage.setItem('monitor_auth', '1');
          setAuthed(true);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">Domain Monitor</h1>
            </div>
            
            <div className="hidden md:flex items-center space-x-4">
              <button
                onClick={() => setCurrentPage('dashboard')}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  currentPage === 'dashboard'
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                仪表盘
              </button>
              <button
                onClick={() => setCurrentPage('settings')}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  currentPage === 'settings'
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                设置
              </button>
              <button
                onClick={() => setCurrentPage('logs')}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  currentPage === 'logs'
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                日志
              </button>
              <button
                onClick={() => {
                  localStorage.removeItem('monitor_auth');
                  setAuthed(false);
                }}
                className="px-3 py-2 rounded-md text-sm font-medium text-red-600 hover:bg-red-50"
              >
                退出
              </button>
            </div>

            <div className="md:hidden flex items-center">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-2 rounded-md text-gray-600 hover:bg-gray-100"
              >
                {menuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {menuOpen && (
          <div className="md:hidden border-t bg-white">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <button
                onClick={() => {
                  setCurrentPage('dashboard');
                  setMenuOpen(false);
                }}
                className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium ${
                  currentPage === 'dashboard'
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                仪表盘
              </button>
              <button
                onClick={() => {
                  setCurrentPage('settings');
                  setMenuOpen(false);
                }}
                className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium ${
                  currentPage === 'settings'
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                设置
              </button>
              <button
                onClick={() => {
                  setCurrentPage('logs');
                  setMenuOpen(false);
                }}
                className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium ${
                  currentPage === 'logs'
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                日志
              </button>
              <button
                onClick={() => {
                  localStorage.removeItem('monitor_auth');
                  setAuthed(false);
                }}
                className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-red-50"
              >
                退出
              </button>
            </div>
          </div>
        )}
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentPage === 'dashboard' && <Dashboard />}
        {currentPage === 'settings' && <Settings />}
        {currentPage === 'logs' && <Logs />}
      </main>
    </div>
  );
}

function AuthForm({ onOk }: { onOk: () => void }) {
  const [pwd, setPwd] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pwd }),
      });

      if (res.ok) {
        onOk();
      } else {
        setError('密码错误');
      }
    } catch (err) {
      setError('网络错误');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <form onSubmit={submit} className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-900">Domain Monitor</h2>
        <p className="text-gray-600 mb-6 text-center">请输入密码以继续</p>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
            {error}
          </div>
        )}

        <input
          type="password"
          value={pwd}
          onChange={(e) => setPwd(e.target.value)}
          placeholder="密码"
          className="w-full px-4 py-3 border border-gray-300 rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={loading}
        />
        
        <button
          type="submit"
          className="w-full py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
          disabled={loading}
        >
          {loading ? '登录中...' : '登录'}
        </button>
      </form>
    </div>
  );
}