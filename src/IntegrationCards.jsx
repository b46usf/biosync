import { useEffect, useState } from "react";
import {
  Activity,
  Bluetooth,
  CheckCircle2,
  CloudDownload,
  HeartPulse,
  Link2,
  Unplug,
} from "lucide-react";

export function BluetoothCard({ sensor }) {
  const connected = sensor.status === "connected";
  return (
    <section className="integration-card panel">
      <div className="integration-card-icon bluetooth">
        <Bluetooth size={21} />
      </div>
      <div className="integration-card-content">
        <div className="integration-card-title">
          <h3>Bluetooth LE sensor</h3>
          {connected && (
            <span className="live-badge">
              <i /> LIVE
            </span>
          )}
        </div>
        <p>
          Hubungkan sensor BLE standar untuk menerima detak jantung, cadence
          lari, atau cadence sepeda.
        </p>
        <div className="integration-card-status" aria-live="polite">
          {connected ? (
            <>
              <CheckCircle2 size={15} /> Tersambung ke {sensor.deviceName}
            </>
          ) : (
            <>
              <Activity size={15} />{" "}
              {sensor.message ||
                "Peramban akan meminta kamu memilih perangkat."}
            </>
          )}
        </div>
        {connected && (
          <div className="sensor-metrics">
            <span>
              <HeartPulse size={15} />
              <b>{sensor.metrics.heartRate ?? "—"}</b>
              <small>bpm</small>
            </span>
            <span>
              <Activity size={15} />
              <b>{sensor.metrics.cadence ?? "—"}</b>
              <small>cadence/min</small>
            </span>
          </div>
        )}
        {sensor.message && !connected && sensor.status === "error" && (
          <p className="integration-error">{sensor.message}</p>
        )}
      </div>
      <button
        className={connected ? "secondary-button" : "primary-button"}
        onClick={connected ? sensor.disconnect : sensor.connect}
        disabled={sensor.status === "connecting"}
      >
        {connected ? (
          <>
            <Unplug size={15} /> Putuskan
          </>
        ) : (
          <>
            <Bluetooth size={15} />{" "}
            {sensor.status === "connecting"
              ? "Menghubungkan…"
              : "Cari perangkat"}
          </>
        )}
      </button>
    </section>
  );
}

export function GoogleHealthCard({ onImport, showToast, onConnectionChange }) {
  const [status, setStatus] = useState({
    loading: true,
    configured: false,
    connected: false,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const refreshStatus = async () => {
    try {
      const response = await fetch("/api/google-health/status", {
        credentials: "same-origin",
        cache: "no-store",
      });
      const result = await response.json();
      setStatus({ loading: false, ...result });
      onConnectionChange?.(Boolean(result.connected));
    } catch {
      setStatus({
        loading: false,
        configured: false,
        connected: false,
        localApiUnavailable: true,
      });
      onConnectionChange?.(false);
    }
  };

  useEffect(() => {
    refreshStatus();
  }, []);

  const connect = () => window.location.assign("/api/google-health/connect");
  const disconnect = async () => {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/google-health/disconnect", {
        method: "POST",
        credentials: "same-origin",
      });
      if (!response.ok)
        throw new Error("Tidak dapat memutuskan Google Health.");
      await refreshStatus();
      showToast("Google Health diputuskan");
    } catch (problem) {
      setError(problem.message);
    } finally {
      setBusy(false);
    }
  };

  const sync = async () => {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/google-health/activities", {
        credentials: "same-origin",
        cache: "no-store",
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Sinkronisasi gagal.");
      onImport(result.activities || []);
      showToast(
        "Google Health disinkronkan",
        `${result.activities?.length || 0} aktivitas diterima.`,
      );
    } catch (problem) {
      setError(problem.message);
    } finally {
      setBusy(false);
    }
  };

  const connected = status.connected;
  const apiUnavailableHint = window.location.hostname.endsWith("github.io")
    ? "Google Health memerlukan Vercel Functions; GitHub Pages hanya menyajikan UI statis."
    : "Untuk uji lokal jalankan dengan Vercel CLI: npx vercel dev.";
  return (
    <section className="integration-card panel">
      <div className="integration-card-icon google-health">G</div>
      <div className="integration-card-content">
        <div className="integration-card-title">
          <h3>Google Health API</h3>
          {connected && (
            <span className="connected-label">
              <i /> Terhubung
            </span>
          )}
        </div>
        <p>
          OAuth 2.0 untuk membaca aktivitas yang disimpan Fitbit, Pixel Watch,
          dan sumber yang tersambung ke Google Health.
        </p>
        <div className="integration-card-status" aria-live="polite">
          {status.loading ? (
            "Memeriksa koneksi…"
          ) : connected ? (
            <>
              <CheckCircle2 size={15} /> Token disimpan sebagai cookie
              terenkripsi HttpOnly.
            </>
          ) : status.configured ? (
            <>
              <Link2 size={15} /> Izin hanya meminta data aktivitas dan
              olahraga.
            </>
          ) : (
            "Perlu kredensial OAuth Google Cloud di environment Vercel."
          )}
        </div>
        {status.localApiUnavailable && (
          <p className="integration-hint">{apiUnavailableHint}</p>
        )}
        {error && <p className="integration-error">{error}</p>}
      </div>
      {connected ? (
        <div className="integration-card-actions">
          <button className="primary-button" onClick={sync} disabled={busy}>
            <CloudDownload size={15} />{" "}
            {busy ? "Memuat…" : "Sinkronkan aktivitas"}
          </button>
          <button className="text-button" onClick={disconnect} disabled={busy}>
            Putuskan
          </button>
        </div>
      ) : (
        <button
          className="primary-button"
          onClick={connect}
          disabled={status.loading || !status.configured}
        >
          <Link2 size={15} /> Hubungkan
        </button>
      )}
    </section>
  );
}
