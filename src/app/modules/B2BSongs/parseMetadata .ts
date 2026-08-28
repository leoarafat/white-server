import { Request, Response, NextFunction } from 'express';

const isJsonString = (s: string) => {
  try {
    JSON.parse(s);
    return true;
  } catch {
    return false;
  }
};

export const parseMetadata = (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  // multipart/form-data হলে multer already req.body বানায় (সব text fields string হয়)
  // যদি 'metadata' ফিল্ড পাঠাও (stringified JSON), সেটা body তে মিশিয়ে দিই
  const meta = (req.body?.metadata ?? '') as string;
  if (meta && typeof meta === 'string' && isJsonString(meta)) {
    const parsed = JSON.parse(meta);
    req.body = { ...parsed, ...req.body }; // parsed আগে, যাতে সাধারণ fields override করতে পারে
    delete req.body.metadata;
  }
  next();
};
