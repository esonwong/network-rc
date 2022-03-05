import React, { useEffect, useState } from "react";
import { Amap, Marker, config, Polyline } from "@amap/amap-react";
import store from "store";
import { Switch } from "antd";
import styles from "./Map.module.scss";

config.key = "8faf092bfa96e5b6748ea7e0a2d6ac9c";

export default function Map({ statusInfo: { gps = {} } = {} }) {
  const { lat = 39, lng = 116 } = gps;
  const center = [lng, lat];

  const [history, setHistory] = useState(
    (store.get("gps history") || [])
      .filter(({ lat, lng }) => lat !== undefined && lng !== undefined)
      .slice(0, 1000)
  );
  const [enabled, setEnabled] = useState(store.get("map enabled") || true);

  useEffect(() => {
    console.log("GPS", { lat, lng });
    const { length } = history;
    if (
      length === 0 ||
      lng !== history[length - 1][0] ||
      lat !== history[length - 1][1]
    ) {
      const newHistory = [...history, [lng, lat]];
      console.log(newHistory);
      setHistory(newHistory);
      store.set("gps history", newHistory);
    }
  }, [lat, lng, history]);

  return (
    <div className={styles.mapContainer}>
      <Switch
        className={styles.switch}
        onChange={setEnabled}
        checked={enabled}
      />
      {enabled && (
        <Amap zoom={15} center={center}>
          <Marker
            position={center}
            label={{
              direction: "bottom",
            }}
            draggable
          />
          <Polyline path={history} />
        </Amap>
      )}
    </div>
  );
}
