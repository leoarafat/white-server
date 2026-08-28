/* eslint-disable @typescript-eslint/ban-ts-comment */
export const createError = (status: any, message: any) => {
  const err = new Error();
  //@ts-ignore
  err.status = status;
  err.message = message;
  return err;
};
