import { Ollama } from '@langchain/ollama';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { question } = await req.json();
    
    const model = new Ollama({
      baseUrl: 'http://localhost:11434',
      model: 'codeqwen',
      // stream: true,
    });

    const result = await model.invoke(question);
    return NextResponse.json({result});
  }
  catch(error){
    NextResponse.status(500).error(error.message).headers({'Content-Type': 'application/json'})
  }
}