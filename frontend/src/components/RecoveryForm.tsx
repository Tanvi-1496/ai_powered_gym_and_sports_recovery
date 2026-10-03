import { useState, type FormEvent } from "react";
import {
  createRecoveryCheckin,
  type RecoveryCheckinCreate,
} from "../services/recovery";
import { GradientButton } from "@/components/ui/gradient-button";

interface Props {
  onSaved: () => void;
}

export default function RecoveryForm({ onSaved }: Props) {
  const [form, setForm] = useState({
    sleep_hours: "7.5",
    resting_heart_rate: "62",
    hrv_ms: "55",
    soreness: "3",
    energy_level: "8",
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  function update(
    field: keyof typeof form,
    value: string
  ) {
    setForm((previous) => ({ ...previous, [field]: value }));
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    const data: RecoveryCheckinCreate = {
      sleep_hours: Number(form.sleep_hours),
      resting_heart_rate: Number(form.resting_heart_rate),
      hrv_ms: form.hrv_ms === "" ? null : Number(form.hrv_ms),
      soreness: Number(form.soreness),
      energy_level: Number(form.energy_level),
    };

    try {
      await createRecoveryCheckin(data);
      setMessage("Check-in saved successfully!");
      onSaved();
    } catch (error) {
      console.error(error);
      setMessage("Could not save check-in. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="glass-panel p-6 rounded-2xl border border-[#7C3AED]/25 text-[#FFFDF9] space-y-4 max-w-lg mx-auto">
      <h2 className="text-xl font-bold font-display text-[#FFFDF9]">New Recovery Check-in</h2>

      <div>
        <label className="text-xs font-semibold text-[#E9E2F5] block mb-1.5">Sleep hours</label>
        <input
          className="block w-full rounded-xl bg-[#18132D] border border-[#7C3AED]/30 p-2.5 text-[#FFFDF9] placeholder-[#B8AEC8] focus:outline-none focus:border-[#F97368] focus:ring-1 focus:ring-[#F97368]/40"
          type="number"
          min="0"
          max="24"
          step="0.1"
          required
          value={form.sleep_hours}
          onChange={(e) => update("sleep_hours", e.target.value)}
        />
      </div>

      <div>
        <label className="text-xs font-semibold text-[#E9E2F5] block mb-1.5">Resting heart rate (bpm)</label>
        <input
          className="block w-full rounded-xl bg-[#18132D] border border-[#7C3AED]/30 p-2.5 text-[#FFFDF9] placeholder-[#B8AEC8] focus:outline-none focus:border-[#F97368] focus:ring-1 focus:ring-[#F97368]/40"
          type="number"
          min="25"
          max="240"
          required
          value={form.resting_heart_rate}
          onChange={(e) =>
            update("resting_heart_rate", e.target.value)
          }
        />
      </div>

      <div>
        <label className="text-xs font-semibold text-[#E9E2F5] block mb-1.5">HRV (ms, optional)</label>
        <input
          className="block w-full rounded-xl bg-[#18132D] border border-[#7C3AED]/30 p-2.5 text-[#FFFDF9] placeholder-[#B8AEC8] focus:outline-none focus:border-[#F97368] focus:ring-1 focus:ring-[#F97368]/40"
          type="number"
          min="0"
          max="500"
          step="any"
          value={form.hrv_ms}
          onChange={(e) => update("hrv_ms", e.target.value)}
        />
      </div>

      <div>
        <label className="text-xs font-semibold text-[#E9E2F5] block mb-1.5">Soreness (1–10)</label>
        <input
          className="block w-full rounded-xl bg-[#18132D] border border-[#7C3AED]/30 p-2.5 text-[#FFFDF9] placeholder-[#B8AEC8] focus:outline-none focus:border-[#F97368] focus:ring-1 focus:ring-[#F97368]/40"
          type="number"
          min="1"
          max="10"
          required
          value={form.soreness}
          onChange={(e) => update("soreness", e.target.value)}
        />
      </div>

      <div>
        <label className="text-xs font-semibold text-[#E9E2F5] block mb-1.5">Energy level (1–10)</label>
        <input
          className="block w-full rounded-xl bg-[#18132D] border border-[#7C3AED]/30 p-2.5 text-[#FFFDF9] placeholder-[#B8AEC8] focus:outline-none focus:border-[#F97368] focus:ring-1 focus:ring-[#F97368]/40"
          type="number"
          min="1"
          max="10"
          required
          value={form.energy_level}
          onChange={(e) => update("energy_level", e.target.value)}
        />
      </div>

      <GradientButton
        type="submit"
        disabled={saving}
        className="w-full py-3 rounded-xl font-bold text-sm tracking-wide uppercase disabled:opacity-50 disabled:pointer-events-none mt-2 cursor-pointer"
      >
        {saving ? "Saving..." : "Save check-in"}
      </GradientButton>

      {message && (
        <p role="status" className="text-xs font-semibold text-[#FDBA8C] text-center mt-2">
          {message}
        </p>
      )}
    </form>
  );
}