const XLSX = require('xlsx');


const filePath = `C:/Users/xyy/Desktop/1_N1454-4600TEU电缆清册.xlsx`; 
const workbook = XLSX.readFile(filePath);


const sheetName = workbook.SheetNames[2];
const sheet = workbook.Sheets[sheetName];


const rows = XLSX.utils.sheet_to_json(sheet);


rows.forEach((row, index) => {
    console.log(`Row ${index + 1}:`, row);
});


