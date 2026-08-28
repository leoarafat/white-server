/* eslint-disable @typescript-eslint/ban-ts-comment */
import axios from 'axios';
import crypto from 'crypto';
import config from '../config';
import ApiError from '../errors/ApiError';
import { logger } from '../shared/logger';
import { ISingleTrack } from '../app/modules/single-track/single.interface';

//!
let accessToken = '';

export const authenticate = async () => {
  if (accessToken) return accessToken;

  try {
    const response = await axios.post(
      `${config.pdl.base_url}/user/system/signin`,
      {
        email: config.pdl.email,
        password: config.pdl.password,
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );

    const token = response?.data?.data?.data?.oauth2_token?.access_token;

    if (!token) throw new Error('Authentication failed: No token received');

    accessToken = token;
    return token;
  } catch (error: any) {
    logger.error('Authentication failed:', error.message);
    throw error;
  }
};

export const uploadMetadataAndFiles = async (
  metadata: any,
  singleTrack: any,
) => {
  const token = await authenticate();

  try {
    const response = await axios.post(
      `${config.pdl.base_url}/album/add/meta`,
      metadata,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json;charset=UTF-8',
          Accept: 'application/json, text/plain, */*',
          'sec-ch-ua':
            '"Not/A)Brand";v="8", "Chromium";v="126", "Google Chrome";v="126"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"Windows"',
          Referer: 'https://dashboard.ansbackstage.com',
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
        },
      },
    );

    if (response.data.success === false) {
      throw new Error(`${response.data.data.msg}`);
    }
    const signedAlbums =
      response.data?.data?.signed_albums || response.data?.signed_albums;

    if (!signedAlbums || signedAlbums.length === 0) {
      logger.error('No signed albums found in the response.');
      throw new Error('No signed albums found in the response.');
    }

    const mediaSignedUrl = signedAlbums[0]?.songs?.[0]?.media?.signed_url;

    const inlaySignedUrl = signedAlbums[0]?.inlay?.signed_url;

    if (!mediaSignedUrl || !inlaySignedUrl) {
      throw new Error('Missing signed URLs for media or inlay.');
    }

    const audioFileResponse = await axios.get(singleTrack.audio, {
      responseType: 'stream',
    });

    await axios.put(mediaSignedUrl, audioFileResponse.data, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': metadata.albums[0].songs[0].media.size,
      },
    });

    const coverArtResponse = await axios.get(singleTrack.image, {
      responseType: 'stream',
    });

    await axios.put(inlaySignedUrl, coverArtResponse.data, {
      headers: {
        'Content-Type': 'image/jpeg',
        'Content-Length': metadata.albums[0].inlay.size,
      },
    });

    return response?.data?.data?.token;
  } catch (error: any) {
    logger.error(
      'Error uploading metadata and files:',
      error.response?.data || error.message,
    );
    throw error;
  }
};

//!
export const verifyAndSubmitAlbum = async (
  albumToken: any,
  singleTrack: ISingleTrack,
) => {
  const accessToken = await authenticate();

  try {
    const verifyResponse = await axios.get(
      `${config.pdl.base_url}/album/verify/meta`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: { token: albumToken },
      },
    );

    if (verifyResponse.data.success === false) {
      throw new Error(
        `Album verification failed: ${verifyResponse.data.data.msg}`,
      );
    }
    const listAlbum = await axios.get(`${config.pdl.base_url}/album/list`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const payload = {
      id: listAlbum?.data?.data?.albums[0].id,
      platforms_to_release: singleTrack?.platform,
      allow_any_go_live_date: false,
    };

    const submitResponse = await axios.post(
      `${config.pdl.base_url}/album/pdl/submit`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      },
    );

    return submitResponse?.data;
  } catch (error: any) {
    logger.error(
      'Error verifying and submitting album:',
      error.response?.data || error.message,
    );
    throw error;
  }
};

//! Its for work
export const getFileMetadata = async (s3Url: string) => {
  try {
    const response = await axios.get(s3Url, {
      responseType: 'stream',
      timeout: 60000,
    });

    const hash = crypto.createHash('md5');
    let size = 0;

    return new Promise((resolve, reject) => {
      response.data
        .on('data', (chunk: any) => {
          size += chunk.length;
          hash.update(chunk);
        })
        .on('end', () => {
          const md5Hash = hash.digest('hex');
          resolve({ md5Hash, size });
        })
        .on('error', (err: any) => {
          logger.error('Stream error:', err.message);
          reject(err);
        });
    });
  } catch (error: any) {
    logger.error('Error calculating file metadata:', error.message);
    throw new ApiError(500, error.message);
  }
};
