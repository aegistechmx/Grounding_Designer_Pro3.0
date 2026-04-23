/**
 * Real-time Collaboration Service
 * Handles Socket.IO for collaborative editing
 */

const { Server } = require('socket.io');

class SocketService {
  constructor() {
    this.io = null;
    this.projectRooms = new Map(); // projectId -> Set of socketIds
    this.userSockets = new Map(); // userId -> socketId
  }

  /**
   * Initialize Socket.IO server
   */
  initialize(server) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        methods: ['GET', 'POST']
      }
    });

    this.io.on('connection', (socket) => {
      console.log(`User connected: ${socket.id}`);

      // Handle user authentication
      socket.on('authenticate', ({ userId, token }) => {
        // Verify token (simplified - should use auth middleware)
        if (userId) {
          this.userSockets.set(userId, socket.id);
          socket.userId = userId;
          console.log(`User ${userId} authenticated with socket ${socket.id}`);
        }
      });

      // Handle joining a project room
      socket.on('join-project', ({ projectId }) => {
        socket.join(`project-${projectId}`);
        
        if (!this.projectRooms.has(projectId)) {
          this.projectRooms.set(projectId, new Set());
        }
        this.projectRooms.get(projectId).add(socket.id);

        // Notify others in the room
        socket.to(`project-${projectId}`).emit('user-joined', {
          userId: socket.userId,
          socketId: socket.id
        });

        // Send current room users to the new joiner
        const roomUsers = this.getProjectUsers(projectId);
        socket.emit('room-users', roomUsers);

        console.log(`User ${socket.userId} joined project ${projectId}`);
      });

      // Handle leaving a project room
      socket.on('leave-project', ({ projectId }) => {
        socket.leave(`project-${projectId}`);
        
        if (this.projectRooms.has(projectId)) {
          this.projectRooms.get(projectId).delete(socket.id);
        }

        // Notify others in the room
        socket.to(`project-${projectId}`).emit('user-left', {
          userId: socket.userId,
          socketId: socket.id
        });

        console.log(`User ${socket.userId} left project ${projectId}`);
      });

      // Handle parameter updates
      socket.on('update-params', ({ projectId, params, userId }) => {
        // Broadcast to all other users in the project room
        socket.to(`project-${projectId}`).emit('params-updated', {
          params,
          userId,
          timestamp: new Date().toISOString()
        });
      });

      // Handle cursor position updates
      socket.on('cursor-move', ({ projectId, position, userId }) => {
        socket.to(`project-${projectId}`).emit('cursor-updated', {
          position,
          userId,
          timestamp: new Date().toISOString()
        });
      });

      // Handle selection updates
      socket.on('selection-change', ({ projectId, selection, userId }) => {
        socket.to(`project-${projectId}`).emit('selection-updated', {
          selection,
          userId,
          timestamp: new Date().toISOString()
        });
      });

      // Handle simulation trigger
      socket.on('run-simulation', ({ projectId, params, userId }) => {
        socket.to(`project-${projectId}`).emit('simulation-started', {
          userId,
          timestamp: new Date().toISOString()
        });
      });

      // Handle simulation complete
      socket.on('simulation-complete', ({ projectId, results, userId }) => {
        this.io.to(`project-${projectId}`).emit('simulation-results', {
          results,
          userId,
          timestamp: new Date().toISOString()
        });
      });

      // Handle typing indicator
      socket.on('typing-start', ({ projectId, userId }) => {
        socket.to(`project-${projectId}`).emit('user-typing', {
          userId,
          timestamp: new Date().toISOString()
        });
      });

      socket.on('typing-stop', ({ projectId, userId }) => {
        socket.to(`project-${projectId}`).emit('user-stopped-typing', {
          userId,
          timestamp: new Date().toISOString()
        });
      });

      // Handle chat messages
      socket.on('send-message', ({ projectId, message, userId }) => {
        this.io.to(`project-${projectId}`).emit('new-message', {
          message,
          userId,
          timestamp: new Date().toISOString()
        });
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
        
        // Remove from user sockets map
        if (socket.userId) {
          this.userSockets.delete(socket.userId);
        }

        // Remove from all project rooms
        for (const [projectId, socketSet] of this.projectRooms.entries()) {
          if (socketSet.has(socket.id)) {
            socketSet.delete(socket.id);
            socket.to(`project-${projectId}`).emit('user-left', {
              userId: socket.userId,
              socketId: socket.id
            });
          }
        }
      });
    });

    return this.io;
  }

  /**
   * Get users in a project room
   */
  getProjectUsers(projectId) {
    const socketSet = this.projectRooms.get(projectId);
    if (!socketSet) return [];

    const users = [];
    for (const socketId of socketSet) {
      const socket = this.io.sockets.sockets.get(socketId);
      if (socket && socket.userId) {
        users.push({
          userId: socket.userId,
          socketId: socket.id
        });
      }
    }

    return users;
  }

  /**
   * Broadcast to project room
   */
  broadcastToProject(projectId, event, data) {
    this.io.to(`project-${projectId}`).emit(event, data);
  }

  /**
   * Send to specific user
   */
  sendToUser(userId, event, data) {
    const socketId = this.userSockets.get(userId);
    if (socketId) {
      this.io.to(socketId).emit(event, data);
    }
  }

  /**
   * Get socket instance
   */
  getIO() {
    return this.io;
  }
}

export default new SocketService();
