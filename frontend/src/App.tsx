import { useEffect, useState } from "react";
import RecoveryForm from "./components/RecoveryForm";
import { getRecoveryCheckins, type RecoveryCheckin } from "./services/recovery";

function App() {
  const [checkins, setCheckins] = useState<RecoveryCheckin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadCheckins() {
      try {
        const data = await getRecoveryCheckins();
        setCheckins(data);
      } catch (err) {
        console.error(err);
        setError("Could not load recovery data.");
      } finally {
        setLoading(false);
      }
    }

    loadCheckins();
  }, []);

  if (loading) {
    return <p>Loading recovery data...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold">RecoverAI Dashboard</h1>

      <h2 className="mt-6 text-lg font-semibold">Recovery Check-ins</h2>

      <RecoveryForm
        onSaved={async () => {
          const data = await getRecoveryCheckins();
          setCheckins(data);
        }}
      />

      {checkins.length === 0 ? (
        <p>No recovery check-ins yet.</p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b text-left">
                <th className="p-2">Date</th>
                <th className="p-2">Sleep (h)</th>
                <th className="p-2">Heart rate</th>
                <th className="p-2">HRV</th>
                <th className="p-2">Soreness</th>
                <th className="p-2">Energy</th>
              </tr>
            </thead>
            <tbody>
              {checkins.map((item) => (
                <tr key={item.id} className="border-b">
                  <td className="p-2">
                    {new Date(item.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-2">{item.sleep_hours}</td>
                  <td className="p-2">{item.resting_heart_rate}</td>
                  <td className="p-2">{item.hrv_ms ?? "—"}</td>
                  <td className="p-2">{item.soreness}</td>
                  <td className="p-2">{item.energy_level}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}

export default App;
