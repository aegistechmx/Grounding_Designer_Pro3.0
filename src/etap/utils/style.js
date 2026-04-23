export function getContourStyle(level, majorStep = 500) {
  const isMajor = Math.round(level) % majorStep === 0;
  return {
    isMajor,
    width: isMajor ? 2.4 : 0.9,
    alpha: isMajor ? 1 : 0.6,
  };
}
