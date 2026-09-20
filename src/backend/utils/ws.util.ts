import { WebSocketServer, WebSocket } from 'ws';

let wss: WebSocketServer | null = null;
const clients = new Map<WebSocket, { role: string; username: string }>();

export function setWssServer(server: WebSocketServer): void {
  wss = server;
}

export function registerWsClient(ws: WebSocket, clientInfo: { role: string; username: string }): void {
  clients.set(ws, clientInfo);
}

export function removeWsClient(ws: WebSocket): void {
  clients.delete(ws);
}

export async function persistNotification(payload: {
  type: string;
  targetRole?: string;
  message: string;
  patientId?: string;
  sender?: string;
  data?: any;
}): Promise<void> {
  try {
    const { query, generateUUID } = await import('../database/db.repo');
    
    let usersQuery = '';
    let params: any[] = [];
    if (payload.targetRole) {
      usersQuery = `
        SELECT u.id FROM zmc_users u
        WHERE LOWER(u.role) = LOWER($1) OR u.role = 'Administrator'
      `;
      params = [payload.targetRole];
    } else {
      usersQuery = `SELECT id FROM zmc_users`;
    }

    const usersRes = await query(usersQuery, params);
    for (const row of usersRes.rows) {
      const notifId = generateUUID();
      await query(`
        INSERT INTO zmc_notifications (id, user_id, message, type, read, timestamp)
        VALUES ($1, $2, $3, $4, FALSE, NOW())
      `, [notifId, row.id, payload.message, payload.type]);
    }
  } catch (err) {
    console.error("Failed to persist notification to DB:", err);
  }
}

export function broadcastNotification(payload: {
  type: string;
  targetRole?: string;
  message: string;
  patientId?: string;
  sender?: string;
  data?: any;
}): void {
  persistNotification(payload).catch(err => {
    console.error("Async notification persistence failed:", err);
  });

  if (!wss) {
    console.log('WS Server not initialized, skipping broadcast of:', payload.type);
    return;
  }

  const json = JSON.stringify(payload);

  wss.clients.forEach(client => {
    if (client.readyState !== WebSocket.OPEN) return;

    const info = clients.get(client);
    
    // Broadcast if no target role is specified, OR if client matches the target role, OR if the client is Administrator
    if (!payload.targetRole || (info && (info.role === payload.targetRole || info.role === 'Administrator'))) {
      client.send(json);
    }
  });
}
