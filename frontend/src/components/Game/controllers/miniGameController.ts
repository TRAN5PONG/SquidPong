import { BounceGamePaddle } from "../entities/Paddle/BounceGamePaddle";
import { BounceGameBall } from "../entities/Ball/BounceGameBall";
import { Physics_miniGame } from "../physics/Bounce";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Scene } from "@babylonjs/core/scene";

export class MiniGameController {
  private paddle: BounceGamePaddle;
  private ball: BounceGameBall;
  private physics: Physics_miniGame;
  private scene: Scene;
  
  // Game state
  public score: number = 0;
  public isGameOver: boolean = false;
  private targetPaddlePos: Vector3 = new Vector3(-4, 1, 0);
  
  // Bounce delay before game over
  private ballHitFloor: boolean = false;
  private floorHitTime: number = 0;
  private readonly BOUNCE_DELAY_MS: number = 300;

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
  }

  /**
   * Setup mouse/touch input handlers for paddle movement
   * Uses normalized screen coordinates like original Bounce-pong-3D
   */
  private setupInputHandlers(): void {
    this.scene.onPointerMove = (evt: any) => {
      if (this.isGameOver) return;

      // Convert screen coordinates to normalized -1 to 1 range
      const mouseX = (evt.clientX / window.innerWidth) * 2 - 1;
      const mouseY = -(evt.clientY / window.innerHeight) * 2 + 1;
      
      // Map to world space (like original game)
      this.targetPaddlePos.x = mouseX * 12;
      this.targetPaddlePos.y = mouseY * 6;
      
      // Keep Z at 0 for 2D movement
      this.targetPaddlePos.z = 0;
    };
  }

  /**
   * Update visuals with interpolation
   */
  public UpdateVisuals(alpha: number): void {
    if (!this.paddle || !this.ball || !this.physics) return;

    // Update paddle visual position with interpolation
    const paddlePos = this.physics.paddle.getInterpolatedPos(alpha);
    this.paddle.updateVisual(paddlePos as Vector3);

    // Update ball visual position with interpolation
    this.updateVisualsBall(alpha);
  }

  /**
   * Update ball visuals with interpolation
   * Simple version like the main ping pong game
   */
  private updateVisualsBall(alpha: number): void {
    if (!this.ball || !this.physics) return;

    // Interpolate position between previous and current
    const renderPos = Vector3.Lerp(
      this.physics.ball.getPrevPosition(),
      this.physics.ball.getCurrentPosition(),
      alpha,
    );

    // Update rotation directly from physics
    const rot = this.physics.ball.body.rotation();
    this.ball.mesh.rotationQuaternion.set(rot.x, rot.y, rot.z, rot.w);

    // Update visual position
    this.ball.setMeshPosition(renderPos.x, renderPos.y, renderPos.z);
  }

  /**
   * Fixed update for physics
   * Simple version like main ping pong game
   */
  public FixedUpdate(): void {
    if (!this.paddle || !this.ball || !this.physics || this.isGameOver) return;

    // Update paddle target position (physics will smooth it)
    this.physics.paddle.setTarget(
      this.targetPaddlePos.x,
      this.targetPaddlePos.y,
      this.targetPaddlePos.z
    );

    // Store previous ball position
    this.physics.ball.setPosition("PREV");

    // Step physics simulation
    this.physics.Step();

    // Store current ball position
    this.physics.ball.setPosition("CURR");

    // Check if ball dropped (game over condition)
    this.checkBallDropped();
  }

  /**
   * Check if ball has dropped below paddle (game over)
   * Ball bounces for 300ms before triggering game over
   */
  private checkBallDropped(): void {
    const ballPos = this.physics.getBallPosition();
    
    // Check if ball hit the floor (below y = -9)
    if (ballPos.y < -9 && !this.ballHitFloor) {
      this.ballHitFloor = true;
      this.floorHitTime = performance.now();
      console.log("Ball hit floor! Waiting 300ms before game over...");
    }
    
    // If 300ms has passed since floor hit, trigger game over
    if (this.ballHitFloor) {
      const elapsed = performance.now() - this.floorHitTime;
      if (elapsed >= this.BOUNCE_DELAY_MS) {
        this.gameOver();
      }
    }
  }

  /**
   * Handle game over
   */
  private gameOver(): void {
    if (this.isGameOver) return; // Prevent multiple calls
    
    this.isGameOver = true;
    console.log(`Game Over! Final Score: ${this.score}`);
    
    // Freeze the ball
    this.physics.setBallFrozen(true);
  }

  /**
   * Increment score (call this on successful paddle hit)
   */
  public incrementScore(): void {
    this.score++;
    console.log(`Score: ${this.score}`);
  }

  /**
   * Reset the game
   */
  public reset(): void {
    this.score = 0;
    this.isGameOver = false;
    this.ballHitFloor = false;
    this.floorHitTime = 0;
    this.targetPaddlePos.set(-4, 1, 0);
    
    // Reset ball and paddle physics
    this.physics.setBallPosition(0, 5, 0);
    this.physics.setBallVelocity(0, 0, 0);
    this.physics.setBallFrozen(false);
  }

  /**
   * Start the game
   */
  public startGame(): void {
    this.reset();
    // Give ball initial upward velocity (like original Bounce-pong-3D)
    this.physics.setBallFrozen(false);
    this.physics.setBallVelocity(0, 5, 0);
  }
}
