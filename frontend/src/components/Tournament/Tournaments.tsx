import { db } from "@/db";
import Zeroact, { useEffect, useState } from "@/lib/Zeroact";
import { styled } from "@/lib/Zerostyle";
import {
  ChallengeIcon,
  CoinIcon,
  InfosIcon,
  PersonIcon,
  TrophyIcon,
} from "../Svg/Svg";
import { useNavigate } from "@/contexts/RouterProvider";
import { Tournament } from "@/types/game/tournament";
import {
  createTournament,
  getTournaments,
  joinTournament,
} from "@/api/tournament";
import { useAppContext } from "@/contexts/AppProviders";
import Skeleton from "../Skeleton/Skeleton";

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
  .NoSPN {
    font-family: var(--span_font);
    font-size: 1.2rem;
    color: rgba(255, 255, 255, 0.4);
    grid-column: span 2;
    text-align: center;
  }
  .CreateTournamentBtn {
    width: 400px;
    height: 50px;
          background: linear-gradient(
        135deg,
        rgba(116, 16, 24, 0.95),
        rgb(202, 47, 60),
        rgba(116, 16, 24, 0.95)
      );
      background-size: 300% 300%;
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
    cursor: pointer;
     transition: border 0.25s ease, transform 0.25s ease, box-shadow 0.25s ease;
    &:hover{
        animation: gradientMove 2.5s ease infinite;
  border-color: var(--main_color_hover);
  box-shadow:
    0 0 0 1px rgba(202, 47, 60, 0.7),
    0 8px 20px rgba(202, 47, 60, 0.25);
    }
  }
`;
const Tournaments = () => {
  const [showCreateTournamentModal, setShowCreateTournamentModal] =
    Zeroact.useState(false);
  const [tournaments, setTournaments] = Zeroact.useState<Tournament[]>([]);
  const [isLoading, setIsLoading] = Zeroact.useState(true);
  const [notFound, setNotFound] = Zeroact.useState(false);

  /**
   * Fetches
   */
  const fetchTournaments = async () => {
    try {
      const resp = await getTournaments();
      if (resp.success && resp.data) {
        if (resp.data.length === 0) setNotFound(true);
        setTournaments(resp.data as Tournament[]);
      } else throw new Error(resp.message);

      setIsLoading(false);
    } catch (err) {
      setNotFound(true);
      console.error("Failed to fetch tournaments:", err);
    }
  };

  useEffect(() => {
    fetchTournaments();
  }, []);

  return (
    <StyledTournaments className="scroll-y">
      {tournaments.length > 0 ? (
        tournaments.map((tournament: Tournament) => {
          return <TournamentCard {...tournament} />;
        })
      ) : isLoading ? (
        Array.from({ length: 2 }).map((_, index) => (
          <Skeleton
            animation={index % 2 === 0 ? "Wave" : "Shine"}
            borderRadius={5}
            width="400px"
            height="300px"
          />
        ))
      ) : (
        <span className="NoSPN">No tournaments available.</span>
      )}

      {showCreateTournamentModal ? (
        <CreateTournamentModal
          onClose={() => setShowCreateTournamentModal(false)}
          refreshTournaments={() => fetchTournaments()}
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
    cursor: pointer;
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
        font-family: var(--main_font);
        font-size: 1.2rem;
        font-weight : 100;
        color: white;
        margin-top: 10px;
      }
      .CardHeaderInfosDesc {
        font-family: var(--span_font);
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
      font-family: var(--span_font);
      font-size: 0.9rem;
      color: rgba(255, 255, 255, 0.5);
    }
    .CardBodyParticipationFee {
      width: 100%;
      height: 30px;
      display: flex;
      align-items: center;
      justify-content: flex-start;
      gap: 5px;
      font-family: var(--span_font);
      font-size: 0.9rem;
      color: rgba(255, 255, 255, 0.5);
      svg {
        filter: grayscale(100%);
        opacity: 0.5;
      }
    }
    .CardBodyParticipantsCount {
      width: 100%;
      height: 30px;
      display: flex;
      align-items: center;
      justify-content: flex-start;
      gap: 5px;
      font-family: var(--span_font);
      font-size: 0.9rem;
      color: rgba(255, 255, 255, 0.5);
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
  const [tournament, setTournament] = useState(props);
  const [isUserParticipant, setIsUserParticipant] = useState<boolean>(false);

  const navigate = useNavigate();
  const { user, toasts } = useAppContext();

  const handleJoinTournament = async () => {
    try {
      const resp = await joinTournament(props.id, user!.userId);

      if (resp.success) {
        toasts.addToastToQueue({
          type: "success",
          message: "Successfully joined the tournament.",
        });
        setTournament(resp.data);
        setIsUserParticipant(
          resp.data.participants.some((p: any) => Number(p.userId) === Number(user?.userId))
        );
      } else throw new Error(resp.message);
    } catch (err) {
      console.error("Failed to join tournament:", err);
    }
  };

  useEffect(() => {
    setIsUserParticipant(
      props.participants.some((p) => Number(p.userId) === Number(user?.userId))
    );
  }, []);

  return (
    <StyledTournamentCard>
      <div
        className="CardHeader"
        onClick={() => navigate(`/tournament/${tournament.id}`)}
      >
        <div className="CardHeaderAvatar">
          <TrophyIcon size={50} fill="var(--bg_color_super_light)" />
        </div>
        <div className="CardHeaderInfos">
          <h1 className="CardHeaderInfosName">{tournament.name}</h1>
          <span className="CardHeaderInfosDesc">{tournament.description}</span>
          <div className="CardBodyParticipants">
            <div className="CardBodyParticipantsAvatars">
              {tournament.participants.slice(0, 3).map((participant) => {
                return (
                  <StyledTournamentCardAvatar avatar={participant.avatar} />
                );
              })}
              {tournament.participants.length > 3 && (
                <StyledTournamentCardAvatar className="Extra">
                  +{tournament.participants.length - 3}
                </StyledTournamentCardAvatar>
              )}
            </div>
            <span>{tournament.participants.length > 0 && "have joined"}</span>
          </div>
        </div>
      </div>

      <div className="CardBody">
        <div className="CardBodyTournamentStatus">
          <InfosIcon size={18} fill="rgba(255, 255, 255, 0.4)" />
          <span>
            {tournament.status === "REGISTRATION"
              ? "Registration Open"
              : tournament.status === "READY"
                ? "Ready to Start"
                : tournament.status === "IN_PROGRESS"
                  ? "In Progress"
                  : tournament.status === "COMPLETED"
                    ? "Completed"
                    : "Cancelled"}
          </span>
        </div>
        <div className="CardBodyParticipationFee">
          <CoinIcon size={18} fill="rgba(255, 255, 255, 0.4)" />
          <span>
            {tournament.participationFee
              ? `Participation Fee: ${tournament.participationFee} Coins`
              : "Free Participation"}
          </span>
        </div>
        <div className="CardBodyParticipantsCount">
          <PersonIcon size={18} fill="rgba(255, 255, 255, 0.4)" />
          <span>
            {tournament.participants.length} / {tournament.maxPlayers}{" "}
            Participants
          </span>
        </div>
      </div>

      <button
        className={`CardBtn ${(tournament.status !== "REGISTRATION" &&
            tournament.status !== "COMPLETED") ||
            isUserParticipant
            ? "disabled"
            : ""
          }`}
        onclick={() => {
          handleJoinTournament();
        }}
      >
        {isUserParticipant
          ? "Joined"
          : tournament.status === "REGISTRATION"
            ? "Join"
            : tournament.status === "READY"
              ? "full"
              : tournament.status === "IN_PROGRESS"
                ? "full"
                : tournament.status === "COMPLETED"
                  ? "View Results"
                  : "Cancelled"}
      </button>
    </StyledTournamentCard>
  );
};
export const StyledTournamentCardAvatar = styled("div")`
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
  refreshTournaments?: () => void;
}
const CreateTournamentModal = (props: CreateTournamentModalProps) => {
  const modalRef = Zeroact.useRef<HTMLDivElement>(null);
  /**
   * States
   */
  const [tournamentName, setTournamentName] = Zeroact.useState("");
  const [tournamentDescription, setTournamentDescription] =
    Zeroact.useState("");
  const [maxPlayers, setMaxPlayers] = Zeroact.useState(4);
  const [participationFee, setParticipationFee] = Zeroact.useState(0);

  /**
   * Contexts
   */
  const { user, toasts } = useAppContext();

  /**
   * Modal management
   */
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

  /**
   * Fetches
   */
  const handleCreateTournament = async () => {
    if (
      !tournamentName ||
      tournamentName.trim() === "" ||
      maxPlayers <= 0 ||
      participationFee < 0
    )
      return toasts.addToastToQueue({
        type: "error",
        message: "Please fill in all required fields correctly.",
      });
    if (!user) return;

    try {
      const resp = await createTournament(
        tournamentName,
        user.userId,
        maxPlayers,
        tournamentDescription,
        participationFee
      );

      if (resp.success) {
        toasts.addToastToQueue({
          type: "success",
          message: "Tournament created successfully.",
        });
        props.refreshTournaments && props.refreshTournaments();
        props.onClose();
      } else throw new Error(resp.message);
    } catch (err: any) {
      toasts.addToastToQueue({
        type: "error",
        message:
          err.message || "An error occurred while creating the tournament.",
      });
    }
  };

  return (
    <StyledCreateTournamentModal ref={modalRef}>
      <input
        type="text"
        placeholder="Tournament Name"
        value={tournamentName}
        onChange={(e: any) => setTournamentName(e.target.value)}
      />

      <textarea
        placeholder="Tournament Description"
        value={tournamentDescription}
        onChange={(e: any) => setTournamentDescription(e.target.value)}
      ></textarea>

      <select
        value={maxPlayers}
        onChange={(e: any) => setMaxPlayers(Number(e.target.value))}
      >
        <option value="4">4 Players</option>
        <option value="8">8 Players</option>
        <option value="16">16 Players</option>
      </select>

      <input
        type="number"
        placeholder="Participation Fee (Coins)"
        value={participationFee === 0 ? "" : participationFee}
        onChange={(e: any) => setParticipationFee(Number(e.target.value))}
      />
      <button className="CreateBtn" onClick={handleCreateTournament}>
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
    border: 1px solid rgba(255, 255, 255, 0.05);
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
    border: 1px solid rgba(255, 255, 255, 0.05);
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
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 5px;
    background-color: var(--bg_color_super_light);
    color: rgba(255,255,255, 0.4);
    padding-right: 10px;
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
