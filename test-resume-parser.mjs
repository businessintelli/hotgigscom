import { extractResumeText, parseResumeWithAI } from './server/resumeParser.ts';
import * as fs from 'fs/promises';

async function testResumeParsing() {
  console.log('=== Testing Resume Parser ===\n');
  
  // Test PDF resume
  console.log('1. Parsing PDF Resume (Chandan Aggarwal)...');
  const pdfBuffer = await fs.readFile('/home/ubuntu/upload/ChandanResumeRPADev.pdf');
  const pdfText = await extractResumeText(pdfBuffer, 'application/pdf');
  console.log(`Extracted ${pdfText.length} characters from PDF\n`);
  
  const pdfParsed = await parseResumeWithAI(pdfText);
  console.log('PDF Parsed Data:');
  console.log(JSON.stringify(pdfParsed, null, 2));
  console.log('\n---\n');
  
  // Test DOCX resume
  console.log('2. Parsing DOCX Resume (Kanishk Gautam)...');
  const docxBuffer = await fs.readFile('/home/ubuntu/upload/KanishkGautam_Mulosoft.DOCX');
  const docxText = await extractResumeText(docxBuffer, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
  console.log(`Extracted ${docxText.length} characters from DOCX\n`);
  
  const docxParsed = await parseResumeWithAI(docxText);
  console.log('DOCX Parsed Data:');
  console.log(JSON.stringify(docxParsed, null, 2));
}

testResumeParsing().catch(console.error);
