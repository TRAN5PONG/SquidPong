import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { constants } from "@/utils/constants";
import RAPIER from "@dimforge/rapier3d-compat";

export class BallTrajectory {
  /**
   * Calculate the velocity vector for hitting the ball.
   * @param type - "play" for regular hits, "serve" for serves
   */
  static calculateTrajectory(
    ballPos: RAPIER.Vector,
    paddlePos: RAPIER.Vector,
    paddleVelocity: RAPIER.Vector,
    applySpin: boolean = false,
    paddleSpeed: number,
    type: "play" | "serve" = "play",
  ): Vector3 {
    if (type === "serve") {
      return this.calculateServe(
        ballPos,
        paddlePos, // serverZ
        paddleVelocity,
        paddleSpeed,
      );
    }

    const halfLength = constants.TABLE.size.length / 2;
    const halfWidth = constants.TABLE.size.width / 2;
    const tableSurfaceY =
      constants.TABLE.position.y + constants.TABLE.size.height / 2;
    const netTopY = constants.TABLE.position.y + constants.NET.size.height;
    const gravity = Math.abs(constants.Gravity.y);
    const safeMargin = 0.3;

    const [zMin, zMax] = this.getZBounds(paddlePos.z, halfLength, safeMargin);

    const targetZ = this.calculateTargetZFromVelocity(
      paddleVelocity.z * 0.2,
      zMin,
      zMax,
    );

    const arcHeight = this.getArcHeight(ballPos.y, netTopY, paddleSpeed);

    const velocityY = this.calculateVelocityY(ballPos.y, arcHeight, gravity);

    const totalFlightTime = this.calculateFlightTime(
      ballPos.y,
      arcHeight,
      velocityY,
      gravity,
      tableSurfaceY,
    );

    const velocityZ =
      (targetZ - ballPos.z) /
      this.getSafeFlightTime(totalFlightTime, targetZ, ballPos.z);

    const velocityX = this.calculateVelocityX(
      ballPos.x,
      paddlePos.x,
      paddleVelocity.x,
      paddlePos.z,
      halfWidth,
      safeMargin,
      applySpin,
      totalFlightTime,
    );

    return new Vector3(velocityX, velocityY, velocityZ);
  }

  // --- Regular Play Helpers ---
  private static getZBounds(
    paddleZ: number,
    halfLength: number,
    margin: number,
  ): [number, number] {
    return paddleZ > 0
      ? [-halfLength + margin, -0.2 - margin]
      : [0.2 + margin, halfLength - margin];
  }

  private static getArcHeight(
    ballY: number,
    netTopY: number,
    paddleSpeed: number,
  ): number {
    const baseArcHeight = 0.2;
    const speedFactor = Math.min(paddleSpeed / 30, 1);
    const dynamicClearance = baseArcHeight + speedFactor * 0.4;

    const minArcHeight = netTopY + dynamicClearance;
    const desiredArcHeight = ballY + 0.3;

    return Math.max(minArcHeight, desiredArcHeight);
  }

  private static calculateVelocityY(
    ballY: number,
    arcHeight: number,
    gravity: number,
  ): number {
    const heightGain = arcHeight - ballY;
    return heightGain > 0
      ? Math.sqrt(2 * gravity * heightGain)
      : -Math.sqrt(2 * gravity * Math.abs(heightGain));
  }

  private static calculateFlightTime(
    ballY: number,
    arcHeight: number,
    velocityY: number,
    gravity: number,
    landingY: number,
  ): number {
    const heightGain = arcHeight - ballY;
    const timeUp = heightGain > 0 ? velocityY / gravity : 0;
    const peakHeight = heightGain > 0 ? arcHeight : ballY;
    const fallDistance = Math.max(peakHeight - landingY, 0.1);
    const timeDown = Math.sqrt((2 * fallDistance) / gravity);
    return timeUp + timeDown;
  }

  private static getSafeFlightTime(
    totalTime: number,
    targetZ: number,
    ballZ: number,
  ): number {
    const distanceZ = Math.abs(targetZ - ballZ);
    const minTimeForDistance = distanceZ / 20.0;
    return Math.max(totalTime, minTimeForDistance);
  }

  private static calculateVelocityX(
    ballX: number,
    paddleX: number,
    paddleVelX: number,
    paddleZ: number,
    halfWidth: number,
    margin: number,
    applySpin: boolean,
    flightTime: number,
  ): number {
    const minX = -halfWidth + margin;
    const maxX = halfWidth - margin;
    const paddleSide = paddleZ > 0 ? -1 : 1;

    let targetX = applySpin
      ? paddleX
      : paddleX + paddleVelX * 0.05 * paddleSide;

    targetX = Math.max(minX, Math.min(maxX, targetX));

    return (targetX - ballX) / flightTime;
  }

  // --- Serve Calculation ---
  private static calculateServe(
    ballPos: RAPIER.Vector,
    paddlePos: RAPIER.Vector,
    paddleVelocity: RAPIER.Vector,
    paddleSpeed: number,
  ): Vector3 {
    const halfLength = constants.TABLE.size.length / 2;
    const halfWidth = constants.TABLE.size.width / 2;
    const safeMargin = 0.3;

    // Target zone: 20%-100% of server's side
    const [zMin, zMax] =
      paddlePos.z > 0
        ? [halfLength * 0.2 - safeMargin, halfLength - safeMargin]
        : [-halfLength + safeMargin, -halfLength * 0.2 + safeMargin];

    const targetZ = this.calculateTargetZFromVelocity(
      paddleVelocity.z * 0.5,
      zMin,
      zMax,
    );

    const distanceZ = Math.abs(targetZ - ballPos.z);
    const estimatedFlightTime = Math.sqrt(distanceZ / 15);
    const velocityZ = (targetZ - ballPos.z) / estimatedFlightTime;

    const baseVelocityY = -1.6;
    const speedFactor = Math.min(Math.abs(paddleVelocity.z) * 0.08, 1.8);
    const velocityY = baseVelocityY - speedFactor * 1.4;

    const [xMin, xMax] = [-halfWidth + safeMargin, halfWidth - safeMargin];
    const targetX = this.calculateTargetZFromVelocity(
      paddleSpeed * 0.5,
      xMin,
      xMax,
    );
    const velocityX = this.calculateVelocityX(
      ballPos.x,
      paddlePos.x,
      paddleVelocity.x,
      paddlePos.z,
      halfWidth,
      safeMargin,
      false,
      estimatedFlightTime,
    );

    return new Vector3(velocityX, velocityY, velocityZ);
  }

  // --- Shared Helper ---
  /**
   * Helper to calculate target position based on velocity input.
   */
  static calculateTargetZFromVelocity(
    paddleVelocityZ: number,
    zMin: number,
    zMax: number,
  ): number {
    const clamped = Math.max(-2, Math.min(2, paddleVelocityZ / 1.5));
    const t = (clamped + 2) / 4;
    return zMin + t * (zMax - zMin);
  }
}
