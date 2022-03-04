import React, { useEffect, useState } from "react";
import "./Map.scss";
import { Amap, Marker, config } from "@amap/amap-react";
import store from "store";

config.key = "8faf092bfa96e5b6748ea7e0a2d6ac9c";

export default function Map({
  statusInfo: { gps = { lat: 116.478935, lng: 39.997761 } } = {},
}) {
  const { lat, lng } = gps;
  const center = [lat, lng];
  const [history, setHistory] = useState(store.get("gps history") || []);

  useEffect(() => {
    console.log("GPS", gps);
    const { length } = history;
    if (
      gps &&
      (length === 0 ||
        gps.lat !== history[length - 1][0] ||
        gps.lng !== history[length - 1][1])
    ) {
      const newHistory = [...history, [gps.lat, gps.lng]];
      setHistory(newHistory);
      store.set("gps history", newHistory);
    }
  }, [gps, history]);

  return (
    <div className="map-container">
      <Amap zoom={15} center={center}>
        <Marker
          position={center}
          label={{
            direction: "bottom",
          }}
          draggable
        />
      </Amap>
    </div>
  );
}
