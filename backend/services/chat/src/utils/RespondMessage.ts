

export enum MessageResponses {
  SEND_SUCCESS = 'Message sent successfully.',
  SEND_FAILED = 'Failed to send message.',
  SEND_NOT_FOUND = 'Message to send not found.',

  FETCH_SUCCESS = 'Messages fetched successfully.',
  FETCH_NOT_FOUND = 'Messages not found in the database.',

  DELETE_SUCCESS = 'Message deleted successfully.',
  DELETE_FAILED = 'Failed to delete message.',
  DELETE_NOT_FOUND = 'Message to delete not found.',

  INVALID_REQUEST = 'Invalid request for messages.',
  SERVER_ERROR = 'Internal server error while handling messages.',
}


export enum PollMessages {
  POLL_CREATED = 'Poll created successfully.',
  POLL_CREATION_FAILED = 'Failed to create poll.',
  POLL_FETCHED = 'Poll fetched successfully.',
  POLL_FETCH_FAILED = 'Failed to fetch poll.',
  POLLS_FETCHED = 'Polls fetched successfully.',
  POLLS_FETCH_FAILED = 'Failed to fetch polls.',
  POLL_DELETED = 'Poll deleted successfully.',
  POLL_DELETE_FAILED = 'Failed to delete poll.',
  OPTION_ADDED = 'Option added to poll successfully.',
  OPTION_ADD_FAILED = 'Failed to add option to poll.',
  VOTE_SUBMITTED = 'Vote submitted successfully.',
  VOTE_SUBMIT_FAILED = 'Failed to submit vote.',
  POLL_CREATED_SUCCESS = 'Poll created successfully.',
  POLL_CREATED_FAILED = 'Failed to create poll.',
  POLL_FETCHED_SUCCESS = 'Poll fetched successfully.',
  POLL_FETCHED_FAILED = 'Failed to fetch poll.',
  POLLS_FETCHED_SUCCESS = 'Polls fetched successfully.',
  POLLS_FETCHED_FAILED = 'Failed to fetch polls.',
  POLL_DELETED_SUCCESS = 'Poll deleted successfully.',
  POLL_DELETED_FAILED = 'Failed to delete poll.',
  OPTION_ADDED_SUCCESS = 'Option added to poll successfully.',
  OPTION_ADDED_FAILED = 'Failed to add option to poll.',
  VOTE_SUBMITTED_SUCCESS = 'Vote submitted successfully.',
  VOTE_SUBMITTED_FAILED = 'Failed to submit vote.',

  INVALID_REQUEST = 'Invalid request for polls.',
  SERVER_ERROR = 'Internal server error while handling polls.',
}

export enum GroupMessages {

  NOT_A_MEMBER = 'You are not a member of this group.',
    CANNOT_UPDATE_MATCH_GROUP = 'Cannot update a match-associated group.',
    NOT_FOUND = 'Group not found.',
    IMAGE_UPDATED_SUCCESS = 'Group image updated successfully.',
    CANNOT_CHANGE_OWN_ROLE = 'You cannot change your own role in the group.',
    JOIN_REQUEST_REJECTED_SUCCESS = 'Join request rejected successfully.',
    JOIN_REQUEST_REJECTED_FAILED = 'Failed to reject join request.',
    JOIN_REQUEST_APPROVED_SUCCESS = 'Join request approved successfully.',
    JOIN_REQUESTS_FETCHED_SUCCESS = 'Join requests fetched successfully.',
    JOIN_REQUEST_NOT_FOUND = 'Join request not found.',
    JOIN_REQUEST_ALREADY_HANDLED = 'Join request has already been handled.',
    USER_ALREADY_IN_GROUP = 'User is already a member of the group.',
    USER_ALREADY_REQUESTED = 'User has already requested to join the group.',
    USER_NOT_REQUESTED = 'User has not requested to join the group.',
    NOT_HAVE_PERMISSION = 'You do not have permission to perform this action.',
    MEMBER_NOT_EXISTS = 'Member does not exist.',
    YOURE_NOT_OWNER = 'You are not the owner of the group.',
    MEMBER_ALREADY_IN_GROUP = 'Member is already in the group.',
    CANTJOIN_PRIVATE = 'Cannot join a private group without an invitation or approval.',
    NOT_MEMBER_CANNOT_JOIN = 'Only group members can join the group.',
    NOT_MEMBER_CANNOT_LEAVE = 'Only group members can leave the group.',
    NOT_OWNER_CANNOT_CHANGE_TYPE = 'Only the group owner can change the group type.',
    CREATED_SUCCESS = 'Group created successfully.',
    CREATED_FAILED = 'Failed to create group.',
    FETCH_SUCCESS = 'Group fetched successfully.',
    FETCH_NOT_FOUND = 'Group not found in the database.',
    UPDATED_SUCCESS = 'Group updated successfully.',
    UPDATED_FAILED = 'Failed to update group.',
    DELETED_SUCCESS = 'Group deleted successfully.',
    DELETED_FAILED = 'Failed to delete group.',

    // Members
    JOINED_SUCCESS = 'Joined group successfully.',
    JOINED_FAILED = 'Failed to join group.',
    LEFT_SUCCESS = 'Left group successfully.',
    LEFT_FAILED = 'Failed to leave group.',
    CHANGE_OWNER_FIRST = 'Transfer ownership before leaving the group.',
    CANNOT_LEAVE_OWNER = 'Group owner cannot leave the group without transferring ownership.',
    MEMBERS_LISTED_SUCCESS = 'Group members listed successfully.',
    MEMBERS_LISTED_FAILED = 'Failed to list group members.',
    MEMBER_ADDED_SUCCESS = 'Member added successfully.',
    MEMBER_ADDED_FAILED = 'Failed to add member.',
    MEMBER_ALREADY_EXISTS = 'Member already exists in the group.',
    SELF_ADD_ERROR = 'Cannot add yourself as a member.',
    MEMBER_REMOVED_SUCCESS = 'Member removed successfully.',
    MEMBER_REMOVED_FAILED = 'Failed to remove member.',

    // Roles
    ROLE_UPDATED_SUCCESS = 'Group role updated successfully.',
    ROLE_UPDATED_FAILED = 'Failed to update group role.',
    ROLE_ASSIGNED_SUCCESS = 'Role assigned successfully.',
    ROLE_ASSIGNED_FAILED = 'Failed to assign role.',
    ROLE_REMOVED_SUCCESS = 'Role removed successfully.',
    ROLE_REMOVED_FAILED = 'Failed to remove role.',
    ROLE_ALREADY_ASSIGNED = 'Role already assigned to the member.',
    CANNOT_CHANGE_OWNER_ROLE = 'Cannot change the role of the group owner.',

    // Group Settings
    SETTINGS_UPDATED_SUCCESS = 'Group settings updated successfully.',
    SETTINGS_UPDATED_FAILED = 'Failed to update group settings.',

    // Fetching Messages
    MESSAGES_FETCHED_SUCCESS = 'Group messages fetched successfully.',
    MESSAGES_FETCHED_FAILED = 'Failed to fetch group messages.',

    // Fetching Groups
    USER_GROUPS_FETCHED_SUCCESS = 'User groups fetched successfully.',
    USER_GROUPS_FETCHED_FAILED = 'Failed to fetch user groups.',

    // Polls
    POLL_CREATED_SUCCESS = 'Poll created successfully.',
    POLL_CREATED_FAILED = 'Failed to create poll.',
    POLL_UPDATED_SUCCESS = 'Poll updated successfully.',
    POLL_UPDATED_FAILED = 'Failed to update poll.',
    POLL_DELETED_SUCCESS = 'Poll deleted successfully.',
    POLL_DELETED_FAILED = 'Failed to delete poll.',
    POLL_FETCHED_SUCCESS = 'Poll fetched successfully.',
    POLL_FETCHED_FAILED = 'Failed to fetch poll.',
    POLL_OPTIONS_LISTED_SUCCESS = 'Poll options listed successfully.',
    POLL_OPTIONS_LISTED_FAILED = 'Failed to list poll options.',
    VOTE_SUBMITTED_SUCCESS = 'Vote submitted successfully.',
    VOTE_SUBMITTED_FAILED = 'Failed to submit vote.',
    POLL_CLOSED_SUCCESS = 'Poll closed successfully.',
    POLL_CLOSED_FAILED = 'Failed to close poll.',
    POLL_RESULTS_FETCHED_SUCCESS = 'Poll results fetched successfully.',
    POLL_RESULTS_FETCHED_FAILED = 'Failed to fetch poll results.',

    // User Invitations
    USER_INVITED_SUCCESS = 'User invited to group successfully.',
    USER_INVITED_FAILED = 'Failed to invite user to group.',
    USER_REQUESTS_FETCHED_SUCCESS = 'User join requests fetched successfully.',
    USER_REQUESTS_FETCHED_FAILED = 'Failed to fetch user join requests.',

    // General Errors
    INVALID_REQUEST = 'Invalid request.',
    SERVER_ERROR = 'Internal server error.',
    UNAUTHORIZED = 'Unauthorized action.',
    FORBIDDEN = 'Forbidden action.',
}


export enum chatMessages {
  CANNOT_CHAT_SELF = 'Cannot create chat with yourself.',
  MEMBER_ALREADY_EXISTS = 'Member already exists in the chat.',
  SELF_CHAT_ERROR = 'Cannot create chat with yourself.',
    CREATED_SUCCESS = 'Chat created successfully.',
    CREATE_FAILED = 'Failed to create chat.',
    FETCH_SUCCESS = 'Chat fetched successfully.',
    FETCH_NOT_FOUND = 'Chat not found in the database.',
    DELETE_SUCCESS = 'Chat deleted successfully.',
    DELETE_FAILED = 'Failed to delete chat.',
    DELETE_NOT_FOUND = 'Chat to delete not found.',

    MEMBER_ADDED_SUCCESS = 'Member added to chat successfully.',
    MEMBER_ADDED_FAILED = 'Failed to add member to chat.',
    MEMBER_REMOVED_SUCCESS = 'Member removed from chat successfully.',
    MEMBER_REMOVED_FAILED = 'Failed to remove member from chat.',

    INVALID_REQUEST = 'Invalid request for chat.',
    SERVER_ERROR = 'Internal server error while handling chat.',
}

export enum Reaction {
  REACTION_ADDED = 'Reaction added successfully.',
  REACTION_REMOVED = 'Reaction removed successfully.',
  REACTION_UPDATED = 'Reaction updated successfully.',
  REACTIONS_FETCHED = 'Reactions fetched successfully.',
  REACTION_NOT_FOUND = 'Reaction not found.',
  INVALID_REQUEST = 'Invalid request for reactions.',
  SERVER_ERROR = 'Internal server error while handling reactions.',
}