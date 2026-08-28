import { Schema, model, Types } from 'mongoose';

export type IAttachment = {
  url: string;
  name: string;
  type: string;
  size?: number;
};

const attachmentSchema = new Schema<IAttachment>(
  {
    url: { type: String, required: true },
    name: { type: String, required: true },
    type: { type: String, required: true },
    size: { type: Number },
  },
  { _id: false },
);

export type IChatConversation = {
  user: Types.ObjectId;
  lastMessage: string;
  lastMessageAt: Date;
  unreadByUser: number;
  unreadByAdmin: number;
};

// One support thread per user (user <-> admin pool). No per-admin fan-out:
// any admin sees and can reply in the same thread, like an Intercom inbox.
const conversationSchema = new Schema<IChatConversation>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    lastMessage: { type: String, default: '' },
    lastMessageAt: { type: Date, default: Date.now },
    unreadByUser: { type: Number, default: 0 },
    unreadByAdmin: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export type IChatMessage = {
  conversation: Types.ObjectId;
  senderId: Types.ObjectId;
  senderRole: 'user' | 'admin';
  text: string;
  attachments: IAttachment[];
};

const messageSchema = new Schema<IChatMessage>(
  {
    conversation: {
      type: Schema.Types.ObjectId,
      ref: 'ChatConversation',
      required: true,
      index: true,
    },
    senderId: { type: Schema.Types.ObjectId, required: true },
    senderRole: { type: String, enum: ['user', 'admin'], required: true },
    text: { type: String, default: '' },
    attachments: { type: [attachmentSchema], default: [] },
  },
  { timestamps: true },
);

messageSchema.index({ conversation: 1, createdAt: 1 });

export const ChatConversation = model<IChatConversation>(
  'ChatConversation',
  conversationSchema,
);
export const ChatMessage = model<IChatMessage>('ChatMessage', messageSchema);
