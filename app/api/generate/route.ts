import { NextRequest, NextResponse } from 'next/server';
import { ROM_SCRIPTWRITING_SYSTEM_PROMPT } from '@/lib/romPrompt';
import { MatchedVideo } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 });
    }

    const { videos }: { videos: MatchedVideo[] } = await req.json();

    if (!videos || videos.length === 0) {
      return NextResponse.json({ error: 'No video data provided' }, { status: 400 });
    }

    const sorted = [...videos].sort((a, b) => b.totalViews - a.totalViews);
    const topByViews = sorted.slice(0, 5);

    const bestRetention = [...videos]
      .filter((v) => v.ytVideo.swipeAwayRate > 0)
      .sort((a, b) => a.ytVideo.swipeAwayRate - b.ytVideo.swipeAwayRate)
      .slice(0, 3);

    const userMessage = `Based on these top performing ROM videos from the last 7 days:

TOP BY VIEWS:
${topByViews
  .map(
    (v) =>
      `- "${v.ytVideo.title}" — ${v.totalViews.toLocaleString()} total views (YT: ${v.ytVideo.views.toLocaleString()}, FB: ${(v.fbVideo?.views || 0).toLocaleString()})`
  )
  .join('\n')}

BEST HOOKS (lowest swipe-away rate):
${
  bestRetention.length > 0
    ? bestRetention
        .map(
          (v) =>
            `- "${v.ytVideo.title}" — ${v.ytVideo.swipeAwayRate}% swipe-away rate, ${v.ytVideo.avgRetention}% avg retention`
        )
        .join('\n')
    : '- No retention data available yet'
}

The videos with the lowest swipe-away rates have the strongest hooks — their first lines are stopping people from scrolling. Use those as inspiration for the hook lines of your new scripts.

Generate 3 new video ideas that combine what's working (high views + strong hooks) with trending topics in entertainment, internet culture, sports, and viral stories.

For each idea, provide:
1. IDEA: [one-line concept]
2. WHY: [one sentence — reference both the view trend AND hook insight]
3. SCRIPT: [full ROM-style voiceover script]

Remember: Output ONLY the voiceover lines in each script. No scene directions, no labels. Each line separated by a blank line.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        system: ROM_SCRIPTWRITING_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userMessage }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Anthropic API error: ${response.status} ${err}`);
    }

    const data = await response.json();
    const rawText: string = data.content?.[0]?.text || '';

    // Parse the response into structured ideas
    const ideas = parseGeneratedContent(rawText);

    return NextResponse.json({ ideas, raw: rawText });
  } catch (error: any) {
    console.error('Generate error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function parseGeneratedContent(raw: string): { idea: string; why: string; script: string }[] {
  const ideas: { idea: string; why: string; script: string }[] = [];

  // Split by numbered idea blocks (1., 2., 3.)
  const blocks = raw.split(/(?=(?:^|\n)(?:IDEA\s*\d*:|1\.|2\.|3\.))/m).filter(Boolean);

  for (const block of blocks) {
    const ideaMatch = block.match(/IDEA:\s*(.+)/i);
    const whyMatch = block.match(/WHY:\s*(.+)/i);
    const scriptMatch = block.match(/SCRIPT:\s*([\s\S]+?)(?=(?:IDEA:|$))/i);

    if (ideaMatch && whyMatch && scriptMatch) {
      ideas.push({
        idea: ideaMatch[1].trim(),
        why: whyMatch[1].trim(),
        script: scriptMatch[1].trim(),
      });
    }
  }

  // If parsing failed, return raw split into 3 chunks
  if (ideas.length === 0 && raw.trim()) {
    return [{ idea: 'Generated Idea', why: 'Based on top performing content', script: raw.trim() }];
  }

  return ideas.slice(0, 3);
}
