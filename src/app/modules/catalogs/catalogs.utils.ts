/* eslint-disable @typescript-eslint/ban-ts-comment */

const generateRandomAppleId = () => {
  return Math.floor(1000000000 + Math.random() * 9000000000).toString();
};
export const buildMetadata = (
  singleTrack: any,
  uniqueId: string,
  uniqueInlayId: string,
  audioMetadata: any,
  coverArtMetadata: any,
  featureArtists: any,
) => {
  return {
    version: '2',
    albums: [
      {
        is_update: false,
        name: singleTrack.title,
        //@ts-ignore
        label: singleTrack.label?.labelName || 'Unknown Label',
        c_line: singleTrack.cLine || '2024 CLine',
        upc_id: singleTrack.upc || '',
        uploaded_via: 'AdvanceMetaData',
        songs: [
          {
            isrc: singleTrack.isrc || '',
            dolby_isrc: singleTrack.isrc,
            data: {
              crbt_cut_name: singleTrack.crbtTitle,
              song_name: singleTrack.title,
              album_name: singleTrack.title,
              language: singleTrack.trackTitleLanguage || 'English',
              album_type: singleTrack.contentType || 'Album',
              content_type: singleTrack.contentType || 'Audio',
              genre: singleTrack.genre || 'Unknown Genre',
              sub_genre: singleTrack.subGenre || 'Unknown Sub-Genre',
              mood: singleTrack?.mood,
              description: singleTrack.subtitle || 'No Description',
              isrc: singleTrack.isrc || '',
              dolby_isrc: singleTrack.isrc,
              //@ts-ignore
              label: singleTrack.label?.labelName || 'Unknown Label',
              publisher: singleTrack.publisher || 'Unknown Publisher',
              // track_duration: '0:00:00',
              // time_for_crbt_cut: '0:00:30',
              original_release_date_of_movie: singleTrack.releaseDate,
              original_release_date_of_music: singleTrack.releaseDate,
              // go_live_date: '26-04-2024',
              // date_of_expiry: '2/1/23',
              c_line: singleTrack.cLine || singleTrack?.label?.labelName,
              p_line: singleTrack.pLine || singleTrack?.label?.labelName,
              // film_banner: 'New Film Banner',
              parental_advisory: singleTrack.parentalAdvisory || 'Not Explicit',
              is_instrumental: singleTrack.instrumental || 'No',
              upc_id: singleTrack.upc || '',
              genreId: uniqueInlayId,
            },
            is_instrumental: singleTrack.instrumental || 'No',
            upc_id: singleTrack.upc || '',

            //@ts-ignore

            track_main_artist: singleTrack.primaryArtist?.map(
              (artist: any) => ({
                id: artist?._id || '',
                name: artist?.primaryArtistName,
                apple_id: generateRandomAppleId(),
                // apple_id: '1636818312',
                meta_id: '',
                facebook_artist_page_url: artist?.primaryArtistFacebookId || '',
                insta_artist_page_url: artist?.primaryArtistInstagramId || '',
                spotify_id: artist?.primaryArtistSpotifyId || '',

                is_iprs_member: false,
              }),
            ),
            ...(featureArtists && {
              track_featured_artist: featureArtists.map((artist: any) => ({
                id: artist?._id || '',
                name: artist?.primaryArtistName,
                apple_id: generateRandomAppleId(),
                // apple_id: '1636818319',
                meta_id: '',
                facebook_artist_page_url: artist?.primaryArtistFacebookId || '',
                insta_artist_page_url: artist?.primaryArtistInstagramId || '',
                spotify_id: artist?.primaryArtistSpotifyId || '',
                is_iprs_member: false,
              })),
            }),
            //!
            lyricists: [
              {
                id: '',
                name: singleTrack?.author,
                apple_id: generateRandomAppleId(),
                meta_id: '',
                facebook_artist_page_url: '',
                insta_artist_page_url: '',
                spotify_id: '',
                locale: '',
              },
            ],
            composers: [
              {
                id: '',
                name: singleTrack?.composer,
                apple_id: generateRandomAppleId(),
                meta_id: '',
                facebook_artist_page_url: '',
                insta_artist_page_url: '',
                spotify_id: '',
                locale: '',
              },
            ],
            //!
            producers: [
              {
                id: '',
                name: singleTrack?.producer,
                apple_id: generateRandomAppleId(),
                meta_id: '',
                facebook_artist_page_url: '',
                insta_artist_page_url: '',
                spotify_id: '',
                locale: '',
                is_iprs_member: false,
                ipi_number: '',
              },
            ],
            track_remixer_artist: [
              {
                id: '',
                name: singleTrack?.remixer,
                apple_id: generateRandomAppleId(),
                meta_id: '',
                facebook_artist_page_url: '',
                insta_artist_page_url: '',
                spotify_id: '',
                locale: '',
                is_iprs_member: false,
                ipi_number: '',
              },
            ],
            //!
            media: {
              id: uniqueId,
              //@ts-ignore
              size: audioMetadata.size,
              //@ts-ignore
              md5: audioMetadata.md5Hash,
              filename: singleTrack.audio,
            },
          },
        ],
        inlay: {
          id: uniqueInlayId,
          //@ts-ignore
          size: coverArtMetadata.size,
          //@ts-ignore
          md5: coverArtMetadata.md5Hash,
          filename: singleTrack.image,
        },
      },
    ],
  };
};
