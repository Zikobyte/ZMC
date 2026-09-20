import { NotificationMsg } from '../types';

export const API_BASE = '/api';

export function isTokenExpired(token: string): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window.atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const payload = JSON.parse(jsonPayload);
    if (!payload.exp) return false;
    const now = Math.floor(Date.now() / 1000);
    return payload.exp < now;
  } catch (err) {
    return true;
  }
}

export function getAuthToken(): string | null {
  const token = localStorage.getItem('zmc_token');
  if (!token) return null;
  if (isTokenExpired(token)) {
    localStorage.removeItem('zmc_token');
    localStorage.removeItem('zmc_user');
    window.dispatchEvent(new CustomEvent('zmc-logout'));
    return null;
  }
  return token;
}

export function setAuthToken(token: string): void {
  localStorage.setItem('zmc_token', token);
}

export function removeAuthToken(): void {
  localStorage.removeItem('zmc_token');
}

export async function apiFetch(endpoint: string, options: RequestInit = {}): Promise<any> {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const text = await response.text();
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch (err) {
    json = null;
  }

  if (!response.ok) {
    if (response.status === 401) {
      removeAuthToken();
      localStorage.removeItem('zmc_user');
      window.dispatchEvent(new CustomEvent('zmc-logout'));
    }
    const cleanError = json?.error || json?.message || (response.status === 403 ? 'Access forbidden (403)' : `HTTP error ${response.status}: ${response.statusText || 'Request failed'}`);
    throw new Error(cleanError);
  }

  if (!json && text) {
    throw new Error('Invalid response from server');
  }

  return json || {};
}

// WebSocket hook / connection manager
export class IntranetSocket {
  private ws: WebSocket | null = null;
  private reconnectTimer: any = null;
  private listeners: ((msg: any) => void)[] = [];

  constructor() {
    this.connect();
  }

  private connect() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const token = getAuthToken();
    
    // Connect to websocket with token in query param if valid
    const wsUrl = `${protocol}//${host}/ws${token ? `?token=${token}` : ''}`;
    
    try {
      this.ws = new WebSocket(wsUrl);
    } catch (err) {
      console.warn('Could not initialize WebSocket:', err);
      return;
    }

    this.ws.onopen = () => {
      const currentToken = getAuthToken();
      if (currentToken) {
        this.ws?.send(JSON.stringify({ type: 'AUTH', token: currentToken }));
      }
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'AUTH_EXPIRED') {
          console.warn('Session expired notification received. Clearing authentication state.');
          removeAuthToken();
          localStorage.removeItem('zmc_user');
          window.dispatchEvent(new CustomEvent('zmc-logout'));
          return;
        }
        this.listeners.forEach(cb => cb(data));
      } catch (err) {
        console.error('Failed to parse socket message:', err);
      }
    };

    this.ws.onclose = () => {
      if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
      this.reconnectTimer = setTimeout(() => this.connect(), 4000);
    };

    this.ws.onerror = (err) => {
      console.warn('WebSocket connection notice:', err);
    };
  }

  public reconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.ws) {
      this.ws.close();
    } else {
      this.connect();
    }
  }

  public subscribe(callback: (msg: any) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  public close() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.ws) this.ws.close();
  }
}

export const socketManager = new IntranetSocket();
