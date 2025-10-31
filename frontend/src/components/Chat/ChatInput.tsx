import Zeroact from "@/lib/Zeroact";
import { styled } from "@/lib/Zerostyle";
import { EmojiIcon, SendIcon } from "../Svg/Svg";

const StyledChatInput = styled("div")`
    position: absolute;
    bottom: 5px;
    width: 340px;
    height: 50px;
    border-radius: 10px;
    display: flex;
    justify-content: center;
    align-items: center;
    overflow: hidden;
    .SendSvg {
      position: absolute;
      right: 5px;
      cursor: pointer;
      transition: 0.1s ease-in-out;
      &:hover {
        fill: var(--main_color);
      }
    }
    .EmojieSvg {
      position: absolute;
      left: 5px;
      cursor: pointer;
      transition: 0.1s ease-in-out;
      &:hover {
        opacity: 0.8;
      }
    }
    input {
      width: 100%;
      height: 100%;
      padding: 0 40px;
      outline: none;
      border: none;
      font-size: 1rem;
      background-color: var(--bg_color_super_light);
      border: 1px solid rgba(255,255,255,0.1);
      color: white;
      box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.7);
    }
    input::placeholder {
      color: white;
      opacity: 0.3;
    }
`;

const ChatInput = () => {
  return (
    <StyledChatInput>
      <SendIcon fill="white" size={25} className="SendSvg" />
      <input type="text" placeholder="Type a message..." />
      <EmojiIcon fill="white" size={25} className="EmojieSvg" />
    </StyledChatInput>
  );
};

export default ChatInput;
