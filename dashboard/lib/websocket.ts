import { useAppStore } from '@/store';
import { toast } from 'sonner';

class WSManager {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectAttempts = 0;
  private maxAttempts = 10;
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor(url: string = 'ws://localhost:8000/ws') {
    this.url = url;
  }

  connect() {
    const { setStatus } = useAppStore.getState();
    setStatus('connecting');

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        setStatus('connected');
        this.reconnectAttempts = 0;
        this.startHeartbeat();
        toast.success('Connected to OpinionRewards Core', {
          style: { background: '#064e3b', color: '#34d399', border: '1px solid #059669' }
        });
      };

      this.ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          const store = useAppStore.getState();
          
          // New typed object payload
          if (payload.type === 'device_state_update') {
            store.setConnectedDevices(payload.devices);
          } else if (payload.type === 'history' || payload.type === 'notifications') {
            store.addNotifications(payload.data);
          } else if (Array.isArray(payload)) {
            // Legacy array fallback
            if (payload.length > 0) store.addNotifications(payload);
          }
        } catch (e) {
          console.error('Invalid payload received', e);
        }
      };

      this.ws.onclose = () => {
        setStatus('disconnected');
        this.cleanup();
        this.scheduleReconnect();
      };

      this.ws.onerror = () => {
        setStatus('error');
      };

    } catch (err) {
      this.scheduleReconnect();
    }
  }

  private startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
      }
    }, 15000); // 15s heartbeat
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts < this.maxAttempts) {
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
      this.reconnectAttempts++;
      setTimeout(() => this.connect(), delay);
      console.log(`Reconnecting in ${delay}ms (Attempt ${this.reconnectAttempts})`);
    } else {
      toast.error('Connection permanently failed. Check backend.', {
        style: { background: '#7f1d1d', color: '#fca5a5', border: '1px solid #dc2626' }
      });
    }
  }

  private cleanup() {
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
  }

  setIntercept(deviceId: string, active: boolean) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'set_intercept', deviceId, active }));
    }
  }

  disconnect() {
    this.cleanup();
    this.ws?.close();
  }
}

export const wsManager = new WSManager();
