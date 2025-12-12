import { readFileSync } from 'fs';
import { PDFParse } from 'pdf-parse';

async function testPDFParsing() {
  try {
    console.log('Reading PDF file...');
    const buffer = readFileSync('/home/ubuntu/upload/ChandanResumeRPADev.pdf');
    console.log('Buffer size:', buffer.length);
    
    console.log('Creating PDF parser...');
    const parser = new PDFParse({ data: buffer });
    
    console.log('Extracting text...');
    const result = await parser.getText();
    
    console.log('Text extracted successfully!');
    console.log('Text length:', result.text.length);
    console.log('First 500 characters:');
    console.log(result.text.substring(0, 500));
    
    await parser.destroy();
    console.log('\n✅ PDF parsing works!');
  } catch (error) {
    console.error('❌ PDF parsing failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

testPDFParsing();
