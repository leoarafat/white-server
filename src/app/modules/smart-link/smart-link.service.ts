import { JwtPayload } from 'jsonwebtoken';
import QueryBuilder from '../../../builder/QueryBuilder';
import ApiError from '../../../errors/ApiError';
import httpStatus from 'http-status';
import { SingleTrack } from '../single-track/single.model';
import User from '../user/user.model';
import { SmartLink, SmartLinkClick } from './smart-link.model';
import { IDspLink } from './smart-link.interface';
import { isWhitelistedDspUrl } from './smart-link.validations';

// A user (or sub-user) may only ever create/see their own links; admin roles
// can act on any artist's — same scoping convention as catalog-video.service.
const isUserScoped = (user?: JwtPayload | null): boolean =>
  user?.role === 'user' || user?.role === 'sub-user';

const slugify = (title: string) =>
  title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 60);

const randomSuffix = () => Math.random().toString(36).slice(2, 7);

const generateUniqueSlug = async (title: string, requestedSlug?: string) => {
  const base = requestedSlug ? slugify(requestedSlug) : slugify(title);
  const safeBase = base || 'track';

  let slug = safeBase;
  // A handful of tries is enough — collisions on a random 5-char suffix are
  // vanishingly rare, this just guards against the unlucky case.
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const exists = await SmartLink.exists({ slug });
    if (!exists) return slug;
    slug = `${safeBase}-${randomSuffix()}`;
  }
  throw new ApiError(httpStatus.CONFLICT, 'Could not generate a unique slug, please set one manually');
};

const assertOwnedApprovedSingle = async (singleId: string, userId: unknown) => {
  const single = await SingleTrack.findOne({
    _id: singleId,
    user: userId,
    isApproved: 'approved',
    isCorrection: false,
  }).lean();

  if (!single) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'This release is not one of your live singles',
    );
  }
  return single;
};

const createSmartLink = async (
  reqUser: JwtPayload,
  payload: { single: string; slug?: string; dspLinks: IDspLink[]; userId?: string },
) => {
  const scoped = isUserScoped(reqUser);
  const ownerId = scoped ? reqUser.userId : payload.userId;

  if (!ownerId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'userId is required');
  }

  const single = scoped
    ? await assertOwnedApprovedSingle(payload.single, ownerId)
    : await SingleTrack.findOne({
        _id: payload.single,
        user: ownerId,
        isApproved: 'approved',
        isCorrection: false,
      }).lean();

  if (!single) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Release not found or not live yet');
  }

  const alreadyLinked = await SmartLink.exists({ single: payload.single });
  if (alreadyLinked) {
    throw new ApiError(httpStatus.CONFLICT, 'This release already has a Smart Link');
  }

  const title = (single as any).releaseTitle || (single as any).title || 'Untitled';
  const slug = await generateUniqueSlug(title, payload.slug);

  try {
    return await SmartLink.create({
      slug,
      user: ownerId,
      single: payload.single,
      title,
      artworkUrl: (single as any).image,
      dspLinks: payload.dspLinks,
      createdBy: scoped ? 'user' : 'admin',
    });
  } catch (error: any) {
    if (error?.code === 11000) {
      throw new ApiError(httpStatus.CONFLICT, 'That slug is already taken, please choose another');
    }
    throw error;
  }
};

const getMyEligibleReleases = async (userId: unknown, search?: string) => {
  const linkedSingleIds = await SmartLink.distinct('single');

  const query: Record<string, unknown> = {
    user: userId,
    isApproved: 'approved',
    isCorrection: false,
    _id: { $nin: linkedSingleIds },
  };
  if (search) {
    query.releaseTitle = { $regex: search, $options: 'i' };
  }

  return SingleTrack.find(query)
    .select('_id releaseTitle title image isrc')
    .sort('-createdAt')
    .limit(50)
    .lean();
};

const getAdminEligibleReleases = async (search?: string) => {
  const linkedSingleIds = await SmartLink.distinct('single');

  const query: Record<string, unknown> = {
    isApproved: 'approved',
    isCorrection: false,
    _id: { $nin: linkedSingleIds },
  };
  if (search) {
    query.releaseTitle = { $regex: search, $options: 'i' };
  }

  return SingleTrack.find(query)
    .select('_id releaseTitle title image isrc user')
    .populate('user', 'name email')
    .sort('-createdAt')
    .limit(50)
    .lean();
};

const getMyLinks = async (reqUser: JwtPayload, query: Record<string, unknown>) => {
  const smartLinkQuery = new QueryBuilder(
    SmartLink.find({ user: reqUser.userId }).lean(),
    query,
  )
    .search(['title', 'slug'])
    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await smartLinkQuery.modelQuery;
  const meta = await smartLinkQuery.countTotal();
  return { meta, data: result };
};

const getAllLinks = async (query: Record<string, unknown>) => {
  const term = ((query?.searchTerm as string) || '').trim();
  const extraOr: any[] = [];

  if (term) {
    const users = await User.find({
      $or: [
        { name: { $regex: term, $options: 'i' } },
        { email: { $regex: term, $options: 'i' } },
      ],
    })
      .select('_id')
      .lean();
    if (users.length) {
      extraOr.push({ user: { $in: users.map(u => u._id) } });
    }
  }

  const smartLinkQuery = new QueryBuilder(
    SmartLink.find().populate('user', 'name email').lean(),
    query,
  )
    .search(['title', 'slug'], extraOr)
    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await smartLinkQuery.modelQuery;
  const meta = await smartLinkQuery.countTotal();
  return { meta, data: result };
};

const assertAccess = async (id: string, reqUser: JwtPayload) => {
  const link = await SmartLink.findById(id);
  if (!link) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Smart Link not found');
  }
  if (isUserScoped(reqUser) && String(link.user) !== String(reqUser.userId)) {
    throw new ApiError(httpStatus.FORBIDDEN, 'You do not have access to this Smart Link');
  }
  return link;
};

const getSingleLink = async (id: string, reqUser: JwtPayload) => {
  return assertAccess(id, reqUser);
};

const updateLink = async (
  id: string,
  reqUser: JwtPayload,
  payload: { dspLinks?: IDspLink[]; status?: 'active' | 'disabled' },
) => {
  await assertAccess(id, reqUser);

  if (payload.dspLinks) {
    const invalid = payload.dspLinks.find(
      link => !isWhitelistedDspUrl(link.platform, link.url),
    );
    if (invalid) {
      throw new ApiError(httpStatus.BAD_REQUEST, `Invalid ${invalid.platform} URL`);
    }
  }

  return SmartLink.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });
};

const deleteLink = async (id: string, reqUser: JwtPayload) => {
  await assertAccess(id, reqUser);
  await SmartLinkClick.deleteMany({ smartLink: id });
  return SmartLink.findByIdAndDelete(id);
};

const getPublicLinkBySlug = async (slug: string) => {
  return SmartLink.findOne({ slug: slug.toLowerCase(), status: 'active' }).lean();
};

const registerClick = async (
  slug: string,
  platform: string,
  meta: { userAgent?: string; referrer?: string },
) => {
  const link = await SmartLink.findOne({ slug: slug.toLowerCase(), status: 'active' });
  if (!link) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Link not found');
  }

  const dspLink = link.dspLinks.find(d => d.platform === platform);
  if (!dspLink) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Platform not available for this link');
  }

  const device = /mobile/i.test(meta.userAgent || '') ? 'mobile' : 'desktop';

  await Promise.all([
    SmartLink.updateOne({ _id: link._id }, { $inc: { totalClicks: 1 } }),
    SmartLinkClick.create({
      smartLink: link._id,
      platform,
      device,
      referrer: meta.referrer,
    }),
  ]);

  return dspLink.url;
};

const getStats = async (id: string, reqUser: JwtPayload) => {
  const link = await assertAccess(id, reqUser);

  const byPlatform = await SmartLinkClick.aggregate([
    { $match: { smartLink: link._id } },
    { $group: { _id: '$platform', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  return {
    totalClicks: link.totalClicks,
    byPlatform: byPlatform.map(row => ({ platform: row._id, count: row.count })),
  };
};

export const smartLinkService = {
  createSmartLink,
  getMyEligibleReleases,
  getAdminEligibleReleases,
  getMyLinks,
  getAllLinks,
  getSingleLink,
  updateLink,
  deleteLink,
  getPublicLinkBySlug,
  registerClick,
  getStats,
};
