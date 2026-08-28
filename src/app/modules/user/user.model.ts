import { Schema, model } from 'mongoose';
import { IUser, UserModel } from './user.interface';
import bcrypt from 'bcrypt';
import config from '../../../config';

const UserSchema = new Schema<IUser, UserModel>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    name: {
      type: String,
    },
    clientId: {
      type: String,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    phoneNumber: {
      type: String,
      sparse: true,
      unique: true,
    },
    nidNumber: {
      type: String,
      sparse: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      select: 0,
    },
    revenueRate: {
      type: String,
      default: '70',
    },
    // Only meaningful when role === 'sub-user': the % of THIS sub-user's own
    // revenue share their master takes as a cut. Set by the master via the
    // Permission modal. '0' (default) means no cut at all — a sub-user's
    // full share is untouched until their master explicitly sets this.
    masterShareRate: {
      type: String,
      default: '0',
    },
    address: {
      type: String,
      // required: true,
    },
    role: {
      type: String,
      enum: ['admin', 'super-admin', 'user', 'sub-user'],
      default: 'user',
    },
    image: {
      type: String,
      // required: true,
    },
    signature: {
      type: String,
      // required: true,
    },
    nidFront: {
      type: String,
      // required: true,
    },
    nidBack: {
      type: String,
      // required: true,
    },
    country: {
      type: String,
      // required: true,
    },
    state: {
      type: String,
      // required: true,
    },
    city: {
      type: String,
      // required: true,
    },
    postCode: {
      type: String,
      // required: true,
    },
    channelName: {
      type: String,
      // required: true,
    },
    channelUrl: {
      type: String,
      // required: true,
    },
    currentDistributor: {
      type: String,
      // required: true,
    },
    howHereUs: {
      type: String,
      // required: true,
    },
    subscribeCount: {
      type: Number,
      // required: true,
    },
    videosCount: {
      type: Number,
      // required: true,
    },
    copyrightNoticeImage: {
      type: String,
      // required: true,
    },
    dashboardScreenShot: {
      type: String,
      // required: true,
    },
    balance: {
      type: Number,
      default: 0,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isBlock: {
      type: Boolean,
      default: false,
    },
    accountStatus: {
      type: String,
      default: 'un-lock',
      enum: ['lock', 'un-lock', 'terminate'],
    },

    note: [],
    permission: [],
    assignedLabels: [{ type: Schema.Types.ObjectId, ref: 'Label' }],
    assignedArtists: [{ type: Schema.Types.ObjectId, ref: 'PrimaryArtist' }],
    assignedChannels: [{ type: Schema.Types.ObjectId, ref: 'Channel' }],
    isApproved: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    twoFactor: {
      enabled: { type: Boolean, default: false },
      secret: { type: String, select: 0 },
      backupCodes: { type: [String], select: 0, default: [] },
    },
  },

  {
    timestamps: true,
  },
);

// Create a unique index for phoneNumber field
// Check if User exists
UserSchema.statics.isUserExist = async function (
  email: string,
): Promise<Pick<IUser, '_id' | 'password' | 'phoneNumber' | 'role'> | null> {
  return await User.findOne(
    { email },
    {
      _id: 1,
      email: 1,
      password: 1,
      role: 1,
      phoneNumber: 1,
    },
  );
};

// Check password match
UserSchema.statics.isPasswordMatched = async function (
  givenPassword: string,
  savedPassword: string,
): Promise<boolean> {
  return await bcrypt.compare(givenPassword, savedPassword);
};

// Hash the password
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  this.password = await bcrypt.hash(
    this.password,
    Number(config.bcrypt_salt_rounds),
  );
  next();
});

// Statics
const User = model<IUser, UserModel>('User', UserSchema);

export default User;
