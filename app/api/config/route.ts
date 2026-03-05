import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    youtubeChannelId: process.env.YOUTUBE_CHANNEL_ID ?? '',
    googleClientId: process.env.GOOGLE_CLIENT_ID ?? '',
    googleClientSecretSet: !!process.env.GOOGLE_CLIENT_SECRET,
    anthropicKeySet: !!process.env.ANTHROPIC_API_KEY,
  });
}
