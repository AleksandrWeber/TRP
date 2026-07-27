import { useState } from 'react';

type Props = {
  value: string;
  label?: string;
  className?: string;
};

export function CopyButton({ value, label = 'Copy', className = '' }: Props) {
  const [copied, setCopied] = useState(false);

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error('[clipboard]', err);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void onCopy()}
      title={`Copy ${value}`}
      aria-label={`Copy ${value}`}
      className={`inline-flex items-center rounded border border-white/15 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-slate-400 hover:bg-white/5 hover:text-slate-200 ${className}`}
    >
      {copied ? 'Copied' : label}
    </button>
  );
}
