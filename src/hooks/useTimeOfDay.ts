import { useEffect, useState } from "react";
import { getTimeOfDay } from "../game/time";
import type { TimeOfDay } from "../game/types";

export function useTimeOfDay(): TimeOfDay {
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>(() =>
    getTimeOfDay(new Date()),
  );

  useEffect(() => {
    const tick = () => setTimeOfDay(getTimeOfDay(new Date()));
    const id = window.setInterval(tick, 60_000);
    return () => window.clearInterval(id);
  }, []);

  return timeOfDay;
}
