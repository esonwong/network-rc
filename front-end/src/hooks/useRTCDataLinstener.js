import communication from "../lib/communication";

const useRTCDataListener = (label, callback) => {
  const onRTCDataChannel = (rtcDataChannel) => {
    if (rtcDataChannel.label === label) {
      callback(rtcDataChannel);
    }
  };
  communication.on("rtc-data-channel", onRTCDataChannel);
  return () => {
    communication.off("rtc-data-channel", onRTCDataChannel);
  };
};

export default useRTCDataListener;
