import { Ball } from "../../../entities/Ball.ts";
import { Paddle } from "../../../entities/Paddle/Paddle.ts";
import { Physics } from "../../../physics/index.ts";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { constants } from "../../../../../utils/constants.ts";

export class AIController {
  private paddle: Paddle;
  private difficulty: number = 0.7; // 0.0-1.0
  private reactionDelay: number = 0.1; // seconds
  private lastPrediction: Vector3 | null = null;

  constructor(paddle: Paddle, difficulty: number = 0.7) {
    this.paddle = paddle;
    this.difficulty = difficulty;
    this.reactionDelay = (1 - difficulty) * 0.3;
  }

  update(
    ball: Ball,
    physics: Physics,
    deltaTime: number,
  ): { x: number; y: number; z: number } {
    const prediction = this.predictBallLanding(ball, physics);

    const error = (1 - this.difficulty) * 0.2;
    const targetX = prediction.x + (Math.random() - 0.5) * error;
    const targetZ = prediction.z + (Math.random() - 0.5) * error * 0.5;

    return {
      x: targetX,
      y: this.paddle.getMeshPosition().y, // Fixed Y
      z: targetZ,
    };
  }

  private predictBallLanding(ball: Ball, physics: Physics): Vector3 {
    const halfTableLength = constants.TABLE.size.length / 2;
    const ballPos = physics.getBallPosition();
    const ballVel = physics.getBallVelocity();
    const paddleZ =
      this.paddle.side === "LEFT" ? -halfTableLength : halfTableLength;

    // Time until ball reaches AI's side
    const timeToReach = (paddleZ - ballPos.z) / ballVel.z;

    if (timeToReach <= 0 || !isFinite(timeToReach)) {
      return this.paddle.getMeshPosition(); // Stay in place
    }

    // Predict X position
    const predictedX = ballPos.x + ballVel.x * timeToReach;

    // Strategic Z positioning
    const strategicZ = this.getStrategicZ(ballVel, timeToReach);

    return new Vector3(predictedX, ballPos.y, strategicZ);
  }

  private getStrategicZ(ballVel: Vector3, timeToReach: number): number {
    const baseZ = this.paddle.side === "LEFT" ? -2 : 2;

    // Move forward for slow balls (aggressive)
    if (Math.abs(ballVel.z) < 5 && this.difficulty > 0.6) {
      return baseZ * 0.7; // Move closer to net
    }

    // Stay back for fast balls (defensive)
    if (Math.abs(ballVel.z) > 10) {
      return baseZ * 1.2; // Move away from net
    }

    return baseZ; // Normal position
  }
}
