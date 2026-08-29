export const TARGET_FIELDS = [
  'isrc',
  'artist',
  'label',
  'title',
  'countryCode',
  'source',
  'allStreams',
  'perStreamRate',
  'gross',
] as const;

export type TargetField = (typeof TARGET_FIELDS)[number];

// Every field except `label` matches admin's Csvvalidator.ts REQUIRED_HEADERS
// and must be mapped before converting. `label` is genuinely optional there —
// some store exports never include it — so it alone may stay unmapped (or use
// the `lookup` mode below) without blocking conversion.
export const REQUIRED_FIELDS: TargetField[] = TARGET_FIELDS.filter(
  f => f !== 'label',
);

// Output CSV header for each target field, in the exact order + casing the
// dashboard's own Report Upload page expects (statics.service.ts insertIntoDB
// reads `label` too, even though admin's Csvvalidator.ts REQUIRED_HEADERS
// doesn't hard-require it — dropping it silently breaks label-scoped
// analytics/permissions downstream).
export const OUTPUT_HEADERS: Record<TargetField, string> = {
  isrc: 'ISRC',
  artist: 'Artist',
  label: 'Label',
  title: 'Title',
  countryCode: 'Country Code',
  source: 'Source',
  allStreams: 'All Streams',
  perStreamRate: 'Per Stream Rate',
  gross: 'Gross',
};

export type FieldMapping =
  | { type: 'column'; header: string }
  | { type: 'constant'; value: string }
  // `label` only: fill each row from our own catalog by looking up its ISRC
  // (SingleTrack / Album / Video), for stores that never report a label.
  | { type: 'lookup' }
  | { type: 'none' };

export type ColumnMapping = Record<TargetField, FieldMapping>;

export type JobStatus = 'ready' | 'converting' | 'done' | 'error';

export type ConversionJob = {
  id: string;
  fileName: string;
  headers: string[];
  rows: Record<string, string>[];
  totalRows: number;
  processedRows: number;
  status: JobStatus;
  phase?: string;
  error?: string;
  resultCsv?: string;
  resultFileName?: string;
  createdAt: number;
};
