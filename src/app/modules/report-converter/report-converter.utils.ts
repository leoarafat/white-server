import * as XLSX from 'xlsx';
import ApiError from '../../../errors/ApiError';
import httpStatus from 'http-status';
import {
  ColumnMapping,
  FieldMapping,
  OUTPUT_HEADERS,
  REQUIRED_FIELDS,
  TARGET_FIELDS,
  TargetField,
} from './report-converter.interface';

// Different stores/DSPs name the same column differently — used to
// pre-fill the mapping UI so the admin usually just has to confirm it.
const SYNONYMS: Record<TargetField, string[]> = {
  source: ['source', 'store', 'dsp', 'platform', 'service', 'retailer'],
  isrc: ['isrc', 'isrc code', 'recording isrc'],
  title: [
    'title',
    'track title',
    'track',
    'song title',
    'song',
    'release title',
    'asset title',
  ],
  artist: ['artist', 'artist name', 'primary artist', 'performer'],
  label: ['label', 'label name', 'record label', 'publisher'],
  countryCode: [
    'country code',
    'country',
    'territory',
    'territory code',
    'store territory',
  ],
  allStreams: [
    'all streams',
    'streams',
    'quantity',
    'units',
    'plays',
    'stream count',
    'units sold',
  ],
  perStreamRate: [
    'per stream rate',
    'unit price',
    'rate',
    'per unit',
    'price per unit',
  ],
  gross: [
    'gross',
    'revenue',
    'royalty',
    'earnings',
    'net revenue',
    'amount',
    'net payable',
    'client payable',
    'total',
  ],
};

const normalize = (s: string) =>
  (s ?? '')
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');

// Real-world exports sometimes carry a title/metadata row above the actual
// header row. Treat the row (within the first 10) with the most non-empty
// cells as the header row, rather than always assuming row 0.
const findHeaderRowIndex = (rows: unknown[][]): number => {
  let bestIdx = 0;
  let bestCount = -1;
  const limit = Math.min(rows.length, 10);
  for (let i = 0; i < limit; i++) {
    const row = rows[i] ?? [];
    const count = row.filter(
      cell => cell !== null && cell !== undefined && String(cell).trim() !== '',
    ).length;
    if (count > bestCount) {
      bestCount = count;
      bestIdx = i;
    }
  }
  return bestIdx;
};

export const parseFileBuffer = (
  buffer: Buffer,
  fileName: string,
): { headers: string[]; rows: Record<string, string>[] } => {
  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(buffer, { type: 'buffer' });
  } catch (error: any) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Could not read file "${fileName}". Please upload a valid .csv or .xlsx report.`,
    );
  }

  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  if (!worksheet) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'The file has no readable sheet.');
  }

  const grid: unknown[][] = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    defval: '',
    raw: false,
  });

  if (!grid.length) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'The file is empty.');
  }

  const headerRowIdx = findHeaderRowIndex(grid);
  const rawHeaders = (grid[headerRowIdx] ?? []).map(h => String(h ?? '').trim());
  const headers = rawHeaders.filter(h => h !== '');

  if (!headers.length) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Could not find a header row in this file.',
    );
  }

  const dataGrid = grid.slice(headerRowIdx + 1);

  const rows: Record<string, string>[] = [];
  for (const line of dataGrid) {
    const isBlank = line.every(
      cell => cell === null || cell === undefined || String(cell).trim() === '',
    );
    if (isBlank) continue;

    const row: Record<string, string> = {};
    rawHeaders.forEach((header, idx) => {
      if (!header) return;
      const val = line[idx];
      row[header] = val === null || val === undefined ? '' : String(val).trim();
    });
    rows.push(row);
  }

  return { headers, rows };
};

export const suggestMapping = (headers: string[]): ColumnMapping => {
  const normalizedHeaders = headers.map(h => ({ raw: h, norm: normalize(h) }));

  const findMatch = (field: TargetField): string | null => {
    const synonyms = SYNONYMS[field];
    // Exact match first, then "contains" as a fallback.
    for (const syn of synonyms) {
      const exact = normalizedHeaders.find(h => h.norm === syn);
      if (exact) return exact.raw;
    }
    for (const syn of synonyms) {
      const partial = normalizedHeaders.find(
        h => h.norm.includes(syn) || syn.includes(h.norm),
      );
      if (partial) return partial.raw;
    }
    return null;
  };

  const mapping = {} as ColumnMapping;
  TARGET_FIELDS.forEach(field => {
    const header = findMatch(field);
    mapping[field] = header
      ? ({ type: 'column', header } as FieldMapping)
      : ({ type: 'none' } as FieldMapping);
  });

  return mapping;
};

export const validateMapping = (mapping: ColumnMapping, headers: string[]) => {
  const headerSet = new Set(headers);
  for (const field of REQUIRED_FIELDS) {
    const m = mapping[field];
    if (!m || m.type === 'none') {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `Please map "${OUTPUT_HEADERS[field]}" before converting.`,
      );
    }
    if (m.type === 'column' && !headerSet.has(m.header)) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `Mapped column "${m.header}" for "${OUTPUT_HEADERS[field]}" was not found in the file.`,
      );
    }
    if (m.type === 'constant' && !m.value.trim()) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `Please provide a value for "${OUTPUT_HEADERS[field]}".`,
      );
    }
  }

  // Label is optional, but if it IS set to column/constant, that value must
  // still make sense — an empty "not mapped" selection resolves to `column`
  // with an empty header, which should be treated as unmapped, not an error.
  const label = mapping.label;
  if (label?.type === 'column' && label.header && !headerSet.has(label.header)) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Mapped column "${label.header}" for "Label" was not found in the file.`,
    );
  }
  if (label?.type === 'constant' && !label.value.trim()) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Please provide a value for "Label", or switch it to Auto-fill / Not mapped.',
    );
  }
};

const csvEscape = (value: string): string => {
  const v = value ?? '';
  if (/[",\n\r]/.test(v)) {
    return `"${v.replace(/"/g, '""')}"`;
  }
  return v;
};

export const rowsToCsv = (fieldOrder: TargetField[], rows: string[][]): string => {
  const headerLine = fieldOrder.map(f => csvEscape(OUTPUT_HEADERS[f])).join(',');
  const lines = rows.map(row => row.map(csvEscape).join(','));
  return [headerLine, ...lines].join('\r\n');
};

export const resolveField = (
  row: Record<string, string>,
  m: FieldMapping,
): string => {
  if (m.type === 'constant') return m.value;
  if (m.type === 'column') return row[m.header] ?? '';
  return ''; // 'none' or 'lookup' (lookup is resolved by the caller)
};

export const applyMapping = (
  row: Record<string, string>,
  mapping: ColumnMapping,
  labelLookup?: Map<string, string>,
): string[] => {
  const isrcValue = resolveField(row, mapping.isrc);

  return TARGET_FIELDS.map(field => {
    if (field === 'isrc') return isrcValue;
    if (field === 'label' && mapping.label.type === 'lookup') {
      return labelLookup?.get(isrcValue.trim().toUpperCase()) ?? '';
    }
    return resolveField(row, mapping[field]);
  });
};
