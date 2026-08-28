// /* eslint-disable @typescript-eslint/ban-ts-comment */
// import { create } from 'xmlbuilder2';
// import { IVideos } from '../videos/videos.interface';
// // import { Response } from 'express';
// // import { uploadXmlToS3 } from './vevo-s3';
// import { computeMd5Hash, getPrimaryArtistNames } from './utils';

// function addHoursToDateTime(dateTime: string, hours: number): string {
//   const date = new Date(dateTime);
//   date.setHours(date.getHours() + hours);
//   return date.toISOString();
// }
// // Helper function to get local ISO datetime without timezone offset
// function getLocalISODateTime(date: Date): string {
//   const tzo = -date.getTimezoneOffset();
//   const dif = tzo >= 0 ? '+' : '-';
//   const pad = (num: number) => (num < 10 ? '0' : '') + num;

//   return (
//     date.getFullYear() +
//     '-' +
//     pad(date.getMonth() + 1) +
//     '-' +
//     pad(date.getDate()) +
//     'T' +
//     pad(date.getHours()) +
//     ':' +
//     pad(date.getMinutes()) +
//     ':' +
//     pad(date.getSeconds()) +
//     dif +
//     pad(Math.floor(Math.abs(tzo) / 60)) +
//     ':' +
//     pad(Math.abs(tzo) % 60)
//   );
// }

// export const generateDdexXml = async (video: IVideos): Promise<any> => {
//   try {
//     // Validate required fields
//     if (!video.isrc) throw new Error('ISRC is required');
//     if (!video.title) throw new Error('Title is required');
//     if (!video.primaryArtist || video.primaryArtist.length === 0)
//       throw new Error('Main artist is required');
//     if (!video.label) throw new Error('Label is required');
//     if (!video.repertoireOwner) throw new Error('Repertoire owner is required');
//     //@ts-ignore
//     // if (!video.user.channelName) throw new Error('YouTube channel is required');

//     // Calculate file hashes
//     const videoHash = await computeMd5Hash(video.video);
//     const imageHash = await computeMd5Hash(video.image);

//     // Prepare metadata
//     const isrc = video.isrc;
//     const title = video.title;
//     const currentDateTime = getLocalISODateTime(new Date());
//     const releaseDateTime = video?.releaseDate
//       ? getLocalISODateTime(new Date(video.releaseDate))
//       : currentDateTime;

//     const currentYear = new Date().getFullYear();

//     const messageId = `ANS${currentYear}.${video.videoId}`;
//     // Format duration as PT0H0M1S
//     let durationIso = 'PT0H0M0S';
//     if (video.durationMs) {
//       const totalSeconds = Math.floor(video.durationMs / 1000);
//       const hours = Math.floor(totalSeconds / 3600);
//       const minutes = Math.floor((totalSeconds % 3600) / 60);
//       const seconds = totalSeconds % 60;
//       durationIso = `PT${hours}H${minutes}M${seconds}S`;
//     }
//     const sanitizeIsrc = (isrc: string): string => {
//       if (!isrc) return '';
//       // Remove all non-alphanumeric characters and convert to uppercase
//       return isrc.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
//     };
//     // Create XML document with ERN 43 namespace
//     const doc = create({ version: '1.0', encoding: 'UTF-8' });
//     const root = doc.ele('ernm:NewReleaseMessage', {
//       'xmlns:ernm': 'http://ddex.net/xml/ern/43',
//       LanguageAndScriptCode: 'en',
//       AvsVersionId: '3',
//       ReleaseProfileVersionId: 'Video',
//       'xmlns:avs': 'http://ddex.net/xml/allowed-value-sets',
//       'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
//       'xsi:schemaLocation':
//         'http://ddex.net/xml/ern/43 http://ddex.net/xml/ern/43/release-notification.xsd',
//     });

//     // ========== Message Header ==========
//     const messageHeader = root.ele('MessageHeader');
//     messageHeader
//       .ele('MessageThreadId')
//       .txt(`GXC${Math.random().toString(36).substring(2, 15)}`)
//       .up();
//     messageHeader.ele('MessageId').txt(messageId).up();

//     // Sender (VEVO)
//     const messageSender = messageHeader.ele('MessageSender');
//     messageSender.ele('PartyId').txt('PADPIDA2011022302N').up();
//     messageSender.ele('PartyName').ele('FullName').txt('Vevo').up().up();
//     messageSender.up();

//     // Sent on behalf of (your company)
//     const sentOnBehalfOf = messageHeader.ele('SentOnBehalfOf');
//     sentOnBehalfOf.ele('PartyId').txt('PADPIDA2014021302H').up();
//     sentOnBehalfOf
//       .ele('PartyName')
//       .ele('FullName')
//       .txt('ANS Enterprise LLC')
//       .up()
//       .up();
//     sentOnBehalfOf.up();

//     // Recipient (YouTube)
//     const messageRecipient = messageHeader.ele('MessageRecipient');
//     messageRecipient.ele('PartyId').txt('PADPIDA2013020802I').up();
//     messageRecipient.ele('PartyName').ele('FullName').txt('YouTube').up().up();
//     messageRecipient.up();

//     messageHeader.ele('MessageCreatedDateTime').txt(currentDateTime).up();
//     messageHeader.ele('MessageControlType').txt('LiveMessage').up();
//     messageHeader.up();

//     // ========== Party List ==========
//     const partyList = root.ele('PartyList');

//     // Main Artist
//     const party1 = partyList.ele('Party');
//     party1.ele('PartyReference').txt('P1').up();
//     party1
//       .ele('PartyName', { LanguageAndScriptCode: 'en', IsDefault: 'true' })
//       .ele('FullName')
//       .txt(getPrimaryArtistNames(video.primaryArtist))
//       .up()
//       .up();
//     party1.up();

//     // Second Main Artist (if exists)
//     if (video.primaryArtist.length > 1) {
//       const party2 = partyList.ele('Party');
//       party2.ele('PartyReference').txt('P2').up();
//       party2
//         .ele('PartyName', { LanguageAndScriptCode: 'en', IsDefault: 'true' })
//         .ele('FullName')
//         .txt(video.primaryArtist[1])
//         .up()
//         .up();
//       party2.up();
//     }

//     // Featured Artist
//     if (video.featuringArtists && video.featuringArtists.length > 0) {
//       const party3 = partyList.ele('Party');
//       party3.ele('PartyReference').txt('P3').up();
//       party3
//         .ele('PartyName', { LanguageAndScriptCode: 'en', IsDefault: 'true' })
//         .ele('FullName')
//         .txt(video.featuringArtists[0])
//         .up()
//         .up();
//       party3.up();
//     }

//     // Label
//     const party4 = partyList.ele('Party');
//     party4.ele('PartyReference').txt('P4').up();
//     party4
//       .ele('PartyName', { LanguageAndScriptCode: 'en', IsDefault: 'true' })
//       .ele('FullName')
//       .txt(video.label)
//       .up()
//       .up();
//     party4.up();

//     // ========== Party References ========== ARA

//     const partyRefs: { [key: string]: string[] } = {
//       Composer: video.composer
//         ? video.composer.split(',').map(s => s.trim())
//         : [],
//       Director: video.musicDirector
//         ? video.musicDirector.split(',').map(s => s.trim())
//         : [],
//       Editor: video.editor ? video.editor.split(',').map(s => s.trim()) : [],
//       Producer: video.producer
//         ? video.producer.split(',').map(s => s.trim())
//         : [],
//     };

//     let partyIndex = 5;
//     const contributorRefs: { [role: string]: string[] } = {};
//     for (const [role, names] of Object.entries(partyRefs)) {
//       contributorRefs[role] = [];
//       for (const name of names) {
//         const ref = `P${partyIndex++}`;
//         contributorRefs[role].push(ref);
//         partyList
//           .ele('Party')
//           .ele('PartyReference')
//           .txt(ref)
//           .up()
//           .ele('PartyName', { LanguageAndScriptCode: 'en', IsDefault: 'true' })
//           .ele('FullName')
//           .txt(name)
//           .up()
//           .up()
//           .up();
//       }
//     }
//     partyList.up();
//     // ========== Resource List ==========
//     const resourceList = root.ele('ResourceList');

//     // 1. Video Resource
//     const videoResource = resourceList.ele('Video');
//     videoResource.ele('ResourceReference').txt('A1').up();
//     videoResource.ele('Type').txt('ShortFormMusicalWorkVideo').up();

//     const videoEdition = videoResource.ele('VideoEdition');
//     videoEdition.ele('ResourceId').ele('ISRC').txt(isrc).up().up();

//     // Copyright Information
//     videoEdition
//       .ele('CLine', { IsDefault: 'true' })
//       .ele('Year')
//       .txt(video.copyrightYear || new Date().getFullYear().toString())
//       .up()
//       .ele('CLineCompany')
//       .txt(video.label)
//       .up()
//       .ele('CLineText')
//       .txt(
//         `© ${video.copyrightYear || new Date().getFullYear()} ${video.label}`,
//       )
//       .up()
//       .up();

//     // Technical Details
//     const videoTechDetails = videoEdition.ele('TechnicalDetails');
//     videoTechDetails.ele('TechnicalResourceDetailsReference').txt('T1').up();
//     const deliveryFile = videoTechDetails.ele('DeliveryFile');
//     deliveryFile.ele('Type').txt('AudioVisualFile').up();
//     deliveryFile
//       .ele('VideoCodecType', {
//         Namespace: 'PADPIDA2014021302H',
//         UserDefinedValue: 'H.264',
//       })
//       .txt('UserDefined')
//       .up();
//     deliveryFile.ele('FrameRate').txt('30.0').up();
//     deliveryFile
//       .ele('ImageHeight', { UnitOfMeasure: 'Pixel' })
//       .txt('2160')
//       .up();
//     deliveryFile.ele('ImageWidth', { UnitOfMeasure: 'Pixel' }).txt('3840').up();
//     deliveryFile.ele('VideoDefinitionType').txt('UltraHighDefinition').up();
//     deliveryFile.ele('NumberOfAudioChannels').txt('2').up();
//     deliveryFile
//       .ele('AudioSamplingRate', { UnitOfMeasure: 'kHz' })
//       .txt('48')
//       .up();
//     deliveryFile.ele('Duration').txt(durationIso).up();
//     deliveryFile.ele('BitDepth').txt('8').up();
//     deliveryFile
//       .ele('File')
//       .ele('URI')
//       .txt(`${isrc}.mp4`)
//       .up()
//       .ele('HashSum')
//       .ele('Algorithm')
//       .txt('MD5')
//       .up()
//       .ele('HashSumValue')
//       .txt(videoHash)
//       .up()
//       .up()
//       .up();
//     deliveryFile.up();
//     videoTechDetails.up();
//     videoEdition.up();

//     // Video Metadata
//     videoResource
//       .ele('DisplayTitleText', {
//         IsDefault: 'true',
//         LanguageAndScriptCode: 'en',
//       })
//       .txt(title)
//       .up();

//     videoResource
//       .ele('DisplayTitle', {
//         IsDefault: 'true',
//         LanguageAndScriptCode: 'en',
//       })
//       .ele('TitleText')
//       .txt(title)
//       .up()
//       .up();

//     // Related Audio Release
//     if (video.audioIsrc) {
//       const sanitizedAudioIsrc = sanitizeIsrc(video.audioIsrc);
//       if (sanitizedAudioIsrc.length === 12) {
//         // Standard ISRC length
//         const relatedRelease = videoResource.ele('RelatedRelease');
//         relatedRelease.ele('ReleaseRelationshipType').txt('IsFromAudio').up();
//         relatedRelease
//           .ele('ReleaseId')
//           .ele('ProprietaryId', { Namespace: 'ISRC' })
//           .txt(sanitizedAudioIsrc)
//           .up()
//           .up();
//         relatedRelease.up();
//       } else {
//         console.warn(`Invalid audio ISRC format: ${video.audioIsrc}`);
//       }
//     }

//     videoResource
//       .ele('AdditionalTitle', {
//         IsDefault: 'true',
//         LanguageAndScriptCode: 'en',
//         TitleType: 'FormalTitle',
//       })
//       .ele('TitleText')
//       .txt(title)
//       .up()
//       .up();

//     // Display Artists
//     videoResource
//       .ele('DisplayArtistName', { IsDefault: 'true' })
//       .txt(getPrimaryArtistNames(video.primaryArtist))
//       .up();

//     const displayArtist1 = videoResource.ele('DisplayArtist', {
//       SequenceNumber: '1',
//     });
//     displayArtist1.ele('ArtistPartyReference').txt('P1').up();
//     displayArtist1.ele('DisplayArtistRole').txt('MainArtist').up();
//     displayArtist1.up();

//     if (video.primaryArtist.length > 1) {
//       const displayArtist2 = videoResource.ele('DisplayArtist', {
//         SequenceNumber: '2',
//       });
//       displayArtist2.ele('ArtistPartyReference').txt('P2').up();
//       displayArtist2.ele('DisplayArtistRole').txt('MainArtist').up();
//       displayArtist2.up();
//     } else {
//       // Default second artist to match sample
//       const displayArtist2 = videoResource.ele('DisplayArtist', {
//         SequenceNumber: '2',
//       });
//       displayArtist2.ele('ArtistPartyReference').txt('P2').up();
//       displayArtist2.ele('DisplayArtistRole').txt('MainArtist').up();
//       displayArtist2.up();
//     }

//     if (video.featuringArtists && video.featuringArtists.length > 0) {
//       const displayArtist3 = videoResource.ele('DisplayArtist', {
//         SequenceNumber: '3',
//       });
//       displayArtist3.ele('ArtistPartyReference').txt('P3').up();
//       displayArtist3.ele('DisplayArtistRole').txt('FeaturedArtist').up();
//       displayArtist3.up();
//     }

//     videoResource
//       .ele('CourtesyLine', { IsDefault: 'true' })
//       .txt(`A ${video.label || 'ANS Music'} release.`)
//       .up();
//     videoResource.ele('Duration').txt(durationIso).up();
//     videoResource
//       .ele('CreationDate', { ApplicableTerritoryCode: 'US' })
//       .txt(new Date().getFullYear().toString())
//       .up();
//     videoResource
//       .ele('ParentalWarningType', { IsDefault: 'true' })
//       .txt('NotExplicit')
//       .up();
//     videoResource
//       .ele('LanguageOfPerformance', { IsMainLanguage: 'true' })
//       .txt('en')
//       .up();
//     videoResource.up();

//     // 2. Image Resource
//     const imageResource = resourceList.ele('Image');
//     imageResource.ele('ResourceReference').txt('A2').up();
//     imageResource.ele('Type').txt('VideoScreenCapture').up();

//     imageResource
//       .ele('ResourceId')
//       .ele('ProprietaryId', { Namespace: 'PADPIDA2014021302H' })
//       .txt(
//         `${Math.floor(Math.random() * 100000)}ANSIM${Math.floor(Math.random() * 100000)}`,
//       )
//       .up()
//       .up();

//     imageResource
//       .ele('DisplayTitleText', {
//         IsDefault: 'true',
//         LanguageAndScriptCode: 'en',
//       })
//       .txt(title)
//       .up();

//     imageResource
//       .ele('DisplayTitle', {
//         IsDefault: 'true',
//         LanguageAndScriptCode: 'en',
//       })
//       .ele('TitleText')
//       .txt(title)
//       .up()
//       .up();

//     imageResource
//       .ele('AdditionalTitle', {
//         IsDefault: 'true',
//         LanguageAndScriptCode: 'en',
//         TitleType: 'FormalTitle',
//       })
//       .ele('TitleText')
//       .txt(title)
//       .up()
//       .up();

//     // Contributors
//     const contributor1 = imageResource.ele('Contributor', {
//       SequenceNumber: '1',
//     });
//     contributor1.ele('ContributorPartyReference').txt('P1').up();
//     contributor1
//       .ele('Role', {
//         Namespace: 'PADPIDA2014021302H',
//         UserDefinedValue: 'MainArtist',
//       })
//       .txt('UserDefined')
//       .up();
//     contributor1.up();

//     const contributor2 = imageResource.ele('Contributor', {
//       SequenceNumber: '2',
//     });
//     contributor2.ele('ContributorPartyReference').txt('P2').up();
//     contributor2
//       .ele('Role', {
//         Namespace: 'PADPIDA2014021302H',
//         UserDefinedValue: 'MainArtist',
//       })
//       .txt('UserDefined')
//       .up();
//     contributor2.up();

//     const contributor3 = imageResource.ele('Contributor', {
//       SequenceNumber: '3',
//     });
//     contributor3.ele('ContributorPartyReference').txt('P3').up();
//     contributor3
//       .ele('Role', {
//         Namespace: 'PADPIDA2014021302H',
//         UserDefinedValue: 'FeaturedArtist',
//       })
//       .txt('UserDefined')
//       .up();
//     contributor3.up();

//     // Copyright
//     imageResource
//       .ele('CLine', { IsDefault: 'true' })
//       .ele('Year')
//       .txt(video.copyrightYear || new Date().getFullYear().toString())
//       .up()
//       .ele('CLineCompany')
//       .txt(video.label)
//       .up()
//       .ele('CLineText')
//       .txt(
//         `© ${video.copyrightYear || new Date().getFullYear()} ${video.label}`,
//       )
//       .up()
//       .up();

//     imageResource
//       .ele('CourtesyLine', { IsDefault: 'true' })
//       .txt(`A ${video.label || 'ANS Music'} release.`)
//       .up();
//     imageResource
//       .ele('ParentalWarningType', { IsDefault: 'true' })
//       .txt(video?.explicit === 'Yes' ? 'Explicit' : 'NotExplicit')
//       .up();

//     // Technical Details
//     const imageTechDetails = imageResource.ele('TechnicalDetails');
//     imageTechDetails.ele('TechnicalResourceDetailsReference').txt('T3').up();
//     imageTechDetails.ele('ImageCodecType').txt('JPEG').up();
//     imageTechDetails
//       .ele('ImageHeight', { UnitOfMeasure: 'Pixel' })
//       .txt('1080')
//       .up();
//     imageTechDetails
//       .ele('ImageWidth', { UnitOfMeasure: 'Pixel' })
//       .txt('1920')
//       .up();
//     imageTechDetails
//       .ele('File')
//       .ele('URI')
//       .txt(`${isrc}.jpg`)
//       .up()
//       .ele('HashSum')
//       .ele('Algorithm')
//       .txt('MD5')
//       .up()
//       .ele('HashSumValue')
//       .txt(imageHash)
//       .up()
//       .up()
//       .up();
//     imageTechDetails.up();
//     imageResource.up();

//     resourceList.up();

//     // ========== Release List ==========
//     const releaseList = root.ele('ReleaseList');

//     // 1. Main Release (VideoSingle)
//     const mainRelease = releaseList.ele('Release');
//     mainRelease.ele('ReleaseReference').txt('R0').up();
//     mainRelease.ele('ReleaseType').txt('VideoSingle').up();
//     mainRelease.ele('ReleaseId').ele('ICPN').up().up();

//     mainRelease
//       .ele('DisplayTitleText', {
//         IsDefault: 'true',
//         LanguageAndScriptCode: 'en',
//       })
//       .txt(title)
//       .up();

//     mainRelease
//       .ele('DisplayTitle', {
//         IsDefault: 'true',
//         LanguageAndScriptCode: 'en',
//       })
//       .ele('TitleText')
//       .txt(title)
//       .up()
//       .up();

//     mainRelease
//       .ele('AdditionalTitle', {
//         IsDefault: 'true',
//         LanguageAndScriptCode: 'en',
//         TitleType: 'FormalTitle',
//       })
//       .ele('TitleText')
//       .txt(title)
//       .up()
//       .up();

//     // Synopsis
//     mainRelease
//       .ele('Synopsis', { LanguageAndScriptCode: 'en', IsDefault: 'true' })
//       .txt(`${video?.description}`)
//       .up();

//     // Display Artists
//     mainRelease
//       .ele('DisplayArtistName', { IsDefault: 'true' })
//       .txt(getPrimaryArtistNames(video.primaryArtist))
//       .up();

//     const mainDisplayArtist1 = mainRelease.ele('DisplayArtist', {
//       SequenceNumber: '1',
//     });
//     mainDisplayArtist1.ele('ArtistPartyReference').txt('P1').up();
//     mainDisplayArtist1.ele('DisplayArtistRole').txt('MainArtist').up();
//     mainDisplayArtist1.up();

//     const mainDisplayArtist2 = mainRelease.ele('DisplayArtist', {
//       SequenceNumber: '2',
//     });
//     mainDisplayArtist2.ele('ArtistPartyReference').txt('P2').up();
//     mainDisplayArtist2.ele('DisplayArtistRole').txt('MainArtist').up();
//     mainDisplayArtist2.up();

//     const mainDisplayArtist3 = mainRelease.ele('DisplayArtist', {
//       SequenceNumber: '2', // Note: This matches the sample file which has sequence 2 repeated
//     });
//     mainDisplayArtist3.ele('ArtistPartyReference').txt('P3').up();
//     mainDisplayArtist3.ele('DisplayArtistRole').txt('FeaturedArtist').up();
//     mainDisplayArtist3.up();

//     // Label Reference
//     mainRelease
//       .ele('ReleaseLabelReference', { IsDefault: 'true' })
//       .txt('P4')
//       .up();

//     // PLine
//     mainRelease
//       .ele('PLine', { IsDefault: 'true' })
//       .ele('Year')
//       .txt(video.copyrightYear || new Date().getFullYear().toString())
//       .up()
//       .ele('PLineCompany')
//       .txt(video.label)
//       .up()
//       .ele('PLineText')
//       .txt(
//         `© ${video.copyrightYear || new Date().getFullYear()} ${video.label}`,
//       )
//       .up()
//       .up();

//     // CLine
//     mainRelease
//       .ele('CLine', { IsDefault: 'true' })
//       .ele('Year')
//       .txt(video.copyrightYear || new Date().getFullYear().toString())
//       .up()
//       .ele('CLineCompany')
//       .txt(video.label)
//       .up()
//       .ele('CLineText')
//       .txt(
//         `© ${video.copyrightYear || new Date().getFullYear()} ${video.label}`,
//       )
//       .up()
//       .up();

//     mainRelease
//       .ele('CourtesyLine', { IsDefault: 'true' })
//       .txt(`A ${video.label || 'ANS Music'} release.`)
//       .up();
//     mainRelease.ele('Duration').txt('PT4M17S').up(); // Note: Different from video duration to match sample
//     mainRelease
//       .ele('Genre', { IsDefault: 'true' })
//       .ele('GenreText')
//       .txt(video.genre)
//       .up()
//       .up();
//     mainRelease
//       .ele('ReleaseDate', { IsDefault: 'true' })
//       .txt(releaseDateTime.split('T')[0])
//       .up();
//     mainRelease
//       .ele('OriginalReleaseDate', { IsDefault: 'true' })
//       .txt(releaseDateTime.split('T')[0])
//       .up();
//     mainRelease.ele('ReleaseVisibilityReference').txt('V1').up();
//     mainRelease
//       .ele('ParentalWarningType', { IsDefault: 'true' })
//       .txt(video?.explicit === 'Yes' ? 'Explicit' : 'NotExplicit')
//       .up();
//     mainRelease.ele('IsMultiArtistCompilation').txt('false').up();

//     // Resource Group
//     const resourceGroup = mainRelease.ele('ResourceGroup', {
//       ResourceGroupType: 'Component',
//     });
//     resourceGroup.ele('SequenceNumber').txt('1').up();
//     const resourceGroupContentItem = resourceGroup.ele(
//       'ResourceGroupContentItem',
//     );
//     resourceGroupContentItem.ele('SequenceNumber').txt('1').up();
//     resourceGroupContentItem.ele('ReleaseResourceReference').txt('A1').up();
//     resourceGroupContentItem
//       .ele('LinkedReleaseResourceReference', {
//         LinkDescription: 'VideoScreenCapture',
//       })
//       .txt('A2')
//       .up();
//     resourceGroupContentItem
//       .ele('IsInstantGratificationResource')
//       .txt('false')
//       .up();
//     resourceGroupContentItem
//       .ele('IsPreOrderIncentiveResource')
//       .txt('false')
//       .up();
//     resourceGroupContentItem.up();
//     resourceGroup.up();
//     mainRelease.up();

//     // 2. Track Release
//     const trackRelease = releaseList.ele('TrackRelease');
//     trackRelease.ele('ReleaseReference').txt('R1').up();

//     const trackReleaseId = trackRelease.ele('ReleaseId');
//     trackReleaseId.ele('ProprietaryId', { Namespace: 'ISRC' }).txt(isrc).up();
//     trackReleaseId
//       .ele('ProprietaryId', { Namespace: 'PADPIDA2014021302H' })
//       .txt(`${Math.floor(Math.random() * 10000000000000)}_${isrc}_R1`)
//       .up();
//     trackReleaseId
//       .ele('ProprietaryId', { Namespace: 'Channel' })
//       .txt(video?.vevoChannel)
//       .up();
//     trackReleaseId.up();

//     trackRelease
//       .ele('DisplayTitleText', {
//         IsDefault: 'true',
//         LanguageAndScriptCode: 'en',
//       })
//       .txt(title)
//       .up();

//     trackRelease
//       .ele('DisplayTitle', {
//         IsDefault: 'true',
//         LanguageAndScriptCode: 'en',
//       })
//       .ele('TitleText')
//       .txt(title)
//       .up()
//       .up();

//     trackRelease
//       .ele('AdditionalTitle', {
//         IsDefault: 'true',
//         LanguageAndScriptCode: 'en',
//         TitleType: 'FormalTitle',
//       })
//       .ele('TitleText')
//       .txt(title)
//       .up()
//       .up();

//     trackRelease.ele('ReleaseResourceReference').txt('A1').up();
//     trackRelease
//       .ele('LinkedReleaseResourceReference', {
//         LinkDescription: 'VideoScreenCapture',
//       })
//       .txt('A2')
//       .up();
//     trackRelease
//       .ele('ReleaseLabelReference', { IsDefault: 'true' })
//       .txt('P4')
//       .up();
//     trackRelease
//       .ele('Genre', { IsDefault: 'true' })
//       .ele('GenreText')
//       .txt(video.genre)
//       .up()
//       .up();
//     trackRelease.ele('ReleaseVisibilityReference').txt('V2').up();
//     trackRelease.up();

//     releaseList.up();

//     // ========== Deal List ==========
//     const dealList = root.ele('DealList');

//     // Release Deal
//     const releaseDeal = dealList.ele('ReleaseDeal');
//     releaseDeal.ele('DealReleaseReference').txt('R0').up();

//     const deal = releaseDeal.ele('Deal');
//     const dealTerms = deal.ele('DealTerms');
//     dealTerms.ele('TerritoryCode').txt('Worldwide').up();
//     dealTerms
//       .ele('ValidityPeriod')
//       .ele('StartDateTime')
//       .txt(releaseDateTime)
//       .up()
//       .up();
//     dealTerms
//       .ele('CommercialModelType')
//       .txt('AdvertisementSupportedModel')
//       .up();
//     dealTerms.ele('CommercialModelType').txt('SubscriptionModel').up();
//     dealTerms.ele('UseType').txt('Stream').up();
//     dealTerms.up();
//     deal.up();
//     releaseDeal.up();

//     // Release Visibility
//     const releaseVisibility = dealList.ele('ReleaseVisibility');
//     releaseVisibility.ele('VisibilityReference').txt('V1').up();
//     releaseVisibility.ele('TerritoryCode').txt('Worldwide').up();
//     releaseVisibility
//       .ele('ReleaseDisplayStartDateTime')
//       .txt(addHoursToDateTime(releaseDateTime, 6))
//       .up();
//     releaseVisibility
//       .ele('CoverArtPreviewStartDateTime')
//       .txt(releaseDateTime)
//       .up();
//     releaseVisibility
//       .ele('FullTrackListingPreviewStartDateTime')
//       .txt(releaseDateTime)
//       .up();
//     releaseVisibility.up();

//     dealList.up();

//     return doc.end({ prettyPrint: true });
//   } catch (error: any) {
//     console.error('VEVO DDEX Generation Error:', error);
//     throw new Error(`Failed to generate VEVO DDEX XML: ${error.message}`);
//   }
// };
