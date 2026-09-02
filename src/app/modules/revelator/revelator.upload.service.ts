import ApiError from '../../../errors/ApiError';
import { SingleTrack } from '../single-track/single.model';
import { revelatorUploadQueue } from '../../../queues/revelator-upload.queue';

const REQUIRED_FIELDS: (keyof import('../single-track/single.interface').ISingleTrack)[] =
  ['title', 'audio', 'genre', 'trackTitleLanguage'];

const sendToRevelator = async (trackId: string, adminId: string) => {
  const track = await SingleTrack.findById(trackId);
  if (!track) {
    throw new ApiError(404, 'Track not found');
  }
  if (track.revelatorStatus === 'processing') {
    throw new ApiError(409, 'This track is already being sent to Revelator');
  }

  const missing = REQUIRED_FIELDS.filter(field => !track[field]);
  if (missing.length) {
    throw new ApiError(
      400,
      `Cannot send to Revelator — missing required field(s): ${missing.join(', ')}`,
    );
  }

  const job = await revelatorUploadQueue.add('send', {
    trackId,
    adminId,
  });

  track.revelatorStatus = 'queued';
  track.revelatorJobId = String(job.id);
  track.revelatorError = '';
  await track.save();

  return { jobId: job.id };
};

export const RevelatorUploadService = { sendToRevelator };
