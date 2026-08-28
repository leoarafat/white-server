import Joi from 'joi';

export const videoSchema = Joi.object({
  reference_filename_video: Joi.string().uri().required(),
  thumbnail_image_name: Joi.string().uri().required(),
  ISRC_code: Joi.string().required(),
  Video_Title: Joi.string().required(),
  Primary_Artists: Joi.string().required(),
  Feature_Artist: Joi.string().optional().allow(''),
  Genre: Joi.string().required(),
  Subgenre: Joi.string().optional().allow(''),
  Language: Joi.string().optional().allow(''),
  Explicit: Joi.string().valid('Yes', 'No').required(),
  'Account ID': Joi.string().required(),
  Repertorie_Owner: Joi.string().required(),
  Label: Joi.string().optional().allow(''),
  Aready_have_VEVO_channel: Joi.string()
    .valid('Yes', 'No')
    .optional()
    .allow(''),
  VEVO_Channel: Joi.string().optional().allow(''),
  Kids_Video: Joi.string().valid('Yes', 'No').optional().allow(''),
  Description: Joi.string().optional().allow(''),
  Keywords: Joi.string().optional().allow(''),
  UPC_Code: Joi.string().optional().allow(''),
  Audio_ISRC: Joi.string().optional().allow(''),
  Version: Joi.string().optional().allow(''),
  Writer: Joi.string().optional().allow(''),
  Composer: Joi.string().optional().allow(''),
  Producer: Joi.string().optional().allow(''),
  Editor: Joi.string().optional().allow(''),
  Copyright: Joi.string().optional().allow(''),
  Copyrigt_year: Joi.string().optional().allow(''),
  Visibility: Joi.string().optional().allow(''),
  Release_start_date: Joi.string().optional().allow(''),
  Territory_policy: Joi.string().optional().allow(''),
});
