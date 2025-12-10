import { useState, useEffect } from 'react';
import DomainTable from '../components/DomainTable';
import AddDomainModal from '../components/AddDomainModal';
import { Plus, Download, Upload, RefreshCw } from 'lucide-react';

interface Domain {
  id: number;
  domain: string;
  mode: string;
  provider: string | null;
  expire_at: string | null;
  registrar: string | null;
  auto_refresh: number;
  check_interval: number;
  last_check: string | null;
  notes: string | null;
  group_name: string | null;
  created_at: string;
}

export default function Dashboard() {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filter, setFilter] = useState('all');
  const [groupFilter, setGroupFilter] = useState('all');

  useEffect(() => {
    loadDomains();
  }, []);

  async function loadDomains() {
    try {
      const res = await fetch('/api/domains');
      const data = await res.json();
      setDomains(data);
    } catch (err) {
      console.error('Failed to load domains:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleExport() {
    try {
      const res = await fetch('/api/export');
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `domains-export-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('导出失败');
    }
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      const res = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        alert('导入成功');
        loadDomains();
      } else {
        alert('导入失败');
      }
    } catch (err) {
      alert('文件格式错误');
    }
  }

  async function handleRefreshAll() {
    if (!confirm('确定要刷新所有自动模式的域名吗？')) return;
    
    setLoading(true);
    for (const domain of domains) {
      if (domain.mode === 'auto') {
        try {
          await fetch(`/api/check/${domain.id}`);
        } catch (err) {
          console.error(`Failed to check ${domain.domain}:`, err);
        }
      }
    }
    await loadDomains();
    alert('刷新完成');
  }

  const groups = Array.from(new Set(domains.map(d => d.group_name).filter(Boolean))) as string[];
  
  const filteredDomains = domains.filter(d => {
    if (groupFilter !== 'all' && d.group_name !== groupFilter) return false;
    
    if (filter === 'expiring') {
      if (!d.expire_at) return false;
      const days = Math.ceil((new Date(d.expire_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      return days <= 30 && days > 0;
    }
    
    if (filter === 'expired') {
      if (!d.expire_at) return false;
      const days = Math.ceil((new Date(d.expire_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      return days <= 0;
    }
    
    return true;
  });

  const stats = {
    total: domains.length,
    expiring: domains.filter(d => {
      if (!d.expire_at) return false;
      const days = Math.ceil((new Date(d.expire_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      return days <= 30 && days > 0;
    }).length,
    expired: domains.filter(d => {
      if (!d.expire_at) return false;
      const days = Math.ceil((new Date(d.expire_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      return days <= 0;
    }).length,
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-600">加载中...</div>;
  }

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">总域名数</div>
          <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">即将到期</div>
          <div className="text-3xl font-bold text-orange-600">{stats.expiring}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">已过期</div>
          <div className="text-3xl font-bold text-red-600">{stats.expired}</div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-4 border-b flex flex-wrap gap-3 items-center justify-between">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              全部
            </button>
            <button
              onClick={() => setFilter('expiring')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                filter === 'expiring' ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              即将到期
            </button>
            <button
              onClick={() => setFilter('expired')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                filter === 'expired' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              已过期
            </button>

            {groups.length > 0 && (
              <select
                value={groupFilter}
                onChange={(e) => setGroupFilter(e.target.value)}
                className="px-4 py-2 rounded-md text-sm font-medium bg-gray-100 text-gray-700 border-0"
              >
                <option value="all">所有分组</option>
                {groups.map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleRefreshAll}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2 text-sm"
            >
              <RefreshCw size={16} />
              刷新全部
            </button>
            <button
              onClick={handleExport}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 flex items-center gap-2 text-sm"
            >
              <Download size={16} />
              导出
            </button>
            <label className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 flex items-center gap-2 cursor-pointer text-sm">
              <Upload size={16} />
              导入
              <input type="file" accept=".json" onChange={handleImport} className="hidden" />
            </label>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2 text-sm"
            >
              <Plus size={16} />
              添加域名
            </button>
          </div>
        </div>

        <DomainTable domains={filteredDomains} onUpdate={loadDomains} />
      </div>

      {showAddModal && (
        <AddDomainModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            loadDomains();
          }}
        />
      )}
    </div>
  );
}