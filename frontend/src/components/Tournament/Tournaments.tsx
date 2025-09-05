import { db } from "@/db";
import Zeroact from "@/lib/Zeroact";
import { styled } from "@/lib/Zerostyle";
import { Tournament } from "@/types/tournament";
import {
  ChallengeIcon,
  CoinIcon,
  InfosIcon,
  PersonIcon,
  TrophyIcon,
} from "../Svg/Svg";
import { useNavigate } from "@/contexts/RouterProvider";

const StyledTournaments = styled("div")`
  width: 100%;
  height: 100%;
  overflow-y: scroll;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-template-rows: repeat(5, 1fr);
  grid-column-gap: 5px;
  grid-row-gap: 5px;
  padding: 10% 25%;
  align-items: center;
  justify-content: center;
  gap: 5px;
  position: relative;
  .CreateTournamentBtn {
    width: 400px;
    height: 50px;
    background-color: var(--main_color);
    border-radius: 8px;
    border: none;
    font-family: var(--squid_font);
    font-size: 1.1rem;
    color: white;
    position: fixed;
    bottom: 80px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    transition: background-color 0.3s ease;
    cursor: pointer;
    &:hover {
      background-color: rgb(168, 33, 44);
    }
  }
`;
const Tournaments = () => {
  const [showCreateTournamentModal, setShowCreateTournamentModal] =
    Zeroact.useState(false);

  return (
    <StyledTournaments className="scroll-y">
      {db.FakeTournaments.map((tournament: Tournament) => {
        return <TournamentCard {...tournament} />;
      })}

      {showCreateTournamentModal ? (
        <CreateTournamentModal
          onClose={() => setShowCreateTournamentModal(false)}
        />
      ) : (
        <button
          className="CreateTournamentBtn"
          onClick={() => setShowCreateTournamentModal(true)}
        >
          <ChallengeIcon size={20} fill="white" />
          Create Tournament
        </button>
      )}
    </StyledTournaments>
  );
};
const StyledTournamentCard = styled("div")`
  width: 400px;
  height: 300px;
  background-color: var(--bg_color_light);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 5px;

  .CardHeader {
    height: 140px;
    background-color: var(--bg_color_super_light);
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 10px;
    .CardHeaderAvatar {
      width: 100px;
      height: 100px;
      border-radius: 10px;
      background-color: var(--bg_color);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .CardHeaderInfos {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 5px;
      position: relative;
      height: 100%;
      .CardHeaderInfosName {
        font-family: var(--span_font);
        font-size: 1.2rem;
        font-weight: 600;
        color: white;
      }
      .CardHeaderInfosDesc {
        font-family: var(--main_font);
        font-size: 0.9rem;
        color: rgba(255, 255, 255, 0.7);
      }
      .CardBodyParticipants {
        display: flex;
        gap: 10px;
        align-items: center;
        justify-content: flex-start;
        position: absolute;
        bottom: 0;
        right: 0;
        span {
          font-family: var(--main_font);
          opacity: 0.8;
          color: white;
          font-size: 0.9rem;
        }
        .CardBodyParticipantsAvatars {
          display: flex;
        }
      }
    }
  }
  .CardBody {
    flex: 1;
    padding: 0px 5px;
    display: flex;
    flex-direction: column;
    justify-content: center;

    .CardBodyTournamentStatus {
      width: 100%;
      height: 30px;
      display: flex;
      align-items: center;
      justify-content: flex-start;
      gap: 5px;
      font-family: var(--main_font);
      font-size: 0.9rem;
      color: rgba(255, 255, 255, 0.8);
    }
    .CardBodyParticipationFee {
      width: 100%;
      height: 30px;
      display: flex;
      align-items: center;
      justify-content: flex-start;
      gap: 5px;
      font-family: var(--main_font);
      font-size: 0.9rem;
      color: rgba(255, 255, 255, 0.8);
      svg {
        filter: grayscale(100%);
      }
    }
    .CardBodyParticipantsCount {
      width: 100%;
      height: 30px;
      display: flex;
      align-items: center;
      justify-content: flex-start;
      gap: 5px;
      font-family: var(--main_font);
      font-size: 0.9rem;
      color: rgba(255, 255, 255, 0.8);
    }
  }
  .CardBtn {
    width: 100%;
    height: 50px;
    background-color: rgba(255, 156, 45, 1);
    border: none;
    outline: none;
    font-family: var(--squid_font);
    font-size: 1.1rem;
    border-radius: 8px;
    cursor: pointer;
    transition: background-color 0.3s ease;
    &:hover {
      background-color: rgba(255, 156, 45, 0.8);
    }
  }
  .CardBtn.disabled {
    background-color: rgba(255, 255, 255, 0.5);
    cursor: not-allowed;
  }
`;
const TournamentCard = (props: Tournament) => {
  const navigate = useNavigate();
  return (
    <StyledTournamentCard>
      <div className="CardHeader">
        <div className="CardHeaderAvatar">
          <TrophyIcon size={50} fill="var(--bg_color_super_light)" />
        </div>
        <div className="CardHeaderInfos">
          <h1 className="CardHeaderInfosName">{props.name}</h1>
          <span className="CardHeaderInfosDesc">{props.desription}</span>
          <div className="CardBodyParticipants">
            <div className="CardBodyParticipantsAvatars">
              {props.participants.slice(0, 3).map((participant) => {
                return (
                  <StyledTournamentCardAvatar
                    avatar={participant.user.avatar}
                  />
                );
              })}
              {props.participants.length > 3 && (
                <StyledTournamentCardAvatar className="Extra">
                  +{props.participants.length - 3}
                </StyledTournamentCardAvatar>
              )}
            </div>
            <span>have joined.</span>
          </div>
        </div>
      </div>

      <div className="CardBody">
        <div className="CardBodyTournamentStatus">
          <InfosIcon size={20} fill="rgba(255, 255, 255, 0.8)" />
          <span>
            {props.status === "registration"
              ? "Registration Open"
              : props.status === "ready"
              ? "Ready to Start"
              : props.status === "inProgress"
              ? "In Progress"
              : props.status === "completed"
              ? "Completed"
              : "Cancelled"}
          </span>
        </div>
        <div className="CardBodyParticipationFee">
          <CoinIcon size={20} fill="rgba(255, 255, 255, 0.8)" />
          <span>
            {props.participationFee
              ? `Participation Fee: ${props.participationFee} Coins`
              : "Free Participation"}
          </span>
        </div>
        <div className="CardBodyParticipantsCount">
          <PersonIcon size={20} fill="rgba(255, 255, 255, 0.8)" />
          <span>
            {props.participants.length} / {props.maxPlayers} Participants
          </span>
        </div>
      </div>

      <button
        className={`CardBtn ${
          props.status !== "registration" && props.status !== "completed"
            ? "disabled"
            : ""
        }`}
        onClick={() => {
          navigate(`/tournament/${props.id}`);
        }}
      >
        {props.status === "registration"
          ? "Join"
          : props.status === "ready"
          ? "full"
          : props.status === "inProgress"
          ? "full"
          : props.status === "completed"
          ? "View Results"
          : "Cancelled"}
      </button>
    </StyledTournamentCard>
  );
};
const StyledTournamentCardAvatar = styled("div")`
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background-color: var(--bg_color_light);
  background-image: url(${(props: any) => props.avatar});
  background-position: center;
  background-size: cover;
  margin-right: -15px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--main_font);
  color: rgba(255, 255, 255, 0.8);
  &:last-child {
    margin-right: 0;
  }
  &.Extra {
    background-color: var(--bg_color_light);
    color: rgba(255, 255, 255, 0.8);
  }
`;

interface CreateTournamentModalProps {
  onClose: () => void;
}
const CreateTournamentModal = (props: CreateTournamentModalProps) => {
  const modalRef = Zeroact.useRef<HTMLDivElement>(null);
  Zeroact.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        props.onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <StyledCreateTournamentModal ref={modalRef}>
      <input type="text" placeholder="Tournament Name" />

      <textarea placeholder="Tournament Description"></textarea>

      <select>
        <option value="4">4 Players</option>
        <option value="8">8 Players</option>
        <option value="16">16 Players</option>
        <option value="32">32 Players</option>
      </select>

      <input type="number" placeholder="Participation Fee (Coins)" />
      <button className="CreateBtn">
        <ChallengeIcon size={20} fill="var(--main_color)" />
        Create
      </button>
    </StyledCreateTournamentModal>
  );
};
const StyledCreateTournamentModal = styled("div")`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 500px;
  height: 600px;
  background-color: var(--bg_color_light);
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
  input {
    width: 100%;
    height: 40px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 5px;
    background-color: var(--bg_color_super_light);
    color: white;
    padding: 0 10px;
    font-family: var(--span_font);
    font-size: 1rem;
    margin-bottom: 10px;
    outline: none;
  }
  textarea {
    width: 100%;
    height: 100px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 5px;
    background-color: var(--bg_color_super_light);
    color: white;
    padding: 10px;
    font-family: var(--span_font);
    font-size: 1rem;
    margin-bottom: 10px;
    outline: none;
    resize: vertical;
    min-height: 100px;
    max-height: 200px;
  }
  select {
    width: 100%;
    height: 40px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 5px;
    background-color: var(--bg_color_super_light);
    color: white;
    padding: 0 10px;
    font-family: var(--span_font);
    font-size: 1rem;
    margin-bottom: 10px;
    outline: none;
  }
  button {
    position: absolute;
    bottom: 20px;
    right: 20px;
    width: 150px;
    height: 40px;
    background-color: transparent;
    border: none;
    border-radius: 5px;
    border: 1px solid var(--main_color);
    font-family: var(--squid_font);
    font-size: 1.1rem;
    color: var(--main_color);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    cursor: pointer;
    transition: background-color 0.3s ease;
    &:hover {
      background-color: rgba(168, 33, 44, 0.3);
    }
  }
`;

export default Tournaments;
