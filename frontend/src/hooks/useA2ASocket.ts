import {useEffect, useRef} from 'react';
import {io, Socket} from 'socket.io-client';

export function useA2ASocket() {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = io();
    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  return socketRef;
}
