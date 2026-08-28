import httpStatus from 'http-status';
import ApiError from '../../../errors/ApiError';
import axios from 'axios';
import fs from 'fs';
export const downloadImage = async (url: string, filepath: string) => {
  try {
    const response = await axios({
      url,
      method: 'GET',
      responseType: 'stream',
    });
    return new Promise((resolve, reject) => {
      const writer = fs.createWriteStream(filepath);
      response.data.pipe(writer);
      let error: Error | null = null;
      writer.on('error', err => {
        error = err;
        writer.close();
        reject(err);
      });
      writer.on('close', () => {
        if (!error) {
          resolve(true);
        }
      });
    });
  } catch (error: any) {
    console.error(`Failed to download image from ${url}: ${error.message}`);
    throw new ApiError(
      httpStatus.NOT_FOUND,
      `Failed to download image from ${url}`,
    );
  }
};
