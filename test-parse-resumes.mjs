import { readFileSync } from 'fs';
import { extractResumeText, parseResumeWithAI } from './server/resumeParser.ts';

async function testResumeParsing() {
  console.log('=== Testing Resume Parsing ===\n');
  
  // Test 1: DOCX file
  console.log('1. Parsing KanishkGautam_Mulosoft.DOCX...');
  try {
    const docxBuffer = readFileSync('/home/ubuntu/upload/KanishkGautam_Mulosoft.DOCX');
    const docxText = await extractResumeText(docxBuffer, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    console.log(`Extracted text length: ${docxText.length} characters\n`);
    
    const docxParsed = await parseResumeWithAI(docxText);
    console.log('DOCX Parsing Results:');
    console.log(JSON.stringify(docxParsed, null, 2));
    console.log('\n---\n');
  } catch (error) {
    console.error('Error parsing DOCX:', error.message);
  }
  
  // Test 2: PDF file
  console.log('2. Parsing ChandanResumeRPADev.pdf...');
  try {
    const pdfBuffer = readFileSync('/home/ubuntu/upload/ChandanResumeRPADev.pdf');
    const pdfText = await extractResumeText(pdfBuffer, 'application/pdf');
    console.log(`Extracted text length: ${pdfText.length} characters\n`);
    
    const pdfParsed = await parseResumeWithAI(pdfText);
    console.log('PDF Parsing Results:');
    console.log(JSON.stringify(pdfParsed, null, 2));
  } catch (error) {
    console.error('Error parsing PDF:', error.message);
  }
}

testResumeParsing().catch(console.error);
