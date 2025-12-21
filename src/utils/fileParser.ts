import Papa from 'papaparse';
import * as XLSX from 'xlsx';

export type FileType = 'csv' | 'xlsx' | 'unknown';

export function detectFileType(file: File): FileType {
  const extension = file.name.split('.').pop()?.toLowerCase();
  if (extension === 'csv') return 'csv';
  if (extension === 'xlsx' || extension === 'xls') return 'xlsx';
  return 'unknown';
}

export async function parseCSV(file: File): Promise<any[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          reject(new Error(`CSV parsing errors: ${results.errors.map(e => e.message).join(', ')}`));
          return;
        }
        resolve(results.data);
      },
      error: (error) => {
        reject(error);
      },
    });
  });
}

export async function parseXLSX(file: File): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: null });
        resolve(jsonData);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => {
      reject(new Error('Failed to read XLSX file'));
    };
    reader.readAsBinaryString(file);
  });
}

export async function parseFile(file: File): Promise<any[]> {
  const fileType = detectFileType(file);
  
  if (fileType === 'csv') {
    return parseCSV(file);
  } else if (fileType === 'xlsx') {
    return parseXLSX(file);
  } else {
    throw new Error(`Unsupported file type: ${file.name}`);
  }
}

