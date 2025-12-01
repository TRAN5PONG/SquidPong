import Zeroact from "@/lib/Zeroact";

interface BounceGameUIProps {
  score: number;
  onGoHome: () => void;
  onRetry?: () => void;
  showControls?: boolean;
}

export function BounceGameUI({
  score,
  onGoHome,
  onRetry,
  showControls = false,
}: BounceGameUIProps) {

  return (
    <div className="bounce-game-ui">
      {/* Live Score Display (top center) */}
      <div className="bounce-score-hud">
        <span className="bounce-score-value">{score}</span>
      </div>

      {/* Controls (Try Again + Leave) — shown only when showControls is true */}
      {showControls && (
        <div className="bounce-controls-fixed">
          <div className="bounce-button-group">
            <button
              className="BtnPrimary "
              onClick={() => {
                if (onRetry) onRetry();
              }}
            >
              Try Again
            </button>

            <button className="BtnSecondary " onClick={onGoHome}>
              Leave
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
