import Zeroact, { useEffect } from "@/lib/Zeroact";
import { styled } from "@/lib/Zerostyle";
import { PasswordIcon } from "../Svg/Svg";
import { db } from "@/db";
import { useSound } from "@/hooks/useSound";
import { characters, GameCharacter } from "@/types/game/character";
import { useAppContext } from "@/contexts/AppProviders";
import { updateProfile } from "@/api/user";

const SelectCharacter = () => {
  const [selectedChar, setselectedChar] =
    Zeroact.useState<GameCharacter | null>(null); //playerId
  const { user, setUser, toasts } = useAppContext();

  useEffect(() => {
    if (!user) return;
    console.log(user);
    const selectedCharId = user.playerSelectedCharacter;
    const selectedChar =
      characters.find((char) => char.id === selectedCharId) || null;
    setselectedChar(selectedChar);
  }, [user]);

  const handleSelectChar = async (character: GameCharacter | null) => {
    if (!character) return;
    if (user?.playerCharacters.includes(character.id) === false)
      return toasts.addToastToQueue({
        message: "You need to purchase this character first",
        type: "error",
      });
    try {
      const resp = await updateProfile({
        playerSelectedCharacter: character.id,
      });
      if (resp.success) {
        toasts.addToastToQueue({
          message: "Character selected successfully",
          type: "success",
        });
        setselectedChar(character);
        if (resp.data) setUser(resp.data);
      } else {
        toasts.addToastToQueue({
          message: "Failed to select character",
          type: "error",
        });
      }
    } catch (err) {
      console.error(err);
    }
  };
  const handlePurchaseChar = async (character: GameCharacter | null) => {
    if (!character || !user) return;
    if (user.walletBalance < character.price)
      return toasts.addToastToQueue({
        message: "Insufficient balance to purchase character",
        type: "error",
      });
    try {
      const resp = await updateProfile({
        playerCharacters: character.id,
      });

      if (resp.success) {
        toasts.addToastToQueue({
          message: "Character purchased successfully",
          type: "success",
        });
        if (resp.data) setUser(resp.data);
      } else throw new Error("Purchase failed");
    } catch (err) {
      toasts.addToastToQueue({
        message: "Failed to purchase character",
        type: "error",
      });
      console.error(err);
    }
  };

  if (!user) return null;

  return (
    <StyledSelectCharacter>
      <div className="CharacterList">
        {characters.map((character) => {
          const isLocked = !user.playerCharacters.includes(character.id);
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
          {selectedChar && !user.playerCharacters.includes(selectedChar.id) ? (
            <button
              className="PurchBtn"
              onClick={() => handlePurchaseChar(selectedChar)}
            >
              Purchase - {selectedChar.price}
            </button>
          ) : null}
          <button
            className="SelectBtn"
            onClick={() => handleSelectChar(selectedChar)}
          >
            select
          </button>
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
        font-family: var(--span_font);
        color: rgba(255,255,255, 0.5);
        font-weight: 100;
        font-size: 1rem;
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
        width: auto;
        padding: 0 20px;
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
  border-radius: 10px;
  border: 1px solid
    ${(props: any) =>
      props.isSelected ? "rgba(255, 105, 117, 0.3)" : "rgba(255,255,255, 0.05)"};
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
  &:before {
    content: "${(props: any) => props.content || ""}";
    position: absolute;
    width: 100%;
    height: 100%;
    overflow: hidden;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 20rem;
    font-family: var(--squid_font);
    color: ${(props: any) =>
      props.isSelected ? "rgba(112, 33, 39, 0.5)" : "rgba(255,255,255,0.02)"};
  }
  &:hover {
    &:after {
      opacity: 1;
    }
    border: 1px solid rgba(255, 105, 117, 0.3);
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
      content={props.character.name[0]}
    >
      <div className="CharacterImgContainer">
        <img src={props.character.avatar} className="CharacterImg" />
      </div>
      <h2>{props.character.name}</h2>
      {props.isLocked && <PasswordIcon stroke="rgba(255,255,255, 0.4)" className="LockedIcon" size={20}/>}
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
    border: 1px solid rgba(202, 47, 60, 0.3);
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
