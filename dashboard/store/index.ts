import { create } from 'zustand';
import { Notification, ConnectionStatus, ConnectedDevice } from '@/types/notification';

interface AppState {
  notifications: Notification[];
  connectedDevices: ConnectedDevice[];
  status: ConnectionStatus;
  searchQuery: string;
  selectedDevice: string | null;
  deviceAliases: Record<string, string>;
  addNotifications: (batch: Notification[]) => void;
  setConnectedDevices: (devices: ConnectedDevice[]) => void;
  setStatus: (status: ConnectionStatus) => void;
  setSearchQuery: (query: string) => void;
  setSelectedDevice: (deviceId: string | null) => void;
  setDeviceAlias: (deviceId: string, alias: string) => void;
  clearAll: () => void;
  markAllRead: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  notifications: [],
  connectedDevices: [],
  status: 'disconnected',
  searchQuery: '',
  selectedDevice: null,
  deviceAliases: {},
  addNotifications: (batch) => set((state) => {
    const combined = [...batch, ...state.notifications];
    const uniqueIds = new Set();
    const deduplicated = combined.filter(n => {
      if (uniqueIds.has(n.id)) return false;
      uniqueIds.add(n.id);
      return true;
    });
    return { notifications: deduplicated.slice(0, 1000) };
  }),
  setConnectedDevices: (devices) => set({ connectedDevices: devices }),
  setStatus: (status) => set({ status }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSelectedDevice: (deviceId) => set({ selectedDevice: deviceId }),
  setDeviceAlias: (deviceId, alias) => set((state) => ({ 
    deviceAliases: { ...state.deviceAliases, [deviceId]: alias } 
  })),
  clearAll: () => set({ notifications: [] }),
  markAllRead: () => set((state) => ({
    notifications: state.notifications.map(n => ({ ...n, status: 'uploaded' }))
  }))
}));
