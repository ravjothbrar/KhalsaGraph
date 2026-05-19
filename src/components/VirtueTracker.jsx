import { useState, useEffect, useCallback } from 'react';
import { useStore } from '../store/useStore';

function loadTasks() {
  try { return JSON.parse(localStorage.getItem('dailyPath') || '[]'); }
  catch { return []; }
}

function saveTasks(tasks) {
  localStorage.setItem('dailyPath', JSON.stringify(tasks));
}

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
    setTasks(prev => {
      const next = prev.map(t => t.id === id ? { ...t, done: !t.done } : t);
      saveTasks(next);
      return next;
    });
  }, []);

  const clearCompleted = useCallback(() => {
    setTasks(prev => {
      const next = prev.filter(t => !t.done);
      saveTasks(next);
      return next;
    });
  }, []);

  const clearAll = useCallback(() => {
    if (!confirmClear) { setConfirmClear(true); return; }
    setTasks([]);
    saveTasks([]);
    setConfirmClear(false);
  }, [confirmClear]);

  // Group by date
  const grouped = tasks.reduce((acc, task) => {
    const d = task.date || 'Unknown';
    if (!acc[d]) acc[d] = [];
    acc[d].push(task);
    return acc;
  }, {});

  const today = new Date().toISOString().split('T')[0];
  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed left-4 top-1/2 -translate-y-1/2 z-30 glass rounded-xl px-3 py-4 text-xs writing-vertical text-slate-400 hover:text-white transition-colors"
        style={{ writingMode: 'vertical-rl' }}
        title="Daily Path"
      >
        Daily Path {tasks.filter(t => !t.done).length > 0 && `(${tasks.filter(t => !t.done).length})`}
      </button>

      {open && (
        <div className="fixed left-0 top-0 h-full z-20 flex">
          <div className="panel-slide-left glass w-80 h-full flex flex-col overflow-hidden shadow-2xl border-r border-white/10">
            <div className="flex items-center justify-between p-5 border-b border-white/10 flex-shrink-0">
              <h2 className="text-white font-semibold">🌿 Daily Path</h2>
              <button onClick={() => setOpen(false)} className="text-slate-500 hover:text-white">✕</button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-5">
              {tasks.length === 0 && (
                <p className="text-slate-500 text-sm text-center py-8">
                  No tasks yet. Click a node and use "Reflect with Ode2Socrates" to generate virtues.
                </p>
              )}

              {sortedDates.map(date => (
                <div key={date}>
                  <div className="text-xs text-slate-500 uppercase tracking-wider mb-2">
                    {date === today ? '✦ Today' : date}
                  </div>
                  <div className="space-y-2">
                    {grouped[date].map(task => (
                      <label key={task.id} className="flex items-start gap-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={task.done}
                          onChange={() => toggle(task.id)}
                          className="mt-1 rounded accent-indigo-500 flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className={`text-sm ${task.done ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                            {task.task}
                          </div>
                          <div className="text-xs text-slate-600 mt-0.5 truncate">{task.source}</div>
                          {task.theme && (
                            <span className="text-xs px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 mt-1 inline-block">
                              {task.theme}
                            </span>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {tasks.length > 0 && (
              <div className="p-4 border-t border-white/10 flex gap-2 flex-shrink-0">
                <button
                  onClick={clearCompleted}
                  className="flex-1 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 text-xs transition-colors"
                >
                  Clear done
                </button>
                <button
                  onClick={clearAll}
                  className={`flex-1 py-2 rounded-lg text-xs transition-colors ${
                    confirmClear
                      ? 'bg-red-600 text-white'
                      : 'bg-white/5 hover:bg-white/10 text-slate-400'
                  }`}
                  onBlur={() => setConfirmClear(false)}
                >
                  {confirmClear ? 'Confirm clear all' : 'Clear all'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
