import Zeroact from "@/lib/Zeroact";
import { styled } from "@/lib/Zerostyle";

const StyledNotFound = styled("div")`
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  h1 {
    font-size: 4rem;
    font-family: var(--squid_font);
    color: white;
	z-index: 4;
  }
  .PlaceHolderGif {
    width: 400px;
    height: 400px;
    background-image: url("https://img2.thejournal.ie/inline/2434312/original/?width=360&version=2434312");
    background-size: cover;
    background-position: center;
    border-radius: 10px;
    z-index: 3;
	border: none;
	outline: none;
	overflow: hidden;
  }
`;
const NotFound = () => {
  return (
    <StyledNotFound>
      <div className="PlaceHolderGif"></div>
      <h1>404 - NOT FOUND</h1>
    </StyledNotFound>
  );
};

export default NotFound;
