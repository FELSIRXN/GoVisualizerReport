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
        
        // Iterate through all sheets
        const allData: any[] = [];
        
        workbook.SheetNames.forEach((sheetName) => {
          // Identify sheet type based on name
          const sheetNameLower = sheetName.toLowerCase();
          let sourceType: 'merchant' | 'channel' | 'unknown' = 'unknown';
          
          if (sheetNameLower.includes('merchant')) {
            sourceType = 'merchant';
          } else if (sheetNameLower.includes('channel')) {
            sourceType = 'channel';
          }
          
          // Skip unknown sheets (or include them - for now we include all)
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: null }) as any[];
          
          // Add sourceType to each row
          jsonData.forEach((row) => {
            row._sourceType = sourceType;
            row._sheetName = sheetName;
          });
          
          allData.push(...jsonData);
        });
        
        resolve(allData);
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

