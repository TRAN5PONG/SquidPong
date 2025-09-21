

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



export enum GroupMessages {
    // Group CRUD
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
    MEMBERS_LISTED_SUCCESS = 'Group members listed successfully.',
    MEMBERS_LISTED_FAILED = 'Failed to list group members.',
    MEMBER_ADDED_SUCCESS = 'Member added successfully.',
    MEMBER_ADDED_FAILED = 'Failed to add member.',
    MEMBER_REMOVED_SUCCESS = 'Member removed successfully.',
    MEMBER_REMOVED_FAILED = 'Failed to remove member.',

    // Roles
    ROLE_UPDATED_SUCCESS = 'Group role updated successfully.',
    ROLE_UPDATED_FAILED = 'Failed to update group role.',
    ROLE_ASSIGNED_SUCCESS = 'Role assigned successfully.',
    ROLE_ASSIGNED_FAILED = 'Failed to assign role.',
    ROLE_REMOVED_SUCCESS = 'Role removed successfully.',
    ROLE_REMOVED_FAILED = 'Failed to remove role.',
    

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

    // General Errors
    INVALID_REQUEST = 'Invalid request.',
    SERVER_ERROR = 'Internal server error.',
    UNAUTHORIZED = 'Unauthorized action.',
    FORBIDDEN = 'Forbidden action.',
}
