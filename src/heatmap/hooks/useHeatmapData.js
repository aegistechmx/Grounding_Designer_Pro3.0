import { useMemo } from "react";

export const useHeatmapData = (input, engine) => {
  return useMemo(() => {
    if (!input) return null;

    return engine(input); // tu realHeatmapEngine
  }, [input, engine]);
};