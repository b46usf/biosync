import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import {
  Activity, ArrowDownRight, ArrowRight, ArrowUpRight, Award, Bell, Bike, CalendarDays,
  Check, ChevronDown, ChevronLeft, ChevronRight, CircleHelp, Clock3, Flame, Footprints,
  Heart, Home, LockKeyhole, LogOut, Menu, Moon, MoreHorizontal, Plus, Route, Settings2,
  Shield, ShieldCheck, Sparkles, Target, TrendingUp, Watch, Waves, X, Zap,
} from 'lucide-react'
import Swal from 'sweetalert2'
import BodyGoals from './BodyGoals.jsx'
import { createEncryptedVault, deleteEncryptedVault, hasEncryptedVault, hasLegacyState, readLegacyState, saveEncryptedVault, unlockEncryptedVault } from './secureStore.js'

const ActivityTrendChart = lazy(() => import('./ChartViews.jsx').then((module) => ({ default: module.ActivityTrendChart })))
const HealthSparkline = lazy(() => import('./ChartViews.jsx').then((module) => ({ default: module.HealthSparkline })))
const HealthTrendChart = lazy(() => import('./ChartViews.jsx').then((module) => ({ default: module.HealthTrendChart })))

const navItems = [
  { label: 'Home', icon: Home }, { label: 'Activity', icon: Activity },
  { label: 'Health', icon: Heart }, { label: 'Challenges', icon: Award }, { label: 'Profile', icon: Shield },
]
const trendData = [
  { day: 'Sen', steps: 5200, heart: 77 }, { day: 'Sel', steps: 7900, heart: 74 },
  { day: 'Rab', steps: 6100, heart: 76 }, { day: 'Kam', steps: 10200, heart: 72 },
  { day: 'Jum', steps: 8400, heart: 75 }, { day: 'Sab', steps: 11200, heart: 71 },
  { day: 'Min', steps: 8420, heart: 76 },
]
const initialActivities = [
  { type: 'Run', title: 'Morning Run', date: 'Hari ini, 06:42', distance: '5.24 km', time: '32:18', pace: '6’10”', icon: Route, tone: 'mint' },
  { type: 'Walk', title: 'Evening Walk', date: 'Kemarin, 18:20', distance: '2.10 km', time: '28:05', pace: '13’21”', icon: Footprints, tone: 'blue' },
  { type: 'Cycle', title: 'City Ride', date: '18 Sep, 07:15', distance: '12.8 km', time: '41:32', pace: '18.5 km/h', icon: Bike, tone: 'orange' },
]
const challenges = [
  { title: 'Move 20 km this week', sub: 'Weekly movement challenge', progress: 62, stat: '12.4 / 20 km', people: '2,430 joined', tone: 'lime', icon: Route },
  { title: '7-day sleep reset', sub: 'Build a better wind-down', progress: 71, stat: '5 / 7 nights', people: '816 joined', tone: 'purple', icon: Moon },
  { title: '10K steps a day', sub: 'A little more every day', progress: 84, stat: '5,882 / 7,000', people: '1,204 joined', tone: 'teal', icon: Footprints },
]
const devices = [
  { name: 'Google Fit', detail: 'Sync langkah & aktivitas', icon: 'G', color: 'google' },
  { name: 'Apple Health', detail: 'Data kesehatan iPhone', icon: '♥', color: 'apple' },
  { name: 'Fitbit', detail: 'Aktivitas & tidur', icon: 'f', color: 'fitbit' },
]

function initials(name) { return name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase() }
function escapeHtml(value) { return String(value ?? '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]) }

function App() {
  const [page, setPage] = useState('Home')
  const [onboarded, setOnboarded] = useState(false)
  const [drawer, setDrawer] = useState(false)
  const [range, setRange] = useState('Minggu ini')
  const [activityType, setActivityType] = useState('All')
  const [slide, setSlide] = useState(0)
  const [loading, setLoading] = useState(true)
  const [activityList, setActivityList] = useState(() => initialActivities.map((item, index) => ({ ...item, id: `sample-${index}` })))
  const [profile, setProfile] = useState({ name: 'Alex Morgan', goals: ['Stamina', 'Sleep'] })
  const [body, setBody] = useState({ height: 172, weight: 68, age: '', sex: '', waist: '', goalWeight: '' })
  const [connections, setConnections] = useState([])
  const [devicePermissions, setDevicePermissions] = useState({})
  const [joined, setJoined] = useState([])
  const [userChallenges, setUserChallenges] = useState([])
  const [consent, setConsent] = useState(true)
  const [tracking, setTracking] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [vaultStatus, setVaultStatus] = useState('checking')
  const [vaultMode, setVaultMode] = useState('setup')
  const [vaultError, setVaultError] = useState('')
  const vaultRef = useRef(null)
  const vaultEpoch = useRef(0)
  const saveTimer = useRef(null)
  const saveQueue = useRef(Promise.resolve())

  useEffect(() => { const timer = setTimeout(() => setLoading(false), 850); return () => clearTimeout(timer) }, [])
  useEffect(() => {
    try {
      setVaultMode(hasEncryptedVault() ? 'unlock' : hasLegacyState() ? 'migrate' : 'setup')
      setVaultStatus(hasEncryptedVault() ? 'locked' : 'access')
    } catch { setVaultStatus('unavailable') }
  }, [])
  useEffect(() => {
    if (vaultStatus !== 'ready' || !vaultRef.current) return
    clearTimeout(saveTimer.current)
    const keys = vaultRef.current
    const epoch = vaultEpoch.current
    const snapshot = { profile, body, connections, devicePermissions, joined, userChallenges, consent, onboarded, activities: activityList.map(({ icon, ...activity }) => activity) }
    saveTimer.current = setTimeout(() => {
      saveQueue.current = saveQueue.current.then(async () => {
        if (epoch === vaultEpoch.current && vaultRef.current === keys) await saveEncryptedVault(keys, snapshot)
      }).catch(() => setVaultError('Penyimpanan terenkripsi gagal. Pastikan ruang penyimpanan browser tersedia.'))
    }, 180)
    return () => clearTimeout(saveTimer.current)
  }, [vaultStatus, profile, body, connections, devicePermissions, joined, userChallenges, consent, onboarded, activityList])
  useEffect(() => { if (!tracking) return; const tick = setInterval(() => setElapsed((n) => n + 1), 1000); return () => clearInterval(tick) }, [tracking])

  const applyVaultData = (data = {}) => {
    setProfile({ name: 'Alex Morgan', goals: ['Stamina', 'Sleep'], ...(data.profile || {}) })
    setBody(data.body || { height: Number(data.profile?.height) || 172, weight: Number(data.profile?.weight) || 68, age: '', sex: '', waist: '', goalWeight: '' })
    setConnections(Array.isArray(data.connections) ? data.connections : [])
    setDevicePermissions(data.devicePermissions || {})
    setJoined(Array.isArray(data.joined) ? data.joined : [])
    setUserChallenges(Array.isArray(data.userChallenges) ? data.userChallenges : [])
    setConsent(data.consent ?? true)
    setActivityList(Array.isArray(data.activities) ? data.activities.map((item, index) => ({ ...item, id: item.id || `activity-${index}` })) : initialActivities.map((item, index) => ({ ...item, id: `sample-${index}` })))
    setOnboarded(Boolean(data.onboarded))
  }
  const openVault = async (password) => {
    setVaultError('')
    try {
      let data
      if (vaultMode === 'unlock') {
        const result = await unlockEncryptedVault(password)
        data = result.data
        vaultRef.current = result.keys
      } else {
        data = vaultMode === 'migrate' ? readLegacyState() : {}
        vaultRef.current = await createEncryptedVault(password, data)
      }
      vaultEpoch.current += 1
      applyVaultData(data)
      setVaultStatus('ready')
    } catch (error) {
      vaultRef.current = null
      setVaultError(error?.message === 'AUTH' ? 'Kata sandi salah atau data terenkripsi berubah.' : 'Tidak dapat membuka penyimpanan. Coba lagi atau hapus data demo melalui pengaturan browser.')
    }
  }
  const lockVault = async () => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    await saveQueue.current
    if (vaultRef.current) {
      const snapshot = { profile, body, connections, devicePermissions, joined, userChallenges, consent, onboarded, activities: activityList.map(({ icon, ...activity }) => activity) }
      await saveEncryptedVault(vaultRef.current, snapshot)
    }
    vaultEpoch.current += 1
    vaultRef.current = null
    setVaultMode('unlock')
    setVaultStatus('locked')
    setPage('Home')
  }

  const filteredActivities = useMemo(() => activityType === 'All' ? activityList : activityList.filter((a) => a.type === activityType), [activityList, activityType])
  const showToast = (title, text = '') => Swal.fire({ toast: true, position: 'top-end', icon: 'success', title, text, showConfirmButton: false, timer: 2300, timerProgressBar: true, customClass: { popup: 'biosync-toast' } })
  const ask = (title, text, confirmText = 'Lanjutkan') => Swal.fire({ title, text, icon: 'question', showCancelButton: true, confirmButtonText: confirmText, cancelButtonText: 'Batal', reverseButtons: true, customClass: { popup: 'biosync-modal', confirmButton: 'swal-confirm', cancelButton: 'swal-cancel' }, buttonsStyling: false })

  const startTracking = async () => {
    if (!tracking) {
      const result = await ask('Mulai aktivitas?', 'BioSync akan mencatat durasi dan jarak perkiraan aktivitas ini.', 'Mulai')
      if (result.isConfirmed) { setElapsed(0); setTracking(true); showToast('Aktivitas dimulai', 'Semangat bergerak!') }
    } else {
      const result = await ask('Selesaikan aktivitas?', 'Aktivitas ini akan disimpan ke riwayatmu.', 'Simpan aktivitas')
      if (result.isConfirmed) {
        setTracking(false)
        setActivityList((old) => [{ id: crypto.randomUUID(), type: 'Run', title: 'Aktivitas baru', date: 'Baru saja', distance: `${(elapsed / 600).toFixed(2)} km`, time: `${String(Math.floor(elapsed / 60)).padStart(2, '0')}:${String(elapsed % 60).padStart(2, '0')}`, pace: '—', icon: Route, tone: 'mint' }, ...old])
        setPage('Activity'); showToast('Aktivitas tersimpan')
      }
    }
  }
  const connectDevice = async (device) => {
    const result = await ask(`Hubungkan ${device.name}?`, 'Kamu dapat mengatur izin kategori data dan mencabut akses kapan saja.', 'Lihat izin')
    if (result.isConfirmed) {
      const accepted = await Swal.fire({ title: 'Pilih data yang boleh disinkronkan', html: '<div class="consent-options"><label><input type="checkbox" value="activity" checked> Langkah & aktivitas</label><label><input type="checkbox" value="heart" checked> Detak jantung</label><label><input type="checkbox" value="sleep"> Tidur & recovery</label></div><p class="modal-note">Data kesehatan tetap privat dan dapat dicabut kapan saja.</p>', showCancelButton: true, confirmButtonText: 'Izinkan & hubungkan', cancelButtonText: 'Batal', customClass: { popup: 'biosync-modal', confirmButton: 'swal-confirm', cancelButton: 'swal-cancel' }, buttonsStyling: false, preConfirm: () => [...Swal.getHtmlContainer().querySelectorAll('input:checked')].map((input) => input.value) })
      if (accepted.isConfirmed) { setConnections((old) => [...new Set([...old, device.name])]); setDevicePermissions((old) => ({ ...old, [device.name]: accepted.value })); showToast(`${device.name} terhubung`) }
    }
  }
  const exportData = () => {
    const blob = new Blob([JSON.stringify({ profile, body, activities: activityList.map(({icon, ...activity})=>activity), connections, devicePermissions, joined, userChallenges, consent, exportedAt: new Date().toISOString() }, null, 2)], { type: 'application/json' })
    const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = 'biosync-my-data.json'; link.click(); URL.revokeObjectURL(link.href); showToast('Data berhasil diekspor', 'File JSON tersimpan di perangkatmu.')
  }
  const deleteAccount = async () => {
    const result = await ask('Hapus akun demo?', 'Data demo di browser ini akan dihapus. Tindakan tidak dapat dibatalkan.', 'Hapus data')
    if (result.isConfirmed) { if (saveTimer.current) clearTimeout(saveTimer.current); vaultEpoch.current += 1; vaultRef.current = null; deleteEncryptedVault(); setVaultMode('setup'); setVaultStatus('access'); setProfile({ name: 'Alex Morgan', goals: ['Stamina', 'Sleep'] }); setBody({ height: 172, weight: 68, age: '', sex: '', waist: '', goalWeight: '' }); setConnections([]); setDevicePermissions({}); setJoined([]); setUserChallenges([]); setConsent(true); setActivityList(initialActivities.map((item,index)=>({...item,id:`sample-${index}`}))); setOnboarded(false); setPage('Home'); showToast('Data demo dihapus') }
  }
  const editActivity = async (activity) => {
    const result = await Swal.fire({
      title: 'Edit aktivitas',
      html: `<div class="onboarding-fields"><label>Nama aktivitas<input id="activity-title" value="${escapeHtml(activity.title)}" maxlength="60"></label><label>Jenis<select id="activity-type"><option ${activity.type === 'Run' ? 'selected' : ''}>Run</option><option ${activity.type === 'Walk' ? 'selected' : ''}>Walk</option><option ${activity.type === 'Cycle' ? 'selected' : ''}>Cycle</option><option ${activity.type === 'Gym' ? 'selected' : ''}>Gym</option><option ${activity.type === 'Yoga' ? 'selected' : ''}>Yoga</option></select></label><div><label>Jarak<input id="activity-distance" value="${escapeHtml(activity.distance)}" maxlength="20"></label><label>Durasi<input id="activity-time" value="${escapeHtml(activity.time)}" maxlength="20"></label></div><label>Pace<input id="activity-pace" value="${escapeHtml(activity.pace)}" maxlength="20"></label></div>`,
      showCancelButton: true, confirmButtonText: 'Simpan', cancelButtonText: 'Batal', customClass: { popup: 'biosync-modal', confirmButton: 'swal-confirm', cancelButton: 'swal-cancel' }, buttonsStyling: false,
      preConfirm: () => { const title = document.getElementById('activity-title').value.trim(); if (!title) { Swal.showValidationMessage('Nama aktivitas wajib diisi.'); return false } return { title, type: document.getElementById('activity-type').value, distance: document.getElementById('activity-distance').value.trim(), time: document.getElementById('activity-time').value.trim(), pace: document.getElementById('activity-pace').value.trim() } },
    })
    if (result.isConfirmed) { setActivityList((current) => current.map((item) => item.id === activity.id ? { ...item, ...result.value } : item)); showToast('Aktivitas diperbarui') }
  }
  const deleteActivity = async (activity) => {
    const result = await ask('Hapus aktivitas ini?', 'Aktivitas akan dihapus dari data demo lokal.', 'Hapus aktivitas')
    if (result.isConfirmed) { setActivityList((current) => current.filter((item) => item.id !== activity.id)); showToast('Aktivitas dihapus') }
  }
  const createChallenge = async () => {
    const result = await Swal.fire({ title: 'Buat challenge pribadi', html: '<div class="onboarding-fields"><label>Nama challenge<input id="challenge-name" maxlength="60" placeholder="Contoh: Jalan kaki 5 hari"></label><label>Target pribadi<input id="challenge-target" maxlength="40" placeholder="Contoh: 30 km minggu ini"></label></div>', showCancelButton: true, confirmButtonText: 'Buat challenge', cancelButtonText: 'Batal', customClass: { popup: 'biosync-modal', confirmButton: 'swal-confirm', cancelButton: 'swal-cancel' }, buttonsStyling: false, preConfirm: () => { const title = document.getElementById('challenge-name').value.trim(); const goal = document.getElementById('challenge-target').value.trim(); if (!title || !goal) { Swal.showValidationMessage('Nama dan target wajib diisi.'); return false } return { title, goal } } })
    if (result.isConfirmed) { setUserChallenges((current) => [{ id: crypto.randomUUID(), ...result.value }, ...current]); showToast('Challenge dibuat') }
  }
  const editChallenge = async (challenge) => {
    const result = await Swal.fire({ title: 'Edit challenge', html: `<div class="onboarding-fields"><label>Nama challenge<input id="challenge-name" maxlength="60" value="${escapeHtml(challenge.title)}"></label><label>Target pribadi<input id="challenge-target" maxlength="40" value="${escapeHtml(challenge.goal)}"></label></div>`, showCancelButton: true, confirmButtonText: 'Simpan', cancelButtonText: 'Batal', customClass: { popup: 'biosync-modal', confirmButton: 'swal-confirm', cancelButton: 'swal-cancel' }, buttonsStyling: false, preConfirm: () => { const title = document.getElementById('challenge-name').value.trim(); const goal = document.getElementById('challenge-target').value.trim(); if (!title || !goal) { Swal.showValidationMessage('Nama dan target wajib diisi.'); return false } return { title, goal } } })
    if (result.isConfirmed) setUserChallenges((current) => current.map((item) => item.id === challenge.id ? { ...item, ...result.value } : item))
  }
  const deleteChallenge = async (challenge) => {
    const result = await ask('Hapus challenge pribadi?', `${challenge.title} akan dihapus dari data demo.`, 'Hapus')
    if (result.isConfirmed) setUserChallenges((current) => current.filter((item) => item.id !== challenge.id))
  }
  const beginOnboarding = async () => {
    const goals = await Swal.fire({ title: 'What would you like to focus on?', html: '<div class="consent-options goal-options"><label><input type="checkbox" value="Stamina" checked> Build stamina</label><label><input type="checkbox" value="Sleep"> Better sleep</label><label><input type="checkbox" value="Strength"> Get stronger</label><label><input type="checkbox" value="Stress"> Manage stress</label><label><input type="checkbox" value="Weight"> Weight balance</label></div>', showCancelButton: true, confirmButtonText: 'Continue', cancelButtonText: 'Skip for now', customClass: { popup: 'biosync-modal', confirmButton: 'swal-confirm', cancelButton: 'swal-cancel' }, buttonsStyling: false, preConfirm: () => [...document.querySelectorAll('.goal-options input:checked')].map((input) => input.value) })
    const selectedGoals = goals.isConfirmed ? goals.value : []
    const details = await Swal.fire({ title: 'A little about you', html: '<div class="onboarding-fields"><label>Display name<input id="onboard-name" value="Alex Morgan" /></label><label>Age range<select id="onboard-age"><option>18–29</option><option selected>30–39</option><option>40–49</option><option>50+</option></select></label><div><label>Height (cm)<input id="onboard-height" type="number" value="172" /></label><label>Weight (kg)<input id="onboard-weight" type="number" value="68" /></label></div><label>Activity level<select id="onboard-level"><option>Light</option><option selected>Moderate</option><option>Active</option></select></label></div><p class="modal-note">These details are optional and can be changed later.</p>', showCancelButton: true, confirmButtonText: 'Continue', cancelButtonText: 'Skip for now', customClass: { popup: 'biosync-modal', confirmButton: 'swal-confirm', cancelButton: 'swal-cancel' }, buttonsStyling: false, preConfirm: () => ({ name: document.getElementById('onboard-name').value.trim(), age: document.getElementById('onboard-age').value, height: document.getElementById('onboard-height').value, weight: document.getElementById('onboard-weight').value, level: document.getElementById('onboard-level').value }) })
    const detailsValue = details.isConfirmed ? details.value : { name: profile.name }
    const source = await Swal.fire({ title: 'Connect a health source', html: '<div class="consent-options source-options"><label><input name="source" type="radio" value="Google Fit"> Google Fit</label><label><input name="source" type="radio" value="Apple Health"> Apple Health</label><label><input name="source" type="radio" value="Fitbit"> Fitbit</label><label><input name="source" type="radio" value=""> Skip for now</label></div><p class="modal-note">This demo records your choice only. Live sync requires provider authorization.</p>', showCancelButton: true, confirmButtonText: 'Continue', cancelButtonText: 'Skip for now', customClass: { popup: 'biosync-modal', confirmButton: 'swal-confirm', cancelButton: 'swal-cancel' }, buttonsStyling: false, preConfirm: () => document.querySelector('.source-options input:checked')?.value || '' })
    const sourceValue = source.isConfirmed ? source.value : ''
    const privacy = await Swal.fire({ title: 'You’re in control', text: 'Health data categories stay private. You can review permissions, export or delete your data any time.', icon: 'success', showCancelButton: true, confirmButtonText: 'Agree & open dashboard', cancelButtonText: 'Skip for now', customClass: { popup: 'biosync-modal', confirmButton: 'swal-confirm', cancelButton: 'swal-cancel' }, buttonsStyling: false })
    if (privacy.isConfirmed || privacy.isDismissed) {
      if (detailsValue.name) setProfile((old) => ({ ...old, name: detailsValue.name, goals: selectedGoals, age: detailsValue.age, height: detailsValue.height, weight: detailsValue.weight, activityLevel: detailsValue.level }))
      setBody((old) => ({ ...old, height: Number(detailsValue.height) || old.height, weight: Number(detailsValue.weight) || old.weight }))
      if (sourceValue) { setConnections((old) => [...new Set([...old, sourceValue])]); setDevicePermissions((old) => ({ ...old, [sourceValue]: ['activity', 'heart'] })) }
      setOnboarded(true); setPage('Home'); showToast('Welcome to BioSync', 'Your demo workspace is ready.')
    }
  }
  const joinChallenge = (title) => { setJoined((old) => old.includes(title) ? old.filter((item) => item !== title) : [...old, title]); showToast(joined.includes(title) ? 'Keluar dari challenge' : 'Kamu bergabung!', title) }
  const changePage = (name) => { setPage(name); setDrawer(false); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  const duration = `${String(Math.floor(elapsed / 60)).padStart(2, '0')}:${String(elapsed % 60).padStart(2, '0')}`

  if (vaultStatus === 'checking') return <div className="vault-checking">Membuka brankas BioSync…</div>
  if (vaultStatus === 'unavailable') return <div className="vault-checking">Browser ini tidak menyediakan penyimpanan lokal yang diperlukan.</div>
  if (vaultStatus !== 'ready') return <VaultAccess mode={vaultMode} error={vaultError} onSubmit={openVault} />
  if (!onboarded) return <Landing onStart={beginOnboarding} onDemo={() => { setOnboarded(true); setPage('Home') }} />

  return <div className="app-shell">
    <aside className={`sidebar ${drawer ? 'sidebar-open' : ''}`}>
      <div className="brand-row"><div className="brand-mark"><Activity size={20} strokeWidth={2.7}/></div><span>bio<span className="brand-light">sync</span></span><button className="icon-button sidebar-close" onClick={() => setDrawer(false)} aria-label="Tutup menu"><X size={19}/></button></div>
      <div className="workspace-label">WORKSPACE</div>
      <div className="workspace-switch"><div className="workspace-avatar">A</div><span><b>Personal space</b><small>Free plan</small></span><ChevronDown size={15}/></div>
      <div className="nav-caption">MENU UTAMA</div>
      <nav className="side-nav">{navItems.map(({ label, icon: Icon }) => <button key={label} className={`nav-item ${page === label ? 'active' : ''}`} onClick={() => changePage(label)}><Icon size={18}/><span>{label === 'Home' ? 'Dashboard' : label}</span>{label === 'Challenges' && <span className="nav-dot"/>}</button>)}</nav>
      <div className="nav-caption tools-caption">PREFERENSI</div>
      <button className={`nav-item ${page === 'Devices' ? 'active' : ''}`} onClick={() => changePage('Devices')}><Watch size={18}/><span>Connected devices</span><span className="device-count">{connections.length}</span></button>
      <button className={`nav-item ${page === 'Privacy' ? 'active' : ''}`} onClick={() => changePage('Privacy')}><LockKeyhole size={18}/><span>Privacy center</span></button>
      <button className="nav-item vault-lock-nav" onClick={lockVault}><ShieldCheck size={18}/><span>Kunci brankas</span></button>
      <div className="sidebar-spacer"/>
      <div className="sidebar-promo"><div className="promo-spark"><Sparkles size={17}/></div><b>Your data, your rules.</b><p>Atur izin dan jaga privasimu tetap dalam kendali.</p><button onClick={() => changePage('Privacy')}>Kelola privasi <ArrowRight size={14}/></button></div>
      <button className="profile-mini" onClick={() => changePage('Profile')}><div className="avatar">{initials(profile.name)}</div><span><b>{profile.name}</b><small>Personal account</small></span><MoreHorizontal size={18}/></button>
    </aside>
    {drawer && <button className="drawer-scrim" onClick={() => setDrawer(false)} aria-label="Tutup navigasi"/>}

    <main className="main-area">
      <header className="topbar"><button className="icon-button mobile-menu" onClick={() => setDrawer(true)} aria-label="Buka menu"><Menu size={20}/></button><div className="breadcrumb">Workspace <ChevronRight size={14}/> <b>{page === 'Home' ? 'Dashboard' : page}</b></div><div className="top-actions"><button className="help-link" onClick={() => Swal.fire({ title: 'Pusat bantuan BioSync', text: 'Untuk MVP demo, fitur ini belum terhubung ke layanan dukungan.', icon: 'info', confirmButtonText: 'Mengerti', customClass: { popup: 'biosync-modal', confirmButton: 'swal-confirm' }, buttonsStyling: false })}><CircleHelp size={17}/><span>Bantuan</span></button><button className="icon-button notification-button" aria-label="Notifikasi" onClick={() => showToast('Kamu sudah up to date')}><Bell size={18}/><i/></button><div className="top-divider"/><button className="top-user" onClick={() => changePage('Profile')}><div className="avatar avatar-small">{initials(profile.name)}</div><span>{profile.name.split(' ')[0]}</span><ChevronDown size={14}/></button></div></header>
      <div className="page-content">
        {vaultError && <div className="vault-save-error" role="alert">{vaultError}</div>}
        {page === 'Home' && <Dashboard loading={loading} profile={profile} range={range} setRange={setRange} slide={slide} setSlide={setSlide} startTracking={startTracking} tracking={tracking} duration={duration} changePage={changePage} activities={activityList} joined={joined} joinChallenge={joinChallenge}/>}
        {page === 'Activity' && <ActivityPage activities={filteredActivities} activityType={activityType} setActivityType={setActivityType} startTracking={startTracking} tracking={tracking} duration={duration} editActivity={editActivity} deleteActivity={deleteActivity}/>}
        {page === 'Health' && <HealthPage loading={loading} range={range} setRange={setRange} exportData={exportData} body={body} setBody={setBody}/>}
        {page === 'Challenges' && <><ChallengesPage joined={joined} joinChallenge={joinChallenge} createChallenge={createChallenge}/><MyChallenges challenges={userChallenges} editChallenge={editChallenge} deleteChallenge={deleteChallenge}/></>}
        {page === 'Profile' && <ProfilePage profile={profile} setProfile={setProfile} changePage={changePage} exportData={exportData} deleteAccount={deleteAccount} lockVault={lockVault}/>}
        {page === 'Devices' && <DevicesPage connections={connections} devicePermissions={devicePermissions} setDevicePermissions={setDevicePermissions} connectDevice={connectDevice} setConnections={setConnections} showToast={showToast} changePage={changePage}/>}
        {page === 'Privacy' && <PrivacyPage consent={consent} setConsent={setConsent} connections={connections} devicePermissions={devicePermissions} setDevicePermissions={setDevicePermissions} setConnections={setConnections} exportData={exportData} deleteAccount={deleteAccount} showToast={showToast}/>}
      </div>
      <footer className="footer"><span>© 2026 BioSync</span><span>Made for a healthier you <span className="footer-heart">♥</span></span><span><ShieldCheck size={13}/> Your data stays yours</span></footer>
    </main>
    <nav className="bottom-nav">{navItems.map(({ label, icon: Icon }) => <button key={label} className={page === label ? 'selected' : ''} onClick={() => changePage(label)}><Icon size={19}/><span>{label}</span></button>)}</nav>
  </div>
}

function VaultAccess({ mode, error, onSubmit }) {
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [busy, setBusy] = useState(false)
  const setup = mode !== 'unlock'
  const migrate = mode === 'migrate'
  const submit = async (event) => {
    event.preventDefault()
    if (password.length < 8 || (setup && password !== confirmation)) return
    setBusy(true)
    await onSubmit(password)
    setPassword('')
    setConfirmation('')
    setBusy(false)
  }
  return <main className="vault-screen">
    <section className="vault-card">
      <div className="vault-mark"><ShieldCheck size={24}/></div>
      <span className="eyebrow">BIOSYNC · DEMO USER</span>
      <h1>{setup ? 'Buat brankas data' : 'Buka brankas data'}</h1>
      <p>{migrate ? 'Data demo lama akan dienkripsi di perangkat ini sebelum dibuka.' : setup ? 'Buat kata sandi lokal untuk mengenkripsi data demo di browser ini.' : 'Masukkan kata sandi untuk membuka data terenkripsi di perangkat ini.'}</p>
      <form onSubmit={submit}>
        <label>Kata sandi<input type="password" autoComplete={setup ? 'new-password' : 'current-password'} value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} required autoFocus /></label>
        {setup && <label>Ulangi kata sandi<input type="password" autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} minLength={8} required /></label>}
        {error && <div className="vault-error" role="alert">{error}</div>}
        {setup && password.length > 0 && password.length < 8 && <div className="vault-hint">Gunakan minimal 8 karakter.</div>}
        {setup && confirmation.length > 0 && password !== confirmation && <div className="vault-hint">Konfirmasi kata sandi belum cocok.</div>}
        <button className="primary-button vault-submit" disabled={busy || password.length < 8 || (setup && password !== confirmation)}>{busy ? 'Memproses…' : setup ? 'Buat & lanjutkan' : 'Buka BioSync'}</button>
      </form>
      <div className="vault-crypto"><LockKeyhole size={14}/><span>Enkripsi AES-256-GCM · autentikasi HMAC-SHA-256</span></div>
      <small>Kata sandi tidak disimpan. Jika terlupa, data lokal tidak dapat dipulihkan.</small>
    </section>
  </main>
}

function Landing({ onStart, onDemo }) {
  const [feature, setFeature] = useState(0)
  const items = [
    { icon: Activity, title: 'Track what moves you', copy: 'Bring your movement and daily health signals into one calm, clear view.' },
    { icon: Sparkles, title: 'Make progress feel good', copy: 'Build healthy routines with small goals, streaks and community challenges.' },
    { icon: ShieldCheck, title: 'Keep your data yours', copy: 'Choose what you share. Export, revoke or delete your data whenever you want.' },
  ]
  const ItemIcon = items[feature].icon
  return <div className="landing-shell min-h-screen"><header className="landing-nav"><div className="brand-row"><div className="brand-mark"><Activity size={20} strokeWidth={2.7}/></div><span>bio<span className="brand-light">sync</span></span></div><nav><a href="#features">Features</a><a href="#privacy">Your privacy</a></nav><button className="landing-signin" onClick={onDemo}>Explore demo <ArrowRight size={15}/></button></header><main className="landing-main"><section className="landing-hero"><div className="landing-copy"><span className="landing-pill"><span/> MOVE · SYNC · OWN</span><h1>Your Health.<br/><span>Your Data.</span><br/>Your Control.</h1><p>One clear picture of your wellbeing. Make progress at your pace, with your health data always in your hands.</p><div className="landing-actions"><button className="landing-cta" onClick={onStart}>Start tracking <ArrowRight size={16}/></button><a href="#features">Explore features <ChevronDown size={15}/></a></div><div className="landing-trust"><ShieldCheck size={16}/><span>Private by design</span><i/> No diagnosis, just helpful insights</div></div><div className="landing-preview"><div className="preview-glow"/><div className="preview-card"><div className="preview-header"><div><span>MONDAY, SEP 21</span><b>Your day, in balance.</b></div><div className="preview-avatar">A</div></div><div className="preview-score"><div className="preview-score-ring"><div><b>82</b><span>daily score</span></div></div><div className="preview-score-copy"><span>DAILY SCORE</span><b>Great momentum!</b><small>You’re moving more than 78% of users today.</small></div></div><div className="preview-stats"><div><Footprints size={15}/><span>Steps</span><b>8,420</b></div><div><Flame size={15}/><span>Calories</span><b>640 kcal</b></div><div><Heart size={15}/><span>Heart</span><b>76 bpm</b></div></div><div className="preview-chart"><div><b>Activity overview</b><span>THIS WEEK</span></div><svg viewBox="0 0 360 88" preserveAspectRatio="none"><path className="preview-area" d="M0 71 C26 70 26 45 55 53 S87 64 113 38 S148 48 170 31 S205 41 225 23 S259 48 286 29 S329 27 360 10 V88 H0Z"/><path className="preview-line" d="M0 71 C26 70 26 45 55 53 S87 64 113 38 S148 48 170 31 S205 41 225 23 S259 48 286 29 S329 27 360 10"/></svg><div className="preview-days"><span>MON</span><span>TUE</span><span>WED</span><span>THU</span><span>FRI</span><span>SAT</span><span>SUN</span></div></div><div className="preview-bottom"><div className="preview-flame"><Flame size={15}/></div><span><b>7 day streak</b><small>One more day to your next badge</small></span><ArrowUpRight size={16}/></div></div><div className="floating-note"><div><LockKeyhole size={16}/></div><span><b>Your data stays yours</b><small>Private by design</small></span><Check size={15}/></div><div className="landing-orbit landing-orbit-one"/><div className="landing-orbit landing-orbit-two"/></div></section><section className="landing-feature-row" id="features"><div className="landing-feature-heading"><span className="eyebrow">A HEALTHIER YOU, IN SYNC</span><h2>Everything that matters.<br/>Nothing you don’t need.</h2></div><div className="landing-feature-card"><div className="landing-feature-icon"><ItemIcon size={19}/></div><div className="landing-feature-copy"><b>{items[feature].title}</b><p>{items[feature].copy}</p></div><div className="landing-feature-controls"><button onClick={()=>setFeature((feature+items.length-1)%items.length)} aria-label="Feature sebelumnya"><ChevronLeft size={15}/></button><span>{feature+1} / {items.length}</span><button onClick={()=>setFeature((feature+1)%items.length)} aria-label="Feature berikutnya"><ChevronRight size={15}/></button></div></div></section><section className="landing-privacy" id="privacy"><div className="landing-privacy-icon"><Shield size={18}/></div><div><b>Your health is personal. Your data should be too.</b><p>We keep health details off public blockchains. Web3 ownership is optional, and your core experience works without a wallet.</p></div><button onClick={onStart}>Get started <ArrowRight size={14}/></button></section></main><footer className="landing-footer"><span>© 2026 BioSync</span><span><ShieldCheck size={13}/> Your health data stays yours</span></footer></div>
}

function Dashboard({ loading, profile, range, setRange, slide, setSlide, startTracking, tracking, duration, changePage, activities, joined, joinChallenge }) {
  const firstName = profile.name.split(' ')[0]
  const featured = challenges[slide]
  return <>
    <div className="welcome-row"><div><div className="eyebrow"><span className="live-dot"/> SENIN, 21 SEPTEMBER 2026</div><h1>Good morning, {firstName}<span className="wave">✦</span></h1><p>Hari baru, kesempatan baru untuk bergerak lebih baik.</p></div><button className="date-button"><CalendarDays size={16}/> Hari ini <ChevronDown size={14}/></button></div>
    {loading ? <DashboardSkeleton/> : <>
      <section className="hero-grid">
        <div className="score-card"><div className="score-orb orb-one"/><div className="score-orb orb-two"/><div className="score-top"><div><div className="card-kicker">YOUR DAILY SCORE <span className="info-dot">i</span></div><div className="score-value">82<span>/100</span></div></div><div className="score-badge"><TrendingUp size={14}/> +8 pts</div></div><p className="score-copy">Kamu lebih aktif dari <b>78% pengguna</b> hari ini.</p><div className="score-bottom"><div className="score-progress"><span/></div><span>Great momentum!</span><Sparkles size={15}/></div><div className="score-watermark"><Activity size={142}/></div></div>
        <div className="streak-card"><div className="streak-icon"><Flame size={19} fill="currentColor"/></div><div className="streak-meta"><span>ACTIVE STREAK</span><b>7 <small>days</small></b></div><div className="week-dots">{['M','T','W','T','F','S','S'].map((d,i) => <div className={i < 5 ? 'done' : ''} key={`${d}${i}`}><i>{i < 5 ? <Check size={11}/> : ''}</i><span>{d}</span></div>)}</div><div className="streak-note"><span className="streak-spark">✦</span> Keep it up! 3 more days to your next badge.</div></div>
      </section>
      <section className="metrics-grid"><MetricCard icon={Footprints} name="Steps" value="8,420" unit="steps" goal="84% of 10,000 goal" progress={84} tint="teal" change="12%"/><MetricCard icon={Flame} name="Calories" value="640" unit="kcal" goal="64% of 1,000 goal" progress={64} tint="orange" change="8%"/><MetricCard icon={Heart} name="Heart rate" value="76" unit="bpm" goal="Resting · within range" progress={71} tint="pink" change="2 bpm" down/></section>
      <section className="content-grid"><div className="panel activity-chart-panel"><div className="panel-heading"><div><h2>Activity overview</h2><p>Keep your movement in rhythm.</p></div><select className="range-select" value={range} onChange={(e) => setRange(e.target.value)}><option>Minggu ini</option><option>30 hari</option><option>90 hari</option></select></div><div className="chart-legend"><span><i className="legend-teal"/> Steps</span><b>8,420 <small>steps</small></b></div><div className="chart-wrap"><Suspense fallback={<div className="skeleton chart-loading"/>}><ActivityTrendChart data={trendData}/></Suspense></div><div className="chart-foot"><span><span className="trend-arrow"><ArrowUpRight size={13}/></span> <b>+18.4%</b> <span>vs last week</span></span><button className="text-button" onClick={() => changePage('Activity')}>View activity <ArrowRight size={14}/></button></div></div>
        <div className="panel snapshot-panel"><div className="panel-heading"><div><h2>Health snapshot</h2><p>Your body, at a glance.</p></div><button className="dots-button" onClick={() => changePage('Health')} aria-label="Health details"><MoreHorizontal size={20}/></button></div><div className="snapshot-item"><div className="snap-icon sleep-icon"><Moon size={17}/></div><div className="snap-main"><span>Sleep</span><b>7h 42m</b></div><span className="status-pill good">Good</span><div className="sleep-bars">{[10,14,12,19,14,22,16,24,16,20,15,12,17,13,21,15,12,19,11,15].map((h,i)=><i key={i} style={{height:h}}/>)}</div></div><div className="snapshot-item"><div className="snap-icon recovery-icon"><Zap size={17}/></div><div className="snap-main"><span>Recovery</span><b>Ready to go</b></div><span className="status-pill great">Optimal</span><div className="recovery-meter"><span/></div></div><div className="snapshot-item"><div className="snap-icon oxygen-icon"><Waves size={17}/></div><div className="snap-main"><span>Resting heart</span><b>58 <small>bpm</small></b></div><span className="status-pill good">Normal</span><svg className="mini-line" viewBox="0 0 90 24" preserveAspectRatio="none"><path d="M1 15 C8 12 8 18 14 14 S22 11 28 14 S36 18 42 11 S50 17 56 13 S64 12 70 15 S80 7 89 11"/></svg></div><button className="snapshot-link" onClick={() => changePage('Health')}>See all health metrics <ArrowRight size={14}/></button></div></section>
      <section className="lower-grid"><div className="panel recent-panel"><div className="panel-heading"><div><h2>Recent activity</h2><p>Every move adds up.</p></div><button className="text-button" onClick={() => changePage('Activity')}>View all <ArrowRight size={14}/></button></div><div className="recent-list">{activities.slice(0, 3).map((item, i) => <ActivityRow key={`${item.title}${i}`} item={item}/>)}</div></div><div className={`challenge-feature feature-${featured.tone}`}><div className="challenge-feature-top"><span className="feature-tag"><Sparkles size={12}/> WEEKLY CHALLENGE</span><div className="carousel-controls"><button onClick={() => setSlide((slide + challenges.length - 1) % challenges.length)} aria-label="Challenge sebelumnya"><ChevronLeft size={15}/></button><button onClick={() => setSlide((slide + 1) % challenges.length)} aria-label="Challenge berikutnya"><ChevronRight size={15}/></button></div></div><div className="feature-icon"><featured.icon size={21}/></div><h2>{featured.title}</h2><p>{featured.sub}</p><div className="feature-progress-line"><span style={{width:`${featured.progress}%`}}/></div><div className="feature-stats"><b>{featured.stat}</b><span>{featured.people}</span></div><button className="feature-join" onClick={() => joinChallenge(featured.title)}>{joined.includes(featured.title) ? 'Joined ✓' : 'Join challenge'} <ArrowRight size={15}/></button><div className="feature-dots">{challenges.map((c,i)=><button aria-label={`Challenge ${i+1}`} className={slide === i ? 'active' : ''} key={c.title} onClick={() => setSlide(i)}/>)}</div></div></section>
      <section className="bottom-promo"><div className="promo-shield"><ShieldCheck size={21}/></div><div><b>Your health data is yours.</b><p>Review what you share, and stay in control at every step.</p></div><button onClick={() => changePage('Privacy')}>Privacy center <ArrowRight size={14}/></button><div className="promo-orb"/></section>
    </>}
  </>
}

function MetricCard({ icon: Icon, name, value, unit, goal, progress, tint, change, down }) { return <div className="metric-card"><div className="metric-top"><div className={`metric-icon ${tint}`}><Icon size={17}/></div><span className={`metric-change ${down ? 'down' : ''}`}>{down ? <ArrowDownRight size={13}/> : <ArrowUpRight size={13}/>} {change}</span></div><div className="metric-label">{name}</div><div className="metric-value">{value}<small>{unit}</small></div><div className="metric-progress"><span className={tint} style={{width:`${progress}%`}}/></div><div className="metric-foot">{goal}</div></div> }
function ActivityRow({ item, onEdit, onDelete }) { const Icon = item.icon || Activity; return <div className="activity-row"><div className={`activity-symbol ${item.tone}`}><Icon size={17}/></div><div className="activity-name"><b>{item.title}</b><span>{item.date}</span></div><div className="activity-distance"><b>{item.distance}</b><span>{item.time}</span></div><div className="activity-pace"><b>{item.pace}</b><span>avg. pace</span></div><button className="row-more" aria-label={`Opsi ${item.title}`} onClick={async () => { if (!onEdit || !onDelete) return Swal.fire({ title: item.title, html: `<div class="activity-detail"><span>${escapeHtml(item.distance)} <small>Distance</small></span><span>${escapeHtml(item.time)} <small>Duration</small></span><span>${escapeHtml(item.pace)} <small>Average pace</small></span></div>`, confirmButtonText: 'Tutup', customClass: { popup: 'biosync-modal', confirmButton: 'swal-confirm' }, buttonsStyling: false }); const result = await Swal.fire({ title: item.title, text: `${item.distance} · ${item.time} · ${item.pace}`, icon: 'info', showCancelButton: true, showDenyButton: true, confirmButtonText: 'Edit', denyButtonText: 'Hapus', cancelButtonText: 'Tutup', customClass: { popup: 'biosync-modal', confirmButton: 'swal-confirm', denyButton: 'swal-cancel', cancelButton: 'swal-cancel' }, buttonsStyling: false }); if (result.isConfirmed) onEdit(item); if (result.isDenied) onDelete(item) }}><MoreHorizontal size={18}/></button></div> }
function DashboardSkeleton() { return <div className="skeleton-dashboard" aria-label="Memuat dashboard"><div className="skeleton skeleton-hero"/><div className="skeleton-row">{[1,2,3].map(n=><div className="skeleton skeleton-metric" key={n}/>)}</div><div className="skeleton-row"><div className="skeleton skeleton-chart"/><div className="skeleton skeleton-snapshot"/></div><div className="skeleton-row"><div className="skeleton skeleton-recent"/><div className="skeleton skeleton-challenge"/></div></div> }

function ActivityPage({ activities, activityType, setActivityType, startTracking, tracking, duration, editActivity, deleteActivity }) { return <><PageHeader eyebrow="MOVE AT YOUR PACE" title="Your activity" subtitle="Small steps. Stronger you." action={<button className={`primary-button ${tracking ? 'recording' : ''}`} onClick={startTracking}>{tracking ? <><span className="record-dot"/> {duration} · Finish</> : <><Plus size={17}/> Start activity</>}</button>}/><div className="activity-summary"><div><span>Total distance</span><b>42.8 <small>km</small></b><small className="summary-up"><ArrowUpRight size={13}/> 12% this month</small></div><div><span>Active time</span><b>6h 24m</b><small>across 18 activities</small></div><div><span>Avg. pace</span><b>6’42” <small>/km</small></b><small>Looking steady</small></div></div><div className="section-title-row"><div><h2>Activity history</h2><p>Your recent movement, all in one place.</p></div><div className="filter-row">{['All','Run','Walk','Cycle','Gym','Yoga'].map((t)=><button className={activityType === t ? 'selected' : ''} key={t} onClick={()=>setActivityType(t)}>{t}</button>)}</div></div><div className="panel history-panel">{activities.length ? activities.map((item,i)=><ActivityRow key={item.id || `${item.title}${i}`} item={item} onEdit={editActivity} onDelete={deleteActivity}/>) : <EmptyState icon={Activity} title="Belum ada aktivitas" copy="Mulai bergerak dan aktivitasmu akan muncul di sini."/>}</div><div className="map-card"><div className="map-art"><div className="map-road road-one"/><div className="map-road road-two"/><div className="map-road road-three"/><div className="map-route"><span/><i/><b/></div><div className="map-pin"><Route size={15}/></div></div><div className="map-info"><div><span className="eyebrow">RECENT ROUTE</span><h3>Morning loop</h3><p>Route details are kept private by default.</p></div><button className="secondary-button" onClick={()=>Swal.fire({title:'Rute disamarkan',text:'Lokasi presisi tidak ditampilkan pada demo ini.',icon:'info',confirmButtonText:'Oke',customClass:{popup:'biosync-modal',confirmButton:'swal-confirm'},buttonsStyling:false})}>Privacy settings <LockKeyhole size={14}/></button></div></div></> }

function HealthPage({ loading, range, setRange, exportData, body, setBody }) {
  const [tab, setTab] = useState('Overview')
  return <>
    <PageHeader eyebrow="KNOW YOUR BODY" title="Health overview" subtitle="Patterns, not diagnoses. See how you’re doing over time." action={<select className="range-select" value={range} onChange={(e) => setRange(e.target.value)}><option>Minggu ini</option><option>30 hari</option><option>90 hari</option></select>} />
    <div className="health-tabs">{['Overview', 'Sleep', 'Heart', 'Body', 'Recovery'].map((item) => <button className={tab === item ? 'active' : ''} key={item} onClick={() => setTab(item)}>{item}</button>)}</div>
    {tab === 'Body' ? <BodyGoals body={body} setBody={setBody} /> : <>
      <div className="health-metrics">{[{ name: 'Sleep duration', value: '7h 42m', label: 'A little above your weekly average', icon: Moon, tone: 'purple', status: 'GOOD' }, { name: 'Resting heart rate', value: '58 bpm', label: 'Stable over the past 7 days', icon: Heart, tone: 'pink', status: 'NORMAL' }, { name: 'Recovery score', value: '86', label: 'Ready for moderate activity today', icon: Zap, tone: 'teal', status: 'OPTIMAL' }].map(({ name, value, label, icon: Icon, tone, status }) => <div className="health-metric panel" key={name}><div className={`metric-icon ${tone}`}><Icon size={18} /></div><span className="health-status">{status}</span><p>{name}</p><b>{value}</b><small>{label}</small><div className="health-sparkline"><Suspense fallback={<div className="skeleton chart-loading" />}><HealthSparkline data={trendData} /></Suspense></div></div>)}</div>
      <div className="panel health-trend"><div className="panel-heading"><div><h2>{tab} trends</h2><p>Keep an eye on patterns over time.</p></div><div className="range-pills"><button>7D</button><button className="active">30D</button><button>90D</button></div></div>{loading ? <div className="skeleton skeleton-chart" /> : <div className="large-chart"><Suspense fallback={<div className="skeleton chart-loading" />}><HealthTrendChart data={trendData} /></Suspense></div>}<div className="health-disclaimer"><ShieldCheck size={15} /> BioSync memberikan insight informatif, bukan diagnosis atau pengganti konsultasi tenaga medis.</div></div>
      <div className="health-export panel"><div className="export-icon"><LockKeyhole size={20} /></div><div><b>Data health, under your control.</b><p>Export a copy or review your data permissions at any time.</p></div><button className="secondary-button" onClick={exportData}>Export health data <ArrowRight size={14} /></button></div>
    </>}
  </>
}function ChallengesPage({ joined, joinChallenge, createChallenge }) { return <><PageHeader eyebrow="MOVE TOGETHER" title="Challenges" subtitle="Make consistency feel like a team sport." action={<button className="secondary-button" onClick={createChallenge}><Plus size={16}/> Create challenge</button>}/><div className="challenge-banner"><div className="banner-content"><span className="feature-tag"><Sparkles size={12}/> COMMUNITY PICK</span><h2>Better together.</h2><p>Join a community challenge and turn your daily movement into a shared win.</p><button onClick={()=>document.getElementById('challenge-list')?.scrollIntoView({behavior:'smooth'})}>Explore challenges <ArrowRight size={15}/></button></div><div className="banner-orbit"><div className="orbit-ring ring-one"/><div className="orbit-ring ring-two"/><div className="orbit-center"><Footprints size={37}/></div><span className="orbit-person p-one">A</span><span className="orbit-person p-two">M</span><span className="orbit-person p-three">J</span></div></div><div className="challenge-toolbar" id="challenge-list"><div><h2>For you</h2><p>Pick a goal that fits your week.</p></div><div className="challenge-sort">Featured <ChevronDown size={14}/></div></div><div className="challenge-grid">{challenges.map((item,i)=>{const Icon=item.icon; const isJoined=joined.includes(item.title); return <div className={`challenge-card panel challenge-${item.tone}`} key={item.title}><div className="challenge-card-head"><div className={`challenge-card-icon ${item.tone}`}><Icon size={20}/></div><button className="dots-button" aria-label="Opsi challenge" onClick={()=>Swal.fire({title:item.title,text:`${item.people} · ${item.sub}`,icon:'info',confirmButtonText:'Tutup',customClass:{popup:'biosync-modal',confirmButton:'swal-confirm'},buttonsStyling:false})}><MoreHorizontal size={18}/></button></div><span className="challenge-category">{i===0?'DISTANCE':i===1?'WELLNESS':'DAILY GOAL'}</span><h3>{item.title}</h3><p>{item.sub}</p><div className="challenge-card-progress"><div><b>{item.stat}</b><span>{item.progress}%</span></div><div className="metric-progress"><span className={item.tone} style={{width:`${item.progress}%`}}/></div></div><div className="challenge-card-bottom"><span><div className="participant-stack"><i>A</i><i>M</i><i>+</i></div>{item.people}</span><button className={`join-button ${isJoined?'joined':''}`} onClick={()=>joinChallenge(item.title)}>{isJoined?'Joined ✓':'Join challenge'}</button></div></div>})}</div><div className="badge-section"><div className="section-title-row"><div><h2>Your badges</h2><p>Little wins worth celebrating.</p></div><span className="badge-count">3 earned</span></div><div className="badge-row">{[{icon:Footprints,title:'First Move',sub:'Your first activity'},{icon:Flame,title:'7-Day Streak',sub:'Moved for 7 days'},{icon:Target,title:'Goal Getter',sub:'Reached a daily goal'},{icon:Heart,title:'Early Bird',sub:'Locked and loaded'}].map(({icon:Icon,title,sub},i)=><div className={`badge-item ${i===3?'locked':''}`} key={title}><div className="badge-medal"><Icon size={19}/></div><div><b>{title}</b><span>{sub}</span></div>{i===3&&<LockKeyhole size={14}/>}</div>)}</div></div></> }

function MyChallenges({ challenges, editChallenge, deleteChallenge }) {
  if (!challenges.length) return null
  return <section className="panel my-challenges"><div className="section-title-row"><div><h2>Challenge pribadi</h2><p>Data demo yang kamu buat.</p></div></div><div className="my-challenge-list">{challenges.map((item) => <article className="my-challenge-row" key={item.id}><div className="challenge-card-icon teal"><Target size={18}/></div><div className="my-challenge-copy"><b>{item.title}</b><span>Target: {item.goal}</span></div><button className="text-button" onClick={() => editChallenge(item)}>Edit</button><button className="delete-button" onClick={() => deleteChallenge(item)}>Hapus</button></article>)}</div></section>
}
function DevicesPage({ connections, devicePermissions, setDevicePermissions, connectDevice, setConnections, showToast, changePage }) { return <><PageHeader eyebrow="ONE PLACE, YOUR HEALTH" title="Connected devices" subtitle="Choose what you sync. You’re always in control."/><div className="device-status-banner"><div className="sync-status-icon"><Activity size={20}/></div><div><b>{connections.length ? 'Your health data is connected' : 'Connect your health data'}</b><p>{connections.length ? `Last synced just now · ${connections.length} source${connections.length===1?'':'s'} connected` : 'Sync your everyday health stats in one private place.'}</p></div>{connections.length>0&&<button className="secondary-button" onClick={()=>showToast('Data tersinkron', 'Sinkronisasi demo berhasil.')}>Sync now <ArrowRight size={14}/></button>}</div><div className="section-title-row"><div><h2>Available integrations</h2><p>Connect a source to bring your health picture together.</p></div></div><div className="device-list">{devices.map((device)=><div className="device-card panel" key={device.name}><div className={`device-logo ${device.color}`}>{device.icon}</div><div className="device-copy"><b>{device.name}</b><span>{device.detail}</span></div>{connections.includes(device.name)?<><span className="connected-label"><i/> Connected</span><button className="secondary-button" onClick={async()=>{const r=await Swal.fire({title:`Putuskan ${device.name}?`,text:'Data yang sudah tersimpan tetap tersedia.',icon:'warning',showCancelButton:true,confirmButtonText:'Putuskan',cancelButtonText:'Batal',customClass:{popup:'biosync-modal',confirmButton:'swal-confirm danger',cancelButton:'swal-cancel'},buttonsStyling:false});if(r.isConfirmed){setConnections((current)=>current.filter(n=>n!==device.name));setDevicePermissions((current)=>{const next={...current};delete next[device.name];return next});showToast('Koneksi diputus')}}}>Disconnect</button></>:<button className="secondary-button connect-button" onClick={()=>connectDevice(device)}>Connect <ArrowRight size={14}/></button>}</div>)}</div><div className="integration-note"><ShieldCheck size={17}/><span><b>Your health data stays private.</b> You choose the categories and can revoke access any time.</span><button onClick={()=>changePage('Privacy')}>Privacy settings <ArrowRight size={13}/></button></div><div className="coming-soon panel"><div><div className="coming-icon"><Watch size={19}/></div><span className="eyebrow">COMING SOON</span><h3>More ways to sync</h3><p>Samsung Health, Garmin and Health Connect integrations are planned for the next release.</p></div><div className="coming-brands"><span>GARMIN</span><span>SAMSUNG<br/>HEALTH</span><span>HEALTH<br/>CONNECT</span></div></div></> }

function PrivacyPage({ consent, setConsent, connections, devicePermissions, setDevicePermissions, setConnections, exportData, deleteAccount, showToast }) { return <><PageHeader eyebrow="YOUR DATA, YOUR RULES" title="Privacy center" subtitle="Transparency and control, built into every step." action={<div className="privacy-safe"><ShieldCheck size={15}/> Privacy protected</div>}/><div className="privacy-hero"><div className="privacy-lock"><ShieldCheck size={26}/></div><div><span className="eyebrow">PRIVACY OVERVIEW</span><h2>You’re in control, always.</h2><p>We only use the data you choose to share. Your health details stay private and are never sold.</p></div><div className="privacy-orbit"><LockKeyhole size={36}/></div></div><div className="privacy-grid"><div className="panel privacy-card"><div className="panel-heading"><div><h2>Your data</h2><p>What’s currently stored in this demo.</p></div><div className="metric-icon teal"><LockKeyhole size={17}/></div></div><div className="data-row"><span>Profile & goals</span><span className="data-stored"><i/> Terenkripsi lokal</span></div><div className="data-row"><span>Activity history</span><span className="data-stored"><i/> {'Terenkripsi lokal'}</span></div><div className="data-row"><span>Connected sources</span><b>{connections.length} connected</b></div><div className="data-row"><span>Wallet / blockchain</span><span className="optional-label">Optional · not connected</span></div><button className="secondary-button full-width" onClick={exportData}>Download my data <ArrowRight size={14}/></button></div><div className="panel privacy-card"><div className="panel-heading"><div><h2>Data permissions</h2><p>Choose what your connected apps can access.</p></div><div className="metric-icon purple"><Settings2 size={17}/></div></div>{connections.length ? <div className="permission-apps">{connections.map(name=><div className="permission-app" key={name}><div className="permission-avatar">{name[0]}</div><div><b>{name}</b><span>{(devicePermissions[name] || []).map((key)=>({activity:"Langkah & aktivitas",heart:"Detak jantung",sleep:"Tidur & recovery"}[key])).filter(Boolean).join(", ") || "Tidak ada kategori diizinkan"} · Sampai dicabut</span></div><button className="toggle-switch on" aria-label={`Cabut izin ${name}`} onClick={()=>{setConnections((current)=>current.filter((entry)=>entry!==name));setDevicePermissions((current)=>{const next={...current};delete next[name];return next})}}/></div>)}</div>:<div className="permission-empty"><LockKeyhole size={20}/><span>Belum ada aplikasi yang memiliki akses.</span></div>}<div className="consent-row"><div><b>Product improvement</b><span>Share anonymous usage insights</span></div><button className={`toggle-switch ${consent?'on':''}`} aria-label="Ubah izin penggunaan data" onClick={()=>{setConsent(!consent);showToast(consent?'Consent dicabut':'Consent diperbarui')}}/></div></div></div><div className="privacy-action-row"><div className="privacy-action"><div className="action-symbol export"><ArrowDownRight size={18}/></div><div><b>Download your data</b><span>Get a portable copy in JSON format.</span></div><button className="secondary-button" onClick={exportData}>Export data <ArrowRight size={14}/></button></div><div className="privacy-action delete-action"><div className="action-symbol delete"><X size={18}/></div><div><b>Delete your account</b><span>Permanently remove your local demo data.</span></div><button className="delete-button" onClick={deleteAccount}>Delete account</button></div></div><div className="blockchain-note"><div className="blockchain-icon"><Shield size={18}/></div><span><b>Web3 ownership · Beta</b><small>Wallet connection is optional. Health details are never written to a public blockchain.</small></span><span className="beta-pill">BETA</span><button onClick={()=>showToast('Web3 beta','Wallet connect is planned for a later phase.')}>Learn more <ArrowRight size={13}/></button></div></> }

async function editHealthGoals(profile, setProfile) {
  const options = ['Stamina', 'Sleep', 'Strength', 'Stress', 'Weight']
  const result = await Swal.fire({ title: 'Health goals', html: `<div class="consent-options goal-options">${options.map((goal) => `<label><input type="checkbox" value="${goal}" ${profile.goals?.includes(goal) ? 'checked' : ''}> ${goal}</label>`).join('')}</div>`, showCancelButton: true, confirmButtonText: 'Simpan', cancelButtonText: 'Batal', customClass: { popup: 'biosync-modal', confirmButton: 'swal-confirm', cancelButton: 'swal-cancel' }, buttonsStyling: false, preConfirm: () => [...document.querySelectorAll('.goal-options input:checked')].map((input) => input.value) })
  if (result.isConfirmed) setProfile((current) => ({ ...current, goals: result.value }))
}

function ProfilePage({ profile, setProfile, changePage, exportData, deleteAccount }) { const [name,setName]=useState(profile.name); const [saved,setSaved]=useState(false); return <><PageHeader eyebrow="YOUR ACCOUNT" title="Profile & settings" subtitle="A little about you, on your terms."/><div className="profile-layout"><div className="panel profile-card"><div className="profile-cover"><div className="profile-avatar-large">{initials(profile.name)}</div></div><div className="profile-summary"><h2>{profile.name}</h2><span>Personal account · Member since Sep 2026</span><div className="profile-stats"><div><b>12</b><small>Activities</small></div><div><b>7 days</b><small>Best streak</small></div><div><b>3</b><small>Badges</small></div></div></div></div><div className="panel settings-card"><div className="panel-heading"><div><h2>Personal information</h2><p>Update your profile details.</p></div></div><label className="form-label">Display name<input value={name} onChange={e=>setName(e.target.value)} placeholder="Your name"/></label><label className="form-label">Email address<input value="alex.morgan@example.com" readOnly/><small>Email changes aren’t available in this demo.</small></label><div className="settings-divider"/><div className="settings-row"><div><b>Health goals</b><span>{profile.goals?.join(' · ') || 'Belum ada target'}</span></div><button className="text-button" onClick={()=>editHealthGoals(profile,setProfile)}>Edit <ArrowRight size={13}/></button></div><div className="settings-row"><div><b>Connected devices</b><span>Manage health data sources</span></div><button className="text-button" onClick={()=>changePage('Devices')}>Manage <ArrowRight size={13}/></button></div><div className="settings-row"><div><b>Privacy & permissions</b><span>Review what you’re sharing</span></div><button className="text-button" onClick={()=>changePage('Privacy')}>Review <ArrowRight size={13}/></button></div><div className="settings-actions"><button className="secondary-button" onClick={exportData}>Export my data <ArrowDownRight size={14}/></button><button className="primary-button" onClick={()=>{setProfile({...profile,name:name||profile.name});setSaved(true);setTimeout(()=>setSaved(false),2200)}}>{saved?<><Check size={15}/> Saved</>:'Save changes'}</button></div></div></div><div className="logout-row"><span><LogOut size={16}/> Want to remove your data?</span><button className="delete-button" onClick={deleteAccount}>Delete account</button></div></> }

function PageHeader({ eyebrow, title, subtitle, action }) { return <div className="page-header"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{subtitle}</p></div>{action&&<div className="page-header-action">{action}</div>}</div> }
function EmptyState({ icon: Icon, title, copy }) { return <div className="empty-state"><div><Icon size={22}/></div><b>{title}</b><span>{copy}</span></div> }

export default App
