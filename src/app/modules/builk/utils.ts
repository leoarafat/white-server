// videoId generation now lives in one shared place so every creation path
// (single upload, resumable upload, B2B API, bulk import) produces ids the
// same way and checks the database before using one.
export { generateUniqueVideoId } from '../../../utils/videoId';
