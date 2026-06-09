import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import useStore from '../store/useStore';

let socketInstance = null;

export const useSocket = () => {
  const { accessToken, user, addMatch, addMessage, addNotification } = useStore();
  const initialized = useRef(false);

  useEffect(() => {
    if (!accessToken || !user || initialized.current) return;
    initialized.current = true;

    socketInstance = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000', {
      auth: { token: accessToken },
      transports: ['websocket', 'polling']
    });

    socketInstance.on('connect', () => {
      console.log('Socket connected');
      socketInstance.emit('join_user_room', user._id);
    });

    socketInstance.on('new_match', (data) => {
      addMatch(data.match);
      addNotification({ type: 'match', message: `New match with ${data.user.name}!`, data });
    });

    socketInstance.on('new_message', ({ message }) => {
      addMessage(message.match, message);
    });

    socketInstance.on('red_flag_warning', ({ message }) => {
      addNotification({ type: 'warning', message });
    });

    socketInstance.on('disconnect', () => {
      initialized.current = false;
    });

    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
        socketInstance = null;
        initialized.current = false;
      }
    };
  }, [accessToken, user]);

  return socketInstance;
};

export const getSocket = () => socketInstance;
