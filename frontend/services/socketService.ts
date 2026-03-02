import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io('/', {
      transports: ['websocket', 'polling'],
      withCredentials: false,
      autoConnect: true,
    });
  }
  return socket;
};

export const joinUserRoom = (userId: string) => {
  if (!userId) return;
  const client = getSocket();
  client.emit('join', userId);
};

