import { Schema, model } from 'mongoose';
import { IRevelatorSettings } from './revelator.settings.interface';

// Singleton document — always upserted against a fixed id, never queried by
// filter. One shared Revelator login for the whole platform (confirmed with
// the client: not per-user).
export const REVELATOR_SETTINGS_SINGLETON_ID = 'revelator-settings';

const revelatorSettingsSchema = new Schema<IRevelatorSettings>(
  {
    _id: { type: String, default: REVELATOR_SETTINGS_SINGLETON_ID },
    username: { type: String, required: true },
    passwordEncrypted: { type: String, required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'Admin' },
    updatedAt: { type: Date, default: Date.now },
  } as any,
);

export const RevelatorSettings = model<IRevelatorSettings>(
  'RevelatorSettings',
  revelatorSettingsSchema,
);
