import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Store active connections
const clients: any[] = [];

// Function to send updates to all connected clients
export function sendOrderUpdate() {
  clients.forEach(client => {
    if (client.res.writable) {
      client.res.write(`data: ${JSON.stringify({ type: 'orders_update', timestamp: Date.now() })}\n\n`);
    }
  });
}

// Middleware to handle SSE connections
export async function GET(request: NextRequest) {
  // Create a readable stream
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();
  
  // Set up the response headers for SSE
  const headers = {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  };
  
  // Add client to the list
  const clientId = Date.now();
  const newClient = {
    id: clientId,
    res: writer,
  };
  
  clients.push(newClient);
  
  // Send an initial connection message
  writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'connected', clientId })}\n\n`));
  
  // Remove client on disconnect
  request.signal.addEventListener('abort', () => {
    const index = clients.findIndex(client => client.id === clientId);
    if (index !== -1) {
      clients.splice(index, 1);
    }
    writer.close();
  });
  
  // Return the response with the stream
  return new NextResponse(readable, { headers });
}