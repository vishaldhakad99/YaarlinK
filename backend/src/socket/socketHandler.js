const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = (io) => {
  // Auth middleware for socket
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
      if (!token) return next(new Error('No token'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'yaarlink_secret');
      const user = await User.findById(decoded.userId).select('-password');
      if (!user) return next(new Error('User not found'));

      socket.userId = user._id.toString();
      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Auth failed'));
    }
  });

  const onlineUsers = new Map();

  io.on('connection', async (socket) => {
    console.log(`🔌 User connected: ${socket.user.name} (${socket.userId})`);

    // Join personal room
    socket.join(`user_${socket.userId}`);

    // Update online status
    onlineUsers.set(socket.userId, socket.id);
    await User.findByIdAndUpdate(socket.userId, { isOnline: true, lastActive: new Date() });
    io.emit('user_online', { userId: socket.userId });

    // Join match rooms
    socket.on('join_match', (matchId) => {
      socket.join(`match_${matchId}`);
    });

    // Leave match room
    socket.on('leave_match', (matchId) => {
      socket.leave(`match_${matchId}`);
    });

    // Join community room
    socket.on('join_community', (communityId) => {
      socket.join(`community_${communityId}`);
    });

    // Typing indicators
    socket.on('typing_start', ({ matchId, receiverId }) => {
      socket.to(`user_${receiverId}`).emit('typing_start', { matchId, userId: socket.userId });
    });

    socket.on('typing_stop', ({ matchId, receiverId }) => {
      socket.to(`user_${receiverId}`).emit('typing_stop', { matchId, userId: socket.userId });
    });

    // WebRTC signaling for voice/video
    socket.on('webrtc_offer', ({ targetUserId, offer, matchId }) => {
      io.to(`user_${targetUserId}`).emit('webrtc_offer', {
        offer,
        matchId,
        fromUserId: socket.userId,
        fromUserName: socket.user.name
      });
    });

    socket.on('webrtc_answer', ({ targetUserId, answer, matchId }) => {
      io.to(`user_${targetUserId}`).emit('webrtc_answer', { answer, matchId, fromUserId: socket.userId });
    });

    socket.on('webrtc_ice_candidate', ({ targetUserId, candidate }) => {
      io.to(`user_${targetUserId}`).emit('webrtc_ice_candidate', { candidate, fromUserId: socket.userId });
    });

    socket.on('call_end', ({ targetUserId }) => {
      io.to(`user_${targetUserId}`).emit('call_ended', { fromUserId: socket.userId });
    });

    // Message seen
    socket.on('message_seen', ({ matchId, messageId, senderId }) => {
      io.to(`user_${senderId}`).emit('message_seen', { matchId, messageId });
    });

    // Vibe update broadcast
    socket.on('vibe_update', ({ vibe }) => {
      io.emit('user_vibe_update', { userId: socket.userId, vibe });
    });

    // Disconnect
    socket.on('disconnect', async () => {
      console.log(`🔌 User disconnected: ${socket.userId}`);
      onlineUsers.delete(socket.userId);
      await User.findByIdAndUpdate(socket.userId, { isOnline: false, lastActive: new Date() });
      io.emit('user_offline', { userId: socket.userId });
    });
  });
};
