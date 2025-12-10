import { useState, useEffect } from 'react';
import { Plus, Trash2, Save } from 'lucide-react';

interface Channel {
  id: number;
  type: string;
  config: string;
  enabled: number;
}

export default function Settings() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    loadChannels();
  }, []);

  async function loadChannels() {
    try {
      const res = await fetch('/api/channels');
      const data = await res.json();
      setChannels(data);
    } catch (err) {
      console.error('Failed to load channels:', err);
    } finally {
      setLoading(false);
    }
  }

  async function deleteChannel(id: number) {
    if (!confirm('确定要删除此通知渠道吗？')) return;

    try {
      await fetch(`/api/channels/${id}`, { method: 'DELETE' });
      loadChannels();
    } catch (err) {
      alert('删除失败');
    }
  }

  async function toggleChannel(channel: Channel) {
    try {
      const config = JSON.parse(channel.config);
      await fetch(`/api/channels/${channel.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: channel.type,
          config,
          enabled: !channel.enabled,
        }),
      });
      loadChannels();
    } catch (err) {
      alert('更新失败');
    }
  }

  if (loading) {
    return <div className="text-center py-12 text-gray-600">加载中...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">通知设置</h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus size={16} />
          添加通知渠道
        </button>
      </div>

      <div className="space-y-4">
        {channels.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            暂无通知渠道，请添加一个
          </div>
        ) : (
          channels.map((channel) => {
            const config = JSON.parse(channel.config);
            return (
              <div key={channel.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                        {channel.type === 'tg' && 'Telegram'}
                        {channel.type === 'email' && 'Email'}
                        {channel.type === 'webhook' && 'Webhook'}
                      </span>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={channel.enabled === 1}
                          onChange={() => toggleChannel(channel)}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-600">已启用</span>
                      </label>
                    </div>

                    <div className="text-sm text-gray-600 space-y-1">
                      {channel.type === 'tg' && (
                        <>
                          <div>Chat ID: {config.chat_id}</div>
                          <div>Token: {config.token?.substring(0, 20)}...</div>
                        </>
                      )}
                      {channel.type === 'email' && (
                        <>
                          <div>Provider: {config.provider}</div>
                          <div>To: {config.to}</div>
                          <div>From: {config.from}</div>
                        </>
                      )}
                      {channel.type === 'webhook' && (
                        <>
                          <div>URL: {config.url}</div>
                        </>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => deleteChannel(channel.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {showAddModal && (
        <AddChannelModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            loadChannels();
          }}
        />
      )}
    </div>
  );
}

function AddChannelModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [type, setType] = useState<'tg' | 'email' | 'webhook'>('tg');
  const [config, setConfig] = useState<any>({});
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/channels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          config,
          enabled: true,
        }),
      });

      if (res.ok) {
        onSuccess();
      } else {
        alert('添加失败');
      }
    } catch (err) {
      alert('网络错误');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h3 className="text-lg font-semibold mb-4">添加通知渠道</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">类型</label>
            <select
              value={type}
              onChange={(e) => {
                setType(e.target.value as any);
                setConfig({});
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="tg">Telegram</option>
              <option value="email">Email</option>
              <option value="webhook">Webhook</option>
            </select>
          </div>

          {type === 'tg' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bot Token</label>
                <input
                  type="text"
                  value={config.token || ''}
                  onChange={(e) => setConfig({ ...config, token: e.target.value })}
                  placeholder="123456:ABC-DEF..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Chat ID</label>
                <input
                  type="text"
                  value={config.chat_id || ''}
                  onChange={(e) => setConfig({ ...config, chat_id: e.target.value })}
                  placeholder="-1001234567890"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </>
          )}

          {type === 'email' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Provider</label>
                <select
                  value={config.provider || 'sendgrid'}
                  onChange={(e) => setConfig({ ...config, provider: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="sendgrid">SendGrid</option>
                  <option value="mailgun">Mailgun</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">API Key</label>
                <input
                  type="text"
                  value={config.api_key || ''}
                  onChange={(e) => setConfig({ ...config, api_key: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">From</label>
                <input
                  type="email"
                  value={config.from || ''}
                  onChange={(e) => setConfig({ ...config, from: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">To</label>
                <input
                  type="email"
                  value={config.to || ''}
                  onChange={(e) => setConfig({ ...config, to: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              {config.provider === 'mailgun' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Domain</label>
                  <input
                    type="text"
                    value={config.domain || ''}
                    onChange={(e) => setConfig({ ...config, domain: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              )}
            </>
          )}

          {type === 'webhook' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Webhook URL</label>
              <input
                type="url"
                value={config.url || ''}
                onChange={(e) => setConfig({ ...config, url: e.target.value })}
                placeholder="https://..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              disabled={loading}
            >
              取消
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400"
              disabled={loading}
            >
              {loading ? '添加中...' : '添加'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}