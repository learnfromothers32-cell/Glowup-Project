import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, Save, Loader2, AlertCircle } from 'lucide-react';
import { getMyAvailability, updateMyAvailability } from '../../api/availability';
import type { DaySchedule } from '../../api/availability';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_LABELS: Record<string, string> = {
  monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday',
  thursday: 'Thursday', friday: 'Friday', saturday: 'Saturday', sunday: 'Sunday'
};

const defaultSchedule = (): Record<string, DaySchedule> => {
  const s: Record<string, DaySchedule> = {};
  DAYS.forEach(day => {
    s[day] = { enabled: day !== 'sunday', start: '09:00', end: '17:00', breaks: [] };
  });
  return s;
};

export default function Availability() {
  const [schedule, setSchedule] = useState<Record<string, DaySchedule>>(defaultSchedule());
  const [bufferMinutes, setBufferMinutes] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadAvailability();
  }, []);

  const loadAvailability = async () => {
    try {
      setLoading(true);
      const data = await getMyAvailability();
      if (data.schedule) setSchedule(data.schedule);
      if (data.bufferMinutes !== undefined) setBufferMinutes(data.bufferMinutes);
    } catch {
      setError('Could not load availability');
    } finally {
      setLoading(false);
    }
  };

  const updateDay = (day: string, updates: Partial<DaySchedule>) => {
    setSchedule(prev => ({
      ...prev,
      [day]: { ...prev[day], ...updates }
    }));
  };

  const addBreak = (day: string) => {
    const breaks = schedule[day].breaks || [];
    updateDay(day, { breaks: [...breaks, { start: '12:00', end: '13:00' }] });
  };

  const removeBreak = (day: string, idx: number) => {
    const breaks = schedule[day].breaks || [];
    updateDay(day, { breaks: breaks.filter((_: any, i: number) => i !== idx) });
  };

  const updateBreak = (day: string, idx: number, field: 'start' | 'end', value: string) => {
    const breaks = [...(schedule[day].breaks || [])];
    breaks[idx] = { ...breaks[idx], [field]: value };
    updateDay(day, { breaks });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      await updateMyAvailability({ schedule, bufferMinutes });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#7A7168]" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-text-primary dark:text-text-dark-primary font-display">Availability</h1>
          <p className="text-[#7A7168] text-sm mt-1">Set your weekly working hours and breaks</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#1A1A1A] text-white rounded-lg hover:bg-[#333] transition-colors disabled:opacity-50 w-full sm:w-auto min-h-[44px]"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? 'Saved!' : <Save className="w-4 h-4" />}
          {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 text-red-700 rounded-lg text-sm">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-[#E8E0D8] overflow-hidden">
        <div className="p-4 bg-[#FAF8F4] border-b border-[#E8E0D8] flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#7A7168]" />
          <span className="text-sm font-medium text-[#1A1A1A]">Weekly Schedule</span>
        </div>

        <div className="p-4 space-y-3">
          {DAYS.map(day => {
            const d = schedule[day] || { enabled: false, start: '09:00', end: '17:00', breaks: [] };
            return (
              <div key={day} className={`flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-lg transition-colors ${d.enabled ? 'bg-white' : 'bg-gray-50'}`}>
                <div className="flex items-center gap-3">
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input type="checkbox" className="sr-only peer" checked={d.enabled} onChange={e => updateDay(day, { enabled: e.target.checked })} />
                    <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#8B7355]" />
                  </label>
                  <span className={`w-20 sm:w-28 text-sm font-medium ${d.enabled ? 'text-[#1A1A1A]' : 'text-gray-400'}`}>{DAY_LABELS[day]}</span>
                </div>
                {d.enabled ? (
                  <div className="flex flex-wrap items-center gap-2 flex-1">
                    <input type="time" value={d.start} onChange={e => updateDay(day, { start: e.target.value })}
                      className="border border-[#E8E0D8] rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#8B7355] w-[110px]" />
                    <span className="text-gray-400">to</span>
                    <input type="time" value={d.end} onChange={e => updateDay(day, { end: e.target.value })}
                      className="border border-[#E8E0D8] rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#8B7355] w-[110px]" />
                    <button onClick={() => addBreak(day)} className="text-xs text-[#8B7355] hover:underline">+ Add break</button>
                  </div>
                ) : (
                  <span className="text-sm italic text-gray-400">Unavailable</span>
                )}
              </div>
            );
          })}
        </div>

        <div className="border-t border-[#E8E0D8] p-4">
          <h3 className="text-sm font-medium text-[#1A1A1A] mb-2">Breaks</h3>
          {DAYS.map(day => {
            const breaks = schedule[day]?.breaks || [];
            return breaks.length > 0 ? (
              <div key={`break-${day}`} className="flex flex-col sm:flex-row sm:items-center gap-1 mb-2">
                <span className="text-xs text-gray-500 w-20 sm:w-28 shrink-0">{DAY_LABELS[day]}:</span>
                <div className="flex flex-wrap gap-1">
                  {breaks.map((b, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1 text-xs bg-gray-100 px-2 py-0.5 rounded">
                      {b.start} – {b.end}
                      <button onClick={() => removeBreak(day, idx)} className="text-red-400 hover:text-red-600">&times;</button>
                    </span>
                  ))}
                </div>
              </div>
            ) : null;
          })}
        </div>
      </div>

      <div className="mt-4 bg-white rounded-xl shadow-sm border border-[#E8E0D8] p-4">
        <label className="text-sm font-medium text-[#1A1A1A]">Buffer time between appointments (minutes)</label>
        <input type="number" value={bufferMinutes} onChange={e => setBufferMinutes(Math.max(0, Math.min(120, Number(e.target.value))))}
          className="mt-1 block w-full sm:w-32 border border-[#E8E0D8] rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#8B7355]" />
      </div>
    </motion.div>
  );
}
