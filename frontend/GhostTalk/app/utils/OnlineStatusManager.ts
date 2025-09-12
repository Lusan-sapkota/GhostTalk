import { updateOnlineStatus, getOnlineStatus } from '../api';
import AsyncStorage from '@react-native-async-storage/async-storage';

class OnlineStatusManager {
  private static instance: OnlineStatusManager;
  private isOnline: boolean = false;
  private pingInterval: ReturnType<typeof setInterval> | null = null;
  private lastActivity: Date = new Date();

  private constructor() {}

  static getInstance(): OnlineStatusManager {
    if (!OnlineStatusManager.instance) {
      OnlineStatusManager.instance = new OnlineStatusManager();
    }
    return OnlineStatusManager.instance;
  }

  async initialize(): Promise<void> {
    // Set user as online when app starts
    await this.setOnline(true);

    // Start periodic ping
    this.startPing();

    // Set up activity listeners
    this.setupActivityListeners();
  }

  private setupActivityListeners(): void {
    // This would be enhanced with actual activity detection
    // For now, we'll just ping periodically
  }

  private startPing(): void {
    // Ping every 30 seconds to keep user online
    this.pingInterval = setInterval(async () => {
      if (this.isOnline) {
        await this.setOnline(true);
      }
    }, 30000);
  }

  async setOnline(isOnline: boolean): Promise<void> {
    try {
      if (this.isOnline !== isOnline) {
        this.isOnline = isOnline;
        await updateOnlineStatus(isOnline);
      } else if (isOnline) {
        // Even if status hasn't changed, send a ping to update last_seen
        await updateOnlineStatus(true);
      }
    } catch (error) {
      console.error('Failed to update online status:', error);
    }
  }

  async goOffline(): Promise<void> {
    await this.setOnline(false);
  }

  async updateActivity(): Promise<void> {
    this.lastActivity = new Date();
    if (!this.isOnline) {
      await this.setOnline(true);
    }
  }

  getStatus(): boolean {
    return this.isOnline;
  }

  async cleanup(): Promise<void> {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    await this.goOffline();
  }
}

export default OnlineStatusManager;