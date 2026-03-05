'use client';

import { useState, useEffect } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import Link from 'next/link';

function StatusDot({ connected }: { connected: boolean }) {
  return (
    <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-gray-600'}`} />
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl p-6 space-y-4">
      <h2 className="text-base font-semibold text-white">{title}</h2>
      {children}
    </div>
  );
}

function InputRow({
  label,
  value,
  placeholder,
  type = 'text',
}: {
  label: string;
  value: string;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs text-gray-400">{label}</label>
      <input
        type={type}
        value={value}
        readOnly
        placeholder={placeholder}
        className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-gray-300 font-mono placeholder-gray-600 focus:outline-none focus:border-[#3a3a3a] cursor-not-allowed"
      />
      <p className="text-xs text-gray-600">
        Set via environment variable — update in Vercel dashboard, then redeploy.
      </p>
    </div>
  );
}

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const [testingFb, setTestingFb] = useState(false);
  const [fbTestResult, setFbTestResult] = useState<'ok' | 'fail' | null>(null);
  const [testingAi, setTestingAi] = useState(false);
  const [aiTestResult, setAiTestResult] = useState<'ok' | 'fail' | null>(null);
  const [youtubeChannelId, setYoutubeChannelId] = useState('');
  const [googleClientId, setGoogleClientId] = useState('');
  const [googleClientSecretSet, setGoogleClientSecretSet] = useState(false);
  const [anthropicKeySet, setAnthropicKeySet] = useState(false);

  useEffect(() => {
    fetch('/api/config')
      .then((r) => r.json())
      .then((d) => {
        setYoutubeChannelId(d.youtubeChannelId ?? '');
        setGoogleClientId(d.googleClientId ?? '');
        setGoogleClientSecretSet(!!d.googleClientSecretSet);
        setAnthropicKeySet(!!d.anthropicKeySet);
      })
      .catch(() => {});
  }, []);

  const testFacebook = async () => {
    setTestingFb(true);
    setFbTestResult(null);
    try {
      const res = await fetch('/api/facebook');
      const data = await res.json();
      setFbTestResult(data.connected ? 'ok' : 'fail');
    } catch {
      setFbTestResult('fail');
    } finally {
      setTestingFb(false);
    }
  };

  const testAI = async () => {
    setTestingAi(true);
    setAiTestResult(null);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videos: [] }),
      });
      // A 500 with "not configured" means no key; 400 "no video data" means key exists
      const data = await res.json();
      setAiTestResult(data.error?.includes('No video data') ? 'ok' : 'fail');
    } catch {
      setAiTestResult('fail');
    } finally {
      setTestingAi(false);
    }
  };

  const isAuthenticated = status === 'authenticated' && !!session?.accessToken;

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0a0a0a]/95 backdrop-blur border-b border-[#1a1a1a]">
        <div className="max-w-[900px] mx-auto px-4 sm:px-6 py-3 flex items-center gap-4">
          <Link
            href="/"
            className="p-2 rounded-lg hover:bg-[#1a1a1a] text-gray-400 hover:text-white transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="text-sm font-bold text-white">Settings</h1>
            <p className="text-xs text-gray-500">API configuration</p>
          </div>
        </div>
      </header>

      <main className="max-w-[900px] mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* YouTube / Google OAuth */}
        <Section title="YouTube (Google OAuth)">
          <div className="flex items-center gap-3 mb-2">
            <StatusDot connected={isAuthenticated} />
            <span className="text-sm text-gray-300">
              {isAuthenticated
                ? `Connected as ${session?.user?.email}`
                : 'Not connected'}
            </span>
          </div>

          {isAuthenticated ? (
            <button
              onClick={() => signOut()}
              className="px-4 py-2 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] hover:border-red-500/30 text-sm text-gray-400 hover:text-red-400 transition-colors"
            >
              Disconnect YouTube Account
            </button>
          ) : (
            <button
              onClick={() => signIn('google')}
              className="px-4 py-2 rounded-lg bg-[#FF0000] hover:bg-[#cc0000] text-white text-sm font-medium transition-colors"
            >
              Connect YouTube Account
            </button>
          )}

          <div className="border-t border-[#1a1a1a] pt-4 mt-4 space-y-3">
            <InputRow
              label="Google Client ID"
              value={googleClientId}
              placeholder="GOOGLE_CLIENT_ID"
            />
            <InputRow
              label="Google Client Secret"
              value={googleClientSecretSet ? '••••••••••••••••••••••••' : ''}
              placeholder="GOOGLE_CLIENT_SECRET"
              type="text"
            />
            <InputRow
              label="YouTube Channel ID"
              value={youtubeChannelId}
              placeholder="YOUTUBE_CHANNEL_ID"
            />
          </div>

          <div className="bg-[#1a1a1a] rounded-lg p-4 mt-2">
            <p className="text-xs text-gray-400 font-medium mb-2">Required OAuth Scopes</p>
            <ul className="space-y-1">
              {[
                'https://www.googleapis.com/auth/youtube.readonly',
                'https://www.googleapis.com/auth/yt-analytics.readonly',
              ].map((scope) => (
                <li key={scope} className="text-xs font-mono text-gray-500">
                  {scope}
                </li>
              ))}
            </ul>
          </div>
        </Section>

        {/* Facebook */}
        <Section title="Facebook (Graph API)">
          <div className="flex items-center gap-3 mb-4">
            <StatusDot connected={fbTestResult === 'ok'} />
            <span className="text-sm text-gray-300">
              {fbTestResult === 'ok'
                ? 'Connected'
                : fbTestResult === 'fail'
                ? 'Not connected or invalid credentials'
                : 'Not tested yet'}
            </span>
          </div>

          <div className="space-y-3">
            <InputRow
              label="Facebook Page Access Token"
              value=""
              placeholder="FACEBOOK_ACCESS_TOKEN"
              type="password"
            />
            <InputRow
              label="Facebook Page ID"
              value=""
              placeholder="FACEBOOK_PAGE_ID"
            />
          </div>

          <button
            onClick={testFacebook}
            disabled={testingFb}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] hover:border-[#3a3a3a] text-sm text-gray-300 hover:text-white transition-colors disabled:opacity-50 mt-2"
          >
            {testingFb ? (
              <div className="w-3.5 h-3.5 border border-gray-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            Test Connection
          </button>

          {fbTestResult && (
            <div className={`text-xs mt-2 px-3 py-2 rounded-lg ${
              fbTestResult === 'ok'
                ? 'bg-green-500/10 text-green-400'
                : 'bg-red-500/10 text-red-400'
            }`}>
              {fbTestResult === 'ok'
                ? '✓ Facebook API connected successfully'
                : '✗ Facebook API not configured or credentials invalid'}
            </div>
          )}

          <p className="text-xs text-gray-600 mt-3">
            Facebook integration is optional. Leave empty to show "Not connected" in the dashboard.
            Videos will still be fully functional with YouTube-only data.
          </p>
        </Section>

        {/* Script Generation */}
        <Section title="Script Generation (Anthropic Claude)">
          <div className="flex items-center gap-3 mb-4">
            <StatusDot connected={aiTestResult === 'ok'} />
            <span className="text-sm text-gray-300">
              {aiTestResult === 'ok'
                ? 'Connected'
                : aiTestResult === 'fail'
                ? 'Not configured'
                : 'Not tested yet'}
            </span>
          </div>

          <InputRow
            label="Anthropic API Key"
            value={anthropicKeySet ? '••••••••••••••••••••••••' : ''}
            placeholder="ANTHROPIC_API_KEY"
            type="text"
          />

          <button
            onClick={testAI}
            disabled={testingAi}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] hover:border-[#3a3a3a] text-sm text-gray-300 hover:text-white transition-colors disabled:opacity-50 mt-2"
          >
            {testingAi ? (
              <div className="w-3.5 h-3.5 border border-gray-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            Test Key
          </button>

          {aiTestResult && (
            <div className={`text-xs mt-2 px-3 py-2 rounded-lg ${
              aiTestResult === 'ok'
                ? 'bg-green-500/10 text-green-400'
                : 'bg-red-500/10 text-red-400'
            }`}>
              {aiTestResult === 'ok'
                ? '✓ Anthropic API key is valid'
                : '✗ ANTHROPIC_API_KEY is not configured or invalid'}
            </div>
          )}

          <div className="bg-[#1a1a1a] rounded-lg p-4 mt-3">
            <p className="text-xs text-gray-400 font-medium mb-1">Model</p>
            <p className="text-xs font-mono text-gray-500">claude-sonnet-4-20250514</p>
          </div>
        </Section>

        {/* Environment Variables Reference */}
        <Section title="Environment Variables Reference">
          <div className="space-y-2">
            {[
              { key: 'GOOGLE_CLIENT_ID', desc: 'Google OAuth client ID' },
              { key: 'GOOGLE_CLIENT_SECRET', desc: 'Google OAuth client secret' },
              { key: 'YOUTUBE_CHANNEL_ID', desc: 'Your YouTube channel ID' },
              { key: 'NEXTAUTH_SECRET', desc: 'Random secret (openssl rand -base64 32)' },
              { key: 'NEXTAUTH_URL', desc: 'Your deployed URL (e.g. https://your-app.vercel.app)' },
              { key: 'FACEBOOK_ACCESS_TOKEN', desc: 'Facebook Page Access Token (optional)' },
              { key: 'FACEBOOK_PAGE_ID', desc: 'Facebook Page ID (optional)' },
              { key: 'ANTHROPIC_API_KEY', desc: 'Anthropic API key for script generation' },
            ].map(({ key, desc }) => (
              <div key={key} className="flex items-start gap-3">
                <code className="text-xs font-mono text-gray-300 bg-[#1a1a1a] px-2 py-1 rounded shrink-0">
                  {key}
                </code>
                <span className="text-xs text-gray-500 mt-1">{desc}</span>
              </div>
            ))}
          </div>
        </Section>
      </main>
    </div>
  );
}
