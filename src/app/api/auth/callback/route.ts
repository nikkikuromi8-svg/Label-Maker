import { NextRequest, NextResponse } from 'next/server';
import { getOAuthClient, saveToken } from '@/lib/googleAuth';

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  if (!code) return NextResponse.json({ error: 'No code' }, { status: 400 });

  const oAuth2Client = getOAuthClient();
  const { tokens } = await oAuth2Client.getToken(code);
  saveToken(tokens);

  return NextResponse.redirect(new URL('/', req.url));
}