import { io, Socket } from 'socket.io-client';
import { getServerUrl } from './network';

let socket: Socket | null = null;
let currentUrl = '';

export const getSocket = (): Socket => {
  const url = getServerUrl();
  // Reconnect if URL changed
  if (socket && currentUrl !== url) {
    socket.disconnect();
    socket = null;
  }
  if (!socket) {
    currentUrl = url;
    socket = io(url, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) { socket.disconnect(); socket = null; }
};
