export const getApiUrl = () => {
  if (typeof window !== "undefined") {
    return `http://${window.location.hostname}:4000`;
  }
  return "http://localhost:4000";
};
