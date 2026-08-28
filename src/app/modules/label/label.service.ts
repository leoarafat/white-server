/* eslint-disable @typescript-eslint/ban-ts-comment */
import { JwtPayload } from 'jsonwebtoken';
import QueryBuilder from '../../../builder/QueryBuilder';
import ApiError from '../../../errors/ApiError';
import { generateLabelId } from '../../../utils/uniqueId';
import { ILabel } from './label.interface';
import { Label } from './label.model';
import { Request } from 'express';
import sendEmail from '../../../utils/sendEmail';
import { labelApproveEmailBody } from './label.mail';
import CustomQueryBuilder from '../../../builder/CustomQueryBuilder';
import User from '../user/user.model';
import { Types } from 'mongoose';
import { notifyAdminsOfSubmission } from '../notifications/notification.hooks';
import { OwnerContext } from '../../../shared/subUserAccess';

const addLabel = async (owner: OwnerContext, payload: ILabel) => {
  payload.labelId = generateLabelId();
  // A sub-user with permission creates the label directly in the master's
  // catalog (owner.ownerId is already resolved to the master when the
  // caller is a sub-user) — it is NOT a private entity of the sub-user.
  const result = await Label.create({ ...payload, user: owner.ownerId });

  // Newly-created-by-sub-user labels are immediately usable by that same
  // sub-user (they made it for their own upload), without waiting for a
  // separate assignment step from the master.
  if (owner.isSubUser) {
    await User.updateOne(
      { user: owner.ownerId, assignedLabels: { $ne: result._id } },
      { $push: { assignedLabels: result._id } },
    );
  }

  notifyAdminsOfSubmission({
    entityType: 'label',
    entityId: result._id.toString(),
    entityName: result.labelName,
  }).catch(() => undefined);

  return result;
};

// Scopes a label listing to the effective owner's catalog, additionally
// intersecting with the caller's assigned-label list when it's a sub-user.
const ownedLabelFilter = (owner: OwnerContext, extra: Record<string, unknown> = {}) => {
  const filter: Record<string, unknown> = { user: owner.ownerId, ...extra };
  if (owner.isSubUser) {
    filter._id = { $in: owner.assignedLabels };
  }
  return filter;
};

const getMyLabel = async (owner: OwnerContext, query: Record<string, unknown>) => {
  const labelQuery = new QueryBuilder(
    Label.find(ownedLabelFilter(owner)).lean(),
    query,
  )
    .search(['labelName'])
    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await labelQuery.modelQuery;
  const meta = await labelQuery.countTotal();
  return {
    meta,
    data: result,
  };
};
const getMyApprovedLabel = async (
  owner: OwnerContext,
  query: Record<string, unknown>,
) => {
  const labelQuery = new CustomQueryBuilder(
    Label.find(ownedLabelFilter(owner)).lean(),
    query,
  )
    .search(['labelName'])
    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await labelQuery.modelQuery;
  const meta = await labelQuery.countTotal();
  return {
    meta,
    data: result,
  };
};
const getMyLabelById = async (req: Request) => {
  const { id } = req.params;
  return await Label.findById(id);
};
const getMyPendingLabel = async (
  owner: OwnerContext,
  query: Record<string, unknown>,
) => {
  const labelQuery = new QueryBuilder(
    Label.find(ownedLabelFilter(owner, { approvedStatus: 'pending' })).lean(),
    query,
  )
    .search(['labelName'])
    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await labelQuery.modelQuery;
  const meta = await labelQuery.countTotal();
  return {
    meta,
    data: result,
  };
};
// This will be use for update, approve and reject
const updateLabel = async (id: string, payload: any) => {
  const checkIsExist = await Label.findById(id).populate('user');
  if (!checkIsExist) {
    throw new ApiError(404, 'Label not found');
  }
  const { ...LabelData } = payload;

  const result = await Label.findOneAndUpdate({ _id: id }, LabelData, {
    new: true,
    runValidators: true,
  });
  if (LabelData.approvedStatus === 'approved' && result) {
    try {
      sendEmail({
        //@ts-ignore
        email: checkIsExist?.user?.email,
        subject: ' Congratulations! Your Label Has Been Approved',
        html: labelApproveEmailBody(checkIsExist),
      });
    } catch (error: any) {
      throw new ApiError(500, `${error.message}`);
    }
  }
  return result;
};
const updateMyLabel = async (id: string, owner: OwnerContext, payload: any) => {
  const checkIsExist = await Label.findById(id);
  if (!checkIsExist) {
    throw new ApiError(404, 'Label not found');
  }
  // Ownership check: previously anyone with a valid user/sub-user session
  // could edit ANY label by id, regardless of who owns it.
  if (String(checkIsExist.user) !== owner.ownerId) {
    throw new ApiError(403, 'You cannot edit this label');
  }
  const { ...LabelData } = payload;
  return await Label.findOneAndUpdate({ _id: id }, LabelData, {
    new: true,
    runValidators: true,
  });
};
const getPendingLabel = async (query: Record<string, unknown>) => {
  const searchTerm = query?.searchTerm as string;
  let matchedUserIds: Types.ObjectId[] = [];

  if (searchTerm) {
    const matchedUsers = await User.find({
      $or: [
        { email: { $regex: searchTerm, $options: 'i' } },
        { name: { $regex: searchTerm, $options: 'i' } },
      ],
    }).select('_id');

    matchedUserIds = matchedUsers.map(u => u._id as unknown as Types.ObjectId);
  }
  const labelQuery = new QueryBuilder(
    Label.find({ approvedStatus: 'pending' }).lean(),
    query,
  )
    .search(
      ['labelName', 'labelId'],
      matchedUserIds.length > 0 ? [{ user: { $in: matchedUserIds } }] : [],
    )
    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await labelQuery.modelQuery;
  const meta = await labelQuery.countTotal();
  return {
    meta,
    data: result,
  };
};
const getApprovedLabel = async (query: Record<string, unknown>) => {
  const searchTerm = query?.searchTerm as string;
  let matchedUserIds: Types.ObjectId[] = [];

  if (searchTerm) {
    const matchedUsers = await User.find({
      $or: [
        { email: { $regex: searchTerm, $options: 'i' } },
        { name: { $regex: searchTerm, $options: 'i' } },
      ],
    }).select('_id');

    matchedUserIds = matchedUsers.map(u => u._id as unknown as Types.ObjectId);
  }
  const labelQuery = new QueryBuilder(Label.find({}).lean(), query)
    .search(
      ['labelName', 'labelId'],
      matchedUserIds.length > 0 ? [{ user: { $in: matchedUserIds } }] : [],
    )
    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await labelQuery.modelQuery;
  const meta = await labelQuery.countTotal();
  return {
    meta,
    data: result,
  };
};
const getRejectedLabel = async (query: Record<string, unknown>) => {
  const searchTerm = query?.searchTerm as string;
  let matchedUserIds: Types.ObjectId[] = [];

  if (searchTerm) {
    const matchedUsers = await User.find({
      $or: [
        { email: { $regex: searchTerm, $options: 'i' } },
        { name: { $regex: searchTerm, $options: 'i' } },
      ],
    }).select('_id');

    matchedUserIds = matchedUsers.map(u => u._id as unknown as Types.ObjectId);
  }
  const labelQuery = new QueryBuilder(
    Label.find({ approvedStatus: 'rejected' }).lean(),
    query,
  )
    .search(
      ['labelName', 'labelId'],
      matchedUserIds.length > 0 ? [{ user: { $in: matchedUserIds } }] : [],
    )
    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await labelQuery.modelQuery;
  const meta = await labelQuery.countTotal();
  return {
    meta,
    data: result,
  };
};
// Admin: every label regardless of status, with owner details, searchable and
// optionally filtered by ?status=pending|approved|rejected.
const getAllLabels = async (query: Record<string, unknown>) => {
  const searchTerm = query?.searchTerm as string;
  const status = query?.status as string;
  let matchedUserIds: Types.ObjectId[] = [];

  if (searchTerm) {
    const matchedUsers = await User.find({
      $or: [
        { email: { $regex: searchTerm, $options: 'i' } },
        { name: { $regex: searchTerm, $options: 'i' } },
      ],
    }).select('_id');
    matchedUserIds = matchedUsers.map(u => u._id as unknown as Types.ObjectId);
  }

  const baseFilter: Record<string, unknown> = {};
  if (status && ['pending', 'approved', 'rejected'].includes(status)) {
    baseFilter.approvedStatus = status;
  }

  // Strip `status` so QueryBuilder.filter() doesn't try to match a non-existent
  // `status` field on the Label model (the real field is `approvedStatus`).
  const { status: _ignoredStatus, ...restQuery } = query;

  const labelQuery = new QueryBuilder(
    Label.find(baseFilter).populate('user', 'name email clientId image').lean(),
    restQuery,
  )
    .search(
      ['labelName', 'labelId'],
      matchedUserIds.length > 0 ? [{ user: { $in: matchedUserIds } }] : [],
    )
    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await labelQuery.modelQuery;
  const meta = await labelQuery.countTotal();
  return { meta, data: result };
};
const deleteLabel = async (
  id: string,
  owner: OwnerContext | null, // null = admin/super-admin, who may delete any label
) => {
  const isExist = await Label.findById(id);
  if (!isExist) {
    throw new ApiError(404, 'Label not found');
  }
  if (owner && String(isExist.user) !== owner.ownerId) {
    throw new ApiError(403, 'You cannot delete this label');
  }
  return await Label.findByIdAndDelete(id);
};
const labelByUserId = async (id: string) => {
  return await Label.find({ user: id });
};
export const LabelService = {
  addLabel,
  updateLabel,
  updateMyLabel,
  getMyLabel,
  getPendingLabel,
  getApprovedLabel,
  getRejectedLabel,
  getMyPendingLabel,
  getAllLabels,
  deleteLabel,
  getMyLabelById,
  getMyApprovedLabel,
  labelByUserId,
};
