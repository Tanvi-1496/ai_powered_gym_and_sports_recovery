
import { useState, type FormEvent } from "react";
import {
  createRecoveryCheckin,
  type RecoveryCheckinCreate,
} from "../services/recovery";

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
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-xl font-semibold">New Recovery Check-in</h2>

      <div>
        <label>Sleep hours</label>
        <input
          className="block w-full rounded border p-2"
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
        <label>Resting heart rate (bpm)</label>
        <input
          className="block w-full rounded border p-2"
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
        <label>HRV (ms, optional)</label>
        <input
          className="block w-full rounded border p-2"
          type="number"
          min="0"
          max="500"
          step="any"
          value={form.hrv_ms}
          onChange={(e) => update("hrv_ms", e.target.value)}
        />
      </div>

      <div>
        <label>Soreness (1–10)</label>
        <input
          className="block w-full rounded border p-2"
          type="number"
          min="1"
          max="10"
          required
          value={form.soreness}
          onChange={(e) => update("soreness", e.target.value)}
        />
      </div>

      <div>
        <label>Energy level (1–10)</label>
        <input
          className="block w-full rounded border p-2"
          type="number"
          min="1"
          max="10"
          required
          value={form.energy_level}
          onChange={(e) => update("energy_level", e.target.value)}
        />
      </div>

      <button
        type="submit"
        disabled={saving}
        className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
      >
        {saving ? "Saving..." : "Save check-in"}
      </button>

      {message && <p role="status">{message}</p>}
    </form>
  );
}