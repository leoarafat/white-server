// const multer = require('multer');
// const multerS3 = require('multer-s3');
// const s3 = require('./aws-config');
// const ApiError = require('../../errors/ApiError');

// const upload = multer({
//   storage: multerS3({
//     s3: s3,
//     bucket: process.env.S3_BUCKET_NAME,
//     acl: 'public-read',
//     key: function (req, file, cb) {
//       const fileName = Date.now().toString() + '-' + file.originalname;
//       cb(null, fileName);
//     },
//   }),
//   fileFilter: function (req, file, cb) {
//     const allowedMimes = [
//       'image/jpeg',
//       'image/png',
//       'image/jpg',
//       'audio/mp3',
//       'audio/mpeg',
//     ];

//     if (allowedMimes.includes(file.mimetype)) {
//       cb(null, true);
//     } else {
//       cb(new ApiError(400, 'Invalid file type'), false);
//     }
//   },
// });

// module.exports = upload;
