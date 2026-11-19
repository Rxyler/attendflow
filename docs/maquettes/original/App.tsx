import { useState } from 'react'
import {
  LayoutDashboard, Calendar, ClipboardList, Users, BarChart3,
  Bell, LogOut, Search, ChevronLeft, ChevronRight, CheckCircle,
  XCircle, Clock, AlertCircle, Download, FileText, Filter, Plus,
  Eye, Pencil, Trash2, X, Check, TrendingUp, BookMarked,
  UserCheck, Mail, Phone, BookOpen, Shield, GraduationCap,
  Settings, ChevronDown, Lock, Star
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts'

// ─── Types ────────────────────────────────────────────────────────────────────

type Screen =
  | 'login'
  | 'dashboard'
  | 'timetable'
  | 'my-presences'
  | 'attendance-session'
  | 'my-students'
  | 'my-stats'
  | 'profile'
  | 'notifications'
  | 'admin-teachers'
  | 'admin-students'
  | 'admin-classes'
  | 'admin-reports'

type Role = 'admin' | 'teacher'
type AttendanceStatus = 'present' | 'absent' | 'late' | 'justified'

interface Teacher {
  id: number
  nom: string
  prenom: string
  email: string
  phone: string
  avatar: string
  matieres: string[]
  classes: string[]
  role: Role
  password: string
}

interface Student {
  id: number
  nom: string
  prenom: string
  matricule: string
  classe: string
  email: string
  taux: number
  absences: number
}

interface TimetableSlot {
  teacherId: number
  matiere: string
  classe: string
  salle: string
  color: string
}

interface AttendanceSession {
  id: number
  teacherId: number
  date: string
  matiere: string
  classe: string
  horaire: string
  salle: string
  presents: number
  absents: number
  retards: number
}

// ─── Data Model ───────────────────────────────────────────────────────────────

const TEACHERS: Teacher[] = [
  {
    id: 1, nom: 'Ben Salah', prenom: 'Ahmed', email: 'ahmed.bensalah@univ.tn',
    phone: '+216 71 234 567', avatar: 'AB',
    matieres: ['Développement Web', 'Java'],
    classes: ['3ème INFO', '2ème INFO'],
    role: 'teacher', password: '1234'
  },
  {
    id: 2, nom: 'Mansouri', prenom: 'Sara', email: 'sara.mansouri@univ.tn',
    phone: '+216 71 345 678', avatar: 'SM',
    matieres: ['Base de données', 'Algorithmique'],
    classes: ['3ème INFO', '1ère INFO'],
    role: 'teacher', password: '1234'
  },
  {
    id: 3, nom: 'Gharbi', prenom: 'Rami', email: 'rami.gharbi@univ.tn',
    phone: '+216 71 456 789', avatar: 'RG',
    matieres: ['Réseaux', 'Systèmes'],
    classes: ['2ème INFO', '3ème RÉSEAUX'],
    role: 'teacher', password: '1234'
  },
  {
    id: 0, nom: 'Admin', prenom: 'Super', email: 'admin@univ.tn',
    phone: '+216 71 000 000', avatar: 'AD',
    matieres: [], classes: [],
    role: 'admin', password: 'admin'
  },
]

const ALL_STUDENTS: Student[] = [
  { id: 1, nom: 'Ferjani', prenom: 'Lina', matricule: '20260001', classe: '3ème INFO', email: 'lina.ferjani@univ.tn', taux: 94, absences: 3 },
  { id: 2, nom: 'Trabelsi', prenom: 'Ahmed', matricule: '20260002', classe: '3ème INFO', email: 'ahmed.trabelsi@univ.tn', taux: 88, absences: 6 },
  { id: 3, nom: 'Ben Ali', prenom: 'Mariem', matricule: '20260003', classe: '3ème INFO', email: 'mariem.benali@univ.tn', taux: 97, absences: 1 },
  { id: 4, nom: 'Jlassi', prenom: 'Mohamed', matricule: '20260004', classe: '3ème INFO', email: 'mohamed.jlassi@univ.tn', taux: 65, absences: 12 },
  { id: 5, nom: 'Karray', prenom: 'Yasmine', matricule: '20260005', classe: '2ème INFO', email: 'yasmine.karray@univ.tn', taux: 91, absences: 4 },
  { id: 6, nom: 'Ghorbel', prenom: 'Sami', matricule: '20260006', classe: '2ème INFO', email: 'sami.ghorbel@univ.tn', taux: 83, absences: 7 },
  { id: 7, nom: 'Chaabane', prenom: 'Karim', matricule: '20260007', classe: '2ème INFO', email: 'karim.chaabane@univ.tn', taux: 71, absences: 10 },
  { id: 8, nom: 'Sfar', prenom: 'Ines', matricule: '20260008', classe: '1ère INFO', email: 'ines.sfar@univ.tn', taux: 98, absences: 0 },
  { id: 9, nom: 'Hamdi', prenom: 'Firas', matricule: '20260009', classe: '1ère INFO', email: 'firas.hamdi@univ.tn', taux: 89, absences: 5 },
  { id: 10, nom: 'Zouari', prenom: 'Nour', matricule: '20260010', classe: '3ème RÉSEAUX', email: 'nour.zouari@univ.tn', taux: 76, absences: 9 },
  { id: 11, nom: 'Ben Amor', prenom: 'Oussama', matricule: '20260011', classe: '3ème RÉSEAUX', email: 'oussama.benamor@univ.tn', taux: 82, absences: 6 },
  { id: 12, nom: 'Saad', prenom: 'Rim', matricule: '20260012', classe: '3ème INFO', email: 'rim.saad@univ.tn', taux: 91, absences: 4 },
]

const TIMETABLE_DATA: Record<string, Record<string, TimetableSlot[]>> = {
  'Lundi': {
    '08:00 - 10:00': [
      { teacherId: 1, matiere: 'Développement Web', classe: '3ème INFO', salle: 'B12', color: 'blue' },
    ],
    '10:00 - 12:00': [
      { teacherId: 2, matiere: 'Base de données', classe: '3ème INFO', salle: 'B08', color: 'emerald' },
      { teacherId: 3, matiere: 'Réseaux', classe: '2ème INFO', salle: 'A03', color: 'indigo' },
    ],
    '12:00 - 14:00': [],
    '14:00 - 16:00': [
      { teacherId: 1, matiere: 'Java', classe: '2ème INFO', salle: 'A05', color: 'violet' },
    ],
    '16:00 - 18:00': [
      { teacherId: 3, matiere: 'Systèmes', classe: '3ème RÉSEAUX', salle: 'C04', color: 'orange' },
    ],
  },
  'Mardi': {
    '08:00 - 10:00': [
      { teacherId: 2, matiere: 'Algorithmique', classe: '1ère INFO', salle: 'A01', color: 'amber' },
    ],
    '10:00 - 12:00': [],
    '12:00 - 14:00': [],
    '14:00 - 16:00': [
      { teacherId: 1, matiere: 'Développement Web', classe: '3ème INFO', salle: 'B12', color: 'blue' },
    ],
    '16:00 - 18:00': [
      { teacherId: 3, matiere: 'Réseaux', classe: '3ème RÉSEAUX', salle: 'A03', color: 'indigo' },
    ],
  },
  'Mercredi': {
    '08:00 - 10:00': [
      { teacherId: 1, matiere: 'Java', classe: '3ème INFO', salle: 'A05', color: 'violet' },
    ],
    '10:00 - 12:00': [
      { teacherId: 2, matiere: 'Base de données', classe: '1ère INFO', salle: 'B08', color: 'emerald' },
    ],
    '12:00 - 14:00': [],
    '14:00 - 16:00': [],
    '16:00 - 18:00': [
      { teacherId: 3, matiere: 'Systèmes', classe: '2ème INFO', salle: 'C04', color: 'orange' },
    ],
  },
  'Jeudi': {
    '08:00 - 10:00': [],
    '10:00 - 12:00': [
      { teacherId: 1, matiere: 'Développement Web', classe: '3ème INFO', salle: 'B12', color: 'blue' },
    ],
    '12:00 - 14:00': [],
    '14:00 - 16:00': [
      { teacherId: 2, matiere: 'Base de données', classe: '3ème INFO', salle: 'B08', color: 'emerald' },
    ],
    '16:00 - 18:00': [
      { teacherId: 3, matiere: 'Réseaux', classe: '2ème INFO', salle: 'A03', color: 'indigo' },
    ],
  },
  'Vendredi': {
    '08:00 - 10:00': [
      { teacherId: 1, matiere: 'Développement Web', classe: '3ème INFO', salle: 'B12', color: 'blue' },
    ],
    '10:00 - 12:00': [
      { teacherId: 2, matiere: 'Algorithmique', classe: '1ère INFO', salle: 'A01', color: 'amber' },
    ],
    '12:00 - 14:00': [],
    '14:00 - 16:00': [],
    '16:00 - 18:00': [],
  },
}

const ALL_SESSIONS: AttendanceSession[] = [
  { id: 1, teacherId: 1, date: '25/09/2026', matiere: 'Développement Web', classe: '3ème INFO', horaire: '08:00-10:00', salle: 'B12', presents: 24, absents: 3, retards: 1 },
  { id: 2, teacherId: 1, date: '24/09/2026', matiere: 'Java', classe: '2ème INFO', horaire: '14:00-16:00', salle: 'A05', presents: 26, absents: 2, retards: 2 },
  { id: 3, teacherId: 1, date: '23/09/2026', matiere: 'Développement Web', classe: '3ème INFO', horaire: '14:00-16:00', salle: 'B12', presents: 25, absents: 2, retards: 1 },
  { id: 4, teacherId: 2, date: '25/09/2026', matiere: 'Base de données', classe: '3ème INFO', horaire: '10:00-12:00', salle: 'B08', presents: 27, absents: 1, retards: 0 },
  { id: 5, teacherId: 2, date: '24/09/2026', matiere: 'Algorithmique', classe: '1ère INFO', horaire: '08:00-10:00', salle: 'A01', presents: 30, absents: 3, retards: 2 },
  { id: 6, teacherId: 3, date: '25/09/2026', matiere: 'Réseaux', classe: '2ème INFO', horaire: '10:00-12:00', salle: 'A03', presents: 22, absents: 5, retards: 3 },
  { id: 7, teacherId: 3, date: '24/09/2026', matiere: 'Systèmes', classe: '3ème RÉSEAUX', horaire: '16:00-18:00', salle: 'C04', presents: 20, absents: 4, retards: 0 },
  { id: 8, teacherId: 1, date: '22/09/2026', matiere: 'Java', classe: '3ème INFO', horaire: '08:00-10:00', salle: 'A05', presents: 23, absents: 4, retards: 1 },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TIME_SLOTS = ['08:00 - 10:00', '10:00 - 12:00', '12:00 - 14:00', '14:00 - 16:00', '16:00 - 18:00']
const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi']

const COLOR_MAP: Record<string, { card: string; dot: string; icon: string }> = {
  blue: { card: 'bg-blue-50 border-blue-200 text-blue-800', dot: 'bg-blue-500', icon: 'text-blue-500' },
  indigo: { card: 'bg-indigo-50 border-indigo-200 text-indigo-800', dot: 'bg-indigo-500', icon: 'text-indigo-500' },
  violet: { card: 'bg-violet-50 border-violet-200 text-violet-800', dot: 'bg-violet-500', icon: 'text-violet-500' },
  emerald: { card: 'bg-emerald-50 border-emerald-200 text-emerald-800', dot: 'bg-emerald-500', icon: 'text-emerald-500' },
  amber: { card: 'bg-amber-50 border-amber-200 text-amber-800', dot: 'bg-amber-500', icon: 'text-amber-500' },
  orange: { card: 'bg-orange-50 border-orange-200 text-orange-800', dot: 'bg-orange-500', icon: 'text-orange-500' },
  teal: { card: 'bg-teal-50 border-teal-200 text-teal-800', dot: 'bg-teal-500', icon: 'text-teal-500' },
}

function StatusBadge({ status }: { status: AttendanceStatus }) {
  const cfg = {
    present: { label: 'Présent', cls: 'bg-green-50 text-green-700 border-green-200', dot: 'bg-green-500' },
    absent: { label: 'Absent', cls: 'bg-red-50 text-red-700 border-red-200', dot: 'bg-red-500' },
    late: { label: 'Retard', cls: 'bg-orange-50 text-orange-700 border-orange-200', dot: 'bg-orange-500' },
    justified: { label: 'Justifié', cls: 'bg-gray-50 text-gray-600 border-gray-200', dot: 'bg-gray-400' },
  }
  const c = cfg[status]
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${c.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  )
}

function Avatar({ name, size = 'md', color = 'blue' }: { name: string; size?: 'xs' | 'sm' | 'md' | 'lg'; color?: string }) {
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  const sz = { xs: 'w-6 h-6 text-[10px]', sm: 'w-8 h-8 text-xs', md: 'w-9 h-9 text-sm', lg: 'w-14 h-14 text-lg' }
  const gradients: Record<string, string> = {
    blue: 'from-blue-500 to-indigo-600',
    green: 'from-emerald-500 to-teal-600',
    purple: 'from-violet-500 to-purple-600',
    orange: 'from-orange-500 to-amber-600',
    red: 'from-red-500 to-rose-600',
  }
  return (
    <div className={`${sz[size]} rounded-full bg-gradient-to-br ${gradients[color] || gradients.blue} flex items-center justify-center font-semibold text-white flex-shrink-0`}>
      {initials}
    </div>
  )
}

function StatCard({ label, value, icon: Icon, color, sub, locked }: { label: string; value: string | number; icon: React.ElementType; color: string; sub?: string; locked?: boolean }) {
  const bgs: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600', indigo: 'bg-indigo-50 text-indigo-600',
    green: 'bg-green-50 text-green-600', orange: 'bg-orange-50 text-orange-600',
    red: 'bg-red-50 text-red-600', violet: 'bg-violet-50 text-violet-600',
    amber: 'bg-amber-50 text-amber-600',
  }
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500 font-medium mb-1">{label}</p>
          <p className="text-3xl font-bold text-slate-800" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{value}</p>
          {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
        </div>
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${bgs[color]}`}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  )
}

function AccessBadge({ label }: { label: string }) {
  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
      <Lock size={10} />
      {label}
    </div>
  )
}

// ─── Login ────────────────────────────────────────────────────────────────────

function LoginScreen({ onLogin }: { onLogin: (t: Teacher) => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    const teacher = TEACHERS.find(t => t.email === email && t.password === password)
    if (teacher) { setError(''); onLogin(teacher) }
    else setError('Email ou mot de passe incorrect.')
  }

  const quickLogin = (t: Teacher) => { setEmail(t.email); setPassword(t.password) }

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col w-[45%] bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-12 relative overflow-hidden">
        <div className="absolute inset-0">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="absolute rounded-full bg-white/5"
              style={{ width: `${150 + i * 80}px`, height: `${150 + i * 80}px`, top: `${10 + i * 12}%`, left: `${-30 + i * 15}%` }} />
          ))}
        </div>
        <div className="relative z-10 mb-auto">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur border border-white/30 flex items-center justify-center">
              <UserCheck size={20} className="text-white" />
            </div>
            <span className="text-white font-bold text-xl" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>AttendFlow</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-5 leading-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Chaque professeur,<br />son propre espace.
          </h1>
          <p className="text-blue-200 text-lg leading-relaxed mb-10">
            Système de gestion des présences basé sur les droits d'accès. Chaque enseignant accède uniquement à ses données.
          </p>

          {/* Access rules visual */}
          <div className="space-y-3">
            {[
              { icon: Calendar, label: 'Son emploi du temps uniquement' },
              { icon: Users, label: 'Ses étudiants uniquement' },
              { icon: ClipboardList, label: 'Ses séances uniquement' },
              { icon: BarChart3, label: 'Ses statistiques uniquement' },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-3 bg-white/10 backdrop-blur rounded-xl px-4 py-3 border border-white/15">
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                  <item.icon size={16} className="text-white" />
                </div>
                <p className="text-white/90 text-sm font-medium">{item.label}</p>
                <CheckCircle size={16} className="text-green-400 ml-auto" />
              </div>
            ))}
          </div>
        </div>
        <p className="relative z-10 text-blue-300 text-sm mt-auto">© 2026 AttendFlow · Université Tunis El Manar</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-slate-50">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center">
              <UserCheck size={20} className="text-white" />
            </div>
            <span className="font-bold text-2xl text-slate-800" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>AttendFlow</span>
          </div>

          <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Connexion</h2>
            <p className="text-slate-500 text-sm mb-7">Accédez à votre espace personnel</p>

            {error && (
              <div className="mb-4 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2.5">
                <AlertCircle size={15} className="text-red-500 flex-shrink-0" />
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Email</label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="email@univ.tn" required
                    className="w-full pl-10 pr-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-slate-50"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Mot de passe</label>
                <input
                  type="password" value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" required
                  className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-slate-50"
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 rounded" />
                  <span className="text-sm text-slate-600">Se souvenir de moi</span>
                </label>
                <button type="button" className="text-sm text-blue-600 hover:text-blue-700 font-medium">Mot de passe oublié ?</button>
              </div>
              <button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors text-sm shadow-lg shadow-blue-200">
                Se connecter
              </button>
            </form>

            {/* Quick access demo */}
            <div className="mt-7 pt-6 border-t border-slate-100">
              <p className="text-xs text-slate-400 text-center font-medium mb-3 uppercase tracking-wider">Accès rapide — Démo</p>
              <div className="space-y-2">
                {TEACHERS.map(t => (
                  <button
                    key={t.id}
                    onClick={() => quickLogin(t)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-all text-left group"
                  >
                    <Avatar name={`${t.prenom} ${t.nom}`} size="sm" color={['blue', 'green', 'purple', 'red'][t.id] as string} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-700 group-hover:text-blue-700">{t.prenom} {t.nom}</p>
                      <p className="text-xs text-slate-400">{t.role === 'admin' ? 'Administrateur' : t.matieres.slice(0, 2).join(', ')}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${t.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                      {t.role === 'admin' ? 'Admin' : 'Prof'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function Sidebar({ screen, setScreen, teacher }: { screen: Screen; setScreen: (s: Screen) => void; teacher: Teacher }) {
  const teacherNav = [
    { label: 'Mon tableau de bord', icon: LayoutDashboard, screen: 'dashboard' as Screen },
    { label: 'Mon emploi du temps', icon: Calendar, screen: 'timetable' as Screen },
    { label: 'Mes présences', icon: ClipboardList, screen: 'my-presences' as Screen },
    { label: 'Mes étudiants', icon: Users, screen: 'my-students' as Screen },
    { label: 'Mes statistiques', icon: BarChart3, screen: 'my-stats' as Screen },
    { label: 'Notifications', icon: Bell, screen: 'notifications' as Screen },
    { label: 'Mon profil', icon: UserCheck, screen: 'profile' as Screen },
  ]

  const adminNav = [
    { label: 'Tableau de bord', icon: LayoutDashboard, screen: 'dashboard' as Screen },
    { label: 'Enseignants', icon: GraduationCap, screen: 'admin-teachers' as Screen },
    { label: 'Étudiants', icon: Users, screen: 'admin-students' as Screen },
    { label: 'Classes', icon: BookOpen, screen: 'admin-classes' as Screen },
    { label: 'Rapports globaux', icon: BarChart3, screen: 'admin-reports' as Screen },
    { label: 'Notifications', icon: Bell, screen: 'notifications' as Screen },
    { label: 'Mon profil', icon: UserCheck, screen: 'profile' as Screen },
  ]

  const navItems = teacher.role === 'admin' ? adminNav : teacherNav
  const avatarColors = ['red', 'blue', 'green', 'purple']

  return (
    <aside className="w-64 bg-[#0f172a] flex flex-col h-screen sticky top-0 flex-shrink-0">
      <div className="px-5 py-5 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-500 flex items-center justify-center">
            <UserCheck size={18} className="text-white" />
          </div>
          <div>
            <span className="text-white font-bold text-lg" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>AttendFlow</span>
            <p className="text-slate-400 text-[10px] font-medium tracking-wider uppercase">
              {teacher.role === 'admin' ? 'Administration' : 'Espace Enseignant'}
            </p>
          </div>
        </div>

        {/* Role badge */}
        <div className={`mt-4 flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold ${
          teacher.role === 'admin'
            ? 'bg-purple-900/30 border-purple-700/50 text-purple-300'
            : 'bg-blue-900/30 border-blue-700/50 text-blue-300'
        }`}>
          {teacher.role === 'admin' ? <Shield size={12} /> : <Lock size={12} />}
          {teacher.role === 'admin' ? 'Accès complet' : `Accès restreint — ${teacher.prenom}`}
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-0.5">
        {navItems.map(item => {
          const active = screen === item.screen
          return (
            <button
              key={item.screen}
              onClick={() => setScreen(item.screen)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                active
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30'
                  : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'
              }`}
            >
              <item.icon size={17} />
              {item.label}
            </button>
          )
        })}
      </nav>

      <div className="px-3 py-4 border-t border-slate-700/50">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-700/30 transition cursor-pointer mb-1">
          <Avatar name={`${teacher.prenom} ${teacher.nom}`} size="sm" color={avatarColors[teacher.id] || 'blue'} />
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">{teacher.prenom} {teacher.nom}</p>
            <p className="text-slate-400 text-xs">{teacher.role === 'admin' ? 'Administrateur' : 'Enseignant'}</p>
          </div>
        </div>
        <button
          onClick={() => setScreen('login' as Screen)}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-slate-400 hover:text-red-400 hover:bg-red-900/20 transition-all"
        >
          <LogOut size={16} />
          Déconnexion
        </button>
      </div>
    </aside>
  )
}

// ─── Header ───────────────────────────────────────────────────────────────────

function Header({ title, teacher, setScreen }: { title: string; teacher: Teacher; setScreen: (s: Screen) => void }) {
  const avatarColors = ['red', 'blue', 'green', 'purple']
  return (
    <header className="bg-white border-b border-slate-100 px-6 py-3.5 flex items-center gap-4 sticky top-0 z-10">
      <div className="flex-1">
        <h1 className="text-xl font-bold text-slate-800" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{title}</h1>
        <p className="text-slate-400 text-xs mt-0.5">Vendredi 25 septembre 2026</p>
      </div>
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input placeholder="Rechercher..." className="pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl w-52 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
      </div>
      <button onClick={() => setScreen('notifications')} className="relative w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-100">
        <Bell size={17} />
        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
      </button>
      <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200">
        <Avatar name={`${teacher.prenom} ${teacher.nom}`} size="sm" color={avatarColors[teacher.id] || 'blue'} />
        <div>
          <p className="text-sm font-semibold text-slate-700 leading-none">{teacher.prenom} {teacher.nom}</p>
          <p className="text-xs text-slate-400">{teacher.role === 'admin' ? 'Administrateur' : 'Enseignant'}</p>
        </div>
      </div>
    </header>
  )
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

function Dashboard({ teacher, setScreen }: { teacher: Teacher; setScreen: (s: Screen) => void }) {
  const isAdmin = teacher.role === 'admin'

  // Scoped data
  const mySessions = ALL_SESSIONS.filter(s => isAdmin || s.teacherId === teacher.id)
  const myClasses = isAdmin ? [...new Set(ALL_STUDENTS.map(s => s.classe))] : teacher.classes
  const myStudents = ALL_STUDENTS.filter(s => myClasses.includes(s.classe))
  const todaySessions = mySessions.filter(s => s.date === '25/09/2026')
  const totalAbsents = mySessions.reduce((a, s) => a + s.absents, 0)
  const totalPresents = mySessions.reduce((a, s) => a + s.presents, 0)
  const taux = totalPresents + totalAbsents > 0 ? Math.round(totalPresents / (totalPresents + totalAbsents) * 100) : 0

  const weekData = [
    { jour: 'Lun', taux: 88 }, { jour: 'Mar', taux: 92 }, { jour: 'Mer', taux: 85 },
    { jour: 'Jeu', taux: 94 }, { jour: 'Ven', taux: taux }, { jour: 'Sam', taux: 0 },
  ]

  const todaySlots = Object.entries(TIMETABLE_DATA).flatMap(([day, slots]) =>
    day === 'Vendredi' ? Object.entries(slots).flatMap(([time, entries]) =>
      entries.filter(e => isAdmin || e.teacherId === teacher.id).map(e => ({ ...e, time }))
    ) : []
  )

  return (
    <div className="p-6 space-y-6">
      {/* Greeting */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Bonjour, {teacher.prenom} 👋
          </h2>
          <p className="text-slate-500 text-sm mt-1">Vendredi 25 septembre 2026</p>
          {!isAdmin && (
            <div className="flex flex-wrap gap-2 mt-3">
              {teacher.matieres.map(m => (
                <span key={m} className="px-2.5 py-1 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold rounded-full">{m}</span>
              ))}
              {teacher.classes.map(c => (
                <span key={c} className="px-2.5 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold rounded-full">{c}</span>
              ))}
            </div>
          )}
        </div>
        {!isAdmin && (
          <div className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 border border-blue-200 rounded-2xl">
            <Lock size={14} className="text-blue-600" />
            <span className="text-blue-700 text-sm font-semibold">Espace personnel</span>
          </div>
        )}
        {isAdmin && (
          <div className="flex items-center gap-2 px-4 py-2.5 bg-purple-50 border border-purple-200 rounded-2xl">
            <Shield size={14} className="text-purple-600" />
            <span className="text-purple-700 text-sm font-semibold">Vue globale — Admin</span>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label={isAdmin ? 'Séances totales' : 'Mes séances aujourd\'hui'}
          value={isAdmin ? mySessions.length : todaySessions.length}
          icon={Calendar} color="blue"
          sub={isAdmin ? 'Tous enseignants' : `${teacher.classes.join(', ')}`}
        />
        <StatCard
          label={isAdmin ? 'Total étudiants' : 'Mes étudiants'}
          value={myStudents.length}
          icon={Users} color="indigo"
          sub={isAdmin ? 'Toutes classes' : teacher.classes.join(', ')}
        />
        <StatCard
          label={isAdmin ? 'Total absences' : 'Absences enregistrées'}
          value={totalAbsents}
          icon={XCircle} color="red"
          sub={isAdmin ? 'Tous enseignants' : 'Dans mes séances'}
        />
        <StatCard
          label="Taux de présence"
          value={`${taux}%`}
          icon={TrendingUp} color="green"
          sub={isAdmin ? 'Moyenne globale' : 'Mes cours'}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2 space-y-4">
          {/* Today's first session */}
          {todaySlots.length > 0 && (
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <span className="inline-flex items-center gap-1.5 bg-green-400/20 text-green-300 text-xs font-semibold px-3 py-1 rounded-full border border-green-400/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    Séance en cours
                  </span>
                  <h3 className="text-2xl font-bold mt-3" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{todaySlots[0].matiere}</h3>
                  <p className="text-blue-200 text-sm mt-0.5">{todaySlots[0].classe} · Salle {todaySlots[0].salle}</p>
                </div>
                <div className="text-right">
                  <p className="text-blue-200 text-xs">Horaire</p>
                  <p className="text-white font-bold text-lg mt-1">{todaySlots[0].time}</p>
                </div>
              </div>
              <button
                onClick={() => setScreen('attendance-session')}
                className="w-full bg-white text-blue-700 font-semibold py-3 rounded-xl hover:bg-blue-50 transition-colors text-sm"
              >
                Prendre les présences →
              </button>
            </div>
          )}

          {/* Upcoming sessions */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                {isAdmin ? 'Séances récentes' : 'Mes séances récentes'}
              </h3>
              <button onClick={() => setScreen('my-presences')} className="text-xs text-blue-600 font-medium hover:text-blue-700">Voir tout →</button>
            </div>
            <div className="space-y-2.5">
              {mySessions.slice(0, 4).map(s => {
                const t = TEACHERS.find(t => t.id === s.teacherId)
                return (
                  <div key={s.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                    <div className="text-right w-20 flex-shrink-0">
                      <p className="text-xs font-mono text-slate-500">{s.horaire}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{s.date}</p>
                    </div>
                    <div className="w-0.5 h-10 rounded-full bg-blue-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800">{s.matiere}</p>
                      <p className="text-xs text-slate-400">{s.classe} · {isAdmin && t ? `${t.prenom} ${t.nom}` : `Salle ${s.salle}`}</p>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-green-600 font-semibold">{s.presents} ✓</span>
                      <span className="text-red-500 font-semibold">{s.absents} ✗</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Chart + students at risk */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h3 className="font-bold text-slate-700 mb-1 text-sm">Taux — 7 jours</h3>
            <p className="text-slate-400 text-xs mb-4">{isAdmin ? 'Moyenne globale' : 'Mes cours uniquement'}</p>
            <ResponsiveContainer width="100%" height={140}>
              <AreaChart data={weekData}>
                <defs>
                  <linearGradient id="aGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="jour" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} domain={[0, 100]} />
                <Tooltip contentStyle={{ borderRadius: 12, border: 'none', fontSize: 12 }} formatter={(v) => [`${v}%`, 'Taux']} />
                <Area type="monotone" dataKey="taux" stroke="#2563eb" strokeWidth={2} fill="url(#aGrad)" dot={{ fill: '#2563eb', r: 3 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle size={16} className="text-amber-600" />
              <h3 className="font-bold text-amber-800 text-sm">Alertes absences</h3>
            </div>
            {myStudents.filter(s => s.taux < 75).slice(0, 3).map(s => (
              <div key={s.id} className="flex items-center gap-2.5 bg-white rounded-xl p-2.5 mb-2 border border-amber-100 last:mb-0">
                <Avatar name={`${s.prenom} ${s.nom}`} size="xs" color="red" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-800 truncate">{s.prenom} {s.nom}</p>
                  <p className="text-[10px] text-slate-400">{s.classe}</p>
                </div>
                <span className="text-xs font-bold text-red-600">{s.taux}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── My Timetable ─────────────────────────────────────────────────────────────

function MyTimetable({ teacher }: { teacher: Teacher }) {
  const isAdmin = teacher.role === 'admin'

  const getSlot = (day: string, time: string) => {
    const slots = TIMETABLE_DATA[day]?.[time] || []
    return isAdmin ? slots : slots.filter(s => s.teacherId === teacher.id)
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            {isAdmin ? 'Tous les emplois du temps' : 'Mon emploi du temps'}
          </h2>
          <p className="text-slate-500 text-sm mt-0.5">Semaine du 21 au 25 septembre 2026</p>
          {!isAdmin && (
            <div className="mt-2 flex items-center gap-2">
              <AccessBadge label={`Visible : ${teacher.matieres.join(', ')}`} />
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50">
            <ChevronLeft size={18} />
          </button>
          <span className="text-sm font-semibold text-slate-700 bg-blue-50 border border-blue-200 px-4 py-2 rounded-xl">Cette semaine</span>
          <button className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-auto">
        <div className="min-w-[700px]">
          <div className="grid" style={{ gridTemplateColumns: '100px repeat(5, 1fr)' }}>
            <div className="bg-slate-50/70 border-b border-slate-100 p-3" />
            {DAYS.map(d => (
              <div key={d} className="bg-slate-50/70 border-b border-l border-slate-100 p-3 text-center">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{d}</p>
              </div>
            ))}

            {TIME_SLOTS.map((time, si) => (
              <div key={time} className="contents">
                <div className="border-b border-slate-100 p-3 bg-slate-50/30 flex flex-col justify-center">
                  <p className="text-xs font-semibold text-slate-500">{time.split(' - ')[0]}</p>
                  <p className="text-[10px] text-slate-300 mt-0.5">{time.split(' - ')[1]}</p>
                </div>
                {DAYS.map(day => {
                  const slots = getSlot(day, time)
                  return (
                    <div key={`${day}-${si}`} className="border-b border-l border-slate-100 p-2 min-h-[88px]">
                      {slots.length === 0
                        ? <div className="h-full min-h-[72px] rounded-xl border border-dashed border-slate-200" />
                        : slots.map((slot, i) => {
                          const t = isAdmin ? TEACHERS.find(t => t.id === slot.teacherId) : null
                          const c = COLOR_MAP[slot.color] || COLOR_MAP.blue
                          return (
                            <div key={i} className={`rounded-xl border p-2.5 cursor-pointer hover:shadow-md transition-all ${c.card} ${i > 0 ? 'mt-1' : ''}`}>
                              <div className="flex items-start gap-1.5 mb-1">
                                <span className={`w-1.5 h-1.5 rounded-full mt-1 flex-shrink-0 ${c.dot}`} />
                                <p className="text-xs font-bold leading-tight">{slot.matiere}</p>
                              </div>
                              <p className="text-xs opacity-70 pl-3">{slot.classe}</p>
                              <p className="text-xs opacity-60 pl-3">Salle {slot.salle}</p>
                              {isAdmin && t && <p className="text-[10px] opacity-50 pl-3 mt-0.5">{t.prenom} {t.nom}</p>}
                            </div>
                          )
                        })
                      }
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {!isAdmin && (
        <div className="flex items-center gap-2.5 px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl">
          <Lock size={14} className="text-blue-600 flex-shrink-0" />
          <p className="text-blue-700 text-sm">
            <span className="font-semibold">Accès restreint :</span> Vous ne voyez que vos propres séances. Les créneaux d'autres enseignants ne sont pas visibles.
          </p>
        </div>
      )}
    </div>
  )
}

// ─── My Presences (session list) ──────────────────────────────────────────────

function MyPresences({ teacher, setScreen }: { teacher: Teacher; setScreen: (s: Screen) => void }) {
  const isAdmin = teacher.role === 'admin'
  const sessions = ALL_SESSIONS.filter(s => isAdmin || s.teacherId === teacher.id)
  const [filterClass, setFilterClass] = useState('Toutes')
  const [filterMatiere, setFilterMatiere] = useState('Toutes')

  const classes = [...new Set(sessions.map(s => s.classe))]
  const matieres = [...new Set(sessions.map(s => s.matiere))]

  const filtered = sessions.filter(s => {
    return (filterClass === 'Toutes' || s.classe === filterClass) &&
      (filterMatiere === 'Toutes' || s.matiere === filterMatiere)
  })

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            {isAdmin ? 'Toutes les présences' : 'Mes présences'}
          </h2>
          <p className="text-slate-500 text-sm mt-0.5">{filtered.length} séance(s) enregistrée(s)</p>
        </div>
        <button
          onClick={() => setScreen('attendance-session')}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl transition-colors shadow-lg shadow-blue-200"
        >
          <Plus size={16} />
          Nouvelle séance
        </button>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <select value={filterClass} onChange={e => setFilterClass(e.target.value)} className="text-sm border border-slate-200 rounded-xl px-3 py-2.5 bg-white focus:outline-none">
          <option value="Toutes">Toutes les classes</option>
          {classes.map(c => <option key={c}>{c}</option>)}
        </select>
        <select value={filterMatiere} onChange={e => setFilterMatiere(e.target.value)} className="text-sm border border-slate-200 rounded-xl px-3 py-2.5 bg-white focus:outline-none">
          <option value="Toutes">Toutes les matières</option>
          {matieres.map(m => <option key={m}>{m}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              {['Date', 'Matière', 'Classe', isAdmin ? 'Enseignant' : 'Salle', 'Présents', 'Absents', 'Retards', 'Action'].map(h => (
                <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.map(s => {
              const t = TEACHERS.find(t => t.id === s.teacherId)
              const total = s.presents + s.absents + s.retards
              const taux = Math.round(s.presents / total * 100)
              return (
                <tr key={s.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-5 py-4 text-sm text-slate-500 font-mono">{s.date}</td>
                  <td className="px-5 py-4 text-sm font-semibold text-slate-800">{s.matiere}</td>
                  <td className="px-5 py-4">
                    <span className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold rounded-full">{s.classe}</span>
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-500">{isAdmin && t ? `${t.prenom} ${t.nom}` : s.salle}</td>
                  <td className="px-5 py-4">
                    <span className="text-sm font-semibold text-green-600">{s.presents}</span>
                    <span className="text-xs text-slate-400 ml-1">/ {total}</span>
                  </td>
                  <td className="px-5 py-4 text-sm font-semibold text-red-500">{s.absents}</td>
                  <td className="px-5 py-4 text-sm font-semibold text-orange-500">{s.retards}</td>
                  <td className="px-5 py-4">
                    <button
                      onClick={() => setScreen('attendance-session')}
                      className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <Eye size={12} />
                      Voir
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <div className="px-5 py-3.5 border-t border-slate-100 text-sm text-slate-400">
          {filtered.length} résultat(s)
          {!isAdmin && <span className="ml-2 text-blue-500 font-medium">· Vos séances uniquement</span>}
        </div>
      </div>
    </div>
  )
}

// ─── Attendance Session ───────────────────────────────────────────────────────

function AttendanceSession({ teacher }: { teacher: Teacher }) {
  const myClasses = teacher.role === 'admin' ? [...new Set(ALL_STUDENTS.map(s => s.classe))] : teacher.classes
  const myStudents = ALL_STUDENTS.filter(s => myClasses.includes(s.classe)).slice(0, 6)

  const [statuses, setStatuses] = useState<Record<number, AttendanceStatus>>(() => {
    const init: Record<number, AttendanceStatus> = {}
    myStudents.forEach(s => { init[s.id] = 'present' })
    return init
  })
  const [saved, setSaved] = useState(false)

  const counts = {
    present: myStudents.filter(s => statuses[s.id] === 'present').length,
    absent: myStudents.filter(s => statuses[s.id] === 'absent').length,
    late: myStudents.filter(s => statuses[s.id] === 'late').length,
    justified: myStudents.filter(s => statuses[s.id] === 'justified').length,
  }

  return (
    <div className="p-6 space-y-5">
      <div>
        <h2 className="text-xl font-bold text-slate-800" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Prise de présence</h2>
        <p className="text-slate-500 text-sm mt-0.5">Séance automatiquement liée à votre emploi du temps</p>
      </div>

      {saved && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center gap-3">
          <CheckCircle size={20} className="text-green-600 flex-shrink-0" />
          <div>
            <p className="text-green-700 font-semibold text-sm">Les présences ont été enregistrées avec succès.</p>
            <p className="text-green-600 text-xs mt-0.5">Données visibles uniquement par vous et l'administrateur.</p>
          </div>
          <button onClick={() => setSaved(false)} className="ml-auto text-green-400 hover:text-green-600"><X size={16} /></button>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Info */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h3 className="font-bold text-slate-700 text-xs uppercase tracking-wider mb-4">Informations de la séance</h3>
            {[
              { label: 'Matière', value: 'Développement Web' },
              { label: 'Classe', value: myClasses[0] || '3ème INFO' },
              { label: 'Enseignant', value: `${teacher.prenom} ${teacher.nom}` },
              { label: 'Date', value: '25 Septembre 2026' },
              { label: 'Horaire', value: '08:00 — 10:00' },
              { label: 'Salle', value: 'B12' },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0">
                <span className="text-slate-500 text-sm">{item.label}</span>
                <span className="text-slate-800 text-sm font-semibold">{item.value}</span>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h3 className="font-bold text-slate-700 text-xs uppercase tracking-wider mb-3">Récapitulatif</h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Présents', v: counts.present, color: 'bg-green-100 text-green-700' },
                { label: 'Absents', v: counts.absent, color: 'bg-red-100 text-red-700' },
                { label: 'Retards', v: counts.late, color: 'bg-orange-100 text-orange-700' },
                { label: 'Justifiés', v: counts.justified, color: 'bg-gray-100 text-gray-600' },
              ].map(item => (
                <div key={item.label} className={`rounded-xl p-3 text-center ${item.color}`}>
                  <p className="text-2xl font-bold">{item.v}</p>
                  <p className="text-xs font-medium opacity-80">{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl">
            <Lock size={14} className="text-blue-600 flex-shrink-0" />
            <p className="text-blue-700 text-xs">Seuls les étudiants de vos classes sont affichés.</p>
          </div>
        </div>

        {/* Student list */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <div className="flex items-center gap-3 p-4 border-b border-slate-100">
            <button
              onClick={() => {
                const all: Record<number, AttendanceStatus> = {}
                myStudents.forEach(s => { all[s.id] = 'present' })
                setStatuses(all)
              }}
              className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 text-green-700 text-sm font-medium rounded-xl hover:bg-green-100"
            >
              <Check size={14} />
              Tous présents
            </button>
            <div className="ml-auto flex items-center gap-3">
              <span className="text-xs text-slate-500">{myStudents.length} étudiants · {myClasses[0]}</span>
            </div>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {['#', 'Étudiant', 'Matricule', 'Statut', 'Action'].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {myStudents.map((student, i) => (
                  <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-4 text-sm text-slate-400 font-mono">{String(i + 1).padStart(2, '0')}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={`${student.prenom} ${student.nom}`} size="sm" />
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{student.prenom} {student.nom}</p>
                          <p className="text-xs text-slate-400">{student.classe}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-500 font-mono">{student.matricule}</td>
                    <td className="px-5 py-4"><StatusBadge status={statuses[student.id]} /></td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1">
                        {([
                          { s: 'present' as AttendanceStatus, l: 'P', ac: 'bg-green-100 text-green-700 border-green-300' },
                          { s: 'absent' as AttendanceStatus, l: 'A', ac: 'bg-red-100 text-red-700 border-red-300' },
                          { s: 'late' as AttendanceStatus, l: 'R', ac: 'bg-orange-100 text-orange-700 border-orange-300' },
                          { s: 'justified' as AttendanceStatus, l: 'J', ac: 'bg-gray-100 text-gray-600 border-gray-300' },
                        ]).map(btn => (
                          <button
                            key={btn.s}
                            onClick={() => setStatuses(prev => ({ ...prev, [student.id]: btn.s }))}
                            className={`w-8 h-8 rounded-lg border text-xs font-bold transition-all ${
                              statuses[student.id] === btn.s ? btn.ac : 'bg-white border-slate-200 text-slate-300 hover:bg-slate-50'
                            }`}
                          >
                            {btn.l}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
            <p className="text-sm text-slate-500">{myStudents.length} étudiant(s) de vos classes</p>
            <button
              onClick={() => setSaved(true)}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl transition-colors shadow-lg shadow-blue-200"
            >
              Enregistrer les présences
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── My Students ──────────────────────────────────────────────────────────────

function MyStudents({ teacher }: { teacher: Teacher }) {
  const isAdmin = teacher.role === 'admin'
  const myClasses = isAdmin ? [...new Set(ALL_STUDENTS.map(s => s.classe))] : teacher.classes
  const myStudents = ALL_STUDENTS.filter(s => myClasses.includes(s.classe))
  const [search, setSearch] = useState('')
  const [filterClass, setFilterClass] = useState('Toutes')

  const filtered = myStudents.filter(s => {
    const match = `${s.prenom} ${s.nom} ${s.matricule}`.toLowerCase().includes(search.toLowerCase())
    const cls = filterClass === 'Toutes' || s.classe === filterClass
    return match && cls
  })

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            {isAdmin ? 'Tous les étudiants' : 'Mes étudiants'}
          </h2>
          <p className="text-slate-500 text-sm mt-0.5">{myStudents.length} étudiants · {myClasses.join(', ')}</p>
          {!isAdmin && (
            <div className="flex flex-wrap gap-2 mt-2">
              {myClasses.map(c => <AccessBadge key={c} label={c} />)}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher par nom, matricule..."
            className="pl-9 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
        <select value={filterClass} onChange={e => setFilterClass(e.target.value)} className="text-sm border border-slate-200 rounded-xl px-3 py-2.5 bg-white focus:outline-none">
          <option value="Toutes">Toutes mes classes</option>
          {myClasses.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              {['Étudiant', 'Matricule', 'Classe', 'Email', 'Taux de présence', 'Absences', 'Actions'].map(h => (
                <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.map(student => (
              <tr key={student.id} className="hover:bg-slate-50/50 transition-colors group">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <Avatar name={`${student.prenom} ${student.nom}`} size="sm" />
                    <p className="text-sm font-semibold text-slate-800">{student.prenom} {student.nom}</p>
                  </div>
                </td>
                <td className="px-5 py-4 text-sm text-slate-500 font-mono">{student.matricule}</td>
                <td className="px-5 py-4">
                  <span className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold rounded-full">{student.classe}</span>
                </td>
                <td className="px-5 py-4 text-sm text-slate-500">{student.email}</td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${student.taux >= 90 ? 'bg-green-500' : student.taux >= 75 ? 'bg-orange-500' : 'bg-red-500'}`}
                        style={{ width: `${student.taux}%` }} />
                    </div>
                    <span className={`text-xs font-semibold ${student.taux >= 90 ? 'text-green-600' : student.taux >= 75 ? 'text-orange-600' : 'text-red-600'}`}>
                      {student.taux}%
                    </span>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <span className={`text-sm font-bold ${student.absences > 8 ? 'text-red-600' : student.absences > 4 ? 'text-orange-500' : 'text-slate-600'}`}>
                    {student.absences}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100"><Eye size={14} /></button>
                    <button className="w-8 h-8 rounded-lg bg-slate-50 text-slate-600 flex items-center justify-center hover:bg-slate-100"><Pencil size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-5 py-3.5 border-t border-slate-100 flex items-center justify-between">
          <span className="text-sm text-slate-400">{filtered.length} étudiant(s)</span>
          {!isAdmin && (
            <div className="flex items-center gap-1.5 text-xs text-blue-600 font-medium">
              <Lock size={11} />
              Accès restreint à vos classes uniquement
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── My Stats ─────────────────────────────────────────────────────────────────

function MyStats({ teacher }: { teacher: Teacher }) {
  const isAdmin = teacher.role === 'admin'
  const mySessions = ALL_SESSIONS.filter(s => isAdmin || s.teacherId === teacher.id)
  const myClasses = isAdmin ? [...new Set(ALL_STUDENTS.map(s => s.classe))] : teacher.classes
  const myStudents = ALL_STUDENTS.filter(s => myClasses.includes(s.classe))

  const totalPresents = mySessions.reduce((a, s) => a + s.presents, 0)
  const totalAbsents = mySessions.reduce((a, s) => a + s.absents, 0)
  const taux = totalPresents + totalAbsents > 0 ? Math.round(totalPresents / (totalPresents + totalAbsents) * 100) : 0

  const byClass = myClasses.map(c => {
    const cs = mySessions.filter(s => s.classe === c)
    const p = cs.reduce((a, s) => a + s.presents, 0)
    const t = cs.reduce((a, s) => a + s.presents + s.absents + s.retards, 0)
    return { classe: c.replace('ème ', 'e ').replace('ère ', 're '), taux: t > 0 ? Math.round(p / t * 100) : 0 }
  })

  const byMatiere = [...new Set(mySessions.map(s => s.matiere))].map(m => {
    const ms = mySessions.filter(s => s.matiere === m)
    const absents = ms.reduce((a, s) => a + s.absents, 0)
    return { matiere: m.split(' ')[0], absents }
  })

  const evolution = [
    { semaine: 'S1', taux: 89 }, { semaine: 'S2', taux: 86 },
    { semaine: 'S3', taux: 92 }, { semaine: 'S4', taux: 88 },
    { semaine: 'S5', taux: taux },
  ]

  const warnings = myStudents.filter(s => s.taux < 80).sort((a, b) => a.taux - b.taux)

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            {isAdmin ? 'Statistiques globales' : 'Mes statistiques'}
          </h2>
          <p className="text-slate-500 text-sm mt-0.5">
            {isAdmin ? 'Vue complète de tous les enseignants' : 'Données exclusives à vos cours et étudiants'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm rounded-xl transition-colors">
            <Download size={14} />PDF
          </button>
          <button className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm rounded-xl transition-colors">
            <FileText size={14} />Excel
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label={isAdmin ? 'Total étudiants' : 'Mes étudiants'} value={myStudents.length} icon={Users} color="blue" sub={myClasses.join(', ')} />
        <StatCard label={isAdmin ? 'Total séances' : 'Mes séances'} value={mySessions.length} icon={Calendar} color="indigo" sub="Toutes classes" />
        <StatCard label="Total absences" value={totalAbsents} icon={XCircle} color="red" sub="Dans mes séances" />
        <StatCard label="Taux de présence" value={`${taux}%`} icon={TrendingUp} color="green" sub="Moyenne globale" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* By class */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h3 className="font-bold text-slate-700 mb-5 text-sm">Taux de présence par classe</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={byClass} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="classe" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} width={80} />
              <Tooltip contentStyle={{ borderRadius: 12, border: 'none', fontSize: 12 }} formatter={(v) => [`${v}%`, 'Taux']} />
              <Bar dataKey="taux" fill="#2563eb" radius={[0, 6, 6, 0]}>
                {byClass.map((_, i) => (
                  <Cell key={i} fill={['#2563eb', '#4f46e5', '#0891b2', '#059669', '#7c3aed'][i % 5]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* By subject */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h3 className="font-bold text-slate-700 mb-5 text-sm">Absences par matière</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={byMatiere}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="matiere" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: 'none', fontSize: 12 }} />
              <Bar dataKey="absents" name="Absences" fill="#ef4444" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Evolution */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h3 className="font-bold text-slate-700 mb-5 text-sm">Évolution du taux de présence</h3>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={evolution}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="semaine" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} domain={[70, 100]} />
              <Tooltip contentStyle={{ borderRadius: 12, border: 'none', fontSize: 12 }} formatter={(v) => [`${v}%`, 'Taux']} />
              <Line type="monotone" dataKey="taux" stroke="#2563eb" strokeWidth={2.5} dot={{ fill: '#2563eb', r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Students at risk */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle size={16} className="text-amber-500" />
            <h3 className="font-bold text-slate-700 text-sm">Étudiants ayant le plus d'absences</h3>
          </div>
          {warnings.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle size={32} className="text-green-400 mx-auto mb-2" />
              <p className="text-slate-500 text-sm">Aucun étudiant à risque</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {warnings.slice(0, 5).map(s => (
                <div key={s.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                  <Avatar name={`${s.prenom} ${s.nom}`} size="sm" color="red" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800">{s.prenom} {s.nom}</p>
                    <p className="text-xs text-slate-400">{s.classe} · {s.absences} absences</p>
                  </div>
                  <div className="text-right">
                    <p className="text-base font-bold text-red-600">{s.taux}%</p>
                    <div className="w-16 h-1 bg-red-100 rounded-full overflow-hidden mt-1">
                      <div className="h-full bg-red-500 rounded-full" style={{ width: `${s.taux}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Profile ──────────────────────────────────────────────────────────────────

function Profile({ teacher }: { teacher: Teacher }) {
  const [editing, setEditing] = useState(false)
  const avatarColors = ['red', 'blue', 'green', 'purple']

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Mon profil</h2>
          <p className="text-slate-500 text-sm mt-0.5">Informations de votre compte</p>
        </div>
        <button
          onClick={() => setEditing(!editing)}
          className={`flex items-center gap-2 px-4 py-2.5 font-semibold text-sm rounded-xl transition-colors ${
            editing ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-200' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200'
          }`}
        >
          <Pencil size={15} />
          {editing ? 'Enregistrer' : 'Modifier mon profil'}
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Profile card */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 text-center">
          <div className="flex justify-center mb-4">
            <Avatar name={`${teacher.prenom} ${teacher.nom}`} size="lg" color={avatarColors[teacher.id] || 'blue'} />
          </div>
          <h3 className="font-bold text-slate-800 text-lg" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            {teacher.prenom} {teacher.nom}
          </h3>
          <p className="text-slate-500 text-sm mt-1">{teacher.email}</p>
          <span className={`inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-full text-xs font-semibold border ${
            teacher.role === 'admin'
              ? 'bg-purple-50 text-purple-700 border-purple-200'
              : 'bg-blue-50 text-blue-700 border-blue-200'
          }`}>
            {teacher.role === 'admin' ? <Shield size={11} /> : <UserCheck size={11} />}
            {teacher.role === 'admin' ? 'Administrateur' : 'Enseignant'}
          </span>

          {teacher.role !== 'admin' && (
            <div className="mt-6 pt-5 border-t border-slate-100 text-left space-y-3">
              <div>
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-2">Matières enseignées</p>
                <div className="flex flex-wrap gap-2">
                  {teacher.matieres.map(m => (
                    <span key={m} className="px-2.5 py-1 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold rounded-full">{m}</span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-2">Classes affectées</p>
                <div className="flex flex-wrap gap-2">
                  {teacher.classes.map(c => (
                    <span key={c} className="px-2.5 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold rounded-full">{c}</span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Info form */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wider mb-5">Informations personnelles</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[
              { label: 'Prénom', value: teacher.prenom, icon: UserCheck },
              { label: 'Nom', value: teacher.nom, icon: UserCheck },
              { label: 'Email', value: teacher.email, icon: Mail },
              { label: 'Téléphone', value: teacher.phone, icon: Phone },
            ].map(field => (
              <div key={field.label}>
                <label className="text-sm font-medium text-slate-600 mb-1.5 block">{field.label}</label>
                <div className="relative">
                  <field.icon size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    defaultValue={field.value}
                    readOnly={!editing}
                    className={`w-full pl-10 pr-4 py-3 text-sm border rounded-xl focus:outline-none transition-all ${
                      editing
                        ? 'border-blue-300 bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400'
                        : 'border-slate-200 bg-slate-50 text-slate-600'
                    }`}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-5 border-t border-slate-100">
            <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wider mb-4">Sécurité</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {['Nouveau mot de passe', 'Confirmer le mot de passe'].map(label => (
                <div key={label}>
                  <label className="text-sm font-medium text-slate-600 mb-1.5 block">{label}</label>
                  <input
                    type="password" placeholder="••••••••" disabled={!editing}
                    className={`w-full px-4 py-3 text-sm border rounded-xl focus:outline-none transition-all ${
                      editing ? 'border-blue-300 bg-white' : 'border-slate-200 bg-slate-50'
                    }`}
                  />
                </div>
              ))}
            </div>
          </div>

          {teacher.role !== 'admin' && (
            <div className="mt-6 pt-5 border-t border-slate-100">
              <div className="flex items-center gap-2 px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl">
                <Lock size={14} className="text-blue-600 flex-shrink-0" />
                <p className="text-blue-700 text-sm">
                  Vos classes et matières sont assignées par l'administrateur. Contactez l'administration pour toute modification.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Notifications ────────────────────────────────────────────────────────────

function Notifications({ teacher }: { teacher: Teacher }) {
  const notifs = [
    { type: 'warning', icon: Clock, title: 'Séance dans 15 minutes', body: `Votre séance de ${teacher.matieres[0] || 'cours'} commence dans 15 minutes. Salle B12.`, time: 'Il y a 5 min', read: false },
    { type: 'info', icon: ClipboardList, title: 'Absences enregistrées', body: '8 absences ont été enregistrées dans vos séances aujourd\'hui.', time: 'Il y a 1 h', read: false },
    { type: 'error', icon: AlertCircle, title: 'Seuil d\'absence dépassé', body: `3 de vos étudiants ont dépassé le seuil d'absence autorisé.`, time: 'Il y a 2 h', read: false },
    { type: 'success', icon: CheckCircle, title: 'Présences confirmées', body: 'Les présences de votre dernière séance ont été enregistrées avec succès.', time: 'Hier, 12:05', read: true },
  ]

  const styles: Record<string, string> = {
    warning: 'bg-orange-50 border-orange-200 text-orange-600',
    info: 'bg-blue-50 border-blue-200 text-blue-600',
    error: 'bg-red-50 border-red-200 text-red-600',
    success: 'bg-green-50 border-green-200 text-green-600',
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Notifications</h2>
          <p className="text-slate-500 text-sm mt-0.5">{notifs.filter(n => !n.read).length} non lues — pour vous uniquement</p>
        </div>
        <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">Tout marquer comme lu</button>
      </div>
      <div className="space-y-3">
        {notifs.map((n, i) => (
          <div key={i} className={`bg-white rounded-2xl border shadow-sm p-5 flex items-start gap-4 hover:shadow-md transition-all ${!n.read ? 'border-slate-200' : 'border-slate-100 opacity-60'}`}>
            <div className={`w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0 ${styles[n.type]}`}>
              <n.icon size={18} />
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-800 text-sm">{n.title}</p>
                  <p className="text-slate-500 text-sm mt-1 leading-relaxed">{n.body}</p>
                </div>
                {!n.read && <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5" />}
              </div>
              <p className="text-xs text-slate-400 mt-2">{n.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Admin Views ──────────────────────────────────────────────────────────────

function AdminTeachers({ setScreen }: { setScreen: (s: Screen) => void }) {
  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Gestion des enseignants</h2>
          <p className="text-slate-500 text-sm mt-0.5">{TEACHERS.filter(t => t.role === 'teacher').length} enseignants enregistrés</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl transition-colors shadow-lg shadow-blue-200">
          <Plus size={16} />
          Ajouter un enseignant
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {TEACHERS.filter(t => t.role === 'teacher').map((t, i) => {
          const tSessions = ALL_SESSIONS.filter(s => s.teacherId === t.id)
          const tStudents = ALL_STUDENTS.filter(s => t.classes.includes(s.classe))
          const totalP = tSessions.reduce((a, s) => a + s.presents, 0)
          const totalTotal = tSessions.reduce((a, s) => a + s.presents + s.absents + s.retards, 0)
          const taux = totalTotal > 0 ? Math.round(totalP / totalTotal * 100) : 0
          const colors = ['blue', 'green', 'purple']
          return (
            <div key={t.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-5 border-b border-slate-100">
                <div className="flex items-start gap-3">
                  <Avatar name={`${t.prenom} ${t.nom}`} size="md" color={colors[i] as string} />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-800" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{t.prenom} {t.nom}</h3>
                    <p className="text-slate-500 text-xs mt-0.5">{t.email}</p>
                    <p className="text-slate-400 text-xs mt-0.5">{t.phone}</p>
                  </div>
                </div>
              </div>
              <div className="p-4 space-y-3">
                <div>
                  <p className="text-xs text-slate-400 mb-1.5 font-semibold uppercase tracking-wider">Matières</p>
                  <div className="flex flex-wrap gap-1.5">
                    {t.matieres.map(m => <span key={m} className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 text-xs font-medium rounded-full">{m}</span>)}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-1.5 font-semibold uppercase tracking-wider">Classes</p>
                  <div className="flex flex-wrap gap-1.5">
                    {t.classes.map(c => <span key={c} className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-medium rounded-full">{c}</span>)}
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-100 grid grid-cols-3 text-center gap-2">
                  <div><p className="text-lg font-bold text-slate-800">{tStudents.length}</p><p className="text-xs text-slate-400">Étudiants</p></div>
                  <div><p className="text-lg font-bold text-slate-800">{tSessions.length}</p><p className="text-xs text-slate-400">Séances</p></div>
                  <div><p className={`text-lg font-bold ${taux >= 90 ? 'text-green-600' : taux >= 80 ? 'text-orange-500' : 'text-red-500'}`}>{taux}%</p><p className="text-xs text-slate-400">Taux</p></div>
                </div>
                <div className="flex gap-2">
                  <button className="flex-1 py-2 text-xs font-semibold text-blue-600 hover:bg-blue-50 rounded-xl transition-colors border border-blue-200">Voir l'espace</button>
                  <button className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-100">
                    <Pencil size={13} />
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function AdminAllStudents() {
  const [search, setSearch] = useState('')
  const [filterClass, setFilterClass] = useState('Toutes')
  const classes = [...new Set(ALL_STUDENTS.map(s => s.classe))]
  const filtered = ALL_STUDENTS.filter(s => {
    const match = `${s.prenom} ${s.nom} ${s.matricule}`.toLowerCase().includes(search.toLowerCase())
    const cls = filterClass === 'Toutes' || s.classe === filterClass
    return match && cls
  })

  return (
    <div className="p-6 space-y-5">
      <div>
        <h2 className="text-xl font-bold text-slate-800" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Tous les étudiants</h2>
        <p className="text-slate-500 text-sm mt-0.5">Vue complète — Administrateur</p>
      </div>
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..."
            className="pl-9 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl w-full focus:outline-none" />
        </div>
        <select value={filterClass} onChange={e => setFilterClass(e.target.value)} className="text-sm border border-slate-200 rounded-xl px-3 py-2.5 bg-white focus:outline-none">
          <option value="Toutes">Toutes les classes</option>
          {classes.map(c => <option key={c}>{c}</option>)}
        </select>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl transition-colors shadow-lg shadow-blue-200">
          <Plus size={16} />
          Ajouter
        </button>
      </div>
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              {['Étudiant', 'Matricule', 'Classe', 'Enseignant(s)', 'Taux', 'Absences', 'Actions'].map(h => (
                <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.map(student => {
              const teachers = TEACHERS.filter(t => t.classes.includes(student.classe) && t.role === 'teacher')
              return (
                <tr key={student.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={`${student.prenom} ${student.nom}`} size="sm" />
                      <p className="text-sm font-semibold text-slate-800">{student.prenom} {student.nom}</p>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-500 font-mono">{student.matricule}</td>
                  <td className="px-5 py-4">
                    <span className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold rounded-full">{student.classe}</span>
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-500">{teachers.map(t => t.nom).join(', ')}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${student.taux >= 90 ? 'bg-green-500' : student.taux >= 75 ? 'bg-orange-500' : 'bg-red-500'}`}
                          style={{ width: `${student.taux}%` }} />
                      </div>
                      <span className={`text-xs font-semibold ${student.taux >= 90 ? 'text-green-600' : student.taux >= 75 ? 'text-orange-600' : 'text-red-600'}`}>{student.taux}%</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm font-bold text-red-500">{student.absences}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100"><Eye size={14} /></button>
                      <button className="w-8 h-8 rounded-lg bg-slate-50 text-slate-600 flex items-center justify-center hover:bg-slate-100"><Pencil size={14} /></button>
                      <button className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-100"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <div className="px-5 py-3.5 border-t border-slate-100 text-sm text-slate-400">{filtered.length} étudiant(s)</div>
      </div>
    </div>
  )
}

function AdminClasses() {
  const classes = [
    { nom: '3ème INFO', niveau: 'Licence 3', etudiants: ALL_STUDENTS.filter(s => s.classe === '3ème INFO').length, enseignants: TEACHERS.filter(t => t.classes.includes('3ème INFO') && t.role === 'teacher') },
    { nom: '2ème INFO', niveau: 'Licence 2', etudiants: ALL_STUDENTS.filter(s => s.classe === '2ème INFO').length, enseignants: TEACHERS.filter(t => t.classes.includes('2ème INFO') && t.role === 'teacher') },
    { nom: '1ère INFO', niveau: 'Licence 1', etudiants: ALL_STUDENTS.filter(s => s.classe === '1ère INFO').length, enseignants: TEACHERS.filter(t => t.classes.includes('1ère INFO') && t.role === 'teacher') },
    { nom: '3ème RÉSEAUX', niveau: 'Licence 3', etudiants: ALL_STUDENTS.filter(s => s.classe === '3ème RÉSEAUX').length, enseignants: TEACHERS.filter(t => t.classes.includes('3ème RÉSEAUX') && t.role === 'teacher') },
  ]
  const gradients = ['from-blue-500 to-indigo-600', 'from-indigo-500 to-violet-600', 'from-emerald-500 to-teal-600', 'from-orange-500 to-amber-600']

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Gestion des classes</h2>
          <p className="text-slate-500 text-sm mt-0.5">Vue complète — Administrateur</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl transition-colors shadow-lg shadow-blue-200">
          <Plus size={16} />
          Ajouter une classe
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {classes.map((cls, i) => (
          <div key={cls.nom} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
            <div className={`bg-gradient-to-br ${gradients[i]} p-5 text-white`}>
              <h3 className="font-bold text-lg" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{cls.nom}</h3>
              <p className="text-white/70 text-sm">{cls.niveau}</p>
              <div className="flex items-center gap-1.5 mt-3">
                <Users size={14} />
                <span className="font-bold">{cls.etudiants}</span>
                <span className="text-white/70 text-sm">étudiants</span>
              </div>
            </div>
            <div className="p-4">
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-2">Enseignants</p>
              {cls.enseignants.map(t => (
                <div key={t.id} className="flex items-center gap-2 mb-1.5">
                  <Avatar name={`${t.prenom} ${t.nom}`} size="xs" />
                  <span className="text-xs text-slate-600">{t.prenom} {t.nom}</span>
                </div>
              ))}
              <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
                <button className="flex-1 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-blue-200">Voir</button>
                <button className="flex-1 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 rounded-lg transition-colors border border-slate-200">Modifier</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function AdminReports() {
  const totalP = ALL_SESSIONS.reduce((a, s) => a + s.presents, 0)
  const totalA = ALL_SESSIONS.reduce((a, s) => a + s.absents, 0)
  const taux = Math.round(totalP / (totalP + totalA) * 100)

  const byTeacher = TEACHERS.filter(t => t.role === 'teacher').map(t => {
    const ts = ALL_SESSIONS.filter(s => s.teacherId === t.id)
    const p = ts.reduce((a, s) => a + s.presents, 0)
    const total = ts.reduce((a, s) => a + s.presents + s.absents + s.retards, 0)
    return { name: t.nom, taux: total > 0 ? Math.round(p / total * 100) : 0 }
  })

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Rapports globaux</h2>
          <p className="text-slate-500 text-sm mt-0.5">Tous les enseignants · Toutes les classes</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm rounded-xl transition-colors"><Download size={14} />PDF</button>
          <button className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm rounded-xl transition-colors"><FileText size={14} />Excel</button>
        </div>
      </div>
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Total étudiants" value={ALL_STUDENTS.length} icon={Users} color="blue" />
        <StatCard label="Total séances" value={ALL_SESSIONS.length} icon={Calendar} color="indigo" />
        <StatCard label="Total absences" value={totalA} icon={XCircle} color="red" />
        <StatCard label="Taux global" value={`${taux}%`} icon={TrendingUp} color="green" />
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h3 className="font-bold text-slate-700 mb-5 text-sm">Taux par enseignant</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={byTeacher}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} domain={[0, 100]} />
              <Tooltip contentStyle={{ borderRadius: 12, border: 'none', fontSize: 12 }} formatter={(v) => [`${v}%`, 'Taux']} />
              <Bar dataKey="taux" fill="#2563eb" radius={[6, 6, 0, 0]}>
                {byTeacher.map((_, i) => (
                  <Cell key={i} fill={['#2563eb', '#059669', '#7c3aed'][i % 3]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h3 className="font-bold text-slate-700 mb-4 text-sm">Étudiants à risque — seuil &lt; 80%</h3>
          <div className="space-y-2.5">
            {ALL_STUDENTS.filter(s => s.taux < 80).sort((a, b) => a.taux - b.taux).map(s => (
              <div key={s.id} className="flex items-center gap-3 p-3 bg-red-50 border border-red-100 rounded-xl">
                <Avatar name={`${s.prenom} ${s.nom}`} size="sm" color="red" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-800">{s.prenom} {s.nom}</p>
                  <p className="text-xs text-slate-400">{s.classe} · {s.absences} absences</p>
                </div>
                <span className="text-base font-bold text-red-600">{s.taux}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function App() {
  const [teacher, setTeacher] = useState<Teacher | null>(null)
  const [screen, setScreen] = useState<Screen>('login')

  const handleLogin = (t: Teacher) => {
    setTeacher(t)
    setScreen('dashboard')
  }

  const handleSetScreen = (s: Screen) => {
    if (s === 'login') { setTeacher(null) }
    setScreen(s)
  }

  if (!teacher || screen === 'login') {
    return <LoginScreen onLogin={handleLogin} />
  }

  const titles: Record<Screen, string> = {
    login: '',
    dashboard: teacher.role === 'admin' ? 'Tableau de bord' : 'Mon tableau de bord',
    timetable: teacher.role === 'admin' ? 'Tous les emplois du temps' : 'Mon emploi du temps',
    'my-presences': teacher.role === 'admin' ? 'Toutes les présences' : 'Mes présences',
    'attendance-session': 'Prise de présence',
    'my-students': teacher.role === 'admin' ? 'Tous les étudiants' : 'Mes étudiants',
    'my-stats': teacher.role === 'admin' ? 'Statistiques globales' : 'Mes statistiques',
    profile: 'Mon profil',
    notifications: 'Notifications',
    'admin-teachers': 'Gestion des enseignants',
    'admin-students': 'Tous les étudiants',
    'admin-classes': 'Gestion des classes',
    'admin-reports': 'Rapports globaux',
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar screen={screen} setScreen={handleSetScreen} teacher={teacher} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header title={titles[screen]} teacher={teacher} setScreen={handleSetScreen} />
        <main className="flex-1 overflow-y-auto">
          {screen === 'dashboard' && <Dashboard teacher={teacher} setScreen={handleSetScreen} />}
          {screen === 'timetable' && <MyTimetable teacher={teacher} />}
          {screen === 'my-presences' && <MyPresences teacher={teacher} setScreen={handleSetScreen} />}
          {screen === 'attendance-session' && <AttendanceSession teacher={teacher} />}
          {screen === 'my-students' && <MyStudents teacher={teacher} />}
          {screen === 'my-stats' && <MyStats teacher={teacher} />}
          {screen === 'profile' && <Profile teacher={teacher} />}
          {screen === 'notifications' && <Notifications teacher={teacher} />}
          {screen === 'admin-teachers' && <AdminTeachers setScreen={handleSetScreen} />}
          {screen === 'admin-students' && <AdminAllStudents />}
          {screen === 'admin-classes' && <AdminClasses />}
          {screen === 'admin-reports' && <AdminReports />}
        </main>
      </div>
    </div>
  )
}
