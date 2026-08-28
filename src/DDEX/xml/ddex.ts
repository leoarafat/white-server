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
//     // Prepare metadata in DDEX XML format
//     const ddexXml = await prepareDDEXMetadata(result);

//     // Distribute to platforms
//     await distributeToPlatforms(ddexXml);
//   }

//   return result;
// };
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
//     // Prepare metadata in DDEX XML format
//     const ddexXml = await prepareDDEXMetadata(result);

//     // Distribute to platforms
//     await distributeToPlatforms(ddexXml);
//   }

//   return result;
// };
// const axios = require('axios');

// const distributeToPlatforms = async ddexXml => {
//   await distributeToSpotify(ddexXml);
//   await distributeToAmazonMusic(ddexXml);
//   await distributeToSoundCloud(ddexXml);
// };

// const distributeToSpotify = async ddexXml => {
//   try {
//     const response = await axios.post(
//       'https://api.spotify.com/v1/ddex',
//       ddexXml,
//       {
//         headers: {
//           Authorization: `Bearer ${process.env.SPOTIFY_API_TOKEN}`,
//           'Content-Type': 'application/xml',
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

// const distributeToAmazonMusic = async ddexXml => {
//   try {
//     const response = await axios.post(
//       'https://music.amazon.com/v1/ddex',
//       ddexXml,
//       {
//         headers: {
//           Authorization: `Bearer ${process.env.AMAZON_MUSIC_API_TOKEN}`,
//           'Content-Type': 'application/xml',
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

// const distributeToSoundCloud = async ddexXml => {
//   try {
//     const response = await axios.post(
//       'https://api.soundcloud.com/v1/ddex',
//       ddexXml,
//       {
//         headers: {
//           Authorization: `Bearer ${process.env.SOUNDCLOUD_API_TOKEN}`,
//           'Content-Type': 'application/xml',
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
// SPOTIFY_API_TOKEN=your_spotify_api_token
// AMAZON_MUSIC_API_TOKEN=your_amazon_music_api_token
// SOUNDCLOUD_API_TOKEN=your_soundcloud_api_token
