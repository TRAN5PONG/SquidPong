type EventHandler = (data: any) => void;

class SocketManager {
  private socket: WebSocket | null = null;
  private listeners: Record<string, EventHandler[]> = {};

  connect(url: string) {
    this.socket = new WebSocket(url);
    this.socket.onmessage = (event) => {
      let parsedData: any;

      try {
        parsedData = JSON.parse(event.data);
        if (parsedData.data && parsedData.event) {
          const handlers = this.listeners[parsedData.event];

          // Call all handlers for this event
          if (handlers) {
            handlers.forEach((handler) => handler(parsedData.data));
          }
        } else {
          console.warn("Received message without event or data:", parsedData);
        }
      } catch (error) {
        console.error("Failed to parse WebSocket message:", error);
        return;
      }
    };
  }

  subscribe(event: string, handler: EventHandler) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(handler);
  }
  unsubscribe(event: string, handler: EventHandler) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter((h) => h !== handler);
  }

  sendMessage(data: any) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(data));
    }
  }
}

// singleton instance
export const socketManager = new SocketManager();
