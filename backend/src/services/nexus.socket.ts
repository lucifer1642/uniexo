import { Server, Socket } from 'socket.io';
import { logger } from '../config/logger';

interface ActiveUser {
  userId?: string;
  socketId: string;
  role?: string;
  lastActive: Date;
  currentPage?: string;
}

export class NexusSocketService {
  private static instance: NexusSocketService;
  private io: Server | null = null;
  private activeUsers: Map<string, ActiveUser> = new Map();

  private constructor() {}

  public static getInstance(): NexusSocketService {
    if (!NexusSocketService.instance) {
      NexusSocketService.instance = new NexusSocketService();
    }
    return NexusSocketService.instance;
  }

  public init(server: any): void {
    this.io = new Server(server, {
      cors: {
        origin: '*', // Adjust for production
        methods: ['GET', 'POST'],
      },
    });

    this.io.on('connection', (socket: Socket) => {
      const socketId = socket.id;
      logger.info(`Nexus: New connection ${socketId}`);

      // Register user
      this.activeUsers.set(socketId, {
        socketId,
        lastActive: new Date(),
      });

      this.broadcastPulse();

      socket.on('user_presence', (data: { userId?: string; role?: string; page?: string }) => {
        const user = this.activeUsers.get(socketId);
        if (user) {
          user.userId = data.userId;
          user.role = data.role;
          user.currentPage = data.page;
          user.lastActive = new Date();
          this.activeUsers.set(socketId, user);
          this.broadcastPulse();
        }
      });

      socket.on('disconnect', () => {
        logger.info(`Nexus: Connection disconnected ${socketId}`);
        this.activeUsers.delete(socketId);
        this.broadcastPulse();
      });
    });

    // Pulse interval for real-time stats
    setInterval(() => this.broadcastPulse(), 5000);
  }

  private broadcastPulse(): void {
    if (!this.io) return;

    const stats = {
      liveUsers: this.activeUsers.size,
      authenticatedUsers: Array.from(this.activeUsers.values()).filter(u => u.userId).length,
      pages: this.getPageStats(),
      timestamp: new Date().toISOString(),
    };

    this.io.emit('nexus_pulse', stats);
  }

  private getPageStats(): Record<string, number> {
    const stats: Record<string, number> = {};
    this.activeUsers.forEach(user => {
      if (user.currentPage) {
        stats[user.currentPage] = (stats[user.currentPage] || 0) + 1;
      }
    });
    return stats;
  }

  public getActiveCount(): number {
    return this.activeUsers.size;
  }
}
