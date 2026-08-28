/* eslint-disable @typescript-eslint/ban-ts-comment */
import { logger } from '../../../shared/logger';
import { IVideos } from '../videos/videos.interface';
import { Video } from '../videos/videos.model';
import { generateUniqueVideoId } from '../../../utils/videoId';

export const mapDataToVideos = async (data: any[]): Promise<IVideos[]> => {
  const videos: IVideos[] = [];

  for (const row of data) {
    const {
      reference_filename_video,
      thumbnail_image_name,
      ISRC_code,
      Video_Title,
      Primary_Artists,
      Genre,
      Subgenre,
      Language,
      Explicit,
      'Account ID_ANSBackstage': userId,
      Repertorie_Owner,
      Label,
      Aready_have_VEVO_channel,
      VEVO_Channel,
      Kids_Video,
      Description,
      Keywords,
      UPC_Code,
      Audio_ISRC,
      Version,
      Writer,
      Composer,
      Producer,
      Editor,
      Copyright,
      Copyrigt_year,
      Visibility,
      Release_start_date,
      Territory_policy,
    } = row;

    let videoId: string;
    try {
      videoId = await generateUniqueVideoId();
    } catch (error) {
      logger.error('Error generating unique videoId:', error);
      continue;
    }

    // ** Construct the video object only with fields that have values **
    const videoData: Partial<IVideos> = {
      ...(userId && { user: userId }),
      ...(thumbnail_image_name && { image: thumbnail_image_name }),
      ...(reference_filename_video && { video: reference_filename_video }),
      ...(ISRC_code && { isrc: ISRC_code }),
      ...(Video_Title && { title: Video_Title }),
      ...(Primary_Artists && {
        primaryArtist: Array.isArray(Primary_Artists)
          ? Primary_Artists
          : Primary_Artists.split(',').map((artist: string) => artist.trim()),
      }),
      ...(Genre && { genre: Genre }),
      ...(Subgenre && { subGenre: Subgenre }),
      ...(Language && { language: Language }),
      ...(Explicit && { explicit: Explicit === 'Yes' ? 'Yes' : 'No' }),
      ...(Repertorie_Owner && { repertoireOwner: Repertorie_Owner }),
      ...(Label && { label: Label }),
      ...(UPC_Code && { upc: UPC_Code }),
      ...(Audio_ISRC && { audioIsrc: Audio_ISRC }),
      ...(Version && { version: Version }),
      ...(Writer && { writer: Writer }),
      ...(Composer && { composer: Composer }),
      ...(Producer && { producer: Producer }),
      ...(Editor && { editor: Editor }),
      ...(Copyright && { copyright: Copyright }),
      ...(Copyrigt_year && { copyrightYear: Copyrigt_year }),
      ...(Visibility && { visibility: Visibility }),
      ...(Release_start_date && { storeReleaseDate: Release_start_date }),
      ...(Territory_policy && { territoryPolicy: Territory_policy }),
      ...(Kids_Video && { isKids: Kids_Video === 'Yes' ? 'Yes' : 'No' }),
      ...(Aready_have_VEVO_channel && {
        alreadyHaveAnVevoChannel:
          Aready_have_VEVO_channel === 'Yes' ? 'Yes' : 'No',
      }),
      ...(VEVO_Channel && { vevoChannel: VEVO_Channel }),
      ...(Description && { description: Description }),
      ...(Keywords && {
        keywords: Keywords.split(',').map((k: string) => k.trim()),
      }),
      ...(Release_start_date && { releaseDate: Release_start_date }),
      ...(videoId && { videoId }),
      isApproved: 'approved',
    };

    // ** Create the video model instance with only valid fields **
    const video = new Video(videoData);
    videos.push(video);
  }

  return videos;
};
