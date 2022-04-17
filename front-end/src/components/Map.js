import React, { useEffect, useState } from "react";
import { Amap, Marker, config, Polyline } from "@amap/amap-react";
import store from "store";
import { Switch, Space, Button, Slider } from "antd";
import styles from "./Map.module.scss";

config.key = "8faf092bfa96e5b6748ea7e0a2d6ac9c";

export default function Map({ editabled = false, statusInfo: { gps } = {} }) {
  const [history, setHistory] = useState(store.get("gps history") || []);
  const [defaultLng, defaultLat] = history.length
    ? history[history.length - 1]
    : [117.2, 34.2];
  const { lat = defaultLat, lng = defaultLng } = gps || {};
  const center = [lng, lat];
  const [enabled, setEnabled] = useState(store.get("map enabled"));
  const [zoom, setZoom] = useState(store.get("map zoom") || 15);

  useEffect(() => {
    console.log("GPS", { lat, lng });
    console.log("history", history);
    const { length } = history;
    if (
      length === 0 ||
      lng !== history[length - 1][0] ||
      lat !== history[length - 1][1]
    ) {
      const newHistory = [...history, [lng, lat]]
        .filter(([lng, lat]) => lat !== undefined && lng !== undefined)
        .slice(0, 1000);
      console.log("newHistory", newHistory);
      setHistory(newHistory);
      store.set("gps history", newHistory);
    }
  }, [lat, lng, history]);

  useEffect(() => {
    store.set("map enabled", enabled);
  }, [enabled]);

  useEffect(() => {
    store.set("map zoom", zoom);
  }, [zoom]);

  return (
    <div className={styles.mapContainer}>
      {editabled ? (
        <div className={styles.editor}>
          <Space size="small" align="center" gutter={8}>
            <Switch onChange={setEnabled} checked={enabled} />
            <Button onClick={() => setHistory([])}>清空</Button>
          </Space>
        </div>
      ) : null}
      {enabled && (
        <>
          <Slider
            className={styles.zoom}
            min={2}
            max={20}
            value={zoom}
            onChange={(v) => setZoom(v)}
          />
          <Amap zoom={zoom} center={center}>
            <Marker
              position={center}
              label={{
                direction: "bottom",
              }}
              draggable
            />
            <Polyline path={history} />
          </Amap>
        </>
      )}
    </div>
  );
}
