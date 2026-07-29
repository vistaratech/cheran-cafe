import { NextResponse } from 'next/server';

/**
 * GET /api/auth/google/config
 *
 * Returns the Google OAuth client ID for the client-side button.
 * The client ID is public by nature (it's embedded in the frontend),
 * but we serve it from the server to avoid NEXT_PUBLIC_ env vars.
 */
export async function GET() {
  const clientId = process.env.GOOGLE_CLIENT_ID;

  if (!clientId) {
    return NextResponse.json({ enabled: false });
  }

  return NextResponse.json({ enabled: true, clientId });
}
