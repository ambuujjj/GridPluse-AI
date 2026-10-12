'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Bot, X, Send, Sparkles } from 'lucide-react';

const prompts = ['Explain the current forecast', 'What are the main demand drivers?', 'Summarize current model performance'];

export default function Copilot() {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<{ role: string; text: string }[]>([]);
  const pathname = usePathname();

  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === 'k') {
        event.preventDefault(); setOpen((value) => !value);
      }
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', listener);
    return () => window.removeEventListener('keydown', listener);
  }, []);

  function ask(text: string) {
    const prompt = text.trim();
    if (!prompt) return;
    setMessages((items) => [...items, { role: 'you', text: prompt }, { role: 'copilot', text: answerFor(prompt, pathname) }]);
    setQuestion('');
  }

  return <>
    {open && <section className="fixed bottom-24 right-6 z-[70] flex h-[min(580px,calc(100vh-120px))] w-[min(410px,calc(100vw-32px))] flex-col overflow-hidden rounded-2xl border border-cyan-400/20 bg-[#0c1422] shadow-2xl shadow-cyan-950/40" aria-label="GridPulse AI Copilot">
      <header className="flex items-center justify-between border-b border-white/10 p-4"><div className="flex items-center gap-3"><div className="rounded-xl bg-cyan-400/10 p-2 text-cyan-300"><Sparkles size={18}/></div><div><div className="text-sm font-semibold text-white">GridPulse Copilot</div><div className="text-xs text-slate-400">Grounded in this workspace · {pathname}</div></div></div><button onClick={() => setOpen(false)} aria-label="Close copilot" className="text-slate-400 hover:text-white"><X size={18}/></button></header>
      <div className="flex-1 space-y-3 overflow-y-auto p-4"><div className="rounded-xl border border-white/5 bg-white/[0.03] p-3 text-sm leading-relaxed text-slate-300">I can interpret the current GridPulse view and its forecast metrics. Answers here use the dashboard’s displayed values and are labeled as estimates where the connected model does not expose that detail.</div>{messages.map((message, index) => <div key={index} className={`max-w-[90%] rounded-xl p-3 text-sm leading-relaxed ${message.role === 'you' ? 'ml-auto bg-blue-500/15 text-blue-100' : 'border border-white/5 bg-white/[0.04] text-slate-200'}`}><span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-slate-500">{message.role}</span>{message.text}</div>)}{messages.length === 0 && <div className="space-y-2 pt-2">{prompts.map((prompt) => <button key={prompt} onClick={() => ask(prompt)} className="block w-full rounded-lg border border-white/10 px-3 py-2 text-left text-xs text-slate-300 hover:border-cyan-400/30 hover:text-white">{prompt}</button>)}</div>}</div>
      <form onSubmit={(event) => { event.preventDefault(); ask(question); }} className="flex gap-2 border-t border-white/10 p-3"><input value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Ask about this dashboard…" className="min-w-0 flex-1 rounded-xl border border-white/10 bg-[#111827] px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/40"/><button aria-label="Send question" className="rounded-xl bg-cyan-500 px-3 text-slate-950 hover:bg-cyan-300"><Send size={16}/></button></form>
    </section>}
    <button onClick={() => setOpen((value) => !value)} aria-label={open ? 'Close AI Copilot' : 'Open AI Copilot'} className="fixed bottom-6 right-6 z-[70] flex items-center gap-2 rounded-full border border-cyan-300/30 bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-3 text-sm font-semibold text-white shadow-xl shadow-cyan-950/40 transition hover:-translate-y-0.5"><Bot size={18}/><span>AI Copilot</span><kbd className="hidden rounded bg-black/20 px-1.5 py-0.5 text-[10px] sm:inline">Ctrl ⇧ K</kbd></button>
  </>;
}

function answerFor(question: string, path: string) {
  const q = question.toLowerCase();
  if (q.includes('mape')) return 'MAPE is the mean absolute percentage error: the average size of forecast errors relative to actual demand. The active Bi-LSTM benchmark on this dashboard reports 2.78% test MAPE. It is an aggregate score and does not explain any single hour by itself.';
  if (q.includes('model') || q.includes('performance')) return 'The dashboard identifies Bi-LSTM as the active champion with 2.78% test MAPE and an R² of 0.9414. The model benchmark page includes the available comparison set. These are displayed evaluation metrics, not a guarantee of future performance.';
  if (q.includes('driver') || q.includes('feature') || q.includes('why')) return 'The current forecast view shows the predicted load curve and confidence envelope, but the connected prediction response does not include per-feature attributions. Open Explainability Center for a clearly labeled driver breakdown; treat its illustrative attribution bars as a visual estimate until SHAP values are connected to the backend.';
  if (q.includes('forecast') || q.includes('graph') || q.includes('summary')) return `You are viewing ${path}. The dashboard’s forecast is the Bi-LSTM load series; the executive view reports a 2.78% horizon MAPE and a 95% confidence envelope. Read the selected timestamps and MW values directly from the forecast chart and table. I don't have a live value attached to this page's current chart in the Copilot context.`;
  return `For “${question}” on ${path}, I can use the displayed GridPulse context: the active model is Bi-LSTM, its test MAPE is 2.78%, and the executive forecast provides a 95% confidence envelope. The dashboard does not expose the requested detail in its current data response, so I won’t invent a value. Try a question about MAPE, the active model, or the forecast view.`;
}
