
import WebSocket from "ws";

export type MyWebSocket = InstanceType<typeof WebSocket> & { userId?: string };
