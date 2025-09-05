import Zeroact, { useEffect } from "@/lib/Zeroact";
import { styled } from "@/lib/Zerostyle";
import { PasswordIcon } from "../Svg/Svg";
import { characters, GameCharacter } from "@/types/game";
import { db } from "@/db";
import { useSound } from "@/hooks/useSound";

const SelectCharacter = () => {
  const [selectedChar, setselectedChar] =
    Zeroact.useState<GameCharacter | null>(null); //playerId
  const FakeUser = db.users[0];

  useEffect(() => {
    const selectedCharId = FakeUser.playerSelectedCharacter;
    const selectedChar =
      characters.find((char) => char.id === selectedCharId) || null;
    setselectedChar(selectedChar);
  }, []);

  return (
    <StyledSelectCharacter>
      <div className="CharacterList">
        {characters.map((character) => {
          const isLocked = !FakeUser.playerCharacters.includes(character.id);
          const isSelected = selectedChar?.id === character.id;

          return (
            <CharacterCard
              character={character}
              isLocked={isLocked}
              isSelected={isSelected}
              setSelectedCharacter={setselectedChar}
            />
          );
        })}
      </div>
      <div className="SelectedCharacterDetails">
        <div className="CharacterStory">
          <h1>{selectedChar?.name}</h1>
          <p>{selectedChar?.description}</p>
        </div>

        <div className="PowerList">
          <Power
            powerName="Spin Control"
            powerPercentage={selectedChar?.spinControl || 0}
          />
          <Power
            powerName="Reflex Speed"
            powerPercentage={selectedChar?.reflexSpeed || 0}
          />
          <Power
            powerName="Power Shot"
            powerPercentage={selectedChar?.powerShot || 0}
          />
        </div>

        <div className="actions">
          {selectedChar &&
          !FakeUser.playerCharacters.includes(selectedChar.id) ? (
            <button className="PurchBtn">Purchase</button>
          ) : null}
          <button className="SelectBtn">select</button>
        </div>
      </div>
    </StyledSelectCharacter>
  );
};
const StyledSelectCharacter = styled("div")`
  width: 100%;
  height: 100%;
  display: flex;
  gap: 10px;
  justify-content: center;
  align-items: center;
  color: white;
  .CharacterList {
    display: grid;
    grid-template-columns: repeat(3, auto);
    grid-template-rows: repeat(5, auto);
    grid-column-gap: 5px;
    grid-row-gap: 5px;
  }
  .SelectedCharacterDetails {
    width: 40%;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: flex-start;
    gap: 30px;
    padding: 10px;

    .PowerList {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .CharacterStory {
      display: flex;
      flex-direction: column;
      h1 {
        font-family: var(--squid_font);
      }
      p {
        font-family: var(--main_font);
        font-weight: 100;
        font-size: 1rem;
        line-height: 1.5;
        margin: 0;
      }
    }
    .actions {
      display: flex;
      gap: 5px;
      justify-content: flex-start;
      width: 100%;
      padding-right: 10%;
      padding-top: 50px;
      button {
        width: 200px;
        height: 45px;
        border-radius: 5px;
        border: none;
        outline: none;
        cursor: pointer;
        font-size: 1.2rem;
        font-family: var(--squid_font);
        transition: 0.2s ease-in-out;
      }
      .PurchBtn {
        background-color: rgba(255, 217, 68, 1);
        width: 150px;
      }
      .SelectBtn {
        background-color: transparent;
        border: 1px solid rgba(255, 255, 255, 0.6);
        color: rgba(255, 255, 255, 0.6);
        &:hover {
          background-color: rgba(255, 255, 255, 0.05);
        }
      }
    }
  }
`;
const StyledCharacterCard = styled("div")`
  background: linear-gradient(
    0deg,
    rgba(27, 26, 31, 1) 0%,
    rgba(24, 30, 48, 0) 100%
  );
  height: 230px;
  width: 200px;
  border-radius: 5px;
  border: 1px solid
    ${(props: any) =>
      props.isSelected ? "rgba(202, 47, 60, 0.6)" : "transparent"};
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  transition: 0.3s ease-in-out;
  cursor: pointer;
  padding: 1px;
  .CharacterImgContainer {
    height: 100%;
    width: 100%;
    transition: 0.3s ease-in-out;
    overflow: hidden;
    position: relative;
    .CharacterImg {
      height: 100%;
      object-fit: cover;
      position: absolute;
      top: 0;
      filter: ${(props: any) =>
        props.isLocked && !props.isSelected ? "grayscale(100%)" : "none"};
      transform: translateX(0);
      transition: 0.3s cubic-bezier(0.87, -1.38, 0.03, 1.54);
    }
  }
  &:after {
    position: absolute;
    border-radius: 5px;
    content: "";
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    background: linear-gradient(
      0deg,
      rgba(202, 47, 60, 0.8) 0%,
      rgba(202, 47, 60, 0) 90%
    );
    opacity: ${(props: any) => (props.isSelected ? 1 : 0)};
    transition: 0.3s ease-in-out;
  }
  &:hover {
    &:after {
      opacity: 1;
    }
    border: 1px solid var(--main_color);
    .CharacterImgContainer .CharacterImg {
      filter: grayscale(0);
    }
    .CharacterImg {
      transform: translateX(-25px);
    }
  }
  h2 {
    position: absolute;
    bottom: 0;
    line-height: 1;
    font-family: var(--squid_font);
    font-size: 2rem;
    z-index: 1;
    bottom: 10px;
  }
  .LockedIcon {
    position: absolute;
    top: 3px;
    right: 3px;
  }
`;
interface CharacterCardProps {
  character: GameCharacter;
  isLocked?: boolean;
  isSelected?: boolean;
  setSelectedCharacter: (selectedChar: GameCharacter | null) => void;
}
const CharacterCard = (props: CharacterCardProps) => {
  const charSelectSound = useSound("/sounds/char_select.wav");
  const charHoverSound = useSound("/sounds/el_hover.wav");
  const onClick = () => {
    charSelectSound.play();
    props.setSelectedCharacter(props.character);
  };

  return (
    <StyledCharacterCard
      className="BorderBottomEffect"
      isLocked={props.isLocked}
      isSelected={props.isSelected}
      onClick={onClick}
      onMouseEnter={() => {
        charHoverSound.play();
      }}
      avatar={props.character.image}
    >
      <div className="CharacterImgContainer">
        <img src={props.character.avatar} className="CharacterImg" />
      </div>
      <h2>{props.character.name}</h2>
      {props.isLocked && <PasswordIcon stroke="white" className="LockedIcon" />}
    </StyledCharacterCard>
  );
};

const PowerElement = styled("div")`
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: 5px;
  .PowerBar {
    width: 350px;
    height: 40px;
    border-radius: 5px;
    position: relative;
    display: flex;
    justify-content: flex-start;
    align-items: center;
    border: 1px solid rgba(202, 47, 60, 0.4);
    border-bottom: none;
    &:after {
      content: "";
      position: absolute;
      width: ${(props: any) => props.percentage + "%" || 0};
      height: 100%;
      background: linear-gradient(
        90deg,
        rgba(202, 47, 60, 0.2) 0%,
        rgba(202, 47, 60, 0.4) 90%
      );
      border-radius: 5px;
      transition: 0.3s cubic-bezier(0.87, -1.38, 0.03, 1.54);
    }
    &:before {
      content: ${(props: any) => `"${props.percentage}%"` || "0%"};
      position: absolute;
      right: 10px;
      font-family: var(--main_font);
      font-weight: 100;
      color: white;
      font-size: 1rem;
    }
  }
  h1 {
    margin: 0;
    font-family: var(--main_font);
    font-weight: 100;
    font-size: 1rem;
  }
  .Perc {
    position: absolute;
    right: 10px;
    font-family: var(--main_font);
    font-weight: 100;
  }
`;
const Power = (props: { powerName: string; powerPercentage: number }) => {
  return (
    <PowerElement percentage={props.powerPercentage}>
      <h1>{props.powerName} :</h1>
      <div className="PowerBar GlassMorphism BorderBottomEffect" />
    </PowerElement>
  );
};

export default SelectCharacter;
