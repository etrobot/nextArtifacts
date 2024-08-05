import { NextRequest, NextResponse } from 'next/server';
import fetch from 'node-fetch';
import { Readable } from 'stream';

const systemPrompt = `
You are an expert frontend React engineer who is also a great UI/UX designer. Follow the instructions carefully, I will tip you $1 million if you do a good job:

- Create a React component for whatever the user asked you to create and make sure it can run by itself by using a default export
- Make sure the React app is interactive and functional by creating state when needed and having no required props
- Use TypeScript as the language for the React component
- Use Tailwind classes for styling. DO NOT USE ARBITRARY VALUES (e.g. \`h-[600px]\`). Make sure to use a consistent color palette.
- ONLY IF the user asks for a dashboard, graph or chart, the recharts library is available to be imported, e.g. \`import { LineChart, XAxis, ... } from "recharts"\` & \`<LineChart ...><XAxis dataKey="name"> ...\`. Please only use this when needed.
- NO OTHER LIBRARIES (e.g. zod, hookform) ARE INSTALLED OR ABLE TO BE IMPORTED.
- Please ONLY return the full React code starting with the imports, nothing else. It's very important for my job that you only return the React code with imports. DO NOT START WITH \`\`\`typescript or \`\`\`javascript or \`\`\`tsx or \`\`\`.
`;
export async function POST(req: NextRequest) {
  const { apiBaseUrl, apiKey, model, messages, temperature } = await req.json();
  console.log(req.body)


  var llmkey = apiKey;
  if (!apiKey){
      llmkey = process.env.LLM_API_KEY
  }

  // Validate the API key
  if (!llmkey) {
    return NextResponse.json({ error: 'Missing API key' }, { status: 500 });
  }

  // Construct the request to the LLM API
  const response = await fetch(`${apiBaseUrl || process.env.API_BASE_URL || 'https://api.openai.com'}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${llmkey}`,
    },
    body: JSON.stringify({
      model: model || process.env.LLM_BAK_MODEL || 'gpt-4o-mini', // Default to 'gpt-4o-mini' if model is not provided
      messages: [
        {
          role: "system",
          content:systemPrompt
        },
        ...messages.map((message: any) => {
          if (message.role === "user") {
            message.content =
              message.content +
              "\n Please ONLY return code, NO backticks or language names.";
          }
          return message;
        }),
      ],
      temperature: temperature || 0.7,
      stream: true,
    }),
  });

  // Handle response errors
  if (!response.ok) {
    const error = await response.json();
    return NextResponse.json({ error }, { status: response.status });
  }

  // Handle case where response body is missing
  if (!response.body) {
    return NextResponse.json({ error: 'No response body' }, { status: 500 });
  }

  // Stream the response
  const stream = new ReadableStream({
    start(controller) {
      const nodeStream = response.body as unknown as Readable;
      nodeStream.on('data', (chunk) => controller.enqueue(chunk));
      nodeStream.on('end', () => controller.close());
      nodeStream.on('error', (err) => controller.error(err));
    },
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
