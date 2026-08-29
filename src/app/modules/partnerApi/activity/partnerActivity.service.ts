import { PartnerActivityLog } from './partnerActivity.model';

type ListActivityQuery = {
  userId?: string;
  keyId?: string;
  environment?: 'live' | 'test';
  page?: number;
  limit?: number;
};

export const listPartnerActivity = async (query: ListActivityQuery) => {
  const filter: Record<string, unknown> = {};
  if (query.userId) filter.user = query.userId;
  if (query.keyId) filter.partnerKey = query.keyId;
  if (query.environment) filter.environment = query.environment;

  const page = query.page || 1;
  const limit = query.limit || 50;

  const [items, total] = await Promise.all([
    PartnerActivityLog.find(filter)
      .populate('partnerKey', 'keyPrefix label environment') // prefix only — never the key itself.
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    PartnerActivityLog.countDocuments(filter),
  ]);

  return { logs: items, page, limit, total };
};
