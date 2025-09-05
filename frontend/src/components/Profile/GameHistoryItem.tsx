import Zeroact from "@/lib/Zeroact";
import { styled } from "@/lib/Zerostyle";
import { characters, Match } from "@/types/game";
import { timeAgo } from "@/utils/time";

const StyledGameHistoryItem = styled("div")`
  width: 100%;
  height: 60px;
  background-color: var(--bg_color_light);
  border-radius: 10px;
  display: flex;
  font-family: var(--main_font);
  align-items: center;
  padding: 0 10px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-left: 3px solid
    ${(props: any) =>
      props.userWon ? "var(--green_color)" : "var(--red_color)"};
  .player-char {
    width: 60px;
    height: 60px;
    background-color: var(--bg_color_super_light);
    /* background-image: url(${(props: any) => props.characterAvatar}); */
    background-image: url("/characters/guard_avatar.png");
    background-size: cover;
    background-position: center;
  }
  .Rank {
    width: 80px;
    height: 60px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 3px;
    img {
      width: 35px;
      height: 35px;
    }
    span {
      font-size: 0.8rem;
      color: ${(props: any) =>
        props.userWon ? "var(--green_color)" : "var(--red_color)"};
      font-weight: 600;
    }
  }
  .game-mode {
    height: 100%;
    width: 200px;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    span {
      font-family: var(--main_font);
      font-size: 1.1rem;
      color: white;
      font-weight: 500;
      text-transform: uppercase;
    }
  }
  .game-result {
    width: 200px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    .result-text {
      color: ${(props: any) =>
        props.userWon ? "var(--green_color)" : "var(--red_color)"};
    }
    span {
      font-family: var(--main_font);
      font-size: 1.3rem;
      color: white;
      font-weight: 500;
      text-transform: uppercase;
    }
  }
  .oponent {
    width: 200px;
    display: flex;
    align-items: center;
    justify-content: center;
    span {
      font-family: var(--main_font);
      font-size: 1.1rem;
      color: white;
      font-weight: 500;
      text-transform: uppercase;
    }
  }
  .game-date {
    width: 150px;
	display: flex;
	align-items: center;
	justify-content: flex-end;
	margin-left: auto;
	span {
	  font-family: var(--main_font);
	  font-size: 0.8rem;
	  color: rgba(255, 255, 255, 0.6);
	  font-weight: 500;
	}
  }
`;

interface GameHistoryItemProps {
  match: Match;
  userId: string;
}
const GameHistoryItem = (props: GameHistoryItemProps) => {
  const user =
    props.match.opponent1.userId === props.userId
      ? props.match.opponent1
      : props.match.opponent2;
  const characterImg = characters.find((c) => c.id === user.characterId)?.image;

  return (
    <StyledGameHistoryItem
      userWon={props.match.winnerId === props.userId}
      characterAvatar={characterImg}
    >
      <div className="player-char"></div>
      <div className="Rank">
        <img src="/badges/Radiant_Rank.png" />
        <span>+30</span>
      </div>

      <div className="game-mode">
        <span>{props.match.mode}</span>
      </div>

      <div className="game-result">
        <span className="result-text">
          {props.match.winnerId === props.userId ? "VICTORY" : "DEFEAT"}
        </span>
        <span>
          {props.match.opponent1.finalScore} -{" "}
          {props.match.opponent2.finalScore}
        </span>
      </div>

      <div className="oponent">
        {(props.match.mode === "ONE_VS_ONE" ||
          props.match.mode === "Tournament") && (
          <span>
            VS -{" "}
            {props.match.opponent1.userId === props.userId
              ? props.match.opponent2.username
              : props.match.opponent1.username}
          </span>
        )}
      </div>

      <div className="game-date">
        <span>{timeAgo(new Date(props.match.completedAt!))}</span>
      </div>
    </StyledGameHistoryItem>
  );
};

export default GameHistoryItem;
