'use client';
import { useMemo, useState } from 'react';
import { createHttpTransport, normalizeImage, type UploadedImage, type ImageReplaceResult, type UploadTransport } from 'react_free_upload-core';
import { ImageUploader } from './image-uploader';
const initial: UploadedImage = { path: 'fixtures/original.svg', url: '/original.svg' };
const scenarios = ['New image', 'Replace image', 'Failure & retry', 'Custom transport'] as const;
type Scenario = typeof scenarios[number];
const customTransport: UploadTransport = async (file, { signal }) => {
  const form = new FormData(); form.append('asset', file);
  const response = await fetch('/api/alternative', { method: 'POST', body: form, signal });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error ?? 'Alternative API upload failed.');
  return normalizeImage({ path: payload.asset?.key, url: payload.asset?.preview, imageId: payload.asset?.id });
};
function ScenarioPanel({ scenario }: { scenario: Scenario }) {
  const [value, setValue] = useState<UploadedImage | null>(scenario === 'New image' || scenario === 'Custom transport' ? null : initial);
  const [path, setPath] = useState(value?.path ?? '');
  const [replacement, setReplacement] = useState<ImageReplaceResult | null>(null);
  const [replaceCalls, setReplaceCalls] = useState(0);
  const [fail, setFail] = useState(scenario === 'Failure & retry');
  const [slow, setSlow] = useState(false);
  const [oldUrl, setOldUrl] = useState('');
  const [oldExists, setOldExists] = useState('');
  const transport = useMemo(() => scenario === 'Custom transport' ? customTransport : createHttpTransport({ endpoint: `/api/uploads?fail=${Number(fail)}&slow=${Number(slow)}` }), [scenario, fail, slow]);
  return <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
    <div>
      <h2 className="mb-3 text-2xl font-semibold">{scenario}</h2>
      <p className="mb-6 max-w-prose text-sm leading-6 text-zinc-600">{scenario === 'New image' ? 'Upload an image and watch the canonical path flow into React form state.' : scenario === 'Custom transport' ? 'A custom fetch function sends an asset field and maps a nested response. Progress is indeterminate.' : 'The current image stays visible until its replacement succeeds. Failure and cancellation preserve the current path.'}</p>
      <form onSubmit={event => event.preventDefault()}>
        <ImageUploader label="Upload image" value={value} transport={transport} onChange={setValue} onUploadComplete={result => setPath(result.path)} onReplace={result => { setReplacement(result); setReplaceCalls(n => n + 1); setOldUrl(value?.url ?? ''); setOldExists(''); }} />
      </form>
      {scenario !== 'Custom transport' && <fieldset className="mt-6 grid gap-3 border-t border-zinc-300 pt-4"><legend className="px-1 text-sm font-semibold">Development test controls</legend><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={fail} onChange={e => setFail(e.target.checked)} /> Simulate server failure</label><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={slow} onChange={e => setSlow(e.target.checked)} /> Delay response for cancellation (2 seconds)</label></fieldset>}
    </div>
    <aside className="min-w-0 border-t border-zinc-300 pt-6 lg:border-t-0 lg:pt-0">
      <h3 className="mb-4 text-lg font-semibold">Form state</h3>
      <label className="grid gap-2 text-sm">React imagePath<input data-testid="form-path" readOnly value={path} onFocus={e => e.target.select()} className="min-w-0 w-full rounded-md border border-zinc-400 bg-white p-3 font-mono text-xs" /></label>
      <p className="mt-2 text-sm text-zinc-600">Select the field to copy its canonical value.</p>
      <h3 className="mb-3 mt-8 text-lg font-semibold">Replacement receipt</h3>
      <p className="mb-3 text-sm">onReplace calls: <output data-testid="replace-calls">{replaceCalls}</output></p>
      <pre data-testid="replacement" className="rounded-md border border-zinc-300 bg-zinc-50 p-4 text-zinc-800">{replacement ? JSON.stringify(replacement, null, 2) : 'No successful replacement yet.'}</pre>
      {replacement && <div className="mt-4 grid gap-2"><button className="justify-self-start rounded-md border border-zinc-400 px-3 py-2 text-sm" type="button" onClick={async () => { try { const response = await fetch(oldUrl); setOldExists(response.ok ? 'Old image still exists (HTTP 200).' : `Old image check returned HTTP ${response.status}.`); } catch { setOldExists('Could not check the old image. Retry the check.'); } }}>Verify old image still exists</button><p role="status" className="text-sm">{oldExists}</p></div>}
      <p className="mt-8 border-t border-zinc-300 pt-4 text-sm leading-6 text-zinc-600">This component was installed by the local CLI, then edited here: the image tile and preview card use local lab instructions.</p>
    </aside>
  </div>;
}
export function UploadLab() {
  const [scenario, setScenario] = useState<Scenario>('New image');
  return <main className="mx-auto max-w-5xl px-5 py-10 sm:px-10 sm:py-14">
    <header className="mb-9 flex flex-wrap items-start justify-between gap-5 border-b border-zinc-300 pb-8"><div><h1 className="text-2xl font-semibold tracking-tight">Image upload lab</h1><p className="mt-3 max-w-prose text-zinc-600">Choose a file. Inspect the result. Replace with confidence.</p></div><p className="rounded-md border border-emerald-700 px-3 py-2 text-sm text-emerald-900">Local development only</p></header>
    <nav aria-label="Upload scenarios" className="mb-10 flex flex-wrap gap-2">{scenarios.map(item => <button type="button" key={item} aria-pressed={scenario === item} onClick={() => setScenario(item)} className={`rounded-md px-4 py-3 text-sm ${scenario === item ? 'bg-zinc-900 text-white' : 'border border-zinc-300 bg-white text-zinc-700'}`}>{item}</button>)}</nav>
    <ScenarioPanel key={scenario} scenario={scenario} />
    <footer className="mt-14 border-t border-zinc-300 pt-5 text-sm text-zinc-600">Test files stay in this app. Images are never automatically deleted. Canonical paths and display URLs are separate values.</footer>
  </main>;
}
