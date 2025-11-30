import Zeroact from "@/lib/Zeroact";

interface BounceGameUIProps {
  isGameOver: boolean;
  score: number;
  onRestart: () => void;
  onGoHome: () => void;
  showWelcome: boolean;
}

export function BounceGameUI({
  isGameOver,
  score,
  onRestart,
  onGoHome,
}: BounceGameUIProps) {

  return (
    <div className="bounce-game-ui">
      {/* Game Over Overlay */}
      {isGameOver && (
        <div className="bounce-game-over-overlay">
          <div className="bounce-game-over-content">
            <h1 className="bounce-game-over-title">Game Over!</h1>
            <p className="bounce-final-score">Score: {score}</p>
            <p className="bounce-message">
              {score === 0
                ? "Try to hit the ball!"
                : score < 10
                ? "Good try! Keep practicing!"
                : score < 25
                ? "Nice job! You're getting better!"
                : score < 50
                ? "Great performance!"
                : "Wow! Amazing skills! 🏆"}
            </p>
            <div className="bounce-button-group">
              <button className="BtnPrimary ClipPath" onClick={onRestart}>
                New Round
              </button>
              <button className="BtnSecondary ClipPath" onClick={onGoHome}>
                Leave Game
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Live Score Display (top center) - minimal UI */}
      {!isGameOver && (
        <div className="bounce-score-hud">
          <span className="bounce-score-value">{score}</span>
        </div>
      )}
    </div>
  );
}
