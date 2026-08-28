// const approveSingleMusic = async (id, payload) => {
//   const { ...musicData } = payload;

//   const findSingleSong = await SingleTrack.findById(id);
//   const findAlbumSong = await Album.findById(id);

//   let result;

//   if (findSingleSong) {
//     result = await SingleTrack.findOneAndUpdate(
//       { _id: id },
//       { ...musicData, isApproved: 'approved' },
//       {
//         new: true,
//         runValidators: true,
//       },
//     )
//       .populate('label')
//       .populate('primaryArtist');
//   } else if (findAlbumSong) {
//     result = await Album.findOneAndUpdate(
//       { _id: id },
//       { ...musicData, isApproved: 'approved' },
//       {
//         new: true,
//         runValidators: true,
//       },
//     )
//       .populate('label')
//       .populate('primaryArtist');
//   }

//   if (result) {
//     // Prepare metadata in DDEX format
//     const ddexMetadata = prepareDDEXMetadata(result);

//     // Distribute to platforms
//     await distributeToPlatforms(ddexMetadata);
//   }

//   return result;
// };
// const prepareDDEXMetadata = musicData => {
//   // Convert the music data to DDEX format
//   const ddexMetadata = {
//     ReleaseId: musicData._id,
//     Title: musicData.title,
//     Artists: musicData.primaryArtist.map(artist => ({
//       ArtistName: artist.name,
//       ArtistRole: 'Primary',
//     })),
//     Label: musicData.label.name,
//     ReleaseDate: musicData.releaseDate,
//     Genre: musicData.genre,
//     Duration: musicData.duration,
//     TrackNumber: musicData.trackNumber,
//     Isrc: musicData.isrc,
//     // ...other necessary fields according to DDEX standard
//   };
//   return ddexMetadata;
// };
// const axios = require('axios');

// const distributeToPlatforms = async ddexMetadata => {
//   await distributeToSpotify(ddexMetadata);
//   await distributeToAmazonMusic(ddexMetadata);
//   await distributeToSoundCloud(ddexMetadata);
// };

// const distributeToSpotify = async ddexMetadata => {
//   try {
//     const response = await axios.post(
//       'https://api.spotify.com/v1/ddex',
//       ddexMetadata,
//       {
//         headers: {
//           Authorization: `Bearer ${process.env.SPOTIFY_API_TOKEN}`,
//           'Content-Type': 'application/json',
//         },
//       },
//     );
//     console.log('Distributed to Spotify:', response.data);
//   } catch (error) {
//     console.error(
//       'Error distributing to Spotify:',
//       error.response ? error.response.data : error.message,
//     );
//   }
// };

// const distributeToAmazonMusic = async ddexMetadata => {
//   try {
//     const response = await axios.post(
//       'https://music.amazon.com/v1/ddex',
//       ddexMetadata,
//       {
//         headers: {
//           Authorization: `Bearer ${process.env.AMAZON_MUSIC_API_TOKEN}`,
//           'Content-Type': 'application/json',
//         },
//       },
//     );
//     console.log('Distributed to Amazon Music:', response.data);
//   } catch (error) {
//     console.error(
//       'Error distributing to Amazon Music:',
//       error.response ? error.response.data : error.message,
//     );
//   }
// };

// const distributeToSoundCloud = async ddexMetadata => {
//   try {
//     const response = await axios.post(
//       'https://api.soundcloud.com/v1/ddex',
//       ddexMetadata,
//       {
//         headers: {
//           Authorization: `Bearer ${process.env.SOUNDCLOUD_API_TOKEN}`,
//           'Content-Type': 'application/json',
//         },
//       },
//     );
//     console.log('Distributed to SoundCloud:', response.data);
//   } catch (error) {
//     console.error(
//       'Error distributing to SoundCloud:',
//       error.response ? error.response.data : error.message,
//     );
//   }
// };
// SPOTIFY_API_TOKEN = your_spotify_api_token;
// AMAZON_MUSIC_API_TOKEN = your_amazon_music_api_token;
// SOUNDCLOUD_API_TOKEN = your_soundcloud_api_token;
