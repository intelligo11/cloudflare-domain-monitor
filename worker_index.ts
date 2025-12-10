import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { DB } from './db';
import { fetchExpiryForDomain } from './whois';
import { notifyAll } from './notify';
import type { DomainRow } from './types';

type Bindings = {
  DOMAINS_DB: D1Database;
  PASSWORD: string;
  DAYS: string;
  SITENAME: string;
  CRON_TOKEN: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use('/*', cors());

app.get('/api/domains', async (c) => {
  const db = new DB(c.env.DOMAINS_DB);
  const rows = await db.queryAll(
    'SELECT * FROM domains ORDER BY expire_at IS NULL, expire_at ASC'
  );
  return c.json(rows);
});

app.post('/api/domains', async (c) => {
  const db = new DB(c.env.DOMAINS_DB);
  const body = await c.req.json();
  const domain = (body.domain || '').toLowerCase().trim();
  
  if (!domain) return c.text('domain required', 400);

  const mode = body.mode === 'manual' ? 'manual' : 'auto';

  await db.run(
    `INSERT OR IGNORE INTO domains(domain, mode, provider, notes, expire_at, group_name) VALUES(?,?,?,?,?,?)`,
    [domain, mode, body.provider || null, body.notes || null, body.expire_at || null, body.group_name || null]
  );

  if (mode === 'auto') {
    try {
      const expiry = await fetchExpiryForDomain(domain);
      if (expiry) {
        await db.run(
          `UPDATE domains SET expire_at=?, last_check=? WHERE domain=?`,
          [expiry, new Date().toISOString(), domain]
        );
      }
    } catch (e) {
      console.error('Auto fetch failed:', e);
    }
  }

  return c.json({ ok: true });
});

app.put('/api/domains/:id', async (c) => {
  const db = new DB(c.env.DOMAINS_DB);
  const id = c.req.param('id');
  const body = await c.req.json();
  
  const stmt = `UPDATE domains SET domain=?, mode=?, provider=?, expire_at=?, notes=?, auto_refresh=?, check_interval=?, group_name=? WHERE id=?`;
  
  await db.run(stmt, [
    body.domain,
    body.mode,
    body.provider,
    body.expire_at,
    body.notes,
    body.auto_refresh ? 1 : 0,
    body.check_interval || 7,
    body.group_name || null,
    id
  ]);
  
  return c.json({ ok: true });
});

app.delete('/api/domains/:id', async (c) => {
  const db = new DB(c.env.DOMAINS_DB);
  const id = c.req.param('id');
  await db.run('DELETE FROM domains WHERE id=?', [id]);
  return c.json({ ok: true });
});

app.get('/api/check/:id', async (c) => {
  const db = new DB(c.env.DOMAINS_DB);
  const id = c.req.param('id');
  const row = await db.get('SELECT * FROM domains WHERE id=?', [id]) as DomainRow | null;
  
  if (!row) return c.text('not found', 404);
  if (row.mode === 'manual') return c.text('manual mode', 400);
  
  try {
    const expiry = await fetchExpiryForDomain(row.domain);
    if (expiry) {
      await db.run(
        'UPDATE domains SET expire_at=?, last_check=? WHERE id=?',
        [expiry, new Date().toISOString(), id]
      );
      return c.json({ ok: true, expiry });
    }
    return c.json({ ok: false, message: 'Unable to fetch expiry' });
  } catch (e) {
    return c.json({ ok: false, error: String(e) }, 500);
  }
});

app.get('/api/cron', async (c) => {
  const token = c.req.query('token') || c.req.header('x-cron-token');
  
  if (!token || token !== c.env.CRON_TOKEN) {
    return c.text('forbidden', 403);
  }

  const db = new DB(c.env.DOMAINS_DB);
  const rows = await db.queryAll('SELECT * FROM domains') as DomainRow[];
  const now = new Date();
  const DAYS_NOTIFY = parseInt(c.env.DAYS || '30');

  for (const r of rows) {
    if (r.mode === 'auto' && r.auto_refresh) {
      const lastCheck = r.last_check ? new Date(r.last_check) : null;
      const checkInterval = r.check_interval || 7;
      const shouldCheck = !lastCheck || (now.getTime() - lastCheck.getTime()) / (1000 * 60 * 60 * 24) >= checkInterval;

      if (shouldCheck) {
        try {
          const expiry = await fetchExpiryForDomain(r.domain);
          if (expiry) {
            await db.run(
              'UPDATE domains SET expire_at=?, last_check=? WHERE id=?',
              [expiry, now.toISOString(), r.id]
            );
            r.expire_at = expiry;
          }
        } catch (e) {
          await db.run(
            `INSERT INTO logs(domain_id,message) VALUES(?,?)`,
            [r.id, `check failed: ${String(e)}`]
          );
        }
      }
    }

    if (r.expire_at) {
      const days = Math.ceil((new Date(r.expire_at).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (days <= DAYS_NOTIFY && days > 0) {
        await notifyAll(c.env.DOMAINS_DB, `⚠️ ${r.domain} 将在 ${days} 天后到期（到期日：${r.expire_at.split('T')[0]}）`);
        await db.run(
          `INSERT INTO logs(domain_id,message) VALUES(?,?)`,
          [r.id, `notify: ${days} days remaining`]
        );
      } else if (days <= 0) {
        await notifyAll(c.env.DOMAINS_DB, `🚨 ${r.domain} 已过期！到期日：${r.expire_at.split('T')[0]}`);
        await db.run(
          `INSERT INTO logs(domain_id,message) VALUES(?,?)`,
          [r.id, `notify: expired`]
        );
      }
    }
  }

  return c.json({ ok: true, checked: rows.length });
});

app.post('/api/auth', async (c) => {
  const body = await c.req.json();
  if (body.password === c.env.PASSWORD) {
    return c.json({ ok: true });
  }
  return c.text('bad', 401);
});

app.get('/api/channels', async (c) => {
  const db = new DB(c.env.DOMAINS_DB);
  const rows = await db.queryAll('SELECT * FROM notify_channels');
  return c.json(rows);
});

app.post('/api/channels', async (c) => {
  const db = new DB(c.env.DOMAINS_DB);
  const body = await c.req.json();
  
  await db.run(
    `INSERT INTO notify_channels(type, config, enabled) VALUES(?,?,?)`,
    [body.type, JSON.stringify(body.config), body.enabled ? 1 : 0]
  );
  
  return c.json({ ok: true });
});

app.put('/api/channels/:id', async (c) => {
  const db = new DB(c.env.DOMAINS_DB);
  const id = c.req.param('id');
  const body = await c.req.json();
  
  await db.run(
    `UPDATE notify_channels SET type=?, config=?, enabled=? WHERE id=?`,
    [body.type, JSON.stringify(body.config), body.enabled ? 1 : 0, id]
  );
  
  return c.json({ ok: true });
});

app.delete('/api/channels/:id', async (c) => {
  const db = new DB(c.env.DOMAINS_DB);
  const id = c.req.param('id');
  await db.run('DELETE FROM notify_channels WHERE id=?', [id]);
  return c.json({ ok: true });
});

app.get('/api/export', async (c) => {
  const db = new DB(c.env.DOMAINS_DB);
  const domains = await db.queryAll('SELECT * FROM domains');
  const channels = await db.queryAll('SELECT * FROM notify_channels');
  
  return c.json({
    domains,
    channels,
    exported_at: new Date().toISOString()
  });
});

app.post('/api/import', async (c) => {
  const db = new DB(c.env.DOMAINS_DB);
  const body = await c.req.json();
  
  if (body.domains && Array.isArray(body.domains)) {
    for (const d of body.domains) {
      await db.run(
        `INSERT OR REPLACE INTO domains(domain, mode, provider, expire_at, notes, group_name, auto_refresh, check_interval) VALUES(?,?,?,?,?,?,?,?)`,
        [d.domain, d.mode || 'auto', d.provider, d.expire_at, d.notes, d.group_name, d.auto_refresh || 1, d.check_interval || 7]
      );
    }
  }
  
  return c.json({ ok: true });
});

app.get('/api/logs', async (c) => {
  const db = new DB(c.env.DOMAINS_DB);
  const limit = c.req.query('limit') || '100';
  const rows = await db.queryAll(
    `SELECT l.*, d.domain FROM logs l LEFT JOIN domains d ON l.domain_id = d.id ORDER BY l.created_at DESC LIMIT ?`,
    [parseInt(limit)]
  );
  return c.json(rows);
});

app.get('/api/init', async (c) => {
  const db = new DB(c.env.DOMAINS_DB);
  await db.init();
  return c.json({ ok: true, message: 'Database initialized' });
});

export default {
  fetch: app.fetch,
  async scheduled(event: ScheduledEvent, env: Bindings, ctx: ExecutionContext) {
    ctx.waitUntil((async () => {
      const db = new DB(env.DOMAINS_DB);
      const rows = await db.queryAll('SELECT * FROM domains') as DomainRow[];
      const now = new Date();
      const DAYS_NOTIFY = parseInt(env.DAYS || '30');

      for (const r of rows) {
        if (r.mode === 'auto' && r.auto_refresh) {
          const lastCheck = r.last_check ? new Date(r.last_check) : null;
          const checkInterval = r.check_interval || 7;
          const shouldCheck = !lastCheck || (now.getTime() - lastCheck.getTime()) / (1000 * 60 * 60 * 24) >= checkInterval;

          if (shouldCheck) {
            try {
              const expiry = await fetchExpiryForDomain(r.domain);
              if (expiry) {
                await db.run(
                  'UPDATE domains SET expire_at=?, last_check=? WHERE id=?',
                  [expiry, now.toISOString(), r.id]
                );
                r.expire_at = expiry;
              }
            } catch (e) {
              console.error('Cron check failed:', e);
            }
          }
        }

        if (r.expire_at) {
          const days = Math.ceil((new Date(r.expire_at).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          if (days <= DAYS_NOTIFY && days > 0) {
            await notifyAll(env.DOMAINS_DB, `⚠️ ${r.domain} 将在 ${days} 天后到期（到期日：${r.expire_at.split('T')[0]}）`);
          } else if (days <= 0) {
            await notifyAll(env.DOMAINS_DB, `🚨 ${r.domain} 已过期！到期日：${r.expire_at.split('T')[0]}`);
          }
        }
      }
    })());
  }
};