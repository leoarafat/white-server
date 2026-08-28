// controllers/admin/balanceSync.controller.ts
import { Request, Response } from 'express';
import { syncAllUsersBalance } from './balanceSync.service';
import { UserBalance } from './UserBalance.model';

export const triggerBalanceSync = async (req: Request, res: Response) => {
  try {
    const result = await syncAllUsersBalance();
    return res.status(200).json({
      success: true,
      message: 'Balance sync completed',
      data: result,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllUsersBalance = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;

    const query: any = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const [balances, total] = await Promise.all([
      UserBalance.find(query)
        .sort({ balance: -1 })
        .skip((+page - 1) * +limit)
        .limit(+limit)
        .lean(),
      UserBalance.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      data: balances,
      pagination: { total, page: +page, limit: +limit },
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
