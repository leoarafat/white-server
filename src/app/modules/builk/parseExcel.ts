import * as XLSX from 'xlsx';
import ApiError from '../../../errors/ApiError';

export const parseExcel = (buffer: Buffer) => {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    defval: null,
  });

  if (!jsonData || jsonData.length < 4) {
    throw new ApiError(400, 'Invalid Excel file format');
  }

  // Get headers from row index 1 (second row)
  const headers = jsonData[1] as string[];
  // const headers = jsonData[1].map((h: string) =>
  //   h ? h.trim().replace(/\s+/g, '_').replace(/[^\w]/g, '') : '',
  // );

  // Data starts from row index 3 (fourth row)
  const dataRows = jsonData.slice(3);

  const data = dataRows
    .map(row => {
      const obj: Record<string, any> = {};
      headers.forEach((header: string, index: number) => {
        // Handle empty cells and normalize values
        obj[header] = row[index] !== undefined ? row[index] : null;

        // Convert numeric UPC codes to strings
        if (header === 'UPC_Code' && typeof obj[header] === 'number') {
          obj[header] = obj[header].toString();
        }
      });
      return obj;
    })
    .filter(
      item =>
        // Validate required fields
        item.reference_filename_video &&
        item.thumbnail_image_name &&
        item.ISRC_code &&
        item.Video_Title,
    );

  return data;
};
