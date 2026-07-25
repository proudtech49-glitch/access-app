export interface Notification {
  id: string;
  packageName: string;
  title: string;
  text: string;
  postTime: number;
  deviceId?: string;
  status?: 'pending' | 'uploaded';
}

export interface ConnectedDevice {
  id: string;
  isIntercepting: boolean;
  online: boolean;
  connectedAt?: number | null;
}

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';
