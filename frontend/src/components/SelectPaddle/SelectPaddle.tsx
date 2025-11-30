import Zeroact, { useEffect, useRef } from "@/lib/Zeroact";
import { styled } from "@/lib/Zerostyle";
import { CustomizeScene } from "../Game/Scenes/CustomizeScene";
import { Color3 } from "@babylonjs/core";
import {
  PaddleColor,
  paddleColors,
  PaddleTexture,
  paddleTextures,
} from "@/types/game/paddle";
import { useAppContext } from "@/contexts/AppProviders";
import { updateProfile } from "@/api/user";
import { PasswordIcon } from "../Svg/Svg";

const StyledColor = styled("div")`
  width: 90px;
  height: 30px;
  background-color: ${(props: any) => props.color};
  border-radius: 4px;
  cursor: pointer;
  transition: 0.2s ease-in-out;
  opacity: 1;
  border: ${(props: any) =>
    props.isSelected ? "2px solid var(--main_color)" : "none"};
  &:hover {
    opacity: 0.8;
  }
`;
const StyledTexture = styled("div")`
  width: 90px;
  height: 90px;
  border-radius: 5px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.05);
  background-color: var(--bg_color_super_light);
  cursor: pointer;
  position: relative;
  transition: 0.2s ease-in-out;
  filter: ${(props: any) => (props.isLocked ? "grayscale(1)" : "none")};
  .paddleImg {
    width: 80%;
    height: 80%;
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    background-image: url(${(props: any) => props.path});
    svg {
      position: absolute;
      top: 2px;
      right: 2px;
    }
  }
  .paddleName {
    bottom: 0;
    left: 0;
    font-family: var(--squid_font);
    font-size: 1rem;
    line-height: 1.2rem;
    width: 100%;
    text-align: center;
    background-color: rgba(255, 255, 255, 0.08);
  }

  &:hover {
    box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.2);
    background-color: rgba(0, 0, 0, 0.2);
    filter: none;
  }

  &.selected {
    border: 2px solid var(--main_color);
    filter: none;
    .paddleName {
      background-color: var(--main_color);
    }
  }
`;
const StyledSelectPaddle = styled("div")`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  color: white;
  padding: 10px;
  .PaddleCanvasContainer {
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: var(--bg_color);
    overflow: hidden;
    position: relative;
    &:before {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: radial-gradient(
        circle,
        ${(props: any) => props.paddleColor} 0%,
        rgba(237, 221, 83, 0) 50%
      );
      mix-blend-mode: color;
      z-index: 1;
    }
    &:after {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: url("https://i.pinimg.com/originals/f3/7b/42/f37b420ba06b90c507de3b386b75febb.gif");
      filter: grayscale(1);
      background-size: cover;
      background-position: center;
      opacity: 1;
      mix-blend-mode: lighten;
    }
    .PaddleCanvas {
      border-radius: 10px;
      width: 600px;
      height: 600px;
      outline: none;
      z-index: 2;
      border-left: none;
    }
  }
  .CustomizationsContainer {
    width: 600px;
    height: 350px;
    display: flex;
    flex-direction: column;
    font-family: var(--main_font);
    align-items: flex-start;
    justify-content: center;
    padding: 0px 40px;
    margin-right: -10%;
    /* border-radius: 5px; */
    /* border: 1px solid rgba(256, 256, 256, 0.1); */
    z-index: 4;
    background-color: var(--bg_color_light);
    -webkit-backdrop-filter: blur(10px);
    backdrop-filter: blur(10px);
    clip-path: path(
      "M 0,0 L 580,0 L 600,20 L 600,350 L 35,350 L 0,315 L 0,0 Z"
    );

    .HeaderTxt {
      font-family: var(--squid_font);
      margin: 20px 0px 20px 0px;
      font-size: 1.2rem;
    }
    .ColorContainer {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 3px;
    }
    .TextureContainer {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 3px;
      .defaultasNone {
        width: 90px;
        height: 90px;
        border-radius: 3px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background-color: var(--bg_color_super_light);
        cursor: pointer;
        position: relative;
        transition: 0.2s ease-in-out;
        border-radius: 5px;
        border: 1px solid rgba(255, 255, 255, 0.05);
        span {
          font-family: var(--squid_font);
          font-size: 1rem;
          line-height: 1.2rem;
          width: 100%;
          text-align: center;
        }

        &:hover {
          box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.2);
          background-color: rgba(0, 0, 0, 0.2);
        }

        &.selected {
          border: 2px solid var(--main_color);
          .paddleName {
            background-color: var(--main_color);
          }
        }
      }
    }
    .Actions {
      width: 100%;
      margin-top: auto;
      height: 60px;
      display: flex;
      gap: 5px;
      justify-content: flex-start;
      button {
        height: 45px;
        border-radius: 5px;
        border: none;
        outline: none;
        cursor: pointer;
        font-size: 1rem;
        font-family: var(--squid_font);
        transition: 0.2s ease-in-out;
        padding: 0px 20px;
      }
      .PurchBtn {
        background-color: rgba(255, 217, 68, 1);
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

const SelectPaddle = () => {
  /**
   * Refs
   */
  const canvasRef = Zeroact.useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<CustomizeScene | null>(null);

  /**
   * States
   */
  const [selectedColor, setSelectedColor] =
    Zeroact.useState<PaddleColor | null>(null);
  const [selectedTexture, setSelectedTexture] =
    Zeroact.useState<PaddleTexture | null>(null);
  /**
   * Context
   */
  const { user, setUser, toasts } = useAppContext();

  /**
   * Utils
   */
  const getPaddleTextureById = (id: string | null): PaddleTexture | null => {
    if (!id) return null;
    const texture = paddleTextures.find((texture) => texture.id === id);
    return texture || null;
  };

  /**
   * Effects
   */
  useEffect(() => {
    if (!canvasRef.current) return;

    const customizeScene = new CustomizeScene(canvasRef.current);
    sceneRef.current = customizeScene;

    return () => {
      customizeScene.dispose();
      sceneRef.current = null;
    };
  }, []);
  useEffect(() => {
    if (!user) return;

    const userPaddleColor = paddleColors.find((p) => p.id === user.paddleColor);

    setSelectedColor((userPaddleColor || null) as PaddleColor | null);
    setSelectedTexture(getPaddleTextureById(user.playerSelectedPaddle));
  }, [user]);

  useEffect(() => {
    if (selectedColor) sceneRef.current?.paddle.setColor(selectedColor.color);
    if (selectedTexture) {
      sceneRef.current?.paddle.setTexture(selectedTexture.image);
    }
  }, [selectedColor, selectedTexture]);

  const onSelectTexture = async () => {
    if (!selectedTexture || !user) return;
    try {
      const resp = await updateProfile({
        playerSelectedPaddle: selectedTexture.id,
        paddleColor: selectedColor?.id,
      });
      if (resp.success) {
        toasts.addToastToQueue({
          type: "success",
          message: `Successfully selected ${selectedTexture.name} paddle texture!`,
        });
      } else
        throw new Error(resp.message || "Failed to select paddle texture.");
    } catch (error) {
      toasts.addToastToQueue({
        type: "error",
        message: "An error occurred while selecting the paddle texture.",
      });
    }
  };
  const onPurchaseCustomization = async () => {
    if (!selectedTexture || !user) return;
    if (user.playerPaddles.includes(selectedTexture.id)) {
      toasts.addToastToQueue({
        type: "info",
        message: "You already own this paddle texture.",
      });
      return;
    }
    if (user?.walletBalance < selectedTexture.price) {
      toasts.addToastToQueue({
        type: "error",
        message: "Insufficient funds to purchase this paddle texture.",
      });
      return;
    }
    try {
      const resp = await updateProfile({
        playerPaddles: selectedTexture.id,
      });
      if (resp.success) {
        toasts.addToastToQueue({
          type: "success",
          message: `Successfully purchased ${selectedTexture.name} paddle texture!`,
        });
        setUser(resp.data);
      } else {
        throw new Error(resp.message || "Failed to purchase paddle texture.");
      }
    } catch (error: any) {
      toasts.addToastToQueue({
        type: "error",
        message: error.message || "An error occurred during purchase.",
      });
    }
  };

  return (
    <StyledSelectPaddle paddleColor={selectedColor?.color}>
      <div className="CustomizationsContainer">
        <h1 className="HeaderTxt">Select color :</h1>
        <div className="ColorContainer">
          {paddleColors.map((color, index) => (
            <StyledColor
              color={color.color}
              isSelected={color === selectedColor}
              onClick={() => {
                setSelectedColor(color);
              }}
              key={index}
            />
          ))}
        </div>

        <h1 className="HeaderTxt">Select texture :</h1>
        <div className="TextureContainer">
          <div
            className={`defaultasNone ${!selectedTexture && "selected"}`}
            onClick={() => {
              setSelectedTexture(null);
              sceneRef.current?.paddle.setTexture(null);
            }}
          >
            <span>None</span>
          </div>
          {paddleTextures.map((texture, index) => {
            const isLocked = user?.playerPaddles.includes(texture.id)
              ? false
              : true;
            return (
              <StyledTexture
                path={texture.image}
                isLocked={isLocked}
                className={`${selectedTexture === texture ? "selected" : ""}`}
                onClick={() => {
                  setSelectedTexture(texture);
                }}
                key={index}
              >
                <div className="paddleImg">
                  {isLocked && (
                    <PasswordIcon
                      stroke="white"
                      className="LockedIcon"
                      size={15}
                    />
                  )}
                </div>
                <h1 className="paddleName">{texture.name}</h1>
              </StyledTexture>
            );
          })}
        </div>

        <div className="Actions">
          {selectedTexture && (
            <button className="PurchBtn" onClick={onPurchaseCustomization}>
              Purchase - {selectedTexture?.price}
            </button>
          )}
          <button className="SelectBtn" onClick={onSelectTexture}>
            select
          </button>
        </div>
      </div>
      <div className="PaddleCanvasContainer">
        <canvas ref={canvasRef} className="PaddleCanvas"></canvas>
      </div>
    </StyledSelectPaddle>
  );
};

export default SelectPaddle;
