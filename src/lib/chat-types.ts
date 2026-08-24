/**
 * Client-safe types for the chat UI (/messages) backed by
 * /api/messages/conversations and /api/conversations/:id/messages.
 */

export type MeInfo = {
  id: string
  name?: string | null
  username?: string | null
  avatarUrl?: string | null
}

export type ChatConversation = {
  id: string
  title: string
  subtitle?: string | null
  avatarUrl?: string | null
  otherUserId?: string | null
  lastMessage?: string | null
  lastMessageAt?: string | null
  unreadCount: number
}

export type ChatMessageDoc = {
  id: string
  sender: string | { id: string; name?: string | null }
  content: string
  readAt?: string | null
  createdAt: string
}

/** A message as held in client state — includes optimistic-send flags. */
export type ChatMessage = ChatMessageDoc & {
  pending?: boolean
}

export function senderId(message: ChatMessage): string {
  return typeof message.sender === 'object' && message.sender
    ? String(message.sender.id)
    : String(message.sender)
}
