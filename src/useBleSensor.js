import { useCallback, useRef, useState } from "react";

const OPTIONAL_SERVICES = [
  "heart_rate",
  "cycling_speed_and_cadence",
  "running_speed_and_cadence",
];

function readHeartRate(event) {
  const value = event.target.value;
  const flags = value.getUint8(0);
  return flags & 1 ? value.getUint16(1, true) : value.getUint8(1);
}

function readRunningCadence(event) {
  const value = event.target.value;
  return value.getUint8(3);
}

export default function useBleSensor() {
  const [deviceName, setDeviceName] = useState("");
  const [status, setStatus] = useState("idle");
  const [metrics, setMetrics] = useState({ heartRate: null, cadence: null });
  const [message, setMessage] = useState("");
  const deviceRef = useRef(null);
  const previousCrankRef = useRef(null);

  const disconnect = useCallback(() => {
    const device = deviceRef.current;
    if (device?.gatt?.connected) device.gatt.disconnect();
    deviceRef.current = null;
    setDeviceName("");
    setMetrics({ heartRate: null, cadence: null });
    previousCrankRef.current = null;
    setMessage("");
    setStatus("idle");
  }, []);

  const connect = useCallback(async () => {
    if (!window.isSecureContext) {
      setMessage("Bluetooth memerlukan HTTPS atau localhost.");
      setStatus("error");
      return;
    }
    if (!navigator.bluetooth) {
      setMessage(
        "Web Bluetooth belum didukung browser ini. Coba Chrome atau Edge.",
      );
      setStatus("error");
      return;
    }

    setStatus("connecting");
    setMessage("");
    try {
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: OPTIONAL_SERVICES,
      });
      deviceRef.current = device;
      device.addEventListener("gattserverdisconnected", () => {
        deviceRef.current = null;
        setDeviceName("");
        setMetrics({ heartRate: null, cadence: null });
        setStatus("idle");
        setMessage("Koneksi Bluetooth terputus.");
      });
      const server = await device.gatt.connect();
      setDeviceName(device.name || "BLE fitness sensor");
      setStatus("connected");

      let supported = 0;
      try {
        const service = await server.getPrimaryService("heart_rate");
        const characteristic = await service.getCharacteristic(
          "heart_rate_measurement",
        );
        await characteristic.startNotifications();
        characteristic.addEventListener(
          "characteristicvaluechanged",
          (event) => {
            setMetrics((current) => ({
              ...current,
              heartRate: readHeartRate(event),
            }));
          },
        );
        supported += 1;
      } catch {
        // Many watches do not expose the standard Heart Rate service to browsers.
      }

      for (const serviceId of [
        "running_speed_and_cadence",
        "cycling_speed_and_cadence",
      ]) {
        try {
          const service = await server.getPrimaryService(serviceId);
          const isRunning = serviceId === "running_speed_and_cadence";
          const characteristicId = isRunning
            ? "running_speed_and_cadence_measurement"
            : "csc_measurement";
          const characteristic =
            await service.getCharacteristic(characteristicId);
          await characteristic.startNotifications();
          characteristic.addEventListener(
            "characteristicvaluechanged",
            (event) => {
              const value = event.target.value;
              const cadence = isRunning
                ? readRunningCadence(event)
                : (() => {
                    const flags = value.getUint8(0);
                    if (!(flags & 2)) return null;
                    const offset = flags & 1 ? 7 : 1;
                    const currentRevolutions = value.getUint16(offset, true);
                    const currentEventTime = value.getUint16(offset + 2, true);
                    const previous = previousCrankRef.current;
                    previousCrankRef.current = {
                      revolutions: currentRevolutions,
                      eventTime: currentEventTime,
                    };
                    if (!previous) return null;
                    const deltaRevolutions =
                      (currentRevolutions - previous.revolutions + 65536) %
                      65536;
                    const deltaTime =
                      (currentEventTime - previous.eventTime + 65536) % 65536;
                    return deltaTime
                      ? Math.round((deltaRevolutions * 60 * 1024) / deltaTime)
                      : null;
                  })();
              if (cadence > 0)
                setMetrics((current) => ({ ...current, cadence }));
            },
          );
          supported += 1;
        } catch {
          // Continue probing other standard services exposed by the selected device.
        }
      }

      setMessage(
        supported
          ? "Sensor tersambung. Nilai akan muncul saat perangkat mengirim data."
          : "Perangkat tersambung, tetapi tidak mengekspos layanan Heart Rate atau cadence standar yang didukung.",
      );
    } catch (error) {
      deviceRef.current = null;
      setStatus("error");
      setMessage(
        error?.name === "NotFoundError"
          ? "Tidak ada perangkat yang dipilih."
          : error?.message || "Tidak dapat menyambungkan sensor BLE.",
      );
    }
  }, []);

  return { deviceName, status, metrics, message, connect, disconnect };
}
