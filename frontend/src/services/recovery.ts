
import { api } from "./api";

export interface RecoveryCheckin {
  id: number;
  sleep_hours: number;
  resting_heart_rate: number;
  hrv_ms: number | null;
  soreness: number;
  energy_level: number;
  created_at: string;
}

export interface RecoveryCheckinCreate {
  sleep_hours: number;
  resting_heart_rate: number;
  hrv_ms: number | null;
  soreness: number;
  energy_level: number;
}

export async function getRecoveryCheckins(): Promise<RecoveryCheckin[]> {
  const response = await api.get<RecoveryCheckin[]>(
    "/recovery/checkins"
  );
  return response.data;
}

export async function createRecoveryCheckin(
  data: RecoveryCheckinCreate
): Promise<RecoveryCheckin> {
  const response = await api.post<RecoveryCheckin>(
    "/recovery/checkins",
    data
  );
  return response.data;
}