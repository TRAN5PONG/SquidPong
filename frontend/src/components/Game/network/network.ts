import { Client, getStateCallbacks, Room } from "colyseus.js";
import { MatchPhase, MatchState } from "./GameState";
import { Match, MatchPlayer } from "@/types/game";

type Listener<T> = (data: T) => void;

// Define specific listener types for better type safety
type ListenerTypes = {
  players: Record<string, MatchPlayer>;
  phase: MatchPhase;
  countdown: number | null;
  winner: string | null;
};

export class Network {
  private client: Client;
  private room: Room<MatchState> | null = null;
  private match: Match | null = null;
  private readonly serverUrl: string;

  // Local state
  private players: Record<string, MatchPlayer> = {};
  private spectators: Record<string, any> = {};
  private winnerId: string | null = null;
  private phase: MatchPhase = "waiting";
  private countdown: number | null = null;

  // Subscriptions
  private listeners: {
    [K in keyof ListenerTypes]: Listener<ListenerTypes[K]>[];
  } = {
    players: [],
    phase: [],
    countdown: [],
    winner: [],
  };

  constructor(serverUrl: string, match: Match) {
    this.serverUrl = serverUrl;
    this.client = new Client(serverUrl);
    this.match = match;

    // Set players
    this.players[match.opponent1.id] = match.opponent1;
    this.players[match.opponent2.id] = match.opponent2;
  }

  // Join
  async join(roomId: string, userId: string) {
    try {
      this.room = await this.client.joinById<MatchState>(roomId, { userId });
      this.setupMatchListeners();
      return this.room;
    } catch (err) {
      console.error("Join error:", err);
      throw err;
    }
  }

  // Setup Match listeners
  private setupMatchListeners() {
    if (!this.room) return;
    const $ = getStateCallbacks(this.room as any);

    // Players
    $(this.room.state as any).players.onAdd(
      (player: MatchPlayer, playerId: string) => {
        const existingPlayer = this.players[playerId];
        if (!existingPlayer) return;
        this.players[playerId] = {
          ...existingPlayer,
          isConnected: player.isConnected,
          pauseRequests: player.pauseRequests,
          remainingPauseTime: player.remainingPauseTime,
        };
        this.emit('players', this.players);

        $(player as any).listen("isConnected", (isConnected: boolean) => {
          if (this.players[playerId]) {
            this.players[playerId].isConnected = isConnected;
            console.log(`Player ${playerId} connection status:`, isConnected);
            this.emit('players', this.players);
          }
        });
      }
    );
    $(this.room.state as any).players.onRemove(
      (_: MatchPlayer, playerId: string) => {
        if (this.players[playerId]) {
          this.players[playerId].isConnected = false;
          this.players[playerId].remainingPauseTime = 0;
          this.players[playerId].pauseRequests = 0;
          this.emit('players', this.players);
        }
      }
    );

    // Phase
    $(this.room.state as any).listen("phase", (phase: MatchPhase) => {
      this.phase = phase;
      this.emit('phase', phase);
    });

    // Winner
    $(this.room.state as any).listen("winnerId", (newWinnerId: string | null) => {
      this.winnerId = newWinnerId;
      this.emit('winner', newWinnerId);
    });

    // Countdown
    $(this.room.state as any).listen("countdown", (countdown: number) => {
      this.countdown = this.room?.state.phase === "countdown" ? countdown : null;
      this.emit('countdown', this.countdown);
    });
  }

  // Message handlers
  registerMessageHandlers(handlers: Record<string, (msg: any) => void>) {
    if (!this.room) return;
    for (const [message, handler] of Object.entries(handlers)) {
      this.room.onMessage(message, handler);
    }
  }

  // Send message to server
  sendMessage(type: string, data?: any) {
    if (!this.room) {
      console.warn('Cannot send message: not connected to room');
      return;
    }
    this.room.send(type, data);
  }

  // Getters
  getRoom() {
    return this.room;
  }
  getPlayers() {
    return this.players;
  }
  getSpectators() {
    return this.spectators;
  }
  getWinnerId() {
    return this.winnerId;
  }
  getPhase() {
    return this.phase;
  }
  getCountdown() {
    return this.countdown;
  }
  isConnected() {
    return this.room !== null;
  }

  // Subscriptions
  on<K extends keyof ListenerTypes>(
    key: K,
    callback: Listener<ListenerTypes[K]>
  ) {
    this.listeners[key].push(callback);
  }

  // Remove listener
  off<K extends keyof ListenerTypes>(
    key: K,
    callback: Listener<ListenerTypes[K]>
  ) {
    const index = this.listeners[key].indexOf(callback);
    if (index > -1) {
      this.listeners[key].splice(index, 1);
    }
  }

  private emit<K extends keyof ListenerTypes>(
    key: K,
    data: ListenerTypes[K]
  ) {
    this.listeners[key].forEach((callback) => callback(data));
  }

  // Leave
  leave() {
    if (this.room) {
      this.room.leave();
      this.room = null;
      this.players = {};
      this.spectators = {};
      this.winnerId = null;
      this.phase = "waiting";
      this.countdown = null;
    }
  }

  // Cleanup all listeners
  dispose() {
    this.leave();
    this.listeners.players = [];
    this.listeners.phase = [];
    this.listeners.countdown = [];
    this.listeners.winner = [];
  }
}