import { useState, useEffect, useCallback } from 'react';
import { useStore } from '../store/useStore';

function loadTasks() {
  try { return JSON.parse(localStorage.getItem('dailyPath') || '[]'); }
  catch { return []; }
}
function saveTasks(tasks) { localStorage.setItem('dailyPath', JSON.stringify(tasks)); }

export default function VirtueTracker() {
  const open = useStore(s => s.virtueTrackerOpen);
  const setOpen = useStore(s => s.setVirtueTrackerOpen);
  const [tasks, setTasks] = useState(loadTasks);
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    const onUpdate = () => setTasks(loadTasks());
    window.addEventListener('dailyPathUpdated', onUpdate);
    return () => window.removeEventListener('dailyPathUpdated', onUpdate);
  }, []);

  const toggle = useCallback((id) => {
    setTasks(prev => { const next = prev.map(t => t.id === id ? { ...t, done: !t.done } : t); saveTasks(next); return next; });
  }, []);
  const clearCompleted = useCallback(() => {
    setTasks(prev => { const next = prev.filter(t => !t.done); saveTasks(next); return next; });
  }, []);
  const clearAll = useCallback(() => {
    if (!confirmClear) { setConfirmClear(true); return; }
    setTasks([]); saveTasks([]); setConfirmClear(false);
  }, [confirmClear]);

  const today = new Date().toISOString().split('T')[0];
  const grouped = tasks.reduce((acc, t) => { const d = t.date || 'Unknown'; if (!acc[d]) acc[d] = []; acc[d].push(t); return acc; }, {});
  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));
  const pending = tasks.filter(t => !t.done).length;

  return (
    <>
      {/* Toggle tab */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed left-0 top-1/2 -translate-y-1/2 z-30 rounded-r-xl px-2 py-5 flex flex-col items-center gap-1.5 text-slate-600 hover:text-accent transition-colors"
        style={{ background: 'rgba(5,8,20,0.94)', border: '1px solid rgba(139,92,246,0.22)', borderLeft: 'none' }}
        title="Daily Path"
      >
        <span className="text-xs font-medium" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
          Daily Path
        </span>
        {pending > 0 && (
          <span className="text-xs w-5 h-5 flex items-center justify-center rounded-full font-medium"
            style={{ background: 'rgba(139,92,246,0.2)', color: '#A78BFA' }}>
            {pending}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed left-0 top-0 h-full z-20 flex">
          <div className="panel-slide-left w-72 h-full flex flex-col overflow-hidden"
          style={{ background: 'rgba(5,8,20,0.98)', borderRight: '1px solid rgba(139,92,246,0.2)' }}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 flex-shrink-0">
              <div>
                <h2 className="text-white font-medium text-sm">Daily Path</h2>
                <div className="text-xs text-slate-500 mt-0.5">{pending} remaining</div>
              </div>
              <button onClick={() => setOpen(false)} className="text-slate-600 hover:text-white w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/5">✕</button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-5">
              {tasks.length === 0 && (
                <p className="text-slate-600 text-xs text-center py-10 leading-relaxed">
                  No tasks yet.<br />Select a node and use<br />"Reflect with Ode2Socrates"<br />to generate virtues.
                </p>
              )}
              {sortedDates.map(date => (
                <div key={date}>
                  <div className="text-xs text-slate-600 uppercase tracking-wider mb-2.5 flex items-center gap-2">
                    {date === today ? <><span className="text-accent">✦</span> Today</> : date}
                  </div>
                  <div className="space-y-2">
                    {grouped[date].map(task => (
                      <label key={task.id} className="flex items-start gap-3 cursor-pointer group">
                        <div className="mt-0.5 flex-shrink-0">
                          <input type="checkbox" checked={task.done} onChange={() => toggle(task.id)}
                            className="rounded accent-accent" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={`text-xs leading-relaxed ${task.done ? 'line-through text-slate-600' : 'text-slate-300'}`}>
                            {task.task}
                          </div>
                          {task.theme && (
                            <span className="text-xs px-1.5 py-0.5 rounded-full bg-accent/10 text-accent/70 mt-1 inline-block">
                              {task.theme}
                            </span>
                          )}
                          <div className="text-xs text-slate-700 mt-0.5 truncate">{task.source}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {tasks.length > 0 && (
              <div className="p-3 border-t border-white/5 flex gap-2 flex-shrink-0">
                <button onClick={clearCompleted}
                  className="flex-1 py-2 rounded-lg bg-white/4 hover:bg-white/8 text-slate-500 hover:text-slate-300 text-xs transition-colors">
                  Clear done
                </button>
                <button onClick={clearAll} onBlur={() => setConfirmClear(false)}
                  className={`flex-1 py-2 rounded-lg text-xs transition-colors ${confirmClear ? 'bg-red-600/70 text-white' : 'bg-white/4 hover:bg-white/8 text-slate-500'}`}>
                  {confirmClear ? 'Confirm' : 'Clear all'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
