import { GameInvitation, GameSettings } from "@/types/game";

// Get Invite
export async function getUserGameInvitations(
  userId: string
): Promise<GameInvitation[]> {
  const response = await fetch(
    `http://10.13.2.6:4000/api/game/invitations/user/${userId}`,
    {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch game invitations");
  }
  return await response.json();
}
export async function getInvitationByCode(
  code: string
): Promise<GameInvitation> {
  const response = await fetch(
    `http://10.13.2.6:4000/api/game/invitations/code/${code}`,
    {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to fetch game invitation by code");
  }
  return data;
}

// Manage Invite
export async function createInvite(
  settings: GameSettings,
  receiverId: string | null,
  expiresAt: Date | null,
  message?: string
) {
  const response = await fetch(`http://10.13.2.6:4000/api/game/invitations`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      receiverId,
      allowPowerUps: settings.rules.allowPowerUps,
      expiresAt: expiresAt,
      pauseTime: settings.rules.pauseTime,
      requiredCurrency: settings.requiredCurrency,
      scoreLimit: settings.rules.maxScore,
      message: message || null,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Something went wrong while creating invite");
  }

  return data;
}
export async function cancelInvite(inviteId: string) {
  const response = await fetch(
    `http://10.13.2.6:4000/api/game/invitations/${inviteId}/cancel`,
    {
      method: "POST",
      credentials: "include",
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error || "Something went wrong while cancelling invite"
    );
  }

  return data;
}
export async function AcceptInvite(inviteId: string) {
  const response = await fetch(
    `http://10.13.2.6:4000/api/game/invitations/${inviteId}/accept`,
    {
      method: "POST",
      credentials: "include",
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error || "Something went wrong while accepting invite"
    );
  }

  return data;
}
export async function AcceptPrivateInvite(code: string) {
  console.log("Accepting private invite with code:", code);
  const response = await fetch(
    `http://10.13.2.6:4000/api/game/invitations/code/${code}/accept`,
    {
      method: "POST",
      credentials: "include",
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error || "Something went wrong while accepting invite"
    );
  }

  return data;
}
export async function DeclineInvite(inviteId: string) {
  const response = await fetch(
    `http://10.13.2.6:4000/api/game/invitations/${inviteId}/decline`,
    {
      method: "POST",
      credentials: "include",
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error || "Something went wrong while declining invite"
    );
  }

  return data;
}
