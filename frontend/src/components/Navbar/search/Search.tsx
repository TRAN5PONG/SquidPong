import { SearchUsers } from "@/api/user";
import { AddFriendIcon, TrophyIcon, VerifiedIcon } from "@/components/Svg/Svg";
import { useNavigate } from "@/contexts/RouterProvider";
import { db } from "@/db";
import Zeroact, { useEffect, useRef, useState } from "@/lib/Zeroact";
import { styled } from "@/lib/Zerostyle";
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
  .SearchCatg {
    color: white;
    font-family: var(--span_font);
    font-size: 1rem;
    font-weight: 100;
    opacity: 0.9;
    margin-bottom: 15px;
  }
  .SearchCatgContainer {
    display: flex;
    flex-direction: column;
    gap: 3px;
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
  // Stats
  const [users, setUsers] = Zeroact.useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const Search = async (query: string) => {
    const Users = await SearchUsers(query);
    if (Users.data) {
      console.log(Users.data);
      setUsers(Users.data);
    }
  };

  useEffect(() => {
    if (props.query.trim() === "") {
      setIsLoading(false);
      return setUsers([]);
    }
    setIsLoading(true);
    const delayDebounceFn = setTimeout(() => {
      Search(props.query.trim()).then(() => setIsLoading(false));
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
      <h1 className="SearchCatg">Players</h1>
      <div className="SearchCatgContainer">
        {isLoading ? (
          <span>Loading...</span>
        ) : users.length === 0 ? (
          <span>No players found.</span>
        ) : (
          users.map((user: User) => {
            return (
              <StyledSearchPlayerBox
                avatar={user.avatar}
                onClick={() => {
                  navigate(`/user/${user.username}`);
                  props.onClose();
                }}
              >
                <div className="Avatar" />
                <div className="SearchPlayerInfos">
                  <span className="SearchPlayerInfosFullName">
                    {user.firstName + " " + user.lastName}
                    {user.isVerified && (
                      <VerifiedIcon fill="var(--main_color)" size={15} />
                    )}
                  </span>
                  <span className="SearchPlayerInfosUserName">
                    {"@" + user.username}
                  </span>
                </div>
                <div className="ActionsBtns">
                  <AddFriendIcon
                    size={20}
                    fill="white"
                    className="AddFriendIcon"
                  />
                </div>
              </StyledSearchPlayerBox>
            );
          })
        )}
      </div>
      <h1 className="SearchCatg">Tournaments</h1>
      <div className="SearchCatgContainer">
        {db.FakeTournaments.map((tournament) => {
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
                <span className="TournamentInfosName">{tournament.name}</span>
                <span className="TournamentInfosDesc">
                  {tournament.status === "registration"
                    ? "Registration is open."
                    : tournament.status === "ready"
                    ? "Tournament is ready to start."
                    : tournament.status === "inProgress"
                    ? "Tournament is in progress."
                    : tournament.status === "completed"
                    ? "Tournament has been completed."
                    : tournament.status === "cancelled"
                    ? "Tournament has been cancelled."
                    : ""}
                </span>
              </div>
            </StyledSearchTournamentBox>
          );
        })}
      </div>
    </StyledSearchModal>
  );
};

export default SearchModal;
