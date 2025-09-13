import { PlayerStats, User, UserPreferences } from "./types/user";
import { Conversation, ChatMessage, ConversationDetails } from "./types/chat";
import { NotificationEl } from "./types/notification";
import { Tournament, TournamentPlayer } from "./types/tournament";
import { Match, MatchPlayer } from "./types/game";

const FakeStats: PlayerStats = {
  matchHistory: [],
  totalGames: 200,
  score: 0,
  rank: 1,
  gamesPlayed: 23,
  gamesWon: 19,
  gamesLost: 4,
  tournamentsPlayed: 5,
  tournamentsWon: 4,
  tournamentsLost: 1,
  winStreak: 4,
  loseStreak: 5,
  longestWinStreak: 3,
  averageGameDuration: 1004,
  bounceChallengeBestScore: 130,
  bounceChallengeGamesPlayed: 44,
  totalPlayTime: 4000,
  friendsCount: 100,
  vsAIStats: {
    easy: {
      gamesPlayed: 11,
      gamesWon: 4,
      gamesLost: 7,
    },
    medium: {
      gamesPlayed: 21,
      gamesWon: 20,
      gamesLost: 1,
    },
    hard: {
      gamesPlayed: 1,
      gamesWon: 0,
      gamesLost: 1,
    },
  },
};

const User1: User = {
  id: "1",
  username: "Zero",
  firstName: "Hassan",
  lastName: "Karrach",
  status: "offline",
  lastSeen: new Date(),
  avatar: "https://cdn.pfps.gg/pfps/1426-tom-and-jerry-icon.png",
  banner:
    "https://i.pinimg.com/originals/4f/29/f1/4f29f15479b99d852271fa23b56d0817.gif",
  bio: "Just a gamer enjoying life!",
  createdAt: new Date(),
  updatedAt: new Date(),
  rankDivision: "Master",
  rankTier: "II",
  level: 13.66,
  isVerified: true,
  walletBalance: 1500,
  playerStats: FakeStats,
  playerCharacters: ["Zero", "Taizen", "Kira"],
  playerSelectedCharacter: "Zero",
  playerPaddles: [""],
  playerSelectedPaddle: "",
  preferences: {
    musicEnabled: false,
    notifications: {
      chatMessages: false,
      friendRequests: false,
      gameInvites: false,
      tournamentUpdates: false,
    },
    soundEnabled: false,
    twoFactorEnabled: false,
  },
};
const User2: User = {
  id: "2",
  username: "Lofi",
  firstName: "Jane",
  lastName: "Smith",
  status: "idle",
  lastSeen: new Date(),
  avatar: "https://cdn3.emoji.gg/emojis/22947-jerry.png",
  banner:
    "https://i.pinimg.com/originals/85/c1/3d/85c13d1d58e409386d9212cbc4c3cc1a.gif",
  bio: "Loves strategy games!",
  createdAt: new Date(),
  updatedAt: new Date(),
  rankDivision: "Diamond",
  rankTier: "II",
  level: 2,
  isVerified: true,
  walletBalance: 3000,
  playerStats: FakeStats,
  playerCharacters: ["Lofi", "Taizen"],
  playerSelectedCharacter: "Kira",
  playerPaddles: [""],
  playerSelectedPaddle: "",
  preferences: {
    musicEnabled: false,
    notifications: {
      chatMessages: false,
      friendRequests: false,
      gameInvites: false,
      tournamentUpdates: false,
    },
    soundEnabled: false,
    twoFactorEnabled: false,
  },
};
const User3: User = {
  id: "3",
  username: "marcos",
  firstName: "Alice",
  lastName: "Johnson",
  status: "doNotDisturb",
  lastSeen: new Date(),
  avatar:
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQKbuGFOi7hBDNztRugDv-oGsJS4w-ErNme8Jpo6ZXE6LPyf7wdcvhpEaylE8gzmpn57VA",
  banner:
    "https://i.pinimg.com/originals/d9/23/b9/d923b99ae7193de31ae54baaf69722f4.gif",
  bio: "Avid gamer and streamer.",
  createdAt: new Date(),
  updatedAt: new Date(),

  rankDivision: "Platinum",
  rankTier: "I",
  level: 13.66,

  isVerified: false,
  walletBalance: 500,
  playerStats: FakeStats,
  playerCharacters: ["marcos", "Taizen"],
  playerSelectedCharacter: "Zero",
  playerPaddles: [""],
  playerSelectedPaddle: "",
  preferences: {
    musicEnabled: false,
    notifications: {
      chatMessages: false,
      friendRequests: false,
      gameInvites: false,
      tournamentUpdates: false,
    },
    soundEnabled: false,
    twoFactorEnabled: false,
  },
};
const User4: User = {
  id: "4",
  username: "Paulo",
  firstName: "Bob",
  lastName: "Brown",
  status: "online",
  lastSeen: new Date(),
  avatar:
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRs6-DjFhDB9341RiZqOj6EPutmbjAHDXXLMSKtcOB3JyjdZys61iigtjkWi8ZAjwwAFmA",
  banner:
    "https://i.pinimg.com/originals/1d/cf/8e/1dcf8e9ce0dac98f447f5790e2efd4b2.gif",
  bio: "Casual gamer.",
  createdAt: new Date(),
  updatedAt: new Date(),

  rankDivision: "Iron",
  rankTier: "I",
  level: 5,

  isVerified: false,
  walletBalance: 100,
  playerStats: FakeStats,
  playerCharacters: ["Paulo", "Taizen"],
  playerSelectedCharacter: "Paulo",
  playerPaddles: [""],
  playerSelectedPaddle: "",
  preferences: {
    musicEnabled: false,
    notifications: {
      chatMessages: false,
      friendRequests: false,
      gameInvites: false,
      tournamentUpdates: false,
    },
    soundEnabled: false,
    twoFactorEnabled: false,
  },
};

const FakeUsers: User[] = [User1, User2, User3, User4];
const FakeConversations: Conversation[] = [
  {
    id: "conv1",
    participants: [User1, User2],
    lastMessage: {
      from: User2,
      date: new Date(2023, 10, 1, 12, 0, 0),
      message: "Let's play a game later!",
      status: "sent",
      reactions: [],
      type: "text",
    } as ChatMessage,
    unreadCount: 1,
    updatedAt: new Date(),
  },
  {
    id: "conv2",
    participants: [User1, User3],
    lastMessage: {
      from: User1,
      date: new Date(),
      message: "Hey, how's it going?",
      status: "read",
      reactions: [],
      type: "text",
    } as ChatMessage,
    unreadCount: 0,
    updatedAt: new Date(),
  },
  {
    id: "conv3",
    participants: [User1, User4],
    lastMessage: {
      from: User4,
      date: new Date(2023, 10, 2, 14, 30, 0),
      message: "Are you up for a challenge?",
      status: "sent",
      reactions: [],
      type: "text",
    } as ChatMessage,
    unreadCount: 2,
    updatedAt: new Date(),
  },
];
const FakeConversationsDetails: ConversationDetails[] = [
  {
    id: "conv1",
    participants: [User1, User2],
    lastMessage: {
      from: User1,
      date: new Date(),
      message: "Hey, how's it going?",
      status: "read",
      reactions: [],
      type: "text",
    } as ChatMessage,
    unreadCount: 0,
    updatedAt: new Date(),
    messages: [
      {
        from: User1,
        date: new Date(2023, 10, 1, 10, 30, 0),
        message: `${User1.username} has sent you an invite to join their game.`,
        status: "sent",
        reactions: [],
        type: "invite",
        // Invitation to a tournamnet
        invitation: {
          id: "invite1",
          inviterId: User1.id,
          inviteeId: User2.id,
          type: "tournament",
          status: "pending",
          createdAt: new Date(2023, 10, 1, 10, 30, 0),
          expiresAt: new Date(2023, 10, 1, 11, 30, 0),
          tournamentInfos: {
            tournamentId: "tournament1",
            tournamentName: "Weekly Tournament",
            requiredCurrency: 500,
            tournamentType: "singleElimination",
            maxParticipants: 16,
            tournamentStatus: "registration",
            startTime: new Date(2023, 10, 1, 12, 0, 0),
            currentParticipants: 8,
            customMessage: "Join me in this exciting tournament!",
          },
          replyTo: {
            from: User2,
            date: new Date(2023, 10, 1, 10, 35, 0),
            message: "Sure, I'll join the tournament!",
            status: "read",
            reactions: [],
            type: "text",
          },
        },
      } as ChatMessage,
      {
        from: User1,
        date: new Date(2023, 10, 1, 10, 35, 0),
        message: "Thanks for the invite! I'll join you.",
        status: "read",
        reactions: [],
        type: "invite",
        // Invitation to a game
        invitation: {
          id: "invite2",
          inviterId: User2.id,
          inviteeId: User1.id,
          type: "game",
          status: "accepted",
          createdAt: new Date(2023, 10, 1, 10, 35, 0),
          expiresAt: new Date(2023, 10, 1, 11, 35, 0),
        },
        replyTo: {
          from: User2,
          date: new Date(2023, 10, 1, 10, 35, 0),
          message: "Invite me please",
          status: "read",
          reactions: [],
          type: "text",
        },
      } as ChatMessage,
      {
        from: User1,
        date: new Date(),
        message: "Hey, how's it going?",
        status: "read",
        reactions: [],
        type: "text",
      } as ChatMessage,
      {
        from: User2,
        date: new Date(2023, 10, 1, 10, 0, 0),
        message: "I'm good! How about you?",
        status: "read",
        reactions: [],
        type: "text",
      } as ChatMessage,
      {
        from: User1,
        date: new Date(2023, 10, 1, 10, 5, 0),
        message: "Just playing some games.",
        status: "read",
        reactions: [],
        type: "text",
      } as ChatMessage,
      {
        from: User2,
        date: new Date(2023, 10, 1, 10, 10, 0),
        message:
          "Nice! Want to team up later? lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
        status: "read",
        reactions: [],
        type: "text",
      } as ChatMessage,
      {
        from: User1,
        date: new Date(2023, 10, 1, 10, 15, 0),
        message:
          "Nice! Want to team up later? lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
        status: "read",
        reactions: [],
        type: "text",
      } as ChatMessage,
      {
        from: User2,
        date: new Date(2023, 10, 1, 10, 20, 0),
        message:
          "Great! I'll send you an invite. and this is a longer message to test the text wrapping and see how it behaves in the chat interface.",
        status: "read",
        reactions: [],
        type: "text",
      } as ChatMessage,
      {
        from: User1,
        date: new Date(2023, 10, 1, 10, 25, 0),
        message:
          "Great! I'll send you an invite. and this is a longer message to test the text wrapping and see how it behaves in the chat interface.",
        status: "read",
        reactions: [],
        type: "text",
      } as ChatMessage,
    ],
  },
  {
    id: "conv2",
    participants: [User1, User3],
    lastMessage: {
      from: User3,
      date: new Date(2023, 10, 1, 12, 0, 0),
      message: "Let's play a game later!",
      status: "delivered",
      reactions: [],
      type: "text",
    } as ChatMessage,
    unreadCount: 1,
    updatedAt: new Date(),
    messages: [
      {
        from: User3,
        date: new Date(2023, 10, 1, 11, 50, 0),
        message: "Hey! Want to join my game?",
        status: "read",
        reactions: [],
        type: "text",
      } as ChatMessage,
      {
        from: User1,
        date: new Date(2023, 10, 1, 11, 55, 0),
        message:
          "Sure! Send me the invite. and this is a longer message to test the text wrapping and see how it behaves in the chat interface.",
        status: "read",
        reactions: [],
        type: "text",
      } as ChatMessage,
      {
        from: User3,
        date: new Date(2023, 10, 1, 12, 0, 0),
        message:
          "Sure! Send me the invite. and this is a longer message to test the text wrapping and see how it behaves in the chat interface.",
        status: "read",
        reactions: [],
        type: "text",
      } as ChatMessage,
    ],
  },
];

const FakeNotificationsForEachType: NotificationEl[] = [
  {
    id: "notif1",
    type: "info",
    createdAt: new Date(2023, 10, 1, 9, 0, 0),
    payload: {
      info: "Welcome to the game!",
    },
    isRead: true,
  },
  {
    id: "notif2",
    type: "warning",
    createdAt: new Date(2023, 10, 1, 9, 30, 0),
    payload: {
      warning:
        "Your account will be suspended if you continue to violate the rules.",
    },
    isRead: false,
  },
  {
    id: "notif3",
    type: "friendRequest",
    by: User3,
    createdAt: new Date(2023, 10, 1, 10, 0, 0),
    payload: {
      friendRequest: {
        id: "fr1",
        status: "pending",
        message: "Hey, let's be friends!",
      },
    },
    isRead: true,
  },
  {
    id: "notif4",
    type: "gameInvite",
    by: User1,
    createdAt: new Date(2023, 10, 1, 10, 30, 0),
    payload: {
      gameId: "game123",
    },
    isRead: false,
  },
  {
    id: "notif5",
    type: "tournamentInvite",
    by: User2,
    createdAt: new Date(2023, 10, 1, 11, 0, 0),
    payload: {
      tournamentName: "Weekly Tournament",
      tournamentId: "tournament1",
    },
    isRead: true,
  },
  {
    id: "notif6",
    type: "tournamentCancelled",
    createdAt: new Date(2023, 10, 1, 11, 30, 0),
    payload: {
      tournamentName: "Weekly Tournament",
      tournamentId: "tournament1",
    },
    isRead: true,
  },
  {
    id: "notif77",
    type: "friendRequestAccepted",
    by: User1,
    createdAt: new Date(2023, 10, 1, 11, 45, 0),
    isRead: true,
  },
  {
    id: "notif7",
    type: "CoinGiftReceived",
    by: User1,
    createdAt: new Date(2023, 10, 1, 12, 0, 0),
    payload: {
      coinAmount: 100,
    },
    isRead: false,
  },
  {
    id: "notif8",
    type: "AchievementUnlocked",
    createdAt: new Date(2023, 10, 1, 12, 30, 0),
    payload: {
      achievementName: "First Blood",
      achievementId: "ach1",
    },
    isRead: false,
  },
  {
    id: "notif9",
    type: "coinGiftReceived",
    by: User3,
    createdAt: new Date(2023, 10, 1, 13, 0, 0),
    payload: {
      coinAmount: 50,
    },
    isRead: false,
  },
  {
    id: "notif10",
    type: "spectateInvite",
    by: User1,
    createdAt: new Date(2023, 10, 1, 13, 30, 0),
    payload: {
      spectateGameId: "game456",
    },
    isRead: false,
  },
  {
    id: "notif11",
    type: "predictionWon",
    createdAt: new Date(2023, 10, 1, 14, 0, 0),
    payload: {
      predictionId: "pred123",
      winningsAmount: 200,
    },
    isRead: false,
  },
];

const FakeTournamentPlayers: TournamentPlayer[] = [
  {
    user: User1,
    bracketPosition: 0,
    currentRound: "qualifiers",
    isEliminated: false,
    isReady: false,
  },
  {
    user: User2,
    bracketPosition: 1,
    currentRound: "qualifiers",
    isEliminated: false,
    isReady: true,
  },
  {
    user: User3,
    bracketPosition: 2,
    currentRound: "qualifiers",
    isEliminated: false,
    isReady: true,
  },
  {
    user: User4,
    bracketPosition: 3,
    currentRound: "qualifiers",
    isEliminated: false,
    isReady: true,
  },
];
const FakeTournaments: Tournament[] = [
  {
    id: "tournament1",
    name: "Weekly Tournament",
    desription: "A fun weekly tournament for all players.",
    maxPlayers: 32,
    bracketPositions: Array(32).fill(null),
    organizerId: User1.id,
    participants: FakeTournamentPlayers,
    status: "registration",
  },
  {
    id: "tournament2",
    name: "Monthly Tournament",
    desription: "The ultimate Tournament for top players.",
    maxPlayers: 16,
    bracketPositions: Array(16).fill(null),
    organizerId: User2.id,
    participants: FakeTournamentPlayers,
    status: "cancelled",
  },
  {
    id: "tournament3",
    name: "Summer Showdown",
    desription: "A summer-themed tournament with exciting prizes.",
    maxPlayers: 8,
    bracketPositions: Array(64).fill(null),
    organizerId: User3.id,
    participants: FakeTournamentPlayers,
    status: "inProgress",
  },
  {
    id: "tournament4",
    name: "Winter Clash",
    desription: "A winter-themed tournament with epic battles.",
    maxPlayers: 4,
    bracketPositions: Array(16).fill(null),
    organizerId: User4.id,
    participants: FakeTournamentPlayers,
    status: "completed",
  },
  {
    id: "tournament5",
    name: "Spring Cup",
    desription: "A spring-themed cup for casual players.",
    maxPlayers: 4,
    bracketPositions: Array(64).fill(null),
    organizerId: User1.id,
    participants: FakeTournamentPlayers,
    status: "ready",
  },
];
const FakeGroupChatMessages: ChatMessage[] = [
  {
    from: User1,
    date: new Date(2023, 10, 1, 12, 0, 0),
    message: "Welcome to the tournament group!",
    status: "read",
    reactions: [],
    type: "text",
  },
  {
    from: User2,
    date: new Date(2023, 10, 1, 12, 5, 0),
    message: "Excited for the matches!",
    status: "read",
    reactions: [],
    type: "text",
  },
  {
    from: User3,
    date: new Date(2023, 10, 1, 12, 10, 0),
    message: "Let's give it our best!",
    status: "read",
    reactions: [],
    type: "text",
  },
  {
    from: User4,
    date: new Date(2023, 10, 1, 12, 15, 0),
    message: "Good luck everyone!",
    status: "read",
    reactions: [],
    type: "text",
  },
  {
    from: User1,
    date: new Date(2023, 10, 1, 12, 20, 0),
    message: "Remember to check the rules!",
    status: "read",
    reactions: [],
    type: "text",
  },
  {
    from: User2,
    date: new Date(2023, 10, 1, 12, 25, 0),
    message:
      "lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
    status: "read",
    reactions: [],
    type: "text",
  },
];
const FakeUserPreferences: UserPreferences = {
  musicEnabled: false,
  soundEnabled: true,
  twoFactorEnabled: false,
  notifications: {
    friendRequests: true,
    chatMessages: true,
    gameInvites: true,
    tournamentUpdates: true,
  },
};

const MatchPlayer1: MatchPlayer = {
  userId: "0",
  finalScore: 11,
  isHost: true,
  isReady: true,
  characterId: "Zero",
  rankChange: 20,
  playerName: "Zero",
};
const MatchPlayer2: MatchPlayer = {
  userId: "1",
  finalScore: 9,
  isHost: false,
  isReady: true,
  characterId: "Taizen",
  rankChange: -20,
  playerName: "Paulo",
};
const MatchHistoryItems: Match[] = [
  {
    id: "match1",
    createdAt: new Date(2023, 10, 1, 10, 0, 0),
    duration: 1200, // 1200 seconds is 20 minutes
    opponent1: MatchPlayer1,
    opponent2: MatchPlayer2,
    mode: "ONE_VS_ONE",
    status: "completed",
    completedAt: new Date(2025, 10, 1, 10, 20, 0),
    winnerId: "0",
  },
  {
    id: "match2",
    createdAt: new Date(2023, 10, 1, 11, 0, 0),
    duration: 1500, // 1500 seconds is 25 minutes
    opponent1: MatchPlayer1,
    opponent2: MatchPlayer2,
    mode: "1vsAI",
    status: "completed",
    completedAt: new Date(2024, 10, 1, 11, 25, 0),
    winnerId: "1",
  },
  {
    id: "match3",
    createdAt: new Date(2023, 10, 1, 12, 0, 0),
    duration: 1800, // 1800 seconds is 30 minutes
    opponent1: MatchPlayer1,
    opponent2: MatchPlayer2,
    mode: "Tournament",
    status: "completed",
    completedAt: new Date(2025, 6, 1, 12, 30, 0),
    winnerId: "0",
  },
  {
    id: "match4",
    createdAt: new Date(2023, 10, 1, 13, 0, 0),
    duration: 2400, // 2400 seconds is 40 minutes
    opponent1: MatchPlayer1,
    opponent2: MatchPlayer2,
    mode: "Tournament",
    status: "completed",
    completedAt: new Date(2023, 10, 1, 13, 40, 0),
    winnerId: "1",
  },
  {
    id: "match5",
    createdAt: new Date(2023, 10, 1, 14, 0, 0),
    duration: 3000, // 3000 seconds is 50 minutes
    opponent1: MatchPlayer1,
    opponent2: MatchPlayer2,
    mode: "BounceChallenge",
    status: "completed",
    completedAt: new Date(2023, 10, 1, 14, 50, 0),
    winnerId: "0",
  },
];

export const db = {
  MatchHistoryItems,
  FakeUserPreferences,
  FakeGroupChatMessages,
  users: FakeUsers,
  conversations: FakeConversations,
  fakeConversationDetails: FakeConversationsDetails,
  fakeNotificationsForEachType: FakeNotificationsForEachType,
  FakeTournaments,
};
