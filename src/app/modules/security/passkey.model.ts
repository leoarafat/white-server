import { Schema, model, Model, Types } from 'mongoose';

export type IPasskey = {
  _id?: string;
  subjectId: Types.ObjectId;
  subjectType: 'user' | 'admin';
  credentialId: string; // base64url
  publicKey: string; // base64url of the credential public key
  counter: number;
  transports?: string[];
  deviceLabel?: string;
  createdAt?: Date;
  updatedAt?: Date;
};

const PasskeySchema = new Schema<IPasskey>(
  {
    subjectId: { type: Schema.Types.ObjectId, required: true, index: true },
    subjectType: { type: String, enum: ['user', 'admin'], required: true },
    credentialId: { type: String, required: true, unique: true, index: true },
    publicKey: { type: String, required: true },
    counter: { type: Number, default: 0 },
    transports: { type: [String], default: [] },
    deviceLabel: { type: String },
  },
  { timestamps: true },
);

const Passkey: Model<IPasskey> = model<IPasskey>('Passkey', PasskeySchema);

export default Passkey;
