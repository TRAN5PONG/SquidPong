import Zeroact from "@/lib/Zeroact";
import { styled } from "@/lib/Zerostyle";
import { User } from "@/types/user";

const StyledScoreBoard = styled("div")`
  display: flex;
  flex-direction: column;
  position: absolute;
  top: 10px;
  left: 50px;
  display: flex;
  align-items: center;
  .OponentCard:first-child {
    transform: translate(-30px, 1px);
  }
  .RoundNumber{
    background-color: var(--main_color);
    width: 100px;
    height: 30px;
    border-radius: 0px 0px 5px 5px;
    display: flex;
    align-items: center;
    justify-content: center;
    h1{
      font-family: var(--main_font);
      font-weight: 100;
      font-size: 1.3rem;
      color: white;
    }
  }
`;

interface ScoreBoardProps {
  oponent1: User;
  oponent2: User;
}
const ScoreBoard = (props: ScoreBoardProps) => {
  return (
    <StyledScoreBoard>
      <OponentCard
        OponentAvatar={props.oponent1.avatar}
        className="OponentCard"
      >
        <div className="OponentCardBorder" />
        <div className="OponentCardContent">
          <div className="Avatar" />
          <h1 className="Username">{props.oponent1.username}</h1>

          <div className="Score">
            <span className="ScoreValue">0</span>
          </div>
        </div>
      </OponentCard>

      <OponentCard OponentAvatar={props.oponent2.avatar} isReversed={true}>
        <div className="OponentCardBorder" />
        <div className="OponentCardContent">
          <div className="Avatar" />
          <h1 className="Username">{props.oponent2.username}</h1>

          <div className="Score">
            <span className="ScoreValue">5</span>
          </div>
        </div>
      </OponentCard>

      <div className="RoundNumber">
        <h1>Round 1</h1>
      </div>
      
    </StyledScoreBoard>
  );
};

const OponentCard = styled("div")`
  width: 300px;
  height: 60px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;

  .OponentCardBorder {
    background: rgba(202, 47, 60, 1);
    transform: scale(1.15);
    z-index: 0;
    top: 0;
    position: absolute;
    width: 100%;
    height: 100%;
    clip-path: path(
      "M 25,0 L 255,4 L 300,43 L 290,55 L 44,59 L 15,17 L 25,0 Z"
    );
  }
  .OponentCardContent {
    z-index: 1;
    background-color: var(--bg_color);
    position: absolute;
    top: 0;
    width: 100%;
    height: 100%;
    clip-path: path("M 10,0 L 270,0 L 300,45 L 290,60 L 30,60 L 0,15 L 10,0 Z");
    display: flex;
    align-items: center;

    .Avatar {
      width: 80px;
      height: 100%;
      background-color: white;
      clip-path: path("M 0,0 L 50,0 L 80,60 L 0,60 L 0,0 Z");
      background-image: url(${(props: any) => props.OponentAvatar});
      background-size: cover;
      background-position: center;
      position: relative;
    }
    .Username {
      color: white;
      font-family: var(--squid_font);
      font-weight: 100;
      font-size: 1.5rem;
    }
    .Score {
      margin-left: auto;
      width: 60px;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: flex-start;
      padding-left: 5px;
      background: linear-gradient(
        90deg,
        rgba(202, 47, 60, 1) 0%,
        rgba(202, 47, 60, 0.3) 100%
      );
      clip-path: path("M 0,0 L 60,0 L 60,60 L 0,60 L 50,100 L 0,50 L 0,0 Z");
      span {
        color: white;
        font-family: var(--game_font);
        margin-top: 10px;
        font-weight: 100;
        font-size: 2rem;
      }
    }
  }
`;
export default ScoreBoard;
