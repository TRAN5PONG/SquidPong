import { searchTournaments } from "@/api/tournament";
import { SearchUsers, sendFriendRequest } from "@/api/user";
import Skeleton from "@/components/Skeleton/Skeleton";
import { AddFriendIcon, TrophyIcon, VerifiedIcon } from "@/components/Svg/Svg";
import { useAppContext } from "@/contexts/AppProviders";
import { useNavigate } from "@/contexts/RouterProvider";
import { db } from "@/db";
import Zeroact, { useEffect, useRef, useState } from "@/lib/Zeroact";
import { styled } from "@/lib/Zerostyle";
import { Conversation } from "@/types/chat";
import { Tournament } from "@/types/game/tournament";
import { User } from "@/types/user";

const StyledSearchModal = styled("div")`
  width: 400px;
  height: 600px;
  top: 55px;
  position: absolute;
  background-color: var(--bg_color);
  left: 0;
  border-radius: 5px 5px 10px 10px;
  padding: 5px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
  .NOPSpan {
    font-family: var(--main_font);
    color: rgba(255, 255, 255, 0.7);
    opacity: 0.7;
    font-size: 1rem;
    text-align: center;
  }

  .SearchCatgContainer {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 3px;
    width: 100%;
    .SearchCatg {
      color: white;
      font-family: var(--span_font);
      min-width: 100%;
      font-size: 1rem;
      font-weight: 100;
      opacity: 0.9;
    }
  }
`;
const StyledSearchPlayerBox = styled("div")`
  width: 100%;
  height: 50px;
  border-radius: 5px;
  border: 1px solid var(--bg_color);
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding: 3px 2px;
  cursor: pointer;
  transition: 0.2s ease-in-out;
  color: white;
  border: 1px solid var(--bg_color_light);
  &:hover {
    background-color: var(--bg_color_light);
  }
  .Avatar {
    height: 44px;
    width: 44px;
    border-radius: 5px;
    background-color: var(--bg_color_light);
    background-image: url(${(props: { avatar: string }) => props.avatar});
    background-size: cover;
    background-position: center;
  }
  .SearchPlayerInfos {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    padding: 0 10px;
    font-family: var(--main_font);
    .SearchPlayerInfosFullName {
      display: flex;
      align-items: center;
      gap: 3px;
    }
    .SearchPlayerInfosUserName {
      font-size: 0.9rem;
      opacity: 0.7;
      color: var(--text_color_light);
      font-weight: 100;
    }
  }
  .ActionsBtns {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-left: auto;
    padding: 5px;
    .AddFriendIcon {
      opacity: 0.8;
      transition: 0.2s ease-in-out;
      &:hover {
        opacity: 1;
        fill: var(--main_color);
      }
    }
  }
`;
const StyledSearchTournamentBox = styled("div")`
  width: 100%;
  height: 50px;
  border-radius: 5px;
  border: 1px solid var(--bg_color_light);
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding: 3px 2px;
  transition: 0.2s ease-in-out;
  cursor: pointer;
  &:hover {
    background-color: var(--bg_color_light);
  }
  .Avatar {
    height: 44px;
    width: 44px;
    border-radius: 5px;
    background-color: var(--bg_color_light);
    background-size: cover;
    background-position: center;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .TournamentInfos {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    align-items: flex-start;
    padding: 0 10px;
    color: white;
    .TournamentInfosName {
      font-family: var(--main_font);
      font-size: 1rem;
      font-weight: 500;
    }
    .TournamentInfosDesc {
      font-family: var(--main_font);
      font-size: 0.9rem;
      opacity: 0.7;
      font-weight: 100;
    }
  }
`;
const SearchModal = (props: { onClose: () => void; query: string }) => {
  const ModalRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { user, toasts } = useAppContext();
  // Stats
  const [players, setPlayers] = Zeroact.useState<User[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [groups, setGroups] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const SearchPlayers = async (query: string) => {
    const Users = await SearchUsers(query);
    if (Users.data) {
      setPlayers(Users.data);
    }
  };
  const SearchTournaments = async (query: string) => {
    try {
      const tournaments = await searchTournaments(query);
      if (tournaments.data) {
        setTournaments(tournaments.data);
      } else {
        setTournaments([]);
      }
    } catch (err) {
      console.error("Error searching tournaments:", err);
    }
  };

  const sendFriendRequest_ = async (receiverId: string) => {
    try {
      const resp = await sendFriendRequest(Number(receiverId));

      if (resp.success) {
        toasts.addToastToQueue({
          type: "info",
          message: "Friend request sent successfully.",
          duration: 3000,
        });
      } else {
        toasts.addToastToQueue({
          type: "warning",
          message: resp.message || "Failed to send friend request.",
          duration: 3000,
        });
      }
    } catch (err: any) {
      toasts.addToastToQueue({
        type: "error",
        message: err.message || "An unexpected error occurred.",
        duration: 3000,
      });
    }
  };

  useEffect(() => {
    if (props.query.trim() === "") {
      setIsLoading(false);
      setPlayers([]);
      setTournaments([]);
      return;
    }
    setIsLoading(true);
    const delayDebounceFn = setTimeout(() => {
      SearchPlayers(props.query.trim()).then(() => setIsLoading(false));
      SearchTournaments(props.query.trim());
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [props.query]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        ModalRef.current &&
        !ModalRef.current.contains(event.target as Node)
      ) {
        props.onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [ModalRef, props]);

  return (
    <StyledSearchModal className="GlassMorphism" ref={ModalRef}>
      <div className="SearchCatgContainer">
        {players.length > 0 ? <h1 className="SearchCatg">Players</h1> : null}
        {isLoading
          ? Array.from({ length: 4 }).map((_, index) => (
              <Skeleton
                dark={true}
                width="100%"
                height="50px"
                borderRadius={5}
                gap={5}
                animation="hybrid"
                index={index + 1}
              />
            ))
          : players.length > 0 &&
            players.map((player: User) => {
              return (
                <StyledSearchPlayerBox
                  avatar={player.avatar}
                  onClick={() => {
                    navigate(`/user/${player.username}`);
                    props.onClose();
                  }}
                >
                  <div className="Avatar" />
                  <div className="SearchPlayerInfos">
                    <span className="SearchPlayerInfosFullName">
                      {player.firstName + " " + player.lastName}
                      {player.isVerified && (
                        <VerifiedIcon fill="var(--main_color)" size={15} />
                      )}
                    </span>
                    <span className="SearchPlayerInfosUserName">
                      {"@" + player.username}
                    </span>
                  </div>
                  <div className="ActionsBtns">
                    {player.id !== user?.id && (
                      <a
                        onClick={() =>
                          sendFriendRequest_(player.userId.toString())
                        }
                      >
                        <AddFriendIcon
                          fill="white"
                          size={20}
                          className="AddFriendIcon"
                        />
                      </a>
                    )}
                  </div>
                </StyledSearchPlayerBox>
              );
            })}
      </div>
      <div className="SearchCatgContainer">
        {tournaments.length > 0 ? (
          <h1 className="SearchCatg">Tournaments</h1>
        ) : null}

        {isLoading
          ? Array.from({ length: 4 }).map((_, index) => (
              <Skeleton
                dark={true}
                width="100%"
                height="50px"
                borderRadius={5}
                gap={5}
                animation="hybrid"
                index={index + 1}
              />
            ))
          : tournaments.length > 0 &&
            tournaments.map((tournament) => {
              return (
                <StyledSearchTournamentBox
                  onClick={() => {
                    navigate(`/tournament/${tournament.id}`);
                    props.onClose();
                  }}
                >
                  <div className="Avatar">
                    <TrophyIcon fill="white" size={30} />
                  </div>
                  <div className="TournamentInfos">
                    <span className="TournamentInfosName">
                      {tournament.name}
                    </span>
                    <span className="TournamentInfosDesc">
                      {tournament.status === "REGISTRATION"
                        ? "Registration is open."
                        : tournament.status === "READY"
                        ? "Tournament is ready to start."
                        : tournament.status === "IN_PROGRESS"
                        ? "Tournament is in progress."
                        : tournament.status === "COMPLETED"
                        ? "Tournament has been completed."
                        : tournament.status === "CANCELLED"
                        ? "Tournament has been cancelled."
                        : ""}
                    </span>
                  </div>
                </StyledSearchTournamentBox>
              );
            })}
      </div>
      {groups.length > 0 && <h1 className="SearchCatg">Groups</h1>}
      {tournaments.length === 0 && players.length === 0 && !isLoading && (
        <span className="NOPSpan">No results found.</span>
      )}
    </StyledSearchModal>
  );
};

export default SearchModal;
