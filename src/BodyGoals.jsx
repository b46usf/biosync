import { ArrowRight, Info, Ruler, Scale, Target, Weight } from "lucide-react";

const number = (value) => (Number.isFinite(Number(value)) ? Number(value) : 0);
const format = (value, digits = 1) =>
  new Intl.NumberFormat("id-ID", { maximumFractionDigits: digits }).format(
    value,
  );

function getBMIStatus(bmi) {
  if (bmi < 18.5) return { label: "Di bawah rentang rujukan", tone: "amber" };
  if (bmi < 25) return { label: "Dalam rentang rujukan", tone: "green" };
  if (bmi < 27) return { label: "Di atas rentang rujukan", tone: "amber" };
  return { label: "Perlu ditinjau lebih lanjut", tone: "rose" };
}

export default function BodyGoals({ body, setBody }) {
  const height = number(body.height);
  const weight = number(body.weight);
  const heightM = height / 100;
  const bmi = heightM > 0 && weight > 0 ? weight / (heightM * heightM) : 0;
  const lowerWeight = heightM > 0 ? 18.5 * heightM * heightM : 0;
  const upperWeight = heightM > 0 ? 24.9 * heightM * heightM : 0;
  const status = bmi ? getBMIStatus(bmi) : null;
  const age = number(body.age);
  const sexCode = body.sex === "male" ? 1 : body.sex === "female" ? 0 : null;
  const rawFatPercent =
    bmi && age >= 18 && sexCode !== null
      ? 1.2 * bmi + 0.23 * age - 10.8 * sexCode - 5.4
      : null;
  const fatPercent =
    rawFatPercent !== null ? Math.max(0, Math.min(100, rawFatPercent)) : null;
  const fatMass =
    fatPercent !== null ? Math.max(0, (weight * fatPercent) / 100) : null;
  const leanMass = fatMass !== null ? Math.max(0, weight - fatMass) : null;
  const waistRatio =
    height > 0 && number(body.waist) > 0 ? number(body.waist) / height : null;
  const targetWeight = number(body.goalWeight);
  const targetDifference = targetWeight > 0 ? targetWeight - weight : null;
  const markerPosition = bmi
    ? Math.max(0, Math.min(100, ((bmi - 15) / 25) * 100))
    : 0;
  const update = (key) => (event) =>
    setBody((current) => ({ ...current, [key]: event.target.value }));

  return (
    <div className="body-goals-page">
      <div className="body-reference-note">
        <Info size={16} />
        <span>
          <b>Gunakan sebagai referensi, bukan diagnosis.</b> Rentang IMT dewasa
          mengikuti kategori Kemenkes Indonesia. Massa otot, usia, kondisi
          kesehatan, dan faktor lain dapat mengubah cara angka ini ditafsirkan.
        </span>
      </div>

      <div className="body-result-grid">
        <section className="panel body-result-card bmi-result-card">
          <div className="body-card-heading">
            <div className="body-icon bmi-icon">
              <Scale size={18} />
            </div>
            <span className="eyebrow">BODY MASS INDEX</span>
            <button
              className="body-info-button"
              title="IMT adalah alat skrining, bukan ukuran langsung lemak tubuh."
            >
              <Info size={15} />
            </button>
          </div>
          <div className="bmi-result">
            <b>{bmi ? format(bmi, 1) : "—"}</b>
            <span>kg/m²</span>
          </div>
          {status ? (
            <span className={`body-status ${status.tone}`}>{status.label}</span>
          ) : (
            <span className="body-status neutral">
              Masukkan tinggi dan berat
            </span>
          )}
          <div className="bmi-scale" aria-label="Skala IMT">
            <div className="bmi-scale-segments">
              <i />
              <i />
              <i />
              <i />
            </div>
            {bmi > 0 && (
              <span
                className="bmi-marker"
                style={{ left: `${markerPosition}%` }}
              />
            )}
          </div>
          <div className="bmi-scale-labels">
            <span>&lt;18,5</span>
            <span>18,5–24,9</span>
            <span>25–26,9</span>
            <span>≥27</span>
          </div>
          <p className="body-helper">
            IMT tidak membedakan lemak, otot, dan tulang.
          </p>
        </section>

        <section className="panel body-result-card fat-result-card">
          <div className="body-card-heading">
            <div className="body-icon fat-icon">
              <Target size={18} />
            </div>
            <span className="eyebrow">ESTIMASI LEMAK TUBUH</span>
            <button
              className="body-info-button"
              title="Estimasi rumus populasi; bukan pengukuran langsung."
            >
              <Info size={15} />
            </button>
          </div>
          {fatPercent !== null ? (
            <>
              <div className="fat-result">
                <b>
                  {format(fatPercent, 1)}
                  <small>%</small>
                </b>
                <span>perkiraan</span>
              </div>
              <div className="composition-split">
                <div>
                  <span>Fat mass</span>
                  <b>{format(fatMass)} kg</b>
                </div>
                <div>
                  <span>Lean mass*</span>
                  <b>{format(leanMass)} kg</b>
                </div>
              </div>
            </>
          ) : (
            <div className="fat-empty">
              <div className="fat-empty-ring">
                <Target size={20} />
              </div>
              <b>Lengkapi usia dan jenis kelamin</b>
              <span>Untuk menampilkan estimasi rumus dewasa.</span>
            </div>
          )}
          <p className="body-helper">
            Estimasi Deurenberg memakai IMT, usia, dan jenis kelamin; hasil
            dapat berbeda dari pengukuran komposisi tubuh.
          </p>
        </section>

        <section className="panel body-result-card reference-result-card">
          <div className="body-card-heading">
            <div className="body-icon reference-icon">
              <Weight size={18} />
            </div>
            <span className="eyebrow">RENTANG BERAT RUJUKAN</span>
          </div>
          {heightM > 0 ? (
            <>
              <div className="weight-range">
                <b>
                  {format(lowerWeight)}–{format(upperWeight)}
                </b>
                <span>kg untuk tinggi {format(height, 0)} cm</span>
              </div>
              <div className="range-visual">
                <span />
                <i
                  style={{
                    left: `${weight > 0 ? Math.max(0, Math.min(100, ((weight - lowerWeight + 8) / (upperWeight - lowerWeight + 16)) * 100)) : 50}%`,
                  }}
                />
              </div>
              <p className="body-helper">
                Kisaran dihitung dari IMT 18,5–24,9 pada orang dewasa; bukan
                target wajib.
              </p>
            </>
          ) : (
            <div className="fat-empty">
              <b>Masukkan tinggi badan</b>
              <span>Kami hitung rentang rujukannya.</span>
            </div>
          )}
        </section>
      </div>

      <div className="body-detail-grid">
        <section className="panel body-form-card">
          <div className="panel-heading">
            <div>
              <h2>Data tubuh</h2>
              <p>Perbarui ukuran untuk menghitung ulang.</p>
            </div>
            <div className="metric-icon teal">
              <Ruler size={17} />
            </div>
          </div>
          <div className="body-input-grid">
            <label className="body-field">
              Tinggi badan
              <span className="body-input">
                <input
                  type="number"
                  min="100"
                  max="240"
                  step="0.1"
                  value={body.height}
                  onChange={update("height")}
                  inputMode="decimal"
                />
                <small>cm</small>
              </span>
            </label>
            <label className="body-field">
              Berat badan
              <span className="body-input">
                <input
                  type="number"
                  min="25"
                  max="350"
                  step="0.1"
                  value={body.weight}
                  onChange={update("weight")}
                  inputMode="decimal"
                />
                <small>kg</small>
              </span>
            </label>
            <label className="body-field">
              Usia <em>untuk estimasi lemak</em>
              <span className="body-input">
                <input
                  type="number"
                  min="18"
                  max="100"
                  placeholder="Opsional"
                  value={body.age}
                  onChange={update("age")}
                  inputMode="numeric"
                />
                <small>th</small>
              </span>
            </label>
            <label className="body-field">
              Jenis kelamin <em>untuk estimasi lemak</em>
              <select value={body.sex} onChange={update("sex")}>
                <option value="">Pilih</option>
                <option value="female">Perempuan</option>
                <option value="male">Laki-laki</option>
              </select>
            </label>
            <label className="body-field">
              Lingkar pinggang <em>opsional</em>
              <span className="body-input">
                <input
                  type="number"
                  min="30"
                  max="200"
                  step="0.1"
                  placeholder="Opsional"
                  value={body.waist}
                  onChange={update("waist")}
                  inputMode="decimal"
                />
                <small>cm</small>
              </span>
            </label>
            <div className="waist-result">
              {waistRatio !== null ? (
                <>
                  <span>Rasio pinggang/tinggi</span>
                  <b>{format(waistRatio, 2)}</b>
                  <small>Catat trennya dari waktu ke waktu.</small>
                </>
              ) : (
                <>
                  <span>Rasio pinggang/tinggi</span>
                  <b>—</b>
                  <small>Tambahkan lingkar pinggang untuk menghitung.</small>
                </>
              )}
            </div>
          </div>
        </section>

        <section className="panel body-goal-card">
          <div className="panel-heading">
            <div>
              <h2>Target tubuh pribadi</h2>
              <p>
                Pilih targetmu sendiri; tidak ada satu angka ideal untuk semua
                orang.
              </p>
            </div>
            <div className="metric-icon purple">
              <Target size={17} />
            </div>
          </div>
          <label className="body-field goal-weight-field">
            Target berat
            <span className="body-input">
              <input
                type="number"
                min="25"
                max="350"
                step="0.1"
                placeholder="Atur target"
                value={body.goalWeight}
                onChange={update("goalWeight")}
                inputMode="decimal"
              />
              <small>kg</small>
            </span>
          </label>
          {targetDifference !== null ? (
            <div className="goal-delta">
              <div className="goal-delta-icon">
                <ArrowRight size={16} />
              </div>
              <div>
                <b>
                  {targetDifference === 0
                    ? "Target tercapai"
                    : `${format(Math.abs(targetDifference))} kg ${targetDifference > 0 ? "menuju target" : "di atas target"}`}
                </b>
                <span>
                  Perbandingan sederhana dengan berat yang kamu masukkan.
                </span>
              </div>
            </div>
          ) : (
            <div className="goal-prompt">
              <Target size={17} />
              <span>Masukkan target pribadi untuk melihat selisihnya.</span>
            </div>
          )}
          <div className="goal-disclaimer">
            Perubahan berat badan dapat dipengaruhi banyak faktor. Untuk target
            yang sesuai kondisi kesehatanmu, diskusikan dengan tenaga kesehatan.
          </div>
        </section>
      </div>

      <div className="body-source-note">
        <Info size={14} />
        <span>
          Estimasi lemak tubuh bukan hasil pengukuran langsung. *Lean mass pada
          tampilan ini dihitung sebagai sisa estimasi berat setelah massa lemak.
        </span>
      </div>
    </div>
  );
}
