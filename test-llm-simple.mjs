import { invokeLLM } from './server/_core/llm.ts';

async function testLLM() {
  console.log('Testing LLM API...\n');
  
  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: "Say hello in JSON format with a 'message' field." }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "greeting",
          strict: true,
          schema: {
            type: "object",
            properties: {
              message: { type: "string" }
            },
            required: ["message"],
            additionalProperties: false
          }
        }
      }
    });
    
    console.log('Response:', JSON.stringify(response, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testLLM();
