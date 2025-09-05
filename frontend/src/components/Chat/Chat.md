
## Chat API Documentation

## Get Conversations
***  GET /api/conversations?userId={userId}&limit=20&offset=0
		-- limit - max dyal conversations li ghatreturny

*** expected response :

{
  conversations: [
    {
      id: "conv_123",
      participants: [
        { id: "user_1", name: "John Doe", avatar: "url", lastSeen: "2024-01-15T10:30:00Z" },
        { id: "user_2", name: "Jane Smith", avatar: "url", lastSeen: "2024-01-15T11:00:00Z" }
      ],
      lastMessage: {
        id: "msg_456",
        content: "Hey, how are you?",
        userId: "user_1",
        timestamp: "2024-01-15T10:30:00Z",
        type: "text"
      },
      unreadCount: 3,
      updatedAt: "2024-01-15T10:30:00Z"
    }
  ],
  totalCount: 25,
  hasMore: true
}
     --- converstaions - array dyal conversations li kaynin f database
	 					--- kola conversation kayn fiha id, participants, lastMessage, unreadCount, updatedAt
	 --- totalCount - total dyal conversations li kaynin f database
	 --- hasMore - wach kaynin mazal conversations li ma t fetchawch

## Get Conversation by ID
*** GET /api/conversations/{conversationId}/messages?cursor={cursor}&limit=20
		-- cursor - id dyal message li ghadi nbdaw mnha l fetch
		-- limit - max dyal messages li ghatreturny

*** expected response :
{
  messages: [
    {
      id: "msg_789",
      content: "Hello there!",
      userId: "user_1",
      user: {
        id: "user_1",
        name: "John Doe",
        avatar: "avatar_url"
      },
      timestamp: "2024-01-15T10:30:00Z",
      type: "text",
      status: "read",
      attachments: [],
      replyTo?: "msg_456" // hadi ila message kan reply 3la chi message akhor
    }
  ],
  nextCursor: "msg_cursor_xyz", // id dyal message li ghadi nbdaw mnha l fetch f l request jaya
  hasMore: true 
}

### Send Message
*** POST /api/conversations/{conversationId}/messages
{
  content: "Hello world!",
  type: "text", // "text" | "invite",
  replyTo?: "msg_123" // for replies
}


### Start New Conversation
*** POST /api/conversations
{
  participantIds: ["user_2", "user_3"], 
  initialMessage?: { // li ghay9ad conversation, khasso darori yssift message
    content: "Hey everyone!",
    type: "text"
  }
}

### Real-time Updates (WebSocket)
*** ws://localhost:3000/ws?userId={userId}&token={jwt_token}
		-- token - JWT token dyal user li kaybghy y connecta
// Incoming message
{
  type: "new_message",
  data: {
    conversationId: "conv_123",
    message: { /* message object */ }
  }
}

// Message status update
{
  type: "message_status",
  data: {
    messageId: "msg_123",
    status: "delivered" | "read"
  }
}

// User typing indicator
{
  type: "typing",
  data: {
    conversationId: "conv_123",
    userId: "user_2",
    isTyping: true
  }
}

