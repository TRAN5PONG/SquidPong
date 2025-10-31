import Zeroact from "@/lib/Zeroact";
import { styled } from "@/lib/Zerostyle";
import { Rank, RANKS } from "@/types/game/rank";

const StyledBadges = styled("div")`
  height: 100%;
  width: 100%;
  display: flex;
  justify-content: center;
  overflow-y: scroll;
  .badges-container {
    width: 400px;
    display: grid;
    grid-template-columns: repeat(3, auto);
    grid-template-rows: repeat(5, auto);
    align-items: center;
    justify-content: center;
    gap: 10px;
    margin-top: 50px;
  }
`;

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const Badges = () => {
  return (
    <StyledBadges className="scroll-y">
      <div className="badges-container">
        {RANKS.map((rank: Rank) => {
          return (
            <StyledRankItem
              primaryColor={rank.primaryColor}
              secondaryColor={rank.secondaryColor}
              key={rank.minPoints}
            >
              <img className="rank-img" src={rank.image} />
            </StyledRankItem>
          );
        })}
      </div>
    </StyledBadges>
  );
};

const StyledRankItem = styled("div")`
  width: 100px;
  height: 100px;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(
    135deg,
    ${(props: any) => hexToRgba(props.primaryColor, 1)},
    ${(props: any) => hexToRgba(props.secondaryColor, 1)}
  );

  .rank-img {
    height: 90%;
  }
`;

export default Badges;
