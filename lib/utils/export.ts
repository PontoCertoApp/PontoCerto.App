import * as XLSX from 'xlsx';

export function exportToExcel(data: any[], fileName: string) {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Relatório');
  
  // Professional filename with date
  const date = new Date().toISOString().split('T')[0];
  const fullFileName = `${fileName}_${date}.xlsx`;
  
  XLSX.writeFile(workbook, fullFileName);
}
