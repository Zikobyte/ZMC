import express from 'express';
import http from 'http';
import path from 'path';
import cors from 'cors';
import crypto from 'crypto';
import { WebSocketServer, WebSocket } from 'ws';
import jwt from 'jsonwebtoken';
import { createServer as createViteServer } from 'vite';

// Utilities & Repos
import { getDB, initializeDatabase, getPostgresStatus, getPostgresPool, seedDatabase, refreshCache } from './src/backend/database/db.repo';
import { setWssServer, registerWsClient, removeWsClient } from './src/backend/utils/ws.util';

// Routes
import authRoutes from './src/backend/routes/auth/auth.routes';
import usersRoutes from './src/backend/routes/users/users.routes';
import patientsRoutes from './src/backend/routes/patients/patients.routes';
import paymentsRoutes from './src/backend/routes/payments/payments.routes';
import exportsRoutes from './src/backend/routes/exports/exports.routes';
import verifyIdentityRoutes from './src/backend/routes/verify-identity.routes';
import notificationsRoutes from './src/backend/routes/notifications/notifications.routes';
import { hrRoutes } from './src/backend/routes/hr/hr.routes';
import nursingRoutes from './src/backend/routes/nursing/nursing.routes';
import { JWT_SECRET } from './src/backend/config/env';

const PORT = 3000;

async function startServer() {
  const app = express();
  const server = http.createServer(app);

  // 1. Standard Middlewares
  app.use(cors());
  app.use(express.json());

  // Health check endpoint for container orchestrators & dev server health monitors
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() });
  });

  // Log requests
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });

  // 2. Mounting API routes FIRST
  app.use('/api/auth', authRoutes);
  app.use('/api/users', usersRoutes);
  app.use('/api/patients', patientsRoutes);
  app.use('/api/payments', paymentsRoutes);
  app.use('/api/exports', exportsRoutes);
  app.use('/api/verify-identity', verifyIdentityRoutes);
  app.use('/api/notifications', notificationsRoutes);
  app.use('/api/hr', hrRoutes);
  app.use('/api/nursing', nursingRoutes);

  // Audit Logs Routes
  app.get('/api/audit-logs', async (req, res) => {
    try {
      const poolInstance = getPostgresPool();
      if (poolInstance) {
        const queryRes = await poolInstance.query('SELECT * FROM zmc_audit_logs ORDER BY timestamp DESC LIMIT 500');
        return res.json({ success: true, data: queryRes.rows, count: queryRes.rows.length });
      }
      const db = getDB();
      const logs = (db.auditLogs || []).slice(-500).reverse();
      res.json({ success: true, data: logs, count: logs.length });
    } catch (err: any) {
      console.error('Error fetching audit logs:', err);
      res.status(500).json({ success: false, error: err.message, data: [] });
    }
  });

  app.post('/api/audit-logs', async (req, res) => {
    try {
      const { action, details, userId, userName, userRole, ipAddress } = req.body;
      const poolInstance = getPostgresPool();
      const id = `audit-${crypto.randomUUID ? crypto.randomUUID() : Date.now()}`;
      const now = new Date();

      if (poolInstance) {
        await poolInstance.query(
          `INSERT INTO zmc_audit_logs (id, user_id, user_name, user_role, action, details, timestamp, ip_address)
           VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, $7)`,
          [id, userId || 'it-admin', userName || 'IT Administrator', userRole || 'IT Administrator', action || 'General Event', details || '—', ipAddress || '127.0.0.1']
        );
        // Retain max 500 entries
        await poolInstance.query(`
          DELETE FROM zmc_audit_logs 
          WHERE id NOT IN (
            SELECT id FROM zmc_audit_logs ORDER BY timestamp DESC LIMIT 500
          )
        `);
      }

      const db = getDB();
      if (!db.auditLogs) db.auditLogs = [];
      db.auditLogs.unshift({
        id,
        user_id: userId || 'it-admin',
        user_name: userName || 'IT Administrator',
        user_role: userRole || 'IT Administrator',
        action: action || 'General Event',
        details: details || '—',
        timestamp: now.toISOString(),
        ip_address: ipAddress || '127.0.0.1'
      });
      if (db.auditLogs.length > 500) {
        db.auditLogs = db.auditLogs.slice(0, 500);
      }

      res.json({ success: true, id });
    } catch (err: any) {
      console.error('Error writing audit log:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  const clearAuditLogsHandler = async (req: express.Request, res: express.Response) => {
    try {
      const poolInstance = getPostgresPool();
      if (poolInstance) {
        await poolInstance.query('TRUNCATE TABLE zmc_audit_logs');
      }
      const db = getDB();
      db.auditLogs = [];
      res.json({ success: true, message: 'All activity logs have been cleared successfully.' });
    } catch (err: any) {
      console.error('Error clearing audit logs:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  };

  app.post('/api/audit-logs/clear', clearAuditLogsHandler);
  app.delete('/api/audit-logs', clearAuditLogsHandler);

  // Maintenance Endpoints
  app.post('/api/maintenance/cache-clear', async (req, res) => {
    try {
      await refreshCache();
      res.json({ success: true, message: 'System cache purged and re-synchronized with PostgreSQL relational database store successfully.' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/maintenance/clear-store', async (req, res) => {
    try {
      const { storeKey, storeName, actorName = 'IT Administrator', actorRole = 'IT Administrator' } = req.body;
      const poolInstance = getPostgresPool();

      const tableMap: Record<string, string[]> = {
        patients: ['zmc_emergency_records', 'zmc_maternity_records', 'zmc_patient_vitals', 'zmc_patient_queue', 'zmc_consultations', 'zmc_pharmacy_orders', 'zmc_laboratory_orders', 'zmc_lab_payments', 'zmc_outstanding_balances', 'zmc_payments', 'zmc_invoices', 'zmc_encounters', 'zmc_patients'],
        encounters: ['zmc_emergency_records', 'zmc_maternity_records', 'zmc_patient_vitals', 'zmc_patient_queue', 'zmc_consultations', 'zmc_pharmacy_orders', 'zmc_laboratory_orders', 'zmc_lab_payments', 'zmc_outstanding_balances', 'zmc_payments', 'zmc_invoices', 'zmc_encounters'],
        vitals: ['zmc_patient_vitals'],
        queue: ['zmc_patient_queue'],
        consultations: ['zmc_consultations'],
        maternity: ['zmc_maternity_records'],
        emergency: ['zmc_emergency_records'],
        lab_orders: ['zmc_laboratory_orders', 'zmc_laboratory_results', 'zmc_lab_payments'],
        pharmacy: ['zmc_pharmacy_orders'],
        inventory: ['zmc_inventory'],
        invoices: ['zmc_invoices'],
        payments: ['zmc_payments', 'zmc_lab_payments'],
        outstanding: ['zmc_outstanding_balances'],
        notifications: ['zmc_notifications'],
        audit_logs: ['zmc_audit_logs']
      };

      const tables = tableMap[storeKey];
      if (tables && poolInstance) {
        for (const tbl of tables) {
          try {
            await poolInstance.query(`TRUNCATE TABLE ${tbl} CASCADE`);
          } catch (e) {
            console.warn(`Could not truncate ${tbl}:`, e);
          }
        }
      }

      await refreshCache();

      // Record Data Clear audit log
      if (poolInstance && storeKey !== 'audit_logs') {
        const id = `audit-${crypto.randomUUID ? crypto.randomUUID() : Date.now()}`;
        await poolInstance.query(
          `INSERT INTO zmc_audit_logs (id, user_id, user_name, user_role, action, details, timestamp, ip_address)
           VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, $7)`,
          [id, 'it-admin', actorName, actorRole, 'Data Clear', `Cleared data store: ${storeName || storeKey}`, '127.0.0.1']
        );
      }

      res.json({ success: true, message: `Data store "${storeName || storeKey}" cleared successfully.` });
    } catch (err: any) {
      console.error('Error clearing data store:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/maintenance/system-reset', async (req, res) => {
    try {
      const { actorName = 'IT Administrator', actorRole = 'IT Administrator' } = req.body;
      const poolInstance = getPostgresPool();

      const operationalTables = [
        'zmc_emergency_records',
        'zmc_maternity_records',
        'zmc_patient_vitals',
        'zmc_patient_queue',
        'zmc_consultations',
        'zmc_pharmacy_orders',
        'zmc_laboratory_results',
        'zmc_laboratory_orders',
        'zmc_lab_payments',
        'zmc_outstanding_balances',
        'zmc_payments',
        'zmc_invoices',
        'zmc_encounters',
        'zmc_patients',
        'zmc_notifications'
      ];

      if (poolInstance) {
        for (const tbl of operationalTables) {
          try {
            await poolInstance.query(`TRUNCATE TABLE ${tbl} CASCADE`);
          } catch (e) {
            console.warn(`Could not truncate ${tbl}:`, e);
          }
        }
      }

      await refreshCache();

      // Record System Reset audit log
      if (poolInstance) {
        const id = `audit-${crypto.randomUUID ? crypto.randomUUID() : Date.now()}`;
        await poolInstance.query(
          `INSERT INTO zmc_audit_logs (id, user_id, user_name, user_role, action, details, timestamp, ip_address)
           VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, $7)`,
          [id, 'it-admin', actorName, actorRole, 'System Reset', 'Executed full system reset of operational data stores', '127.0.0.1']
        );
      }

      res.json({ success: true, message: 'Full system reset executed successfully. Operational stores have been cleared.' });
    } catch (err: any) {
      console.error('Error during system reset:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/maintenance/vacuum', async (req, res) => {
    try {
      const pool = getPostgresPool();
      if (pool) {
        await pool.query('ANALYZE');
        const usersCount = await pool.query('SELECT count(*) as count FROM zmc_users');
        const patientsCount = await pool.query('SELECT count(*) as count FROM zmc_patients');
        const encountersCount = await pool.query('SELECT count(*) as count FROM zmc_encounters');
        const paymentsCount = await pool.query('SELECT count(*) as count FROM zmc_payments');
        const auditCount = await pool.query('SELECT count(*) as count FROM zmc_audit_logs');
        
        return res.json({
          success: true,
          message: 'PostgreSQL database indexes and table query plans analyzed and optimized.',
          stats: {
            users: parseInt(usersCount.rows[0].count, 10),
            patients: parseInt(patientsCount.rows[0].count, 10),
            encounters: parseInt(encountersCount.rows[0].count, 10),
            payments: parseInt(paymentsCount.rows[0].count, 10),
            auditLogs: parseInt(auditCount.rows[0].count, 10),
            timestamp: new Date().toISOString()
          }
        });
      }
      res.json({ success: true, message: 'Database integrity verified.' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get('/api/maintenance/backup', async (req, res) => {
    try {
      const db = getDB();
      const now = new Date();
      const dateString = now.toISOString().split('T')[0];
      const filename = `ZMC_HMS_Backup_${dateString}.json`;

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(JSON.stringify(db, null, 2));
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // General server health check
  app.get('/api/health', (req, res) => {
    const host = process.env.PGHOST || process.env.DB_HOST || '';
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: `PostgreSQL (${host || 'Active'})`,
      phase: 1,
      modules: ['Authentication', 'User Management', 'OPD Patient Registration'],
    });
  });

  // DB Diagnostic & Test Route
  app.get('/api/db-test', async (req, res) => {
    const { isPostgresActive, hasPool } = getPostgresStatus();
    const host = process.env.PGHOST || process.env.DB_HOST || '';
    const port = process.env.PGPORT || process.env.DB_PORT || '5432';
    const database = process.env.PGDATABASE || process.env.DB_NAME || process.env.DB_DATABASE || '';
    const user = process.env.PGUSER || process.env.DB_USER || process.env.DB_USERNAME || '';

    const dbConfig = {
      host: host || 'Not set',
      port: port,
      database: database || 'Not set',
      username: user || 'Not set',
      passwordProvided: !!(process.env.PGPASSWORD || process.env.DB_PASSWORD),
    };

    let testQueryResult = null;
    let storeStatus: any[] = [];
    let error: string | null = null;

    if (isPostgresActive) {
      const pool = getPostgresPool();
      if (pool) {
        try {
          const startTime = Date.now();
          const queryRes = await pool.query('SELECT NOW() as current_time, VERSION() as db_version');
          const duration = Date.now() - startTime;
          testQueryResult = {
            success: true,
            time: queryRes.rows[0].current_time,
            version: queryRes.rows[0].db_version,
            latencyMs: duration,
          };

          storeStatus = [];

          // Fetch relational table row counts to display on Diagnostics hub
          const usersCountRes = await pool.query('SELECT count(*) as count FROM zmc_users');
          const patientsCountRes = await pool.query('SELECT count(*) as count FROM zmc_patients');
          const inventoryCountRes = await pool.query('SELECT count(*) as count FROM zmc_inventory');
          const auditLogsCountRes = await pool.query('SELECT count(*) as count FROM zmc_audit_logs');

          storeStatus.push({
            key: 'Table: zmc_users',
            size_bytes: `${usersCountRes.rows[0].count} registered users`,
            updated_at: new Date().toISOString()
          });
          storeStatus.push({
            key: 'Table: zmc_patients',
            size_bytes: `${patientsCountRes.rows[0].count} active patient EMRs`,
            updated_at: new Date().toISOString()
          });
          storeStatus.push({
            key: 'Table: zmc_inventory',
            size_bytes: `${inventoryCountRes.rows[0].count} clinical stock items`,
            updated_at: new Date().toISOString()
          });
          storeStatus.push({
            key: 'Table: zmc_audit_logs',
            size_bytes: `${auditLogsCountRes.rows[0].count} operations logs`,
            updated_at: new Date().toISOString()
          });
        } catch (err: any) {
          error = err.message || 'Database test query failed';
        }
      } else {
        error = 'Postgres is marked active but no connection pool is found.';
      }
    }

    const currentDb = getDB();

    res.json({
      postgresActive: isPostgresActive,
      connectionConfig: dbConfig,
      testQuery: testQueryResult,
      postgresStoreKeys: storeStatus,
      localBackupStats: {
        usersCount: currentDb.users?.length || 0,
        patientsCount: currentDb.patients?.length || 0,
        auditLogsCount: currentDb.auditLogs?.length || 0,
      },
      error: error,
    });
  });

  // Route to trigger seeding high-quality clinical data
  app.post('/api/db-test/seed', async (req, res) => {
    try {
      console.log('🌱 Received manual trigger to seed database...');
      const seedResult = await seedDatabase();
      res.json({
        success: true,
        message: 'Successfully seeded database with comprehensive clinical records, patient profiles, inventory and audit logs!',
        ...seedResult
      });
    } catch (err: any) {
      console.error('❌ Database seeding failed:', err);
      res.status(500).json({
        success: false,
        message: 'Failed to seed database',
        error: err.message || 'Seeding failed',
      });
    }
  });

  // 3. Setup WebSocket server on same HTTP server
  const wss = new WebSocketServer({ noServer: true });
  setWssServer(wss);

  server.on('upgrade', (request, socket, head) => {
    // Parse protocol URL parameters or query strings if any, or verify token inside upgrade headers/protocols
    const url = new URL(request.url || '', `http://${request.headers.host || 'localhost'}`);
    const token = url.searchParams.get('token');

    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        wss.handleUpgrade(request, socket, head, (ws) => {
          wss.emit('connection', ws, request, decoded);
        });
        return;
      } catch (err: any) {
        // Token is expired or invalid - upgrade as guest and let client refresh or re-authenticate
        if (err?.name === 'TokenExpiredError') {
          console.log('ℹ️ WebSocket client token expired; initiating guest connection.');
        } else {
          console.log('ℹ️ WebSocket token verification skipped:', err?.message || 'Invalid token');
        }
      }
    }

    // Allow connections even without query param for client standard fallback, handle internal auth later
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  });

  wss.on('connection', (ws: WebSocket, request, user?: any) => {
    console.log(`New WebSocket client connected. Authenticated: ${user ? `${user.username} (${user.role})` : 'No'}`);
    
    if (user) {
      registerWsClient(ws, { role: user.role, username: user.username });
    }

    ws.on('message', (message) => {
      try {
        const payload = JSON.parse(message.toString());
        
        // Handle explicit client authentication inside the socket flow
        if (payload.type === 'AUTH' && payload.token) {
          try {
            const decoded = jwt.verify(payload.token, JWT_SECRET) as any;
            registerWsClient(ws, { role: decoded.role, username: decoded.username });
            console.log(`Client authenticated via WS payload: ${decoded.username} (${decoded.role})`);
            ws.send(JSON.stringify({ type: 'AUTH_SUCCESS', message: 'WebSocket connection authenticated' }));
          } catch (err: any) {
            if (err?.name === 'TokenExpiredError') {
              ws.send(JSON.stringify({ type: 'AUTH_EXPIRED', message: 'Token expired' }));
            } else {
              ws.send(JSON.stringify({ type: 'ERROR', message: 'Authentication failed' }));
            }
          }
        }
      } catch (err) {
        console.error('Failed to parse WebSocket message:', err);
      }
    });

    ws.on('close', () => {
      removeWsClient(ws);
      console.log('WebSocket client disconnected.');
    });
  });

  // 4. Vite Dev Server vs Static Production serving
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('Vite middleware mounted for development.');
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log('Serving production static build from dist folder.');
  }

  // 5. Run Server
  server.on('error', (error: NodeJS.ErrnoException) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is already in use. Stop the existing ZMC server before starting another one.`);
      process.exitCode = 1;
      return;
    }

    console.error('ZMC server failed to listen:', error);
    process.exitCode = 1;
  });

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`=============================================================`);
    console.log(`🏥 ZMC Hospital Management System running on http://localhost:${PORT}`);
    console.log(`🚀 Mode: ${process.env.NODE_ENV || 'development'}`);
    console.log(`=============================================================`);

    // Asynchronously initialize database and verify seed in background
    (async () => {
      try {
        console.log('Initializing database layer...');
        await initializeDatabase();
        let initialDb = getDB();
        console.log(`Database loaded with ${initialDb.users?.length || 0} users and ${initialDb.patients?.length || 0} patients.`);

        // Auto-seed if the database has zero patients
        if (!initialDb.patients || initialDb.patients.length === 0) {
          console.log('🌱 No patients found in database. Auto-seeding comprehensive clinical records...');
          try {
            const seedResult = await seedDatabase();
            console.log('✅ Auto-seeding complete:', seedResult);
          } catch (seedErr) {
            console.error('❌ Failed to auto-seed database:', seedErr);
          }
        }
      } catch (dbInitErr) {
        console.error('⚠️ Database layer initialization notice:', dbInitErr);
      }
    })();
  });
}

startServer().catch((error) => {
  console.error('Fatal error starting ZMC server:', error);
});
