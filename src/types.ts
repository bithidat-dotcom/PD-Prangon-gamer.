export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  bio?: string;
  createdAt: any;
}

export interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorPhoto: string;
  content: string;
  mediaUrl?: string;
  likesCount: number;
  commentsCount: number;
  createdAt: any;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  type: 'text' | 'voice' | 'image';
  createdAt: any;
}

export interface Chat {
  id: string;
  participants: string[];
  lastMessage?: string;
  updatedAt: any;
  name?: string; // For groups
  isGroup?: boolean;
}

export interface CallState {
  isCalling: boolean;
  incoming: boolean;
  active: boolean;
  remoteUid?: string;
  type?: 'video' | 'voice';
  stream?: MediaStream;
}
