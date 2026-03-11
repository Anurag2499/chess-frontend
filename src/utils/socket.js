import { io } from 'socket.io-client';

// const socket = io('http://localhost:5000', {
//   autoConnect: false,
// });

const socket = io('https://chess-backend-xdgj.onrender.com', {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 2000,
  transports: ['websocket'],
});

export default socket;
