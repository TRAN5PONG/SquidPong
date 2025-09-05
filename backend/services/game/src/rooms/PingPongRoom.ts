import { Room, Client } from "colyseus";
import { Schema, type, MapSchema } from "@colyseus/schema";
import jwt from "jsonwebtoken";

// ====================
// 1. Define room state
// ====================
class Player extends Schema {
  @type("string") id!: string;
  @type("number") x = 0;
  @type("number") y = 0;
  @type("boolean") isReady = false;
}

class PingPongState extends Schema {
  @type({ map: Player }) players = new MapSchema<Player>();
}

export class PingPongRoom extends Room<PingPongState> {
  maxClients = 10; // 2 players + 8 spectators

  onCreate(options: any) {
    this.state = new PingPongState();
    console.log("new Room created!", this.roomId);

    this.onMessage("update-position", (client, { x, y }) => {
      const player = this.state.players.get(client.sessionId);

      if (player) {
        player.x = x;
        player.y = y;
      }
    });
  }

  onJoin(client: Client, options: any) {
    const player = new Player();
    player.id = client.sessionId;
    this.state.players.set(client.sessionId, player);

    console.log(`Player ${client.sessionId} joined room ${this.roomId}`);
  }

  onLeave(client: Client, consented: boolean) {
    this.state.players.delete(client.sessionId);
    console.log(`Player ${client.sessionId} left room ${this.roomId}`);
  }

  onDispose() {
    console.log("Room disposed", this.roomId);
  }
}
