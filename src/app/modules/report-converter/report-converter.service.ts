import crypto from 'crypto';
import ApiError from '../../../errors/ApiError';
import httpStatus from 'http-status';
import { logger } from '../../../shared/logger';
import { ReportConverterTemplate } from './report-converter-template-model';
import { SingleTrack } from '../single-track/single.model';
import { Album } from '../album/album.model';
import { Video } from '../videos/videos.model';
import {
  ColumnMapping,
  ConversionJob,
  TARGET_FIELDS,
} from './report-converter.interface';
import {
  applyMapping,
  parseFileBuffer,
  resolveField,
  rowsToCsv,
  suggestMapping,
  validateMapping,
} from './report-converter.utils';

// Single-process in-memory job store. Good enough for an admin-only utility
// that never writes to the database — nothing here needs to survive a
// restart or be visible across instances.
const jobs = new Map<string, ConversionJob>();

const JOB_TTL_MS = 30 * 60 * 1000;
const ROWS_PER_TICK = 500;

setInterval(() => {
  const cutoff = Date.now() - JOB_TTL_MS;
  for (const [id, job] of jobs) {
    if (job.createdAt < cutoff) jobs.delete(id);
  }
}, 5 * 60 * 1000).unref();

const getJobOrThrow = (jobId: string): ConversionJob => {
  const job = jobs.get(jobId);
  if (!job) {
    throw new ApiError(httpStatus.NOT_FOUND, 'This conversion job was not found or has expired.');
  }
  return job;
};

const analyzeUpload = (file: { originalname: string; buffer: Buffer }) => {
  const { headers, rows } = parseFileBuffer(file.buffer, file.originalname);

  const jobId = crypto.randomUUID();
  const job: ConversionJob = {
    id: jobId,
    fileName: file.originalname,
    headers,
    rows,
    totalRows: rows.length,
    processedRows: 0,
    status: 'ready',
    createdAt: Date.now(),
  };
  jobs.set(jobId, job);

  const suggestedMapping = suggestMapping(headers);

  return {
    jobId,
    fileName: file.originalname,
    headers,
    totalRows: rows.length,
    sampleRows: rows.slice(0, 5),
    suggestedMapping,
  };
};

// Looks up each ISRC's real label from our own catalog (SingleTrack, Album's
// nested audio tracks, Video) — used when a store's report never includes a
// label column at all, so the converted CSV doesn't ship with `label` blank.
const buildIsrcLabelMap = async (
  isrcs: string[],
): Promise<Map<string, string>> => {
  const map = new Map<string, string>();
  if (!isrcs.length) return map;

  // Query with both the raw and upper-cased forms — cheap (it's just a
  // membership list) and avoids missing matches from case differences
  // between a store's export and how the ISRC was originally entered.
  const queryIsrcs = [
    ...new Set(isrcs.flatMap(i => [i, i.toUpperCase()])),
  ];

  const [singles, albums, videos] = await Promise.all([
    SingleTrack.find({ isrc: { $in: queryIsrcs } })
      .select('isrc label')
      .lean(),
    Album.aggregate([
      { $unwind: '$audio' },
      { $match: { 'audio.isrc': { $in: queryIsrcs } } },
      { $project: { _id: 0, isrc: '$audio.isrc', label: '$audio.label' } },
    ]),
    Video.find({ isrc: { $in: queryIsrcs } })
      .select('isrc label')
      .lean(),
  ]);

  const fill = (rows: { isrc?: string; label?: string }[]) => {
    for (const r of rows) {
      if (!r.isrc || !r.label) continue;
      const key = r.isrc.trim().toUpperCase();
      if (!map.has(key)) map.set(key, r.label);
    }
  };
  fill(singles as any);
  fill(albums as any);
  fill(videos as any);

  return map;
};

const runConversion = async (job: ConversionJob, mapping: ColumnMapping) => {
  let labelLookup: Map<string, string> | undefined;

  if (mapping.label.type === 'lookup') {
    job.phase = 'Looking up labels from your catalog…';
    const isrcSet = new Set<string>();
    for (const row of job.rows) {
      const v = resolveField(row, mapping.isrc).trim();
      if (v) isrcSet.add(v);
    }
    labelLookup = await buildIsrcLabelMap([...isrcSet]);
  }

  job.phase = undefined;
  const outputRows: string[][] = new Array(job.rows.length);

  await new Promise<void>(resolve => {
    const processBatch = () => {
      const start = job.processedRows;
      const end = Math.min(start + ROWS_PER_TICK, job.rows.length);

      for (let i = start; i < end; i++) {
        outputRows[i] = applyMapping(job.rows[i], mapping, labelLookup);
      }
      job.processedRows = end;

      if (end < job.rows.length) {
        setImmediate(processBatch);
        return;
      }
      resolve();
    };

    setImmediate(processBatch);
  });

  const csv = rowsToCsv([...TARGET_FIELDS], outputRows);
  const base = job.fileName.replace(/\.[^.]+$/, '');
  job.resultCsv = csv;
  job.resultFileName = `${base}-converted.csv`;
  job.status = 'done';
};

const startConversion = (jobId: string, mapping: ColumnMapping) => {
  const job = getJobOrThrow(jobId);
  if (job.status === 'converting') {
    return { status: job.status };
  }

  validateMapping(mapping, job.headers);

  job.status = 'converting';
  job.processedRows = 0;
  job.error = undefined;
  job.phase = undefined;

  runConversion(job, mapping).catch(error => {
    job.status = 'error';
    job.error = error?.message || 'Conversion failed.';
    logger.error('report-converter conversion failed:', error);
  });

  return { status: job.status };
};

const getStatus = (jobId: string) => {
  const job = getJobOrThrow(jobId);
  const percent =
    job.totalRows === 0
      ? 100
      : Math.floor((job.processedRows / job.totalRows) * 100);

  return {
    status: job.status,
    fileName: job.fileName,
    totalRows: job.totalRows,
    processedRows: job.processedRows,
    percent,
    phase: job.phase ?? null,
    error: job.error ?? null,
  };
};

const getDownload = (jobId: string) => {
  const job = getJobOrThrow(jobId);
  if (job.status !== 'done' || !job.resultCsv) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'This report has not finished converting yet.');
  }
  return { csv: job.resultCsv, fileName: job.resultFileName as string };
};

const listTemplates = async () => {
  return ReportConverterTemplate.find().sort({ name: 1 });
};

const saveTemplate = async (
  name: string,
  mapping: ColumnMapping,
  createdBy?: string,
) => {
  if (!name?.trim()) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Store/DSP name is required.');
  }
  const trimmed = name.trim();
  const template = await ReportConverterTemplate.findOneAndUpdate(
    { name: trimmed },
    { name: trimmed, mapping, createdBy },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  return template;
};

const deleteTemplate = async (id: string) => {
  const result = await ReportConverterTemplate.findByIdAndDelete(id);
  if (!result) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Template not found.');
  }
  return result;
};

export const ReportConverterService = {
  analyzeUpload,
  startConversion,
  getStatus,
  getDownload,
  listTemplates,
  saveTemplate,
  deleteTemplate,
};
