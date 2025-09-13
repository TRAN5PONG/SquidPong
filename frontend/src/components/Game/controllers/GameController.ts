import { Paddle } from "../entities/Paddle"
import { Ball } from "../entities/Ball";
import { GameState, PlayerState } from "../../../network/GameState";
import { EntryPoint } from "@/network/network";
import { Physics } from "../physics";
import { playerSide, Vec3, BallHitMessage } from "@/types/network";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { RollbackManager } from "./RollbackManager";

// debug paddle
import { Scene } from "@babylonjs/core";
import { DebugMeshManager } from "./debugMeshManager_TMP";

export enum ServeBall {
    FOLLOWING_PADDLE,
    IN_PLAY,
}

export class GameController {
    // Game entities
    private opponentPaddle!: Paddle;
    private paddle!: Paddle;
    ball!: Ball;

    // Rollback system
    private rollbackManager!: RollbackManager;
    private currentTick = 0;

    // Network data
    private playerSide: playerSide = null;
    private entryPoint!: EntryPoint;
    private localTick: number = 0;
    private lastServerTick: number = 0;

    // Server state
    private opponentPaddlePos: Vector3 = new Vector3(0, 0, 0);
    private opponentPaddleRot: Vector3 = new Vector3(0, 0, 0);
    private opponentPaddleVel: Vector3 = new Vector3(0, 0, 0);
    private opponentServePosition: Vector3 | null = null;

    // Collision detection
    private isHitter: boolean = false;
    private lastCollisionTick: number = -1;

    // Physics
    physics: Physics | null = null;

    // Interpolation
    private prevPhysicsPos: Vector3 = new Vector3(0, 0, 0);
    private currentPhysicsPos: Vector3 = new Vector3(0, 0, 0);

    // Serves
    public serveState: ServeBall = ServeBall.FOLLOWING_PADDLE;

    // Paddle Sync Interval 30 fps
    private paddleSyncInterval: number = 1000 / 30; // 33.33 ms
    private lastPaddleSyncTime: number = 0;

    // Paddle timing
    private lastUpdatePaddleTime: number = 0;
    private lastFrameTime: number = 0;

    // debug mesh
    private scene: Scene;
    private debugMeshes: DebugMeshManager;

    constructor(scene: Scene) {
        this.lastUpdatePaddleTime = performance.now();
        this.lastFrameTime = performance.now();
        this.lastPaddleSyncTime = performance.now();
        this.serveState = ServeBall.FOLLOWING_PADDLE;


        // debug mesh
        this.scene = scene;
        this.debugMeshes = new DebugMeshManager(this.scene);
        const sessionId = this.entryPoint?.room?.sessionId || "";
        this.debugMeshes.setSessionId(sessionId);
        this.debugMeshes.createDebugSpheres();
    }

    public setOpponentServePosition(position: Vec3): void {
        this.opponentServePosition = new Vector3(position.x, position.y, position.z);
    }

    public fixedUpdate(dt: number): void {
        if (!this.paddle || !this.ball || !this.physics) return;

        this.updateLocalPaddle();

        this.prevPhysicsPos.copyFrom(this.currentPhysicsPos);
        this.physics.Step();
        this.currentPhysicsPos.copyFrom(this.physics.getBallPosition());

        this.rollbackManager?.recordState(this.currentTick, this.serveState);

        this.currentTick++;

        const now = performance.now();
        this.sendPaddleState(now);
    }

    public onUpdateVisuals(alpha: number): void {
        const currentTime = performance.now();
        const deltaTime = (currentTime - this.lastFrameTime) / 1000;
        this.lastFrameTime = currentTime;

        this.updateVisualsOpponentPaddle(currentTime, deltaTime);

        this.updateVisualsBall(alpha);
    }

    private getOpponentPaddleData(state: GameState): PlayerState | null {
        if (!this.entryPoint || !state.players) return null;
        for (const [sessionId, player] of state.players.entries()) {
            if (sessionId !== this.entryPoint.room.sessionId) {
                return player;
            }
        }
        return null;
    }

    public onGameStateUpdate(state: GameState): void {
        this.onOpponentPaddleState(state);
    }

    private onOpponentPaddleState(state: GameState): void {
        if (!this.opponentPaddle) return;
        const opponentState = this.getOpponentPaddleData(state);
        if (!opponentState) return;

        this.opponentPaddlePos = new Vector3(opponentState.x, opponentState.y, opponentState.z);
        this.opponentPaddleRot = new Vector3(0, 0, opponentState.rotationZ);
        this.opponentPaddleVel = new Vector3(opponentState.velX, opponentState.velY, opponentState.velZ);
        this.lastUpdatePaddleTime = performance.now();
    }

    public updateVisualsOpponentPaddle(currentTime: number, deltaTime: number): void {
        if (!this.opponentPaddle) return;

        const timeSinceServerUpdate = (currentTime - this.lastUpdatePaddleTime) / 1000;
        const extrapolatedPos = this.opponentPaddlePos.add(this.opponentPaddleVel.scale(timeSinceServerUpdate));

        const currentPos = this.opponentPaddle.mesh.position;
        const errorToServer = this.opponentPaddlePos.subtract(currentPos).length();

        let targetPos: Vector3;
        let smoothingSpeed = 15;

        if (errorToServer > 0.8) {
            targetPos = extrapolatedPos;
            smoothingSpeed = 20;
        } else if (this.opponentPaddleVel.length() > 2.0) {
            targetPos = extrapolatedPos;
        } else {
            targetPos = this.opponentPaddlePos;
        }

        const smoothingFactor = 1.0 - Math.exp(-deltaTime * smoothingSpeed);
        this.opponentPaddle.mesh.position = Vector3.Lerp(
            this.opponentPaddle.mesh.position,
            targetPos,
            smoothingFactor
        );
        this.opponentPaddle.mesh.rotation = Vector3.Lerp(
            this.opponentPaddle.mesh.rotation,
            this.opponentPaddleRot,
            smoothingFactor
        );
    }

    private updateVisualsBall(alpha: number): void {
        if (!this.ball || !this.physics) return;

        if (this.serveState === ServeBall.FOLLOWING_PADDLE) {
            if (this.paddle.side === -1) {
                this.followingPaddle();
            } else if (this.opponentServePosition) {
                this.ball.setMeshPosition(this.opponentServePosition);
            }
            return;
        }

        const justHadCollision = this.lastCollisionTick === this.currentTick;
        if (justHadCollision) {
            const currentPos = this.physics.getBallPosition();
            this.ball.setMeshPosition(currentPos);
        } else {
            const renderPos = Vector3.Lerp(this.prevPhysicsPos, this.currentPhysicsPos, alpha);
            this.ball.setMeshPosition(renderPos);
        }
    }

    private updateLocalPaddle(): void {
        if (!this.paddle) return;

        this.paddle.setMeshPosition();
        if (this.physics) {
            const meshPos = this.paddle.getMeshPosition();
            this.physics.setPaddleTargetPosition(meshPos.x, meshPos.y, meshPos.z);
        }




        // dubeg
        const playerIds = this.entryPoint?.getPlayerIds();
        this.debugMeshes.createMeshes(playerIds);
        const sessionId = this.entryPoint?.room?.sessionId || "";
        const rotationPaddle = new Vector3(0, 0, this.physics!.getPaddleZRotation());
        this.debugMeshes.updatePaddle(sessionId, this.physics!.getPaddlePosition(), rotationPaddle)
    }

    setNetwork(network: EntryPoint) {
        this.entryPoint = network;
    }

    setPhysics(physics: Physics) {
        this.physics = physics;
        this.setCallbacks();
    }

    private calculateMagnusSpin(paddleSpeed: number, paddleVelocityX: number, paddleSide: number): { spinY: number, applySpin: boolean } {
        let spinY = 0;
        let applySpin = false;

        if (paddleSpeed >= 26) {
            const clampedPaddleVelX = Math.max(-29, Math.min(29, paddleVelocityX));

            if (Math.abs(clampedPaddleVelX) > 26) {
                if (clampedPaddleVelX > 26) {
                    spinY = ((clampedPaddleVelX - 26) / (29 - 26)) * 6;
                } else if (clampedPaddleVelX < -26) {
                    spinY = ((clampedPaddleVelX + 26) / (-29 + 26)) * -6;
                }

                spinY *= paddleSide;
                applySpin = true;
            }
        }

        return { spinY, applySpin };
    }

    setCallbacks() {
        if (!this.physics) return;

        this.physics.onBallPaddleCollision = (ball, paddle) => {
            const paddleVelocity = new Vector3(paddle.linvel().x, paddle.linvel().y, paddle.linvel().z);
            const paddleSpeed = paddleVelocity.length();

            if (this.rollbackManager?.isInProgress() || this.lastCollisionTick === this.currentTick) {
                return;
            }

            this.lastCollisionTick = this.currentTick;
            const spinCalc = this.calculateMagnusSpin(paddleSpeed, paddleVelocity.x, this.paddle.side);
            const spinY = spinCalc.spinY;
            this.physics!.setBallSpin(0, spinY, 0);
            this.physics!.setApplySpin(spinCalc.applySpin);

            const targetVel = this.physics!.calculateTargetZYVelocity(
                ball.translation(),
                paddle.translation()
            );

            const currentVel = ball.linvel();
            const mass = ball.mass();
            const impulse = new Vector3(
                (targetVel.x - currentVel.x) * mass,
                (targetVel.y - currentVel.y) * mass,
                (targetVel.z - currentVel.z) * mass
            );
            this.physics!.ball.body.applyImpulse(impulse, true);

            const actualVel = ball.linvel();
            const hitMsg: BallHitMessage = {
                position: { x: ball.translation().x, y: ball.translation().y, z: ball.translation().z },
                velocity: { x: actualVel.x, y: actualVel.y, z: actualVel.z },
                spin: { x: this.physics!.getBallSpin().x, y: this.physics!.getBallSpin().y, z: this.physics!.getBallSpin().z },
                applySpin: this.physics!.getApplySpin(),
                tick: this.currentTick,
                hitterId: this.entryPoint?.room?.sessionId
            };
            this.entryPoint?.SendBallHit(hitMsg);
            this.isHitter = true;
        };

        this.physics.onBallFloorCollision = (ball, floor) => {
            this.resetGame();
        };

        this.physics.onBallNetCollision = (ball, net) => {
            this.resetGame();
        };
    }

    setEntities(ball: Ball, opponentPaddle: Paddle, paddle: Paddle) {
        this.ball = ball;
        this.opponentPaddle = opponentPaddle;
        this.paddle = paddle;

        if (this.physics && this.ball) {
            this.rollbackManager = new RollbackManager(this.physics, this.ball);
        }
    }

    resetGame() {
        console.log("Resetting game state");
        this.currentTick = 0;
        this.rollbackManager?.clearHistory();
        this.isHitter = false;
        this.lastCollisionTick = -1;
        this.physics?.setBallSpin(0, 0, 0);
        this.physics?.setApplySpin(false);
        this.setBallState(true, new Vector3(0, 0, 0), new Vector3(0, 0, 0));

        if (this.isHitter || this.serveState === ServeBall.IN_PLAY) {
            this.entryPoint.room.send("resetGame", {
                tick: 0,
                resetBy: this.entryPoint.room.sessionId
            });
        }
        this.serveState = ServeBall.FOLLOWING_PADDLE;
    }

    private setBallState(frozen: boolean, position?: Vector3, velocity?: Vector3): void {
        if (!this.physics) return;

        this.physics.setBallFrozen(frozen);

        if (position) {
            this.physics.setBallPosition(position.x, position.y, position.z);
        }

        if (velocity) {
            this.physics.setBallVelocity(velocity.x, velocity.y, velocity.z);
        }

        if (this.ball) {
            this.ball.setMeshPosition(this.physics.getBallPosition());
        }
    }

    private followingPaddle(): void {
        if (!this.ball || !this.paddle || !this.physics) return;

        const paddlePos = this.paddle.getMeshPosition();
        const zOffset = this.paddle.side === -1 ? 0.3 : -0.3;
        const ballOffset = new Vector3(0, 0, zOffset);
        const newBallPos = paddlePos.add(ballOffset);

        this.ball.setMeshPosition(newBallPos);
        this.physics.setBallPosition(newBallPos.x, newBallPos.y, newBallPos.z);

        this.sendBallFollowPosition(newBallPos);
    }

    private sendBallFollowPosition(position: Vector3): void {
        if (!this.entryPoint) return;

        this.entryPoint.room.send("BallPreServe", {
            position: { x: position.x, y: position.y, z: position.z },
            isServing: true
        });
    }

    public triggerServe(): void {
        if (!this.ball || !this.physics || this.serveState !== ServeBall.FOLLOWING_PADDLE) return;

        this.physics.setBallFrozen(false);
        this.serveState = ServeBall.IN_PLAY;
        const serveVelocity = new Vector3(0, 2.5, this.paddle.side === 0 ? 0.2 : -0.2);
        const ballPos = this.ball.getMeshPosition();

        this.physics.setBallPosition(ballPos.x, ballPos.y, ballPos.z);
        this.physics.setBallVelocity(serveVelocity.x, serveVelocity.y, serveVelocity.z);

        this.entryPoint.room.send("BallServed", {
            velocity: { x: serveVelocity.x, y: serveVelocity.y, z: serveVelocity.z },
            position: { x: ballPos.x, y: ballPos.y, z: ballPos.z },
            tick: this.currentTick,
            serverId: this.entryPoint.room.sessionId
        });
    }

    private sendPaddleState(currentTime: number): void {
        if (!this.entryPoint || !this.paddle) return;

        if (currentTime - this.lastPaddleSyncTime >= this.paddleSyncInterval) {
            const pos = {
                x: this.paddle.getMeshPosition().x,
                y: this.paddle.getMeshPosition().y,
                z: this.paddle.getMeshPosition().z
            };
            const rot = {
                x: this.paddle.getMeshRotation().x,
                y: this.paddle.getMeshRotation().y,
                z: this.paddle.getMeshRotation().z
            };
            const paddleVel = {
                x: this.paddle.getPaddleVelocity().x,
                y: this.paddle.getPaddleVelocity().y,
                z: this.paddle.getPaddleVelocity().z
            };

            this.entryPoint.SendPaddlePosition(pos, rot, paddleVel);
            this.lastPaddleSyncTime = currentTime;
        }
    }

    public getCurrentTick(): number {
        return this.currentTick;
    }

    // Simplified rollback method that delegates to RollbackManager
    rollbackBall(receivedTick: number, position: Vec3, velocity: Vec3, spin?: Vec3) {
        if (!this.rollbackManager) {
            console.warn("RollbackManager not initialized");
            return;
        }

        this.rollbackManager.rollback(
            receivedTick,
            this.currentTick,
            position,
            velocity,
            spin,
            this.serveState
        );

        // Update current physics position after rollback
        this.currentPhysicsPos.copyFrom(this.physics!.getBallPosition());
    }

    public resetTick(startTick: number): void {
        this.currentTick = startTick;
        this.localTick = startTick;
        this.rollbackManager?.clearHistory();
    }

    // Utility methods for rollback debugging
    public debugRollbackHistory(): void {
        this.rollbackManager?.debugPrintHistory();
    }

    public getRollbackHistoryLength(): number {
        return this.rollbackManager?.getHistoryLength() || 0;
    }

}