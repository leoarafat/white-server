import CustomQueryBuilder from '../../../builder/CustomQueryBuilder';

import ApiError from '../../../errors/ApiError';
import { generateArtistId } from '../../../utils/uniqueId';
import { IPrimaryArtist } from './primary-artist.interface';
import { PrimaryArtist } from './primary-artist.model';
import { OwnerContext } from '../../../shared/subUserAccess';
import User from '../user/user.model';

const addPrimaryArtist = async (owner: OwnerContext, payload: IPrimaryArtist) => {
  payload.primaryArtistId = generateArtistId();
  // Created directly in the master's catalog (see label.service.ts addLabel
  // for the same reasoning) — never a private entity of the sub-user.
  const result = await PrimaryArtist.create({ ...payload, user: owner.ownerId });

  if (owner.isSubUser) {
    await User.updateOne(
      { user: owner.ownerId, assignedArtists: { $ne: result._id } },
      { $push: { assignedArtists: result._id } },
    );
  }

  return result;
};
const updatePrimaryArtist = async (
  id: string,
  owner: OwnerContext,
  payload: any,
) => {
  const checkIsExist = await PrimaryArtist.findById(id);
  if (!checkIsExist) {
    throw new ApiError(404, 'Artist not found');
  }
  if (String(checkIsExist.user) !== owner.ownerId) {
    throw new ApiError(403, 'You cannot edit this artist');
  }
  const { ...artistData } = payload;
  return await PrimaryArtist.findOneAndUpdate({ _id: id }, artistData, {
    new: true,
    runValidators: true,
  });
};
const getPrimaryArtist = async (
  owner: OwnerContext,
  query: Record<string, unknown>,
) => {
  const filter: Record<string, unknown> = { user: owner.ownerId };
  if (owner.isSubUser) {
    filter._id = { $in: owner.assignedArtists };
  }
  const artistQuery = new CustomQueryBuilder(
    PrimaryArtist.find(filter).lean(),
    query,
  )
    .search(['primaryArtistName'])
    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await artistQuery.modelQuery;
  const meta = await artistQuery.countTotal();
  return {
    meta,
    data: result,
  };
};
const deletePrimaryArtist = async (id: string, owner: OwnerContext) => {
  const isExist = await PrimaryArtist.findById(id);
  if (!isExist) {
    throw new ApiError(404, 'PrimaryArtist not found');
  }
  if (String(isExist.user) !== owner.ownerId) {
    throw new ApiError(403, 'You cannot delete this artist');
  }
  return await PrimaryArtist.findByIdAndDelete(id);
};
const getArtistsByIds = async (payload: { ids: string[] }) => {
  const { ids } = payload;

  const result = await PrimaryArtist.find({ _id: { $in: ids } });

  return result;
};
const getFeatureArtistsByIds = async (payload: { ids: string[] }) => {
  const { ids } = payload;

  const result = await PrimaryArtist.find({ _id: { $in: ids } });

  return result;
};
const artistByUserId = async (id: string) => {
  if (!id) {
    throw new ApiError(404, 'Id not sending');
  }
  return await PrimaryArtist.find({ user: id });
};
const allArtist = async () => {
  return await PrimaryArtist.find({});
};
export const PrimaryArtistService = {
  addPrimaryArtist,
  updatePrimaryArtist,
  getPrimaryArtist,
  deletePrimaryArtist,
  getArtistsByIds,
  getFeatureArtistsByIds,
  artistByUserId,
  allArtist,
};
