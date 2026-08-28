// const js2xmlparser = require('js2xmlparser');

// const ernMessage = {
//   MessageHeader: {
//     MessageID: '123456',
//     MessageThreadID: '654321',
//     MessageSender: {
//       PartyID: 'YOUR_PARTY_ID',
//       PartyName: 'YOUR_PARTY_NAME',
//     },
//     MessageRecipient: {
//       PartyID: 'RECIPIENT_PARTY_ID',
//       PartyName: 'RECIPIENT_PARTY_NAME',
//     },
//     MessageCreatedDateTime: new Date().toISOString(),
//   },
//   ReleaseList: {
//     Release: [
//       {
//         ReleaseID: 'release123',
//         ReleaseType: 'Album',
//         ReleaseTitle: {
//           TitleText: 'Sample Album',
//         },
//         ReleaseDetailsByTerritory: {
//           TerritoryCode: 'Worldwide',
//           DisplayArtist: [
//             {
//               PartyName: 'Sample Artist',
//             },
//           ],
//           LabelName: 'Sample Label',
//           ReleaseDate: '2024-06-11',
//         },
//       },
//     ],
//   },
// };

// const xml = js2xmlparser.parse('ERNMessage', ernMessage);
// console.log(xml);
// const axios = require('axios');

// axios.post('https://partner.api.endpoint', xml, {
//     headers: {
//         'Content-Type': 'application/xml'
//     }
// })
// .then(response => {
//     console.log('Response:', response.data);
// })
// .catch(error => {
//     console.error('Error:', error);
// });
