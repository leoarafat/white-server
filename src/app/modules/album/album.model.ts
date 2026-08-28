import { Schema, model } from 'mongoose';
import IAlbumMusic from './album.interface';
import { attachStatusChangeHook } from '../notifications/notification.hooks';

const multipleMusicSchema = new Schema<IAlbumMusic>(
  {
    audio: [
      {
        audioFileName: {
          type: String,
          required: true,
        },
        releaseTitle: {
          type: String,
          required: true,
        },
        subtitle: {
          type: String,
          required: true,
        },
        primaryArtist: {
          type: [],
          // ref: 'PrimaryArtist',
          required: true,
        },
        format: {
          type: String,
          enum: ['CD', 'Vinyl'],
          required: true,
        },
        label: {
          type: String,
          // ref: 'Label',
          required: true,
        },
        writer: {
          type: [String],
          required: true,
        },
        composer: {
          type: [String],
          required: true,
        },
        musicDirectors: {
          type: [String],
          required: true,
        },
        producers: {
          type: [String],
          required: true,
        },
        featuring: {
          type: [String],
          required: true,
        },
        genre: {
          type: String,
          required: true,
        },
        upcEan: {
          type: String,
          // required: true,
        },
        subGenre: {
          type: String,
          required: true,
        },

        originalReleaseDate: {
          type: String,
          // required: true,
        },
        lyricsLanguage: {
          type: String,
          // required: true,
        },
        productionYear: {
          type: String,
          required: true,
        },
        youtube: {
          type: String,
          required: true,
        },
        lyrics: {
          type: String,
          required: true,
        },
        isrc: {
          type: String,
        },
      },
    ],
    image: {
      type: String,
      required: true,
    },
    releaseTitle: {
      type: String,
      required: true,
    },
    subtitle: {
      type: String,
      required: true,
    },
    pLine: {
      type: String,
      required: true,
    },
    cLine: {
      type: String,
      required: true,
    },
    // primaryArtist: {
    //   type: [Schema.Types.ObjectId],
    //   ref: 'PrimaryArtist',
    //   required: true,
    // },
    primaryArtist: [
      {
        type: Schema.Types.ObjectId,
        ref: 'PrimaryArtist',
      },
    ],
    originalReleaseDate: {
      type: String,
      // required: true,
    },
    label: {
      type: Schema.Types.ObjectId,
      ref: 'Label',
      required: true,
    },
    physicalReleaseDate: {
      type: String,
      // required: true,
    },
    storeReleaseDate: {
      type: String,
      required: true,
    },
    producerCatalogNumber: {
      type: String,
      // required: true,
    },
    productionYear: {
      type: String,
      required: true,
    },
    catalogNumber: {
      type: String,
      required: true,
    },
    isApproved: {
      type: String,
      enum: ['approved', 'rejected', 'pending'],
      default: 'pending',
    },
    songStatus: {
      type: String,
      enum: ['take-down', 'distribute', 'none'],
      default: 'none',
    },
    releaseId: {
      type: String,
      required: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    songType: {
      type: String,
      enum: ['album'],
      required: true,
    },
    countries: {
      type: [String],
      // required: true,
    },

    isCorrection: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

attachStatusChangeHook(multipleMusicSchema, 'album', {
  statusField: 'isApproved',
  titleField: 'releaseTitle',
});

export const Album = model<IAlbumMusic>('Album', multipleMusicSchema);
