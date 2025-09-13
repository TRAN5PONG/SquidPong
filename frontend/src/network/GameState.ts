import { Schema, type, MapSchema } from "@colyseus/schema";

export class PlayerState extends Schema {
  @type("number") x: number = 0;
  @type("number") y: number = 0;
  @type("number") z: number = 0;
  @type("number") velX: number = 0;
  @type("number") velY: number = 0;
  @type("number") velZ: number = 0;
  @type("number") rotationZ: number = 0;
  @type("number") side: number = 0;
}

export class BallState extends Schema {
  @type("number") x: number = 0;
  @type("number") y: number = 0;
  @type("number") z: number = 0;

  @type("number") velocityX: number = 0;
  @type("number") velocityY: number = 0;
  @type("number") velocityZ: number = 0;


  @type("number") lastHitTime: number = 0;
}

export class GameState extends Schema {
  @type({ map: PlayerState })
  players = new MapSchema<PlayerState>(); // key: sessionId, value: Player
  @type(BallState) ball = new BallState();
  @type("string") gameStatus:  "waiting" | "playing" | "start" | "paused" | "over" = "waiting";
  @type("number") tick: number = 0;
  @type("number") timestamp: number = 0;
}