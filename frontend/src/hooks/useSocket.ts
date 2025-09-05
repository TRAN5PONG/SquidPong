import { useState, useEffect, useRef } from "@/lib/Zeroact";

export function useSocket(url: string) {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Event | null>(null);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const socket = new WebSocket(url);
    socketRef.current = socket;

    socket.onopen = () => {
      setIsConnected(true);
    };

    socket.onclose = (event) => {
      setIsConnected(false);
      setError(event);
    };

    socket.onerror = (event) => {
      setError(event);
    };

    return () => {
      socket.close();
      socketRef.current = null;
      setIsConnected(false);
      setError(null);
    };
  }, [url]);

  const sendMessage = (data: any) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      console.log("useSocket: Sending message:", data);
      socketRef.current.send(JSON.stringify(data));
    } else {
      console.warn("useSocket: Cannot send message: WebSocket is not open");
    }
  };

  const result = {
    socket: socketRef.current,
    isConnected,
    error,
    sendMessage,
  };
  return result;
}
