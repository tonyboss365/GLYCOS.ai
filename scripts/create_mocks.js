import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import PDFDocument from 'pdfkit';
import XLSX from 'xlsx';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure mocks directory exists
const mocksDir = path.join(__dirname, '..', 'mocks');
if (!fs.existsSync(mocksDir)) {
  fs.mkdirSync(mocksDir);
}

// Generate PDF Report
function generatePdfReport() {
  const doc = new PDFDocument();
  const pdfPath = path.join(mocksDir, 'mock_patient_report.pdf');
  const stream = fs.createWriteStream(pdfPath);
  
  doc.pipe(stream);

  // Title
  doc.font('Helvetica-Bold').fontSize(18).text('GLYCOS CLINICAL METABOLIC ASSESSMENT REPORT', { align: 'center' });
  doc.moveDown();
  
  // Metadata
  doc.font('Helvetica').fontSize(10).text('REPORT REFERENCE: SMC-738920');
  doc.text('STATUS: COMPLETED');
  doc.text('PATIENT INGESTION: JANE DOE');
  doc.text('DATE OF RECORDING: OCTOBER 24, 2024');
  doc.moveDown(2);

  // Section
  doc.font('Helvetica-Bold').fontSize(14).text('Patient Biomarker Panel Details:');
  doc.moveDown();

  // Biomarkers list
  const biomarkers = [
    '- Pregnancies: 3 count',
    '- Glucose Concentration: 145 mg/dL',
    '- Diastolic Blood Pressure: 78 mmHg',
    '- Triceps Skin Fold Thickness: 23 mm',
    '- 2-Hour Serum Insulin: 110 uU/mL',
    '- Body Mass Index (BMI): 28.4',
    '- Diabetes Pedigree Function: 0.420',
    '- Age: 36 years old'
  ];

  doc.font('Helvetica-Oblique').fontSize(11);
  biomarkers.forEach(line => {
    doc.text(line);
    doc.moveDown(0.5);
  });

  doc.moveDown();
  doc.font('Helvetica').fontSize(9).text('Disclaimer: This mock document is created for system integration testing purposes.', { align: 'center', color: 'gray' });

  doc.end();

  console.log(`Created PDF mock report at: ${pdfPath}`);
}

// Generate Excel Report
function generateExcelReport() {
  const xlsxPath = path.join(mocksDir, 'mock_patient_report.xlsx');
  
  const data = [
    ["Biomarker Factor", "Ingested Value", "Clinical Unit", "Reference Standard"],
    ["Pregnancies", 3, "count", "N/A"],
    ["Glucose", 145, "mg/dL", "70 - 140"],
    ["BloodPressure", 78, "mmHg", "60 - 80"],
    ["SkinThickness", 23, "mm", "10 - 50"],
    ["Insulin", 110, "uU/mL", "16 - 166"],
    ["BMI", 28.4, "kg/m^2", "18.5 - 24.9"],
    ["DiabetesPedigree", 0.42, "ratio", "0.08 - 2.42"],
    ["Age", 36, "years", "Adult"]
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Clinical Panel");
  
  XLSX.writeFile(workbook, xlsxPath);
  console.log(`Created Excel mock report at: ${xlsxPath}`);
}

generatePdfReport();
generateExcelReport();
