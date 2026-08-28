export type IStatics = {
  upc: string;
  isrc: string;
  labelName: string;
  artistName: string;
  releaseTitle: string;
  album: string;
  trackTitle: string;
  stream_quantity: string;
  revenue: string;
  country: string;
  reportingMonth: string;
  salesMonth: string;
  platForm: string;
  clientShareRate: string;
};
export type IStaticsData = {
  dateRange: string;
  totalStreams: number;
  labelName: string;
  streams: number;
};

// Define the interface for the Statics document
export type IStatic = {
  filename: string;
  fieldname: string;
  data: IStaticsData[];
} & Document;
