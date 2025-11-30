import { BounceGamePaddle } from "../entities/Paddle/BounceGamePaddle";
import { BounceGameBall } from "../entities/Ball/BounceGameBall";
import { Physics_miniGame } from "../physics/Bounce";
import { Vector3, Quaternion } from "@babylonjs/core";
import { Scene } from "@babylonjs/core";

export class MiniGameController {
  private paddle: BounceGamePaddle;
  private ball: BounceGameBall;
  private physics: Physics_miniGame;
  private scene: Scene;
  
  // Game state
  public score: number = 0;
  public isGameOver: boolean = false;
  private countingPaused: boolean = false;
  // callback to notify outer code (scene) when game over occurs
  public onGameOver?: () => void;
  private targetPaddlePos: Vector3 = new Vector3(0, 0, 0);
  private mouseX: number = 0;
  private mouseY: number = 0;

  constructor(
    paddle: BounceGamePaddle,
    ball: BounceGameBall,
    physics: Physics_miniGame,
    scene: Scene
  ) {
    this.paddle = paddle;
    this.ball = ball;
    this.physics = physics;
    this.scene = scene;
    
    this.setupInputHandlers();
    this.setupPhysicsCallbacks();
  }

  /**
   * Setup physics collision callbacks
   */
  private setupPhysicsCallbacks(): void {
    this.physics.onBallPaddleCollision = () => {

      const ballVel = this.physics.ball.body.linvel();
      const velocityMagnitude = Math.sqrt(
        ballVel.x * ballVel.x + 
        ballVel.y * ballVel.y + 
        ballVel.z * ballVel.z
      );
      
      const MIN_BOUNCE_VELOCITY = 10.0;
      
      if (velocityMagnitude >= MIN_BOUNCE_VELOCITY) {
        this.incrementScore();
      }
    };

    this.physics.onBallFloorCollision = () => {
      this.gameOver();
    };
  }


  private checkBallBounds(): void {
    if (this.isGameOver) return;

    const ballPos = this.physics.ball.body.translation();
    const MAX_DISTANCE = 50;

    // Check if ball is too far from origin
    const distanceFromOrigin = Math.sqrt(
      ballPos.x * ballPos.x + 
      ballPos.y * ballPos.y + 
      ballPos.z * ballPos.z
    );

    if (distanceFromOrigin > MAX_DISTANCE) {
      this.gameOver();
    }
  }

  /**
   * Setup mouse/touch input handlers for paddle movement
   */
  private setupInputHandlers(): void {
    this.scene.onPointerMove = (evt: any) => {
      if (this.isGameOver) return;

      this.mouseX = (evt.clientX / window.innerWidth) * 2 - 1;
      this.mouseY = -(evt.clientY / window.innerHeight) * 2 + 1;
    
      this.targetPaddlePos.x = this.mouseX * 12;
      this.targetPaddlePos.y = this.mouseY * 6;
      this.targetPaddlePos.z = 0;
    };
  }

  /**
   * Update visuals with interpolation
   */
  public UpdateVisuals(alpha: number): void {
    if (!this.paddle || !this.ball || !this.physics) return;

    const paddlePos = this.physics.paddle.getInterpolatedPos(alpha);
    this.paddle.updateVisual(paddlePos as Vector3);
  
    this.updatePaddleRotation();

    this.updateVisualsBall(alpha);
  }

  /**
   * Update paddle rotation based on mouse X position
   */
  private updatePaddleRotation(): void {
    if (!this.paddle.mesh || !this.physics) return;
  
    const clampedMouseX = Math.max(-1, Math.min(1, this.mouseX));
    
    const targetRot = (clampedMouseX * Math.PI) / 5;
    this.physics.paddle.setRotationZ(targetRot);
    const paddleRot = this.physics.paddle.body.rotation();
    
    if (!this.paddle.mesh.rotationQuaternion) {
      this.paddle.mesh.rotationQuaternion = new Quaternion();
    }
    
    this.paddle.mesh.rotationQuaternion.set(paddleRot.x, paddleRot.y, paddleRot.z, paddleRot.w);
  }

  /**
   * Update ball visuals with interpolation 
   */
  private updateVisualsBall(alpha: number): void {
    if (!this.ball || !this.physics) return;

    const renderPos = Vector3.Lerp(
      this.physics.ball.getPrevPosition(),
      this.physics.ball.getCurrentPosition(),
      alpha,
    );

    const rot = this.physics.ball.body.rotation();
    this.ball.mesh.rotationQuaternion!.set(rot.x, rot.y, rot.z, rot.w);
    this.ball.setMeshPosition(renderPos.x, renderPos.y, renderPos.z);
  }

  /**
   * Fixed update for physics
   */
  public FixedUpdate(): void {
    if (!this.paddle || !this.ball || !this.physics) return;

    this.physics.paddle.setTarget(
      this.targetPaddlePos.x,
      this.targetPaddlePos.y,
      this.targetPaddlePos.z
    );

    this.physics.ball.setPosition("PREV");
    this.physics.Step();
    this.physics.ball.setPosition("CURR");

    // Check if ball went too far
    this.checkBallBounds();
  }

  public gameOver(): void {
    if (this.isGameOver) return;

    this.isGameOver = true;
    this.countingPaused = true;

    // notify listeners (e.g., the scene / UI) that game is over so they can show controls
    try {
      this.onGameOver?.();
    } catch (e) {
      console.warn("onGameOver callback threw:", e);
    }
  }

  public incrementScore(): void {
    if (this.countingPaused) return;
    this.score++;
  }


  public reset(): void {
    this.score = 0;
    this.isGameOver = false;
    this.countingPaused = false;
    this.targetPaddlePos.set(0, 0, 0);
    
    this.physics.setBallPosition(0, 5, 0);
    this.physics.setBallVelocity(0, 0, 0);
    this.physics.setBallFrozen(false);
  }


  public startGame(): void {
    this.reset();
    this.physics.setBallFrozen(false);
    this.physics.setBallVelocity(0, 5, 0);
  }
}
