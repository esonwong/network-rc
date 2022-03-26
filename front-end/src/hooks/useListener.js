import communication from "../lib/communication";

const useListener = (eventName, callback) => {
  communication.on(eventName, callback);
  return () => {
    communication.off(eventName, callback);
  };
};

export default useListener;
