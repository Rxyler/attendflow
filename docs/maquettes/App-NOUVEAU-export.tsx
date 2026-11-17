import { useState } from 'react'
import {
  LayoutDashboard, Calendar, ClipboardList, Users, BarChart3,
  Bell, LogOut, Search, ChevronLeft, ChevronRight, CheckCircle,
  XCircle, Clock, AlertCircle, Download, FileText, Filter, Plus,
  Eye, Pencil, Trash2, X, Check, TrendingUp, BookMarked,
  UserCheck, Mail, Phone, BookOpen, Shield, GraduationCap,
  Settings, ChevronDown, Lock, Star, RefreshCw
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
  | 'subjects'
  | 'settings'
  | 'student-history'
  | 'justifications'
  | 'admin-justifications'

type Role = 'admin' | 'teacher' | 'student'
type AttendanceStatus = 'present' | 'absent' | 'late' | 'justified'
type SessionState = 'Planifiée' | 'Modifiée' | 'Annulée'

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
  studentId?: number
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
  dateNaissance?: string
  telephone?: string
  photo?: string
}

interface TimetableSlot {
  teacherId: number
  matiere: string
  classe: string
  salle: string
  color: string
  etat: SessionState
}

interface SelectedSession {
  teacherId: number
  matiere: string
  classe: string
  salle: string
  date: string
  horaire: string
  etat: SessionState
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

interface StudentAttendance {
  id: number
  studentId: number
  date: string
  matiere: string
  teacherId: number
  horaire: string
  status: AttendanceStatus
}

type JustificationStatus = 'pending' | 'accepted' | 'refused'

interface Justification {
  id: number
  attendanceId: number
  studentId: number
  motif: string
  fichier: string
  status: JustificationStatus
  date: string
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
  {
    id: 101, nom: 'Nouira', prenom: 'Manar', email: 'manar.nouira@univ.tn',
    phone: '+216 22 111 001', avatar: 'MN',
    matieres: [], classes: ['3ème INFO'],
    role: 'student', password: '1234', studentId: 1
  },
  {
    id: 102, nom: 'Trabelsi', prenom: 'Ahmed', email: 'ahmed.trabelsi@univ.tn',
    phone: '+216 22 111 002', avatar: 'AT',
    matieres: [], classes: ['3ème INFO'],
    role: 'student', password: '1234', studentId: 2
  },
]

const ALL_STUDENTS: Student[] = [
  { id: 1, nom: 'Nouira', prenom: 'Manar', matricule: '20260001', classe: '3ème INFO', email: 'manar.nouira@univ.tn', taux: 94, absences: 3 },
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
      { teacherId: 1, matiere: 'Développement Web', classe: '3ème INFO', salle: 'B12', color: 'blue', etat: 'Planifiée' },
    ],
    '10:00 - 12:00': [
      { teacherId: 2, matiere: 'Base de données', classe: '3ème INFO', salle: 'B08', color: 'emerald', etat: 'Modifiée' },
      { teacherId: 3, matiere: 'Réseaux', classe: '2ème INFO', salle: 'A03', color: 'indigo', etat: 'Planifiée' },
    ],
    '12:00 - 14:00': [],
    '14:00 - 16:00': [
      { teacherId: 1, matiere: 'Java', classe: '2ème INFO', salle: 'A05', color: 'violet', etat: 'Planifiée' },
    ],
    '16:00 - 18:00': [
      { teacherId: 3, matiere: 'Systèmes', classe: '3ème RÉSEAUX', salle: 'C04', color: 'orange', etat: 'Annulée' },
    ],
  },
  'Mardi': {
    '08:00 - 10:00': [
      { teacherId: 2, matiere: 'Algorithmique', classe: '1ère INFO', salle: 'A01', color: 'amber', etat: 'Planifiée' },
    ],
    '10:00 - 12:00': [],
    '12:00 - 14:00': [],
    '14:00 - 16:00': [
      { teacherId: 1, matiere: 'Développement Web', classe: '3ème INFO', salle: 'B12', color: 'blue', etat: 'Modifiée' },
    ],
    '16:00 - 18:00': [
      { teacherId: 3, matiere: 'Réseaux', classe: '3ème RÉSEAUX', salle: 'A03', color: 'indigo', etat: 'Planifiée' },
    ],
  },
  'Mercredi': {
    '08:00 - 10:00': [
      { teacherId: 1, matiere: 'Java', classe: '3ème INFO', salle: 'A05', color: 'violet', etat: 'Planifiée' },
    ],
    '10:00 - 12:00': [
      { teacherId: 2, matiere: 'Base de données', classe: '1ère INFO', salle: 'B08', color: 'emerald', etat: 'Planifiée' },
    ],
    '12:00 - 14:00': [],
    '14:00 - 16:00': [],
    '16:00 - 18:00': [
      { teacherId: 3, matiere: 'Systèmes', classe: '2ème INFO', salle: 'C04', color: 'orange', etat: 'Modifiée' },
    ],
  },
  'Jeudi': {
    '08:00 - 10:00': [],
    '10:00 - 12:00': [
      { teacherId: 1, matiere: 'Développement Web', classe: '3ème INFO', salle: 'B12', color: 'blue', etat: 'Planifiée' },
    ],
    '12:00 - 14:00': [],
    '14:00 - 16:00': [
      { teacherId: 2, matiere: 'Base de données', classe: '3ème INFO', salle: 'B08', color: 'emerald', etat: 'Planifiée' },
    ],
    '16:00 - 18:00': [
      { teacherId: 3, matiere: 'Réseaux', classe: '2ème INFO', salle: 'A03', color: 'indigo', etat: 'Planifiée' },
    ],
  },
  'Vendredi': {
    '08:00 - 10:00': [
      { teacherId: 1, matiere: 'Développement Web', classe: '3ème INFO', salle: 'B12', color: 'blue', etat: 'Planifiée' },
    ],
    '10:00 - 12:00': [
      { teacherId: 2, matiere: 'Algorithmique', classe: '1ère INFO', salle: 'A01', color: 'amber', etat: 'Annulée' },
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

const INITIAL_STUDENT_ATTENDANCES: StudentAttendance[] = [
  { id: 1, studentId: 1, date: '25/09/2026', matiere: 'Développement Web', teacherId: 1, horaire: '08:00 - 10:00', status: 'present' },
  { id: 2, studentId: 1, date: '24/09/2026', matiere: 'Base de données', teacherId: 2, horaire: '14:00 - 16:00', status: 'late' },
  { id: 3, studentId: 1, date: '23/09/2026', matiere: 'Java', teacherId: 1, horaire: '08:00 - 10:00', status: 'absent' },
  { id: 4, studentId: 1, date: '22/09/2026', matiere: 'Développement Web', teacherId: 1, horaire: '14:00 - 16:00', status: 'present' },
  { id: 5, studentId: 1, date: '21/09/2026', matiere: 'Base de données', teacherId: 2, horaire: '10:00 - 12:00', status: 'present' },
  { id: 6, studentId: 1, date: '18/09/2026', matiere: 'Java', teacherId: 1, horaire: '08:00 - 10:00', status: 'absent' },
  { id: 7, studentId: 1, date: '17/09/2026', matiere: 'Développement Web', teacherId: 1, horaire: '10:00 - 12:00', status: 'justified' },
  { id: 8, studentId: 1, date: '16/09/2026', matiere: 'Base de données', teacherId: 2, horaire: '14:00 - 16:00', status: 'present' },
  { id: 9, studentId: 2, date: '25/09/2026', matiere: 'Développement Web', teacherId: 1, horaire: '08:00 - 10:00', status: 'present' },
  { id: 10, studentId: 2, date: '24/09/2026', matiere: 'Base de données', teacherId: 2, horaire: '14:00 - 16:00', status: 'absent' },
  { id: 11, studentId: 2, date: '23/09/2026', matiere: 'Java', teacherId: 1, horaire: '08:00 - 10:00', status: 'late' },
  { id: 12, studentId: 2, date: '22/09/2026', matiere: 'Développement Web', teacherId: 1, horaire: '14:00 - 16:00', status: 'present' },
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

function ForgotPasswordScreen({ initialEmail, onBack }: { initialEmail: string; onBack: () => void }) {
  const [email, setEmail] = useState(initialEmail)
  const [sent, setSent] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (email.trim()) setSent(true)
  }

  return (
    <div className="min-h-screen flex">
      <div className="flex-1 flex items-center justify-center p-8 bg-slate-50">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-3 mb-8 justify-center">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center">
              <UserCheck size={20} className="text-white" />
            </div>
            <span className="font-bold text-2xl text-slate-800" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>AttendFlow</span>
          </div>

          <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Mot de passe oublié</h2>
            <p className="text-slate-500 text-sm mb-7">Saisissez votre email pour recevoir un lien de réinitialisation.</p>

            {sent ? (
              <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-start gap-3">
                <CheckCircle size={18} className="text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-green-700 text-sm font-semibold">Un lien de réinitialisation a été envoyé</p>
                  <p className="text-green-600 text-xs mt-0.5">Consultez la boîte de réception de {email}.</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
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
                <button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors text-sm shadow-lg shadow-blue-200">
                  Envoyer le lien
                </button>
              </form>
            )}

            <button type="button" onClick={onBack} className="mt-6 w-full flex items-center justify-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium">
              <ChevronLeft size={15} />
              Retour à la connexion
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function LoginScreen({ onLogin }: { onLogin: (t: Teacher) => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [forgot, setForgot] = useState(false)

  if (forgot) return <ForgotPasswordScreen initialEmail={email} onBack={() => setForgot(false)} />

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
            Chaque utilisateur,<br />son propre espace.
          </h1>
          <p className="text-blue-200 text-lg leading-relaxed mb-10">
            Système de gestion des présences basé sur les droits d'accès. Chaque rôle accède uniquement aux données qui le concernent.
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
                <button type="button" onClick={() => setForgot(true)} className="text-sm text-blue-600 hover:text-blue-700 font-medium">Mot de passe oublié ?</button>
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
                      <p className="text-xs text-slate-400">
                        {t.role === 'admin' ? 'Administrateur' : t.role === 'student' ? t.classes.join(', ') : t.matieres.slice(0, 2).join(', ')}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                      t.role === 'admin' ? 'bg-purple-100 text-purple-700' : t.role === 'student' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {t.role === 'admin' ? 'Admin' : t.role === 'student' ? 'Étudiant' : 'Prof'}
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
    { label: 'Matières', icon: BookMarked, screen: 'subjects' as Screen },
    { label: 'Mes statistiques', icon: BarChart3, screen: 'my-stats' as Screen },
    { label: 'Notifications', icon: Bell, screen: 'notifications' as Screen },
    { label: 'Mon profil', icon: UserCheck, screen: 'profile' as Screen },
  ]

  const adminNav = [
    { label: 'Tableau de bord', icon: LayoutDashboard, screen: 'dashboard' as Screen },
    { label: 'Emploi du temps', icon: Calendar, screen: 'timetable' as Screen },
    { label: 'Présences', icon: ClipboardList, screen: 'my-presences' as Screen },
    { label: 'Justificatifs', icon: FileText, screen: 'admin-justifications' as Screen },
    { label: 'Étudiants', icon: Users, screen: 'admin-students' as Screen },
    { label: 'Classes', icon: BookOpen, screen: 'admin-classes' as Screen },
    { label: 'Matières', icon: BookMarked, screen: 'subjects' as Screen },
    { label: 'Enseignants', icon: GraduationCap, screen: 'admin-teachers' as Screen },
    { label: 'Rapports', icon: BarChart3, screen: 'admin-reports' as Screen },
    { label: 'Notifications', icon: Bell, screen: 'notifications' as Screen },
    { label: 'Paramètres', icon: Settings, screen: 'settings' as Screen },
    { label: 'Mon profil', icon: UserCheck, screen: 'profile' as Screen },
  ]

  const studentNav = [
    { label: 'Tableau de bord', icon: LayoutDashboard, screen: 'dashboard' as Screen },
    { label: 'Emploi du temps', icon: Calendar, screen: 'timetable' as Screen },
    { label: 'Mon historique', icon: ClipboardList, screen: 'student-history' as Screen },
    { label: 'Mes justificatifs', icon: FileText, screen: 'justifications' as Screen },
    { label: 'Notifications', icon: Bell, screen: 'notifications' as Screen },
    { label: 'Mon profil', icon: UserCheck, screen: 'profile' as Screen },
  ]

  const navItems = teacher.role === 'admin' ? adminNav : teacher.role === 'student' ? studentNav : teacherNav
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
              {teacher.role === 'admin' ? 'Administration' : teacher.role === 'student' ? 'Espace Étudiant' : 'Espace Enseignant'}
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
            <p className="text-slate-400 text-xs">{teacher.role === 'admin' ? 'Administrateur' : teacher.role === 'student' ? 'Étudiant' : 'Enseignant'}</p>
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
          <p className="text-xs text-slate-400">{teacher.role === 'admin' ? 'Administrateur' : teacher.role === 'student' ? 'Étudiant' : 'Enseignant'}</p>
        </div>
      </div>
    </header>
  )
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

function Dashboard({ teacher, setScreen, onStartAttendance }: { teacher: Teacher; setScreen: (s: Screen) => void; onStartAttendance: (session: SelectedSession) => void }) {
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
  const currentSlot = todaySlots.find(slot => slot.etat !== 'Annulée')

  const startTodaySession = (slot: TimetableSlot & { time: string }) => {
    onStartAttendance({
      teacherId: slot.teacherId,
      matiere: slot.matiere,
      classe: slot.classe,
      salle: slot.salle,
      date: '25 septembre 2026',
      horaire: slot.time,
      etat: slot.etat,
    })
  }

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
          {currentSlot && (
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <span className="inline-flex items-center gap-1.5 bg-green-400/20 text-green-300 text-xs font-semibold px-3 py-1 rounded-full border border-green-400/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    Séance en cours
                  </span>
                  <h3 className="text-2xl font-bold mt-3" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{currentSlot.matiere}</h3>
                  <p className="text-blue-200 text-sm mt-0.5">{currentSlot.classe} · Salle {currentSlot.salle}</p>
                </div>
                <div className="text-right">
                  <p className="text-blue-200 text-xs">Horaire</p>
                  <p className="text-white font-bold text-lg mt-1">{currentSlot.time}</p>
                </div>
              </div>
              <button
                onClick={() => startTodaySession(currentSlot)}
                className="w-full bg-white text-blue-700 font-semibold py-3 rounded-xl hover:bg-blue-50 transition-colors text-sm"
              >
                Prendre les présences →
              </button>
            </div>
          )}

          {!isAdmin && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-slate-800">Prochaines séances</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Vos séances restantes aujourd'hui</p>
                </div>
                <Calendar size={18} className="text-blue-500" />
              </div>
              <div className="space-y-2.5">
                {todaySlots.length > 0 ? todaySlots.map((slot, index) => (
                  <div key={`${slot.time}-${slot.matiere}-${index}`} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                      <Clock size={17} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800">{slot.matiere}</p>
                      <p className="text-xs text-slate-400">{slot.classe} · Salle {slot.salle} · {slot.time}</p>
                    </div>
                    <button
                      onClick={() => startTodaySession(slot)}
                      disabled={slot.etat === 'Annulée'}
                      className="px-3 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
                    >
                      Prendre les présences
                    </button>
                  </div>
                )) : (
                  <p className="text-sm text-slate-400 py-4 text-center">Aucune autre séance aujourd'hui.</p>
                )}
              </div>
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

function StudentDashboard({ account, records, setScreen }: { account: Teacher; records: StudentAttendance[]; setScreen: (s: Screen) => void }) {
  const presents = records.filter(r => r.status === 'present').length
  const absents = records.filter(r => r.status === 'absent').length
  const retards = records.filter(r => r.status === 'late').length
  const taux = records.length ? Math.round((presents + records.filter(r => r.status === 'justified').length) / records.length * 100) : 0
  const nextSlot = Object.entries(TIMETABLE_DATA.Vendredi).flatMap(([time, slots]) =>
    slots.filter(slot => account.classes.includes(slot.classe) && slot.etat !== 'Annulée').map(slot => ({ ...slot, time }))
  )[0]
  const recentAbsences = records.filter(r => r.status === 'absent' || r.status === 'justified').slice(0, 3)
  const evolution = [
    { semaine: 'S1', taux: 78 },
    { semaine: 'S2', taux: 84 },
    { semaine: 'S3', taux: 88 },
    { semaine: 'S4', taux },
  ]

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Bonjour, {account.prenom}</h2>
        <p className="text-slate-500 text-sm mt-1">{account.classes[0]} · Votre suivi de présence</p>
      </div>
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Taux de présence" value={`${taux}%`} icon={TrendingUp} color="blue" sub="Depuis le début du semestre" />
        <StatCard label="Présences" value={presents} icon={CheckCircle} color="green" sub="Séances validées" />
        <StatCard label="Absences" value={absents} icon={XCircle} color="red" sub="À régulariser si nécessaire" />
        <StatCard label="Retards" value={retards} icon={Clock} color="orange" sub="Retards enregistrés" />
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2 space-y-5">
          {nextSlot && (
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white">
              <div className="flex items-start justify-between">
                <div>
                  <span className="inline-flex items-center gap-1.5 bg-white/15 border border-white/20 px-3 py-1 rounded-full text-xs font-semibold">
                    <Clock size={12} /> Prochaine séance
                  </span>
                  <h3 className="text-2xl font-bold mt-4">{nextSlot.matiere}</h3>
                  <p className="text-blue-200 text-sm mt-1">{nextSlot.classe} · Salle {nextSlot.salle}</p>
                </div>
                <div className="text-right">
                  <p className="text-blue-200 text-xs">Aujourd'hui</p>
                  <p className="font-bold text-lg mt-1">{nextSlot.time}</p>
                </div>
              </div>
              <button onClick={() => setScreen('timetable')} className="mt-5 w-full bg-white text-blue-700 font-semibold py-3 rounded-xl hover:bg-blue-50 text-sm">
                Voir mon emploi du temps
              </button>
            </div>
          )}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800">Dernières absences</h3>
              <button onClick={() => setScreen('student-history')} className="text-xs font-semibold text-blue-600">Voir l'historique</button>
            </div>
            <div className="space-y-2.5">
              {recentAbsences.map(record => {
                const t = TEACHERS.find(item => item.id === record.teacherId)
                return (
                  <div key={record.id} className="flex items-center gap-3 p-3 bg-slate-50/70 rounded-xl">
                    <div className="w-9 h-9 rounded-xl bg-red-50 text-red-500 flex items-center justify-center"><XCircle size={16} /></div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-800">{record.matiere}</p>
                      <p className="text-xs text-slate-400">{record.date} · {t?.prenom} {t?.nom}</p>
                    </div>
                    <StatusBadge status={record.status} />
                  </div>
                )
              })}
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h3 className="font-bold text-slate-800 text-sm">Évolution de ma présence</h3>
          <p className="text-xs text-slate-400 mt-1 mb-5">Quatre dernières semaines</p>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={evolution}>
              <defs>
                <linearGradient id="studentGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="semaine" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(value) => [`${value}%`, 'Taux']} />
              <Area type="monotone" dataKey="taux" stroke="#2563eb" strokeWidth={2.5} fill="url(#studentGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

function StudentHistory({
  student,
  records,
  justifications,
  canJustify,
  onSubmitJustification,
}: {
  student: Student
  records: StudentAttendance[]
  justifications: Justification[]
  canJustify: boolean
  onSubmitJustification: (attendanceId: number, motif: string, fichier: string) => void
}) {
  const [justifyRecord, setJustifyRecord] = useState<StudentAttendance | null>(null)
  const [motif, setMotif] = useState('')
  const [fichier, setFichier] = useState('')
  const presents = records.filter(r => r.status === 'present').length
  const absents = records.filter(r => r.status === 'absent').length
  const retards = records.filter(r => r.status === 'late').length
  const taux = records.length ? Math.round((presents + records.filter(r => r.status === 'justified').length) / records.length * 100) : 0
  const evolution = [
    { semaine: 'S1', taux: 76 }, { semaine: 'S2', taux: 82 },
    { semaine: 'S3', taux: 86 }, { semaine: 'S4', taux },
  ]

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!justifyRecord || !motif || !fichier) return
    onSubmitJustification(justifyRecord.id, motif, fichier)
    setJustifyRecord(null)
    setMotif('')
    setFichier('')
  }

  return (
    <div className="p-6 space-y-5">
      <div>
        <h2 className="text-xl font-bold text-slate-800">{canJustify ? 'Mon historique' : `Historique de ${student.prenom} ${student.nom}`}</h2>
        <p className="text-slate-500 text-sm mt-0.5">{student.classe} · Matricule {student.matricule}</p>
      </div>
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Taux de présence" value={`${taux}%`} icon={TrendingUp} color="blue" />
        <StatCard label="Présences" value={presents} icon={CheckCircle} color="green" />
        <StatCard label="Absences" value={absents} icon={XCircle} color="red" />
        <StatCard label="Retards" value={retards} icon={Clock} color="orange" />
      </div>
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <h3 className="font-bold text-slate-700 text-sm mb-4">Évolution du taux de présence</h3>
        <ResponsiveContainer width="100%" height={170}>
          <LineChart data={evolution}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="semaine" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip formatter={(value) => [`${value}%`, 'Taux']} />
            <Line type="monotone" dataKey="taux" stroke="#2563eb" strokeWidth={2.5} dot={{ fill: '#2563eb', r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              {['Date', 'Matière', 'Enseignant', 'Horaire', 'Statut', canJustify ? 'Action' : ''].filter(Boolean).map(h => (
                <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {records.map(record => {
              const recordTeacher = TEACHERS.find(t => t.id === record.teacherId)
              const justification = justifications.find(j => j.attendanceId === record.id && j.status !== 'refused')
              return (
                <tr key={record.id}>
                  <td className="px-5 py-4 text-sm text-slate-500 font-mono">{record.date}</td>
                  <td className="px-5 py-4 text-sm font-semibold text-slate-800">{record.matiere}</td>
                  <td className="px-5 py-4 text-sm text-slate-500">{recordTeacher?.prenom} {recordTeacher?.nom}</td>
                  <td className="px-5 py-4 text-sm text-slate-500">{record.horaire}</td>
                  <td className="px-5 py-4"><StatusBadge status={record.status} /></td>
                  {canJustify && (
                    <td className="px-5 py-4">
                      {justification?.status === 'pending' ? (
                        <span className="px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold rounded-full">En attente</span>
                      ) : record.status === 'absent' ? (
                        <button onClick={() => setJustifyRecord(record)} className="px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold rounded-lg">Justifier</button>
                      ) : <span className="text-slate-300">—</span>}
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {justifyRecord && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={submit} className="bg-white rounded-3xl border border-white shadow-xl p-6 w-full max-w-lg">
            <div className="flex items-start justify-between mb-5">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Justifier une absence</h3>
                <p className="text-sm text-slate-400 mt-1">{justifyRecord.matiere} · {justifyRecord.date}</p>
              </div>
              <button type="button" onClick={() => setJustifyRecord(null)} className="w-8 h-8 rounded-lg bg-slate-50 text-slate-500 flex items-center justify-center"><X size={15} /></button>
            </div>
            <label className="text-sm font-medium text-slate-600 mb-1.5 block">Motif</label>
            <textarea required value={motif} onChange={e => setMotif(e.target.value)} rows={4} placeholder="Décrivez le motif de votre absence..." className="w-full px-4 py-3 text-sm border border-slate-200 bg-white rounded-xl focus:outline-none resize-none" />
            <label className="text-sm font-medium text-slate-600 mb-1.5 mt-4 block">Justificatif (PDF ou image)</label>
            <input required type="file" accept=".pdf,image/*" onChange={e => setFichier(e.target.files?.[0]?.name || '')} className="w-full px-3 py-2.5 text-sm border border-slate-200 bg-white rounded-xl" />
            <div className="flex justify-end gap-2 mt-6">
              <button type="button" onClick={() => setJustifyRecord(null)} className="px-4 py-2.5 text-sm font-semibold text-slate-600 border border-slate-200 rounded-xl">Annuler</button>
              <button type="submit" className="px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl">Envoyer le justificatif</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

function StudentJustifications({ studentId, justifications, records }: { studentId: number; justifications: Justification[]; records: StudentAttendance[] }) {
  const mine = justifications.filter(j => j.studentId === studentId)
  const labels: Record<JustificationStatus, { text: string; cls: string }> = {
    pending: { text: 'En attente', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
    accepted: { text: 'Accepté', cls: 'bg-green-50 text-green-700 border-green-200' },
    refused: { text: 'Refusé', cls: 'bg-red-50 text-red-700 border-red-200' },
  }
  return (
    <div className="p-6 space-y-5">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Mes justificatifs</h2>
        <p className="text-slate-500 text-sm mt-0.5">Suivez le traitement de vos demandes</p>
      </div>
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {mine.length ? mine.map(item => {
          const record = records.find(r => r.id === item.attendanceId)
          const status = labels[item.status]
          return (
            <div key={item.id} className="flex items-center gap-4 p-5 border-b border-slate-100 last:border-0">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center"><FileText size={18} /></div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-800">{record?.matiere || 'Séance'} · {record?.date}</p>
                <p className="text-xs text-slate-400 mt-1">{item.motif} · {item.fichier}</p>
              </div>
              <span className={`px-2.5 py-1 rounded-full border text-xs font-semibold ${status.cls}`}>{status.text}</span>
            </div>
          )
        }) : (
          <div className="py-14 text-center">
            <FileText size={32} className="text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-500">Aucun justificatif envoyé.</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── My Timetable ─────────────────────────────────────────────────────────────

function MyTimetable({ teacher, onStartAttendance }: { teacher: Teacher; onStartAttendance: (session: SelectedSession) => void }) {
  const isAdmin = teacher.role === 'admin'
  const isStudent = teacher.role === 'student'
  const [weekOffset, setWeekOffset] = useState(0)
  const [filterClass, setFilterClass] = useState('Toutes')
  const [filterTeacher, setFilterTeacher] = useState('Tous')
  const [selected, setSelected] = useState<SelectedSession | null>(null)
  const baseMonday = new Date(Date.UTC(2026, 8, 21))
  const weekDays = DAYS.map((_, index) => {
    const date = new Date(baseMonday)
    date.setUTCDate(baseMonday.getUTCDate() + weekOffset * 7 + index)
    return date
  })
  const formatShort = (date: Date) => date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', timeZone: 'UTC' })
  const formatLong = (date: Date) => date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
  const classes = [...new Set(Object.values(TIMETABLE_DATA).flatMap(day => Object.values(day).flat().map(slot => slot.classe)))]

  const getSlot = (day: string, time: string) => {
    const slots = TIMETABLE_DATA[day]?.[time] || []
    return slots.filter(slot =>
      (isAdmin || (isStudent ? teacher.classes.includes(slot.classe) : slot.teacherId === teacher.id)) &&
      (!isAdmin || filterClass === 'Toutes' || slot.classe === filterClass) &&
      (!isAdmin || filterTeacher === 'Tous' || slot.teacherId === Number(filterTeacher))
    )
  }

  const openDetails = (slot: TimetableSlot, dayIndex: number, time: string) => {
    setSelected({
      teacherId: slot.teacherId,
      matiere: slot.matiere,
      classe: slot.classe,
      salle: slot.salle,
      date: formatLong(weekDays[dayIndex]),
      horaire: time,
      etat: slot.etat,
    })
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            {isAdmin ? 'Tous les emplois du temps' : isStudent ? `Emploi du temps — ${teacher.classes[0]}` : 'Mon emploi du temps'}
          </h2>
          <p className="text-slate-500 text-sm mt-0.5">
            Semaine du {formatLong(weekDays[0])} au {formatLong(weekDays[4])}
          </p>
          {!isAdmin && !isStudent && (
            <div className="mt-2 flex items-center gap-2">
              <AccessBadge label={`Visible : ${teacher.matieres.join(', ')}`} />
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { setWeekOffset(v => v - 1); setSelected(null) }} aria-label="Semaine précédente" className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50">
            <ChevronLeft size={18} />
          </button>
          <button onClick={() => { setWeekOffset(0); setSelected(null) }} className="text-sm font-semibold text-slate-700 bg-blue-50 border border-blue-200 px-4 py-2 rounded-xl">Cette semaine</button>
          <button onClick={() => { setWeekOffset(v => v + 1); setSelected(null) }} aria-label="Semaine suivante" className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {isAdmin && (
        <div className="flex items-center gap-3 flex-wrap">
          <select value={filterClass} onChange={e => { setFilterClass(e.target.value); setSelected(null) }} className="text-sm border border-slate-200 rounded-xl px-3 py-2.5 bg-white focus:outline-none">
            <option value="Toutes">Toutes les classes</option>
            {classes.map(classe => <option key={classe}>{classe}</option>)}
          </select>
          <select value={filterTeacher} onChange={e => { setFilterTeacher(e.target.value); setSelected(null) }} className="text-sm border border-slate-200 rounded-xl px-3 py-2.5 bg-white focus:outline-none">
            <option value="Tous">Tous les enseignants</option>
            {TEACHERS.filter(t => t.role === 'teacher').map(t => <option key={t.id} value={t.id}>{t.prenom} {t.nom}</option>)}
          </select>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-auto">
        <div className="min-w-[700px]">
          <div className="grid" style={{ gridTemplateColumns: '100px repeat(5, 1fr)' }}>
            <div className="bg-slate-50/70 border-b border-slate-100 p-3" />
            {DAYS.map((d, index) => (
              <div key={d} className="bg-slate-50/70 border-b border-l border-slate-100 p-3 text-center">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{d}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{formatShort(weekDays[index])}</p>
              </div>
            ))}

            {TIME_SLOTS.map((time, si) => (
              <div key={time} className="contents">
                <div className="border-b border-slate-100 p-3 bg-slate-50/30 flex flex-col justify-center">
                  <p className="text-xs font-semibold text-slate-500">{time.split(' - ')[0]}</p>
                  <p className="text-[10px] text-slate-300 mt-0.5">{time.split(' - ')[1]}</p>
                </div>
                {DAYS.map((day, dayIndex) => {
                  const slots = getSlot(day, time)
                  return (
                    <div key={`${day}-${si}`} className="border-b border-l border-slate-100 p-2 min-h-[88px]">
                      {slots.length === 0
                        ? <div className="h-full min-h-[72px] rounded-xl border border-dashed border-slate-200" />
                        : slots.map((slot, i) => {
                          const t = isAdmin ? TEACHERS.find(t => t.id === slot.teacherId) : null
                          const c = COLOR_MAP[slot.color] || COLOR_MAP.blue
                          return (
                            <button
                              key={i}
                              onClick={() => openDetails(slot, dayIndex, time)}
                              className={`w-full text-left rounded-xl border p-2.5 cursor-pointer hover:shadow-md transition-all ${c.card} ${slot.etat === 'Annulée' ? 'line-through opacity-65' : ''} ${i > 0 ? 'mt-1' : ''}`}
                            >
                              <div className="flex items-start gap-1.5 mb-1">
                                <span className={`w-1.5 h-1.5 rounded-full mt-1 flex-shrink-0 ${c.dot}`} />
                                <p className="text-xs font-bold leading-tight">{slot.matiere}</p>
                                {slot.etat !== 'Planifiée' && (
                                  <span className={`ml-auto no-underline px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                    slot.etat === 'Modifiée' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'
                                  }`}>{slot.etat}</span>
                                )}
                              </div>
                              <p className="text-xs opacity-70 pl-3">{slot.classe}</p>
                              <p className="text-xs opacity-60 pl-3">Salle {slot.salle}</p>
                              {isAdmin && t && <p className="text-[10px] opacity-50 pl-3 mt-0.5">{t.prenom} {t.nom}</p>}
                            </button>
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

      {selected && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <p className="text-xs uppercase tracking-wider font-semibold text-slate-400">Détails de la séance</p>
              <h3 className={`text-lg font-bold text-slate-800 mt-1 ${selected.etat === 'Annulée' ? 'line-through' : ''}`}>{selected.matiere}</h3>
            </div>
            <button onClick={() => setSelected(null)} aria-label="Fermer les détails" className="w-8 h-8 rounded-lg bg-slate-50 text-slate-500 flex items-center justify-center"><X size={15} /></button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3">
            {[
              ['Matière', selected.matiere],
              ['Classe', selected.classe],
              ['Enseignant', (() => { const t = TEACHERS.find(item => item.id === selected.teacherId); return t ? `${t.prenom} ${t.nom}` : '—' })()],
              ['Salle', selected.salle],
              ['Date', selected.date],
              ['Horaire', selected.horaire],
              ['État', selected.etat],
            ].map(([label, value]) => (
              <div key={label} className="bg-slate-50/70 rounded-xl p-3">
                <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">{label}</p>
                <p className="text-sm text-slate-700 font-semibold mt-1">{value}</p>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between gap-4 mt-4 pt-4 border-t border-slate-100">
            <p className={`text-xs font-semibold ${selected.etat === 'Annulée' ? 'text-red-600' : selected.etat === 'Modifiée' ? 'text-orange-600' : 'text-green-600'}`}>
              {selected.etat === 'Annulée' ? 'Cette séance est annulée et ne peut pas faire l’objet d’une prise de présence.' : `Séance ${selected.etat.toLowerCase()}`}
            </p>
            <button
              onClick={() => onStartAttendance(selected)}
              disabled={selected.etat === 'Annulée'}
              className={`px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none ${isStudent ? 'hidden' : ''}`}
            >
              Prendre les présences
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 text-xs text-slate-400">
        <Lock size={12} />
        Emploi du temps fourni par le projet partenaire — lecture seule
      </div>

      {!isAdmin && !isStudent && (
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

function MyPresences({ teacher, setScreen, onStartAttendance }: { teacher: Teacher; setScreen: (s: Screen) => void; onStartAttendance: (session: SelectedSession) => void }) {
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
                      onClick={() => onStartAttendance({
                        teacherId: s.teacherId,
                        matiere: s.matiere,
                        classe: s.classe,
                        salle: s.salle,
                        date: s.date,
                        horaire: s.horaire.replace('-', ' - '),
                        etat: 'Planifiée',
                      })}
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

function AttendanceSession({ teacher, session }: { teacher: Teacher; session: SelectedSession | null }) {
  const fallbackTeacher = teacher.role === 'admin' ? TEACHERS.find(t => t.role === 'teacher') || teacher : teacher
  const activeSession: SelectedSession = session || {
    teacherId: fallbackTeacher.id,
    matiere: fallbackTeacher.matieres[0] || 'Développement Web',
    classe: fallbackTeacher.classes[0] || '3ème INFO',
    salle: 'B12',
    date: '25 septembre 2026',
    horaire: '08:00 - 10:00',
    etat: 'Planifiée',
  }
  const sessionTeacher = TEACHERS.find(t => t.id === activeSession.teacherId) || teacher
  const myStudents = ALL_STUDENTS.filter(s => s.classe === activeSession.classe)

  const [statuses, setStatuses] = useState<Record<number, AttendanceStatus>>(() => {
    const init: Record<number, AttendanceStatus> = {}
    myStudents.forEach(s => { init[s.id] = 'present' })
    return init
  })
  const [saved, setSaved] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'Tous' | AttendanceStatus>('Tous')
  const filteredStudents = myStudents.filter(student => {
    const matchesSearch = `${student.prenom} ${student.nom} ${student.matricule}`.toLowerCase().includes(search.toLowerCase())
    return matchesSearch && (statusFilter === 'Tous' || statuses[student.id] === statusFilter)
  })

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
              { label: 'Matière', value: activeSession.matiere },
              { label: 'Classe', value: activeSession.classe },
              { label: 'Enseignant', value: `${sessionTeacher.prenom} ${sessionTeacher.nom}` },
              { label: 'Date', value: activeSession.date },
              { label: 'Horaire', value: activeSession.horaire },
              { label: 'Salle', value: activeSession.salle },
              { label: 'État', value: activeSession.etat },
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
          <div className="flex items-center gap-3 p-4 border-b border-slate-100 flex-wrap">
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
            <div className="relative flex-1 min-w-48">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher par nom ou matricule..."
                className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as 'Tous' | AttendanceStatus)} className="text-sm border border-slate-200 rounded-xl px-3 py-2 bg-white focus:outline-none">
              <option value="Tous">Tous les statuts</option>
              <option value="present">Présent</option>
              <option value="absent">Absent</option>
              <option value="late">Retard</option>
              <option value="justified">Justifié</option>
            </select>
            <div className="ml-auto flex items-center gap-3">
              <span className="text-xs text-slate-500">{filteredStudents.length} étudiant(s) · {activeSession.classe}</span>
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
                {filteredStudents.map((student, i) => (
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

function Profile({ teacher }: { teacher: Teacher }) {
  const [editing, setEditing] = useState(false)
  const avatarColors = ['red', 'blue', 'green', 'purple']
  const studentProfile = teacher.role === 'student' ? ALL_STUDENTS.find(student => student.id === teacher.studentId) : null

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
            {teacher.role === 'admin' ? 'Administrateur' : teacher.role === 'student' ? 'Étudiant' : 'Enseignant'}
          </span>

          {teacher.role === 'teacher' && (
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
          {studentProfile && (
            <div className="mt-6 pt-5 border-t border-slate-100 text-left space-y-3">
              <div>
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">Classe</p>
                <span className="px-2.5 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold rounded-full">{studentProfile.classe}</span>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">Matricule</p>
                <p className="text-sm text-slate-600 font-mono">{studentProfile.matricule}</p>
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

          {teacher.role === 'teacher' && (
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

type NotificationType = 'information' | 'avertissement' | 'succes'

interface AppNotification {
  id: number
  type: NotificationType
  title: string
  body: string
  time: string
  read: boolean
}

const NOTIFICATION_STYLES: Record<NotificationType, { label: string; box: string; badge: string; icon: React.ElementType }> = {
  information: { label: 'Information', box: 'bg-blue-50 border-blue-200 text-blue-600', badge: 'bg-blue-50 border-blue-200 text-blue-700', icon: Bell },
  avertissement: { label: 'Avertissement', box: 'bg-orange-50 border-orange-200 text-orange-600', badge: 'bg-orange-50 border-orange-200 text-orange-700', icon: AlertCircle },
  succes: { label: 'Succès', box: 'bg-green-50 border-green-200 text-green-600', badge: 'bg-green-50 border-green-200 text-green-700', icon: CheckCircle },
}

function initialNotifications(account: Teacher): AppNotification[] {
  if (account.role === 'student') {
    return [
      { id: 1, type: 'information', title: 'Séance dans 15 minutes', body: 'Votre séance de Développement Web commence dans 15 minutes. Salle B12.', time: 'Il y a 5 min', read: false },
      { id: 2, type: 'avertissement', title: 'Nouvelle absence', body: 'Une absence a été enregistrée dans votre cours de Java.', time: 'Il y a 2 h', read: false },
      { id: 3, type: 'information', title: 'Justificatif en cours', body: 'Votre justificatif est en attente de traitement par l’administration.', time: 'Hier, 14:20', read: true },
    ]
  }
  if (account.role === 'admin') {
    return [
      { id: 1, type: 'avertissement', title: 'Séance annulée dans le planning source', body: 'La séance de Systèmes (3ème RÉSEAUX, lundi 16:00) a été annulée par le projet partenaire. Les présences déjà saisies sont conservées.', time: 'Il y a 20 min', read: false },
      { id: 2, type: 'avertissement', title: 'Seuil d’absence dépassé', body: '3 étudiants ont dépassé le seuil d’absence autorisé.', time: 'Il y a 2 h', read: false },
      { id: 3, type: 'information', title: 'Nouveau justificatif', body: 'Un justificatif est en attente de validation.', time: 'Il y a 3 h', read: false },
      { id: 4, type: 'succes', title: 'Synchronisation réussie', body: 'L’emploi du temps a été synchronisé avec le projet partenaire.', time: 'Hier, 07:00', read: true },
    ]
  }
  return [
    { id: 1, type: 'information', title: 'Séance dans 15 minutes', body: `Votre séance de ${account.matieres[0] || 'cours'} commence dans 15 minutes. Salle B12.`, time: 'Il y a 5 min', read: false },
    { id: 2, type: 'information', title: 'Absences enregistrées', body: '8 absences ont été enregistrées dans vos séances aujourd\'hui.', time: 'Il y a 1 h', read: false },
    { id: 3, type: 'avertissement', title: 'Seuil d\'absence dépassé', body: '3 de vos étudiants ont dépassé le seuil d\'absence autorisé.', time: 'Il y a 2 h', read: false },
    { id: 4, type: 'succes', title: 'Présences confirmées', body: 'Les présences de votre dernière séance ont été enregistrées avec succès.', time: 'Hier, 12:05', read: true },
  ]
}

function Notifications({ notifications, setNotifications }: { notifications: AppNotification[]; setNotifications: (n: AppNotification[]) => void }) {
  const unread = notifications.filter(n => !n.read).length
  const markAllRead = () => setNotifications(notifications.map(n => ({ ...n, read: true })))
  const markRead = (id: number) => setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n))

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Notifications</h2>
          <p className="text-slate-500 text-sm mt-0.5">{unread} non lue(s) — pour vous uniquement</p>
        </div>
        <button
          onClick={markAllRead}
          disabled={unread === 0}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium disabled:text-slate-300 disabled:cursor-not-allowed"
        >
          Tout marquer comme lu
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {(Object.keys(NOTIFICATION_STYLES) as NotificationType[]).map(type => (
          <span key={type} className={`px-2.5 py-1 rounded-full border text-xs font-semibold ${NOTIFICATION_STYLES[type].badge}`}>
            {NOTIFICATION_STYLES[type].label}
          </span>
        ))}
      </div>
      <div className="space-y-3">
        {notifications.map(n => {
          const style = NOTIFICATION_STYLES[n.type]
          const Icon = style.icon
          return (
            <div
              key={n.id}
              onClick={() => markRead(n.id)}
              className={`bg-white rounded-2xl border shadow-sm p-5 flex items-start gap-4 hover:shadow-md transition-all cursor-pointer ${!n.read ? 'border-slate-200' : 'border-slate-100 opacity-60'}`}
            >
              <div className={`w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0 ${style.box}`}>
                <Icon size={18} />
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-slate-800 text-sm">{n.title}</p>
                      <span className={`px-2 py-0.5 rounded-full border text-[10px] font-semibold ${style.badge}`}>{style.label}</span>
                    </div>
                    <p className="text-slate-500 text-sm mt-1 leading-relaxed">{n.body}</p>
                  </div>
                  {!n.read && <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5" />}
                </div>
                <p className="text-xs text-slate-400 mt-2">{n.time}</p>
              </div>
            </div>
          )
        })}
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

function AdminAllStudents({
  students,
  setStudents,
  onOpenHistory,
}: {
  students: Student[]
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>
  onOpenHistory: (student: Student) => void
}) {
  const [search, setSearch] = useState('')
  const [filterClass, setFilterClass] = useState('Toutes')
  const [formOpen, setFormOpen] = useState(false)
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Student | null>(null)
  const [form, setForm] = useState({
    nom: '', prenom: '', email: '', matricule: '', classe: '3ème INFO',
    dateNaissance: '', telephone: '', photo: '',
  })
  const classes = [...new Set([...ALL_STUDENTS.map(s => s.classe), ...students.map(s => s.classe)])]
  const filtered = students.filter(s => {
    const match = `${s.prenom} ${s.nom} ${s.matricule}`.toLowerCase().includes(search.toLowerCase())
    const cls = filterClass === 'Toutes' || s.classe === filterClass
    return match && cls
  })

  const openForm = (student?: Student) => {
    setEditingStudent(student || null)
    setForm(student ? {
      nom: student.nom,
      prenom: student.prenom,
      email: student.email,
      matricule: student.matricule,
      classe: student.classe,
      dateNaissance: student.dateNaissance || '',
      telephone: student.telephone || '',
      photo: student.photo || '',
    } : {
      nom: '', prenom: '', email: '', matricule: '', classe: classes[0] || '3ème INFO',
      dateNaissance: '', telephone: '', photo: '',
    })
    setFormOpen(true)
  }

  const submitForm = (event: React.FormEvent) => {
    event.preventDefault()
    if (editingStudent) {
      setStudents(prev => prev.map(student => student.id === editingStudent.id ? { ...student, ...form } : student))
    } else {
      setStudents(prev => [...prev, {
        id: Math.max(0, ...prev.map(student => student.id)) + 1,
        ...form,
        taux: 100,
        absences: 0,
      }])
    }
    setFormOpen(false)
  }

  const confirmDelete = () => {
    if (!deleteTarget) return
    setStudents(prev => prev.filter(student => student.id !== deleteTarget.id))
    setDeleteTarget(null)
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Gestion des étudiants</h2>
          <p className="text-slate-500 text-sm mt-0.5">{students.length} étudiants enregistrés</p>
        </div>
        <button onClick={() => openForm()} className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl transition-colors shadow-lg shadow-blue-200">
          <Plus size={16} />
          Ajouter
        </button>
      </div>
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher par nom ou matricule..."
            className="pl-9 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl w-full focus:outline-none" />
        </div>
        <select value={filterClass} onChange={e => setFilterClass(e.target.value)} className="text-sm border border-slate-200 rounded-xl px-3 py-2.5 bg-white focus:outline-none">
          <option value="Toutes">Toutes les classes</option>
          {classes.map(c => <option key={c}>{c}</option>)}
        </select>
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
                    <div className="flex items-center gap-2">
                      <button onClick={() => onOpenHistory(student)} title="Voir l'historique" className="flex items-center gap-1.5 px-2.5 h-8 rounded-lg bg-blue-50 text-blue-600 text-xs font-semibold hover:bg-blue-100"><Eye size={14} />Voir l'historique</button>
                      <button onClick={() => openForm(student)} title="Modifier" className="w-8 h-8 rounded-lg bg-slate-50 text-slate-600 flex items-center justify-center hover:bg-slate-100"><Pencil size={14} /></button>
                      <button onClick={() => setDeleteTarget(student)} title="Supprimer" className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-100"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <div className="px-5 py-3.5 border-t border-slate-100 text-sm text-slate-400">{filtered.length} étudiant(s)</div>
      </div>

      {formOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={submitForm} className="bg-white rounded-3xl border border-white shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-5">
              <div>
                <h3 className="text-lg font-bold text-slate-800">{editingStudent ? 'Modifier l’étudiant' : 'Ajouter un étudiant'}</h3>
                <p className="text-sm text-slate-400 mt-1">Renseignez les informations du dossier étudiant</p>
              </div>
              <button type="button" onClick={() => setFormOpen(false)} className="w-8 h-8 rounded-lg bg-slate-50 text-slate-500 flex items-center justify-center"><X size={15} /></button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { key: 'nom', label: 'Nom', type: 'text' },
                { key: 'prenom', label: 'Prénom', type: 'text' },
                { key: 'email', label: 'Email', type: 'email' },
                { key: 'matricule', label: 'Matricule', type: 'text' },
                { key: 'dateNaissance', label: 'Date de naissance', type: 'date' },
                { key: 'telephone', label: 'Téléphone', type: 'tel' },
              ].map(field => (
                <div key={field.key}>
                  <label className="text-sm font-medium text-slate-600 mb-1.5 block">{field.label}</label>
                  <input
                    required
                    type={field.type}
                    value={form[field.key as keyof typeof form]}
                    onChange={e => setForm(prev => ({ ...prev, [field.key]: e.target.value }))}
                    className="w-full px-4 py-3 text-sm border border-slate-200 bg-white rounded-xl focus:outline-none"
                  />
                </div>
              ))}
              <div>
                <label className="text-sm font-medium text-slate-600 mb-1.5 block">Classe</label>
                <select required value={form.classe} onChange={e => setForm(prev => ({ ...prev, classe: e.target.value }))} className="w-full px-4 py-3 text-sm border border-slate-200 bg-white rounded-xl focus:outline-none">
                  {classes.map(classe => <option key={classe}>{classe}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600 mb-1.5 block">Photo</label>
                <input type="file" accept="image/*" onChange={e => setForm(prev => ({ ...prev, photo: e.target.files?.[0]?.name || prev.photo }))} className="w-full px-3 py-2.5 text-sm border border-slate-200 bg-white rounded-xl" />
                {form.photo && <p className="text-xs text-slate-400 mt-1">{form.photo}</p>}
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6 pt-5 border-t border-slate-100">
              <button type="button" onClick={() => setFormOpen(false)} className="px-4 py-2.5 text-sm font-semibold text-slate-600 border border-slate-200 rounded-xl">Annuler</button>
              <button type="submit" className="px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl">{editingStudent ? 'Enregistrer' : 'Ajouter l’étudiant'}</button>
            </div>
          </form>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-white shadow-xl p-6 w-full max-w-md">
            <div className="w-11 h-11 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mb-4"><Trash2 size={20} /></div>
            <h3 className="text-lg font-bold text-slate-800">Supprimer cet étudiant ?</h3>
            <p className="text-sm text-slate-500 mt-2">Le dossier de {deleteTarget.prenom} {deleteTarget.nom} sera supprimé de la liste. Cette action est irréversible.</p>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setDeleteTarget(null)} className="px-4 py-2.5 text-sm font-semibold text-slate-600 border border-slate-200 rounded-xl">Annuler</button>
              <button onClick={confirmDelete} className="px-4 py-2.5 bg-red-600 text-white text-sm font-semibold rounded-xl">Confirmer la suppression</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function AdminJustifications({
  justifications,
  records,
  students,
  onDecision,
}: {
  justifications: Justification[]
  records: StudentAttendance[]
  students: Student[]
  onDecision: (id: number, decision: 'accepted' | 'refused') => void
}) {
  const pending = justifications.filter(item => item.status === 'pending')
  return (
    <div className="p-6 space-y-5">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Justificatifs</h2>
        <p className="text-slate-500 text-sm mt-0.5">{pending.length} demande(s) en attente de traitement</p>
      </div>
      <div className="space-y-3">
        {pending.map(item => {
          const student = students.find(s => s.id === item.studentId)
          const record = records.find(r => r.id === item.attendanceId)
          return (
            <div key={item.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4">
              <Avatar name={`${student?.prenom || ''} ${student?.nom || ''}`} size="md" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-slate-800">{student?.prenom} {student?.nom}</p>
                  <span className="text-xs text-slate-400">{student?.classe} · {student?.matricule}</span>
                </div>
                <p className="text-sm text-slate-600 mt-1">{record?.matiere} · {record?.date} · {record?.horaire}</p>
                <p className="text-xs text-slate-400 mt-1">Motif : {item.motif} · Fichier : {item.fichier}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => onDecision(item.id, 'refused')} className="px-3 py-2 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded-xl">Refuser</button>
                <button onClick={() => onDecision(item.id, 'accepted')} className="px-3 py-2 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 rounded-xl">Accepter</button>
              </div>
            </div>
          )
        })}
        {!pending.length && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm py-14 text-center">
            <CheckCircle size={34} className="text-green-400 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-700">Toutes les demandes ont été traitées.</p>
          </div>
        )}
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

// ─── Rapports et statistiques ─────────────────────────────────────────────────

interface AppSettings {
  seuilAbsence: number
  maxAbsencesNonJustifiees: number
  delaiModificationHeures: number
  retardCommePresent: boolean
  justifieCommePresent: boolean
}

const DEFAULT_SETTINGS: AppSettings = {
  seuilAbsence: 20,
  maxAbsencesNonJustifiees: 8,
  delaiModificationHeures: 48,
  retardCommePresent: true,
  justifieCommePresent: true,
}

const toIsoDate = (frDate: string) => {
  const [d, m, y] = frDate.split('/')
  return `${y}-${m}-${d}`
}

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 bg-white border border-green-200 rounded-2xl shadow-xl">
      <CheckCircle size={18} className="text-green-600 flex-shrink-0" />
      <p className="text-sm font-semibold text-slate-700">{message}</p>
      <button onClick={onClose} aria-label="Fermer" className="text-slate-400 hover:text-slate-600"><X size={15} /></button>
    </div>
  )
}

// ─── Export (PDF / Excel) sans dépendance ─────────────────────────────────────

type PdfItem =
  | { kind: 'text'; text: string; size?: number; bold?: boolean; gap?: number }
  | { kind: 'row'; cells: string[]; columns: number[]; bold?: boolean }
  | { kind: 'rule' }

// Convertit en octets WinAnsi (Latin-1) pour les polices standard PDF.
function toWinAnsi(text: string) {
  const map: Record<string, string> = { '’': "'", '‘': "'", '“': '"', '”': '"', '–': '-', '—': '-', '…': '...', '·': '-', ' ': ' ', ' ': ' ' }
  let out = ''
  for (const ch of text) {
    const c = map[ch] ?? ch
    for (const sub of c) {
      const code = sub.charCodeAt(0)
      out += code < 256 ? sub : '?'
    }
  }
  return out.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')
}

function buildPdf(items: PdfItem[]): ArrayBuffer {
  const W = 595, H = 842, M = 48
  const pages: string[] = []
  let stream = ''
  let y = H - M

  const newPage = () => { pages.push(stream); stream = ''; y = H - M }
  const ensure = (h: number) => { if (y - h < M) newPage() }

  for (const item of items) {
    if (item.kind === 'rule') {
      ensure(10)
      y -= 4
      stream += `0.8 0.84 0.9 RG 0.6 w ${M} ${y} m ${W - M} ${y} l S\n`
      y -= 8
    } else if (item.kind === 'text') {
      const size = item.size ?? 10
      const lh = size * 1.45
      y -= item.gap ?? 0
      ensure(lh)
      y -= lh
      stream += `BT /${item.bold ? 'F2' : 'F1'} ${size} Tf ${M} ${y.toFixed(1)} Td (${toWinAnsi(item.text)}) Tj ET\n`
    } else {
      const size = 9
      const lh = size * 1.6
      ensure(lh)
      y -= lh
      item.cells.forEach((cell, i) => {
        stream += `BT /${item.bold ? 'F2' : 'F1'} ${size} Tf ${(M + item.columns[i]).toFixed(1)} ${y.toFixed(1)} Td (${toWinAnsi(cell)}) Tj ET\n`
      })
    }
  }
  pages.push(stream)

  const total = pages.length
  const objects: string[] = []
  objects[1] = '<< /Type /Catalog /Pages 2 0 R >>'
  const kids = pages.map((_, i) => `${5 + i * 2} 0 R`).join(' ')
  objects[2] = `<< /Type /Pages /Kids [${kids}] /Count ${total} >>`
  objects[3] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>'
  objects[4] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>'
  pages.forEach((content, i) => {
    const footer = `BT /F1 8 Tf ${M} 24 Td (${toWinAnsi(`AttendFlow - page ${i + 1} / ${total}`)}) Tj ET\n`
    const body = content + footer
    objects[5 + i * 2] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${6 + i * 2} 0 R >>`
    objects[6 + i * 2] = `<< /Length ${body.length} >>\nstream\n${body}endstream`
  })

  let pdf = '%PDF-1.4\n'
  const offsets: number[] = []
  for (let i = 1; i < objects.length; i++) {
    offsets[i] = pdf.length
    pdf += `${i} 0 obj\n${objects[i]}\nendobj\n`
  }
  const xref = pdf.length
  pdf += `xref\n0 ${objects.length}\n0000000000 65535 f \n`
  for (let i = 1; i < objects.length; i++) pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`
  pdf += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`

  const buffer = new ArrayBuffer(pdf.length)
  const bytes = new Uint8Array(buffer)
  for (let i = 0; i < pdf.length; i++) bytes[i] = pdf.charCodeAt(i) & 0xff
  return buffer
}

function buildCsv(rows: (string | number)[][]) {
  const cell = (v: string | number) => {
    const s = String(v)
    return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  // BOM + point-virgule : ouverture directe et correcte dans Excel (version française)
  return '﻿' + rows.map(r => r.map(cell).join(';')).join('\r\n')
}

function downloadFile(data: BlobPart, filename: string, type: string) {
  const blob = new Blob([data], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  link.remove()
  return url
}

function Reports({ viewer, students, records, settings }: {
  viewer: Teacher
  students: Student[]
  records: StudentAttendance[]
  settings: AppSettings
}) {
  const isAdmin = viewer.role === 'admin'
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [filterClass, setFilterClass] = useState('Toutes')
  const [filterSubject, setFilterSubject] = useState('Toutes')
  const [filterTeacher, setFilterTeacher] = useState('Tous')
  const [exportInfo, setExportInfo] = useState<{ ok: boolean; message: string; url: string; filename: string } | null>(null)

  const scopeSessions = ALL_SESSIONS.filter(s => isAdmin || s.teacherId === viewer.id)
  const classOptions = [...new Set(scopeSessions.map(s => s.classe))]
  const subjectOptions = [...new Set(scopeSessions.map(s => s.matiere))]
  const teacherOptions = TEACHERS.filter(t => t.role === 'teacher')

  const inPeriod = (frDate: string) => {
    const iso = toIsoDate(frDate)
    return (!dateFrom || iso >= dateFrom) && (!dateTo || iso <= dateTo)
  }

  const sessions = scopeSessions.filter(s =>
    inPeriod(s.date) &&
    (filterClass === 'Toutes' || s.classe === filterClass) &&
    (filterSubject === 'Toutes' || s.matiere === filterSubject) &&
    (!isAdmin || filterTeacher === 'Tous' || s.teacherId === Number(filterTeacher))
  )

  const visibleClasses = isAdmin ? [...new Set(students.map(s => s.classe))] : viewer.classes
  const filteredRecords = records.filter(r => {
    const student = students.find(s => s.id === r.studentId)
    if (!student || !visibleClasses.includes(student.classe)) return false
    if (!isAdmin && r.teacherId !== viewer.id) return false
    return inPeriod(r.date) &&
      (filterClass === 'Toutes' || student.classe === filterClass) &&
      (filterSubject === 'Toutes' || r.matiere === filterSubject) &&
      (!isAdmin || filterTeacher === 'Tous' || r.teacherId === Number(filterTeacher))
  })

  // RG-04 : taux = (présents + retards + justifiés selon paramètres) / total
  const rate = (presents: number, absents: number, retards: number) => {
    const total = presents + absents + retards
    if (total === 0) return 0
    const counted = presents + (settings.retardCommePresent ? retards : 0)
    return Math.round(counted / total * 100)
  }

  const totalPresents = sessions.reduce((a, s) => a + s.presents, 0)
  const totalAbsents = sessions.reduce((a, s) => a + s.absents, 0)
  const totalRetards = sessions.reduce((a, s) => a + s.retards, 0)
  const totalJustifies = filteredRecords.filter(r => r.status === 'justified').length
  const globalRate = rate(totalPresents, totalAbsents, totalRetards)

  const byClass = [...new Set(sessions.map(s => s.classe))].map(classe => {
    const cs = sessions.filter(s => s.classe === classe)
    return {
      name: classe,
      taux: rate(cs.reduce((a, s) => a + s.presents, 0), cs.reduce((a, s) => a + s.absents, 0), cs.reduce((a, s) => a + s.retards, 0)),
    }
  })

  const bySubject = [...new Set(sessions.map(s => s.matiere))].map(matiere => ({
    name: matiere,
    absences: sessions.filter(s => s.matiere === matiere).reduce((a, s) => a + s.absents, 0),
  }))

  const overTime = [...new Set(sessions.map(s => s.date))]
    .sort((a, b) => toIsoDate(a).localeCompare(toIsoDate(b)))
    .map(date => {
      const ds = sessions.filter(s => s.date === date)
      return {
        date: date.slice(0, 5),
        taux: rate(ds.reduce((a, s) => a + s.presents, 0), ds.reduce((a, s) => a + s.absents, 0), ds.reduce((a, s) => a + s.retards, 0)),
      }
    })

  const statusSplit = [
    { name: 'Présent', value: totalPresents, color: '#16a34a' },
    { name: 'Absent', value: totalAbsents, color: '#dc2626' },
    { name: 'Retard', value: totalRetards, color: '#ea580c' },
    { name: 'Justifié', value: totalJustifies, color: '#6b7280' },
  ]

  // RG-05 : seuil d'alerte paramétrable par l'administrateur
  const atRisk = students
    .filter(s => visibleClasses.includes(s.classe) && (filterClass === 'Toutes' || s.classe === filterClass))
    .filter(s => (100 - s.taux) >= settings.seuilAbsence || s.absences > settings.maxAbsencesNonJustifiees)
    .sort((a, b) => a.taux - b.taux)

  const resetFilters = () => {
    setDateFrom(''); setDateTo(''); setFilterClass('Toutes'); setFilterSubject('Toutes'); setFilterTeacher('Tous')
  }

  const teacherName = (id: number) => {
    const t = TEACHERS.find(x => x.id === id)
    return t ? `${t.prenom} ${t.nom}` : '-'
  }

  const filterSummary = [
    `Période : ${dateFrom ? dateFrom.split('-').reverse().join('/') : 'début'} au ${dateTo ? dateTo.split('-').reverse().join('/') : 'aujourd’hui'}`,
    `Classe : ${filterClass === 'Toutes' ? 'toutes' : filterClass}`,
    `Matière : ${filterSubject === 'Toutes' ? 'toutes' : filterSubject}`,
    isAdmin
      ? `Enseignant : ${filterTeacher === 'Tous' ? 'tous' : teacherName(Number(filterTeacher))}`
      : `Enseignant : ${viewer.prenom} ${viewer.nom}`,
  ]

  const exportReport = (format: 'PDF' | 'Excel') => {
    const stamp = new Date().toISOString().slice(0, 10)
    const generated = new Date().toLocaleString('fr-FR')
    const sortedSessions = [...sessions].sort((a, b) => toIsoDate(b.date).localeCompare(toIsoDate(a.date)))
    let filename = ''
    let url = ''

    try {
      if (format === 'PDF') {
        const cols = [0, 70, 190, 290, 375, 430, 480]
        const items: PdfItem[] = [
          { kind: 'text', text: 'AttendFlow - Rapport des présences', size: 18, bold: true },
          { kind: 'text', text: `Généré le ${generated} par ${viewer.prenom} ${viewer.nom}`, size: 9 },
          { kind: 'text', text: filterSummary.join('   |   '), size: 9, gap: 2 },
          { kind: 'rule' },
          { kind: 'text', text: 'Synthèse', size: 13, bold: true, gap: 4 },
          { kind: 'text', text: `Séances : ${sessions.length}    Taux de présence : ${globalRate} %    Absences : ${totalAbsents}    Retards : ${totalRetards}    Justifiés : ${totalJustifies}` },
          { kind: 'text', text: `Règle de calcul : présents${settings.retardCommePresent ? ' + retards' : ''}${settings.justifieCommePresent ? ' + justifiés' : ''} / total`, size: 8 },
          { kind: 'text', text: 'Taux de présence par classe', size: 13, bold: true, gap: 10 },
          { kind: 'row', cells: ['Classe', 'Taux'], columns: [0, 190], bold: true },
          ...byClass.map(c => ({ kind: 'row' as const, cells: [c.name, `${c.taux} %`], columns: [0, 190] })),
          { kind: 'text', text: 'Absences par matière', size: 13, bold: true, gap: 10 },
          { kind: 'row', cells: ['Matière', 'Absences'], columns: [0, 190], bold: true },
          ...bySubject.map(s => ({ kind: 'row' as const, cells: [s.name, String(s.absences)], columns: [0, 190] })),
          { kind: 'text', text: 'Détail des séances', size: 13, bold: true, gap: 10 },
          { kind: 'row', cells: ['Date', 'Matière', 'Classe', 'Enseignant', 'Présents', 'Absents', 'Retards'], columns: cols, bold: true },
          ...sortedSessions.map(s => ({
            kind: 'row' as const,
            cells: [s.date, s.matiere, s.classe, teacherName(s.teacherId).split(' ').slice(-2).join(' '), String(s.presents), String(s.absents), String(s.retards)],
            columns: cols,
          })),
          { kind: 'text', text: `Étudiants à absences fréquentes (seuil ${settings.seuilAbsence} % ou plus de ${settings.maxAbsencesNonJustifiees} absences)`, size: 13, bold: true, gap: 10 },
          ...(atRisk.length === 0
            ? [{ kind: 'text' as const, text: 'Aucun étudiant ne dépasse le seuil.' }]
            : [
              { kind: 'row' as const, cells: ['Étudiant', 'Matricule', 'Classe', 'Absences', 'Taux'], columns: [0, 150, 240, 340, 410], bold: true },
              ...atRisk.map(s => ({ kind: 'row' as const, cells: [`${s.prenom} ${s.nom}`, s.matricule, s.classe, String(s.absences), `${s.taux} %`], columns: [0, 150, 240, 340, 410] })),
            ]),
        ]
        filename = `rapport-presences-${stamp}.pdf`
        url = downloadFile(buildPdf(items), filename, 'application/pdf')
      } else {
        const rows: (string | number)[][] = [
          ['AttendFlow - Rapport des présences'],
          [`Généré le ${generated}`],
          ...filterSummary.map(f => [f]),
          [],
          ['Synthèse'],
          ['Séances', 'Taux de présence (%)', 'Absences', 'Retards', 'Justifiés'],
          [sessions.length, globalRate, totalAbsents, totalRetards, totalJustifies],
          [],
          ['Détail des séances'],
          ['Date', 'Matière', 'Classe', 'Enseignant', 'Horaire', 'Salle', 'Présents', 'Absents', 'Retards', 'Taux (%)'],
          ...sortedSessions.map(s => [s.date, s.matiere, s.classe, teacherName(s.teacherId), s.horaire, s.salle, s.presents, s.absents, s.retards, rate(s.presents, s.absents, s.retards)]),
          [],
          ['Taux de présence par classe'],
          ['Classe', 'Taux (%)'],
          ...byClass.map(c => [c.name, c.taux]),
          [],
          ['Absences par matière'],
          ['Matière', 'Absences'],
          ...bySubject.map(s => [s.name, s.absences]),
          [],
          [`Étudiants à absences fréquentes (seuil ${settings.seuilAbsence} %)`],
          ['Nom', 'Prénom', 'Matricule', 'Classe', 'Absences', 'Taux (%)'],
          ...atRisk.map(s => [s.nom, s.prenom, s.matricule, s.classe, s.absences, s.taux]),
        ]
        filename = `rapport-presences-${stamp}.csv`
        url = downloadFile(buildCsv(rows), filename, 'text/csv;charset=utf-8')
      }
    } catch {
      setExportInfo({ ok: false, message: `L’export ${format} a échoué. Réessayez.`, url: '', filename: '' })
      return
    }

    if (exportInfo?.url) URL.revokeObjectURL(exportInfo.url)
    setExportInfo({ ok: true, message: `Rapport ${format} téléchargé : ${filename}`, url, filename })
  }

  const chartCard = 'bg-white rounded-2xl border border-slate-100 shadow-sm p-5'
  const selectCls = 'text-sm border border-slate-200 rounded-xl px-3 py-2.5 bg-white focus:outline-none'

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            {isAdmin ? 'Rapports et statistiques' : 'Mes statistiques'}
          </h2>
          <p className="text-slate-500 text-sm mt-0.5">
            {isAdmin ? 'Tous les enseignants · Toutes les classes' : 'Vos séances et vos classes uniquement'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => exportReport('PDF')} className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm rounded-xl transition-colors"><Download size={14} />Exporter PDF</button>
          <button onClick={() => exportReport('Excel')} className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm rounded-xl transition-colors"><FileText size={14} />Exporter Excel</button>
        </div>
      </div>

      {exportInfo && (
        <div className={`rounded-2xl p-4 flex items-center gap-3 border ${exportInfo.ok ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          {exportInfo.ok
            ? <CheckCircle size={20} className="text-green-600 flex-shrink-0" />
            : <AlertCircle size={20} className="text-red-600 flex-shrink-0" />}
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-semibold ${exportInfo.ok ? 'text-green-700' : 'text-red-700'}`}>{exportInfo.message}</p>
            {exportInfo.ok && (
              <p className="text-xs text-green-600 mt-0.5">
                Le téléchargement ne démarre pas ?{' '}
                <a href={exportInfo.url} download={exportInfo.filename} target="_blank" rel="noopener" className="font-semibold underline">Ouvrir le fichier</a>
              </p>
            )}
          </div>
          <button onClick={() => setExportInfo(null)} aria-label="Fermer" className="text-green-400 hover:text-green-600"><X size={16} /></button>
        </div>
      )}

      {/* Filtres */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter size={14} className="text-slate-400" />
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Filtres</p>
          <button onClick={resetFilters} className="ml-auto text-xs font-semibold text-blue-600 hover:text-blue-700">Réinitialiser</button>
        </div>
        <div className={`grid grid-cols-1 md:grid-cols-2 ${isAdmin ? 'xl:grid-cols-5' : 'xl:grid-cols-4'} gap-3`}>
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">Du</label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className={`w-full ${selectCls}`} />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">Au</label>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className={`w-full ${selectCls}`} />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">Classe</label>
            <select value={filterClass} onChange={e => setFilterClass(e.target.value)} className={`w-full ${selectCls}`}>
              <option value="Toutes">Toutes les classes</option>
              {classOptions.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">Matière</label>
            <select value={filterSubject} onChange={e => setFilterSubject(e.target.value)} className={`w-full ${selectCls}`}>
              <option value="Toutes">Toutes les matières</option>
              {subjectOptions.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          {isAdmin && (
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">Enseignant</label>
              <select value={filterTeacher} onChange={e => setFilterTeacher(e.target.value)} className={`w-full ${selectCls}`}>
                <option value="Tous">Tous les enseignants</option>
                {teacherOptions.map(t => <option key={t.id} value={t.id}>{t.prenom} {t.nom}</option>)}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Cartes */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Séances" value={sessions.length} icon={Calendar} color="indigo" sub="Sur la période filtrée" />
        <StatCard label="Taux de présence" value={`${globalRate}%`} icon={TrendingUp} color="green" sub={settings.retardCommePresent ? 'Retards comptés présents' : 'Retards non comptés'} />
        <StatCard label="Absences" value={totalAbsents} icon={XCircle} color="red" />
        <StatCard label="Retards" value={totalRetards} icon={Clock} color="orange" />
      </div>

      {sessions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-10 text-center">
          <BarChart3 size={28} className="text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-600">Aucune séance ne correspond à ces filtres</p>
          <button onClick={resetFilters} className="mt-3 text-sm font-semibold text-blue-600">Réinitialiser les filtres</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          <div className={chartCard}>
            <h3 className="font-bold text-slate-700 mb-5 text-sm">Taux de présence par classe</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={byClass}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} domain={[0, 100]} />
                <Tooltip contentStyle={{ borderRadius: 12, border: 'none', fontSize: 12 }} formatter={(v) => [`${v}%`, 'Taux']} />
                <Bar dataKey="taux" fill="#2563eb" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className={chartCard}>
            <h3 className="font-bold text-slate-700 mb-5 text-sm">Absences par matière</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={bySubject}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: 'none', fontSize: 12 }} formatter={(v) => [v, 'Absences']} />
                <Bar dataKey="absences" fill="#dc2626" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className={chartCard}>
            <h3 className="font-bold text-slate-700 mb-5 text-sm">Évolution du taux de présence</h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={overTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} domain={[0, 100]} />
                <Tooltip contentStyle={{ borderRadius: 12, border: 'none', fontSize: 12 }} formatter={(v) => [`${v}%`, 'Taux']} />
                <Line type="monotone" dataKey="taux" stroke="#4f46e5" strokeWidth={2.5} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className={chartCard}>
            <h3 className="font-bold text-slate-700 mb-5 text-sm">Répartition des statuts</h3>
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="55%" height={220}>
                <PieChart>
                  <Pie data={statusSplit} dataKey="value" nameKey="name" innerRadius={50} outerRadius={85} paddingAngle={2}>
                    {statusSplit.map(item => <Cell key={item.name} fill={item.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 12, border: 'none', fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2.5">
                {statusSplit.map(item => (
                  <div key={item.name} className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: item.color }} />
                    <span className="text-sm text-slate-600 w-16">{item.name}</span>
                    <span className="text-sm font-bold text-slate-800">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Étudiants à absences fréquentes */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="text-orange-500" />
            <h3 className="font-bold text-slate-700 text-sm">Étudiants à absences fréquentes</h3>
          </div>
          <p className="text-xs text-slate-400">
            Seuil : {settings.seuilAbsence} % d’absence ou plus de {settings.maxAbsencesNonJustifiees} absences
          </p>
        </div>
        {atRisk.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-6">Aucun étudiant ne dépasse le seuil d’alerte.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5">
            {atRisk.map(s => (
              <div key={s.id} className="flex items-center gap-3 p-3 bg-orange-50 border border-orange-100 rounded-xl">
                <Avatar name={`${s.prenom} ${s.nom}`} size="sm" color="orange" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{s.prenom} {s.nom}</p>
                  <p className="text-xs text-slate-400">{s.classe} · {s.absences} absences</p>
                </div>
                <span className={`text-base font-bold ${s.taux < 75 ? 'text-red-600' : 'text-orange-600'}`}>{s.taux}%</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Matières ─────────────────────────────────────────────────────────────────

interface Subject {
  id: number
  intitule: string
  code: string
  coefficient: number
  teacherIds: number[]
}

const INITIAL_SUBJECTS: Subject[] = [
  { id: 1, intitule: 'Développement Web', code: 'DEV-WEB', coefficient: 3, teacherIds: [1] },
  { id: 2, intitule: 'Java', code: 'JAVA', coefficient: 3, teacherIds: [1] },
  { id: 3, intitule: 'Base de données', code: 'BDD', coefficient: 2.5, teacherIds: [2] },
  { id: 4, intitule: 'Algorithmique', code: 'ALGO', coefficient: 2, teacherIds: [2] },
  { id: 5, intitule: 'Réseaux', code: 'RES', coefficient: 2.5, teacherIds: [3] },
  { id: 6, intitule: 'Systèmes', code: 'SYS', coefficient: 2, teacherIds: [3] },
]

function Subjects({ teacher, subjects, setSubjects }: { teacher: Teacher; subjects: Subject[]; setSubjects: (s: Subject[]) => void }) {
  const isAdmin = teacher.role === 'admin'
  const visible = isAdmin ? subjects : subjects.filter(s => s.teacherIds.includes(teacher.id))
  const teachers = TEACHERS.filter(t => t.role === 'teacher')

  const emptyForm = { intitule: '', code: '', coefficient: '1', teacherIds: [] as number[] }
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Subject | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [formError, setFormError] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<Subject | null>(null)

  const openForm = (subject?: Subject) => {
    setEditing(subject || null)
    setForm(subject
      ? { intitule: subject.intitule, code: subject.code, coefficient: String(subject.coefficient), teacherIds: subject.teacherIds }
      : emptyForm)
    setFormError('')
    setFormOpen(true)
  }

  const toggleTeacher = (id: number) => setForm(prev => ({
    ...prev,
    teacherIds: prev.teacherIds.includes(id) ? prev.teacherIds.filter(t => t !== id) : [...prev.teacherIds, id],
  }))

  const save = () => {
    const coefficient = Number(form.coefficient)
    if (!form.intitule.trim() || !form.code.trim()) { setFormError('L’intitulé et le code sont obligatoires.'); return }
    if (!coefficient || coefficient <= 0) { setFormError('Le coefficient doit être un nombre positif.'); return }
    const code = form.code.trim().toUpperCase()
    if (subjects.some(s => s.code === code && s.id !== editing?.id)) { setFormError('Ce code existe déjà.'); return }
    const data = { intitule: form.intitule.trim(), code, coefficient, teacherIds: form.teacherIds }
    if (editing) setSubjects(subjects.map(s => s.id === editing.id ? { ...s, ...data } : s))
    else setSubjects([...subjects, { id: Math.max(0, ...subjects.map(s => s.id)) + 1, ...data }])
    setFormOpen(false)
  }

  const confirmDelete = () => {
    if (deleteTarget) setSubjects(subjects.filter(s => s.id !== deleteTarget.id))
    setDeleteTarget(null)
  }

  const inputCls = 'w-full px-4 py-3 text-sm border border-slate-200 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400'

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{isAdmin ? 'Matières' : 'Mes matières'}</h2>
          <p className="text-slate-500 text-sm mt-0.5">
            {isAdmin ? `${subjects.length} matière(s) enregistrée(s)` : 'Liste en lecture seule de vos matières assignées'}
          </p>
        </div>
        {isAdmin && (
          <button onClick={() => openForm()} className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl transition-colors shadow-lg shadow-blue-200">
            <Plus size={16} />
            Ajouter une matière
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              {['Intitulé', 'Code', 'Coefficient', 'Enseignants', ...(isAdmin ? ['Actions'] : [])].map(h => (
                <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map(subject => {
              const assigned = teachers.filter(t => subject.teacherIds.includes(t.id))
              return (
                <tr key={subject.id} className="border-b border-slate-50 last:border-0">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center"><BookMarked size={16} /></div>
                      <span className="text-sm font-semibold text-slate-800">{subject.intitule}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-sm font-mono text-slate-600">{subject.code}</td>
                  <td className="px-5 py-3.5 text-sm text-slate-700">{subject.coefficient}</td>
                  <td className="px-5 py-3.5">
                    {assigned.length === 0
                      ? <span className="text-xs text-slate-400 italic">Aucun enseignant</span>
                      : <div className="flex flex-wrap gap-1.5">{assigned.map(t => (
                        <span key={t.id} className="px-2 py-0.5 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold rounded-full">{t.prenom} {t.nom}</span>
                      ))}</div>}
                  </td>
                  {isAdmin && (
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => openForm(subject)} title="Modifier" className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 text-slate-500 hover:text-blue-600 flex items-center justify-center"><Pencil size={14} /></button>
                        <button onClick={() => setDeleteTarget(subject)} title="Supprimer" className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 text-slate-500 hover:text-red-600 flex items-center justify-center"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  )}
                </tr>
              )
            })}
            {visible.length === 0 && (
              <tr><td colSpan={isAdmin ? 5 : 4} className="px-5 py-10 text-center text-sm text-slate-500">Aucune matière</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {!isAdmin && (
        <div className="flex items-center gap-2.5 px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl">
          <Lock size={14} className="text-blue-600" />
          <p className="text-blue-700 text-sm">Vos matières sont assignées par l’administration et ne peuvent pas être modifiées ici.</p>
        </div>
      )}

      {formOpen && (
        <div className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-slate-800">{editing ? 'Modifier la matière' : 'Ajouter une matière'}</h3>
              <button onClick={() => setFormOpen(false)} aria-label="Fermer" className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-600 mb-1.5 block">Intitulé</label>
                <input value={form.intitule} onChange={e => setForm({ ...form, intitule: e.target.value })} className={inputCls} placeholder="Ex. Génie logiciel" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-600 mb-1.5 block">Code</label>
                  <input value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} className={inputCls} placeholder="Ex. GL" />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600 mb-1.5 block">Coefficient</label>
                  <input type="number" min="0.5" step="0.5" value={form.coefficient} onChange={e => setForm({ ...form, coefficient: e.target.value })} className={inputCls} />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600 mb-1.5 block">Enseignants affectés</label>
                <div className="flex flex-wrap gap-2">
                  {teachers.map(t => {
                    const on = form.teacherIds.includes(t.id)
                    return (
                      <button key={t.id} type="button" onClick={() => toggleTeacher(t.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-colors ${on ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-white border-slate-200 text-slate-500'}`}>
                        {on && <Check size={12} />}
                        {t.prenom} {t.nom}
                      </button>
                    )
                  })}
                </div>
              </div>
              {formError && <p className="text-sm text-red-600">{formError}</p>}
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setFormOpen(false)} className="px-4 py-2.5 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl">Annuler</button>
              <button onClick={save} className="px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl">{editing ? 'Enregistrer' : 'Ajouter'}</button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-slate-800">Supprimer cette matière ?</h3>
            <p className="text-sm text-slate-500 mt-2">« {deleteTarget.intitule} » sera supprimée. Les présences déjà enregistrées sont conservées.</p>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setDeleteTarget(null)} className="px-4 py-2.5 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl">Annuler</button>
              <button onClick={confirmDelete} className="px-4 py-2.5 bg-red-600 text-white text-sm font-semibold rounded-xl">Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Paramètres ───────────────────────────────────────────────────────────────

interface SyncLog {
  id: number
  date: string
  ajoutees: number
  modifiees: number
  annulees: number
  statut: 'Succès' | 'Partiel' | 'Échec'
}

const INITIAL_SYNC_LOGS: SyncLog[] = [
  { id: 3, date: '25/09/2026 07:00', ajoutees: 0, modifiees: 1, annulees: 2, statut: 'Succès' },
  { id: 2, date: '24/09/2026 07:00', ajoutees: 3, modifiees: 0, annulees: 0, statut: 'Succès' },
  { id: 1, date: '23/09/2026 07:00', ajoutees: 42, modifiees: 0, annulees: 0, statut: 'Partiel' },
]

function Switch({ checked, onChange, label, help }: { checked: boolean; onChange: (v: boolean) => void; label: string; help: string }) {
  return (
    <label className="flex items-start justify-between gap-4 cursor-pointer">
      <div>
        <p className="text-sm font-medium text-slate-700">{label}</p>
        <p className="text-xs text-slate-400 mt-0.5">{help}</p>
      </div>
      <button
        type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full flex-shrink-0 transition-colors ${checked ? 'bg-indigo-600' : 'bg-slate-300'}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full shadow transition-transform ${checked ? 'translate-x-5' : ''}`} style={{ background: '#fff' }} />
      </button>
    </label>
  )
}

function AdminSettings({ settings, onSave, syncLogs, setSyncLogs }: {
  settings: AppSettings
  onSave: (s: AppSettings) => void
  syncLogs: SyncLog[]
  setSyncLogs: (l: SyncLog[]) => void
}) {
  const [form, setForm] = useState<AppSettings>(settings)
  const [saved, setSaved] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [toast, setToast] = useState('')

  const save = () => {
    onSave(form)
    setSaved(true)
    window.setTimeout(() => setSaved(false), 2500)
  }

  const synchronize = () => {
    setSyncing(true)
    window.setTimeout(() => {
      const now = new Date()
      const pad = (n: number) => String(n).padStart(2, '0')
      const date = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}`
      setSyncLogs([{ id: Math.max(0, ...syncLogs.map(l => l.id)) + 1, date, ajoutees: 0, modifiees: 0, annulees: 0, statut: 'Succès' }, ...syncLogs])
      setSyncing(false)
      setToast('Emploi du temps synchronisé avec le projet partenaire')
      window.setTimeout(() => setToast(''), 3000)
    }, 1200)
  }

  const numberField = (key: 'seuilAbsence' | 'maxAbsencesNonJustifiees' | 'delaiModificationHeures', label: string, suffix: string, help: string) => (
    <div>
      <label className="text-sm font-medium text-slate-600 mb-1.5 block">{label}</label>
      <div className="relative">
        <input
          type="number" min="0" value={form[key]}
          onChange={e => setForm({ ...form, [key]: Math.max(0, Number(e.target.value)) })}
          className="w-full pl-4 pr-14 py-3 text-sm border border-slate-200 bg-white rounded-xl focus:outline-none"
        />
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">{suffix}</span>
      </div>
      <p className="text-xs text-slate-400 mt-1">{help}</p>
    </div>
  )

  const statusCls: Record<SyncLog['statut'], string> = {
    'Succès': 'bg-green-50 border-green-200 text-green-700',
    'Partiel': 'bg-orange-50 border-orange-200 text-orange-700',
    'Échec': 'bg-red-50 border-red-200 text-red-700',
  }

  return (
    <div className="p-6 space-y-5">
      <div>
        <h2 className="text-xl font-bold text-slate-800" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Paramètres</h2>
        <p className="text-slate-500 text-sm mt-0.5">Configuration générale d’AttendFlow — administrateur uniquement</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h3 className="font-bold text-slate-700 mb-5">Règles de présence</h3>
          <div className="space-y-5">
            {numberField('seuilAbsence', 'Seuil d’alerte d’absence', '%', 'Alerte quand le taux d’absence d’un étudiant atteint ce seuil (RG-05).')}
            {numberField('maxAbsencesNonJustifiees', 'Nombre maximal d’absences non justifiées', 'abs.', 'Alerte au-delà de ce nombre d’absences.')}
            {numberField('delaiModificationHeures', 'Délai de modification d’une prise de présence', 'h', 'Après ce délai, l’enseignant ne peut plus modifier (F-22).')}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h3 className="font-bold text-slate-700 mb-5">Calcul du taux de présence</h3>
          <div className="space-y-5">
            <Switch
              checked={form.retardCommePresent}
              onChange={v => setForm({ ...form, retardCommePresent: v })}
              label="Compter les retards comme présents"
              help="Un retard augmente le taux de présence (RG-04)."
            />
            <Switch
              checked={form.justifieCommePresent}
              onChange={v => setForm({ ...form, justifieCommePresent: v })}
              label="Compter les justifiés comme présents"
              help="Une absence justifiée n’est pas pénalisante (RG-04)."
            />
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <p className="text-xs text-slate-500">
                Taux = (présents{form.retardCommePresent ? ' + retards' : ''}{form.justifieCommePresent ? ' + justifiés' : ''}) / total des séances × 100
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3">
        {saved && <span className="text-sm text-green-600 font-medium flex items-center gap-1.5"><CheckCircle size={15} />Paramètres enregistrés</span>}
        <button onClick={() => setForm(settings)} className="px-4 py-2.5 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl">Annuler</button>
        <button onClick={save} className="px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl">Enregistrer</button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-5 flex items-center justify-between gap-4 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-700">Synchronisation de l’emploi du temps</h3>
            <p className="text-xs text-slate-400 mt-0.5">Séances fournies par le projet partenaire — synchronisation automatique chaque jour à 07:00</p>
          </div>
          <button
            onClick={synchronize} disabled={syncing}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl disabled:opacity-60 flex-shrink-0"
          >
            <RefreshCw size={15} className={syncing ? 'animate-spin' : ''} />
            {syncing ? 'Synchronisation…' : 'Synchroniser maintenant'}
          </button>
        </div>
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              {['Date', 'Séances ajoutées', 'Modifiées', 'Annulées', 'Statut'].map(h => (
                <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {syncLogs.map(log => (
              <tr key={log.id} className="border-b border-slate-50 last:border-0">
                <td className="px-5 py-3 text-sm font-mono text-slate-600">{log.date}</td>
                <td className="px-5 py-3 text-sm text-slate-700">{log.ajoutees}</td>
                <td className="px-5 py-3 text-sm text-orange-600 font-semibold">{log.modifiees}</td>
                <td className="px-5 py-3 text-sm text-red-600 font-semibold">{log.annulees}</td>
                <td className="px-5 py-3">
                  <span className={`px-2.5 py-1 rounded-full border text-xs font-semibold ${statusCls[log.statut]}`}>{log.statut}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </div>
  )
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function App() {
  const [teacher, setTeacher] = useState<Teacher | null>(null)
  const [screen, setScreen] = useState<Screen>('login')
  const [selectedSession, setSelectedSession] = useState<SelectedSession | null>(null)
  const [students, setStudents] = useState<Student[]>(ALL_STUDENTS)
  const [studentAttendances, setStudentAttendances] = useState<StudentAttendance[]>(INITIAL_STUDENT_ATTENDANCES)
  const [justifications, setJustifications] = useState<Justification[]>([])
  const [historyStudent, setHistoryStudent] = useState<Student | null>(null)
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS)
  const [subjects, setSubjects] = useState<Subject[]>(INITIAL_SUBJECTS)
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>(INITIAL_SYNC_LOGS)
  const [notifications, setNotifications] = useState<AppNotification[]>([])

  const handleLogin = (t: Teacher) => {
    setTeacher(t)
    setNotifications(initialNotifications(t))
    setSelectedSession(null)
    setHistoryStudent(null)
    setScreen('dashboard')
  }

  const handleSetScreen = (s: Screen) => {
    if (s === 'login') { setTeacher(null); setSelectedSession(null) }
    setScreen(s)
  }

  const handleStartAttendance = (session: SelectedSession) => {
    if (session.etat === 'Annulée') return
    setSelectedSession(session)
    setScreen('attendance-session')
  }

  const openStudentHistory = (student: Student) => {
    setHistoryStudent(student)
    setScreen('student-history')
  }

  const submitJustification = (studentId: number, attendanceId: number, motif: string, fichier: string) => {
    setJustifications(prev => [...prev, {
      id: Math.max(0, ...prev.map(item => item.id)) + 1,
      attendanceId,
      studentId,
      motif,
      fichier,
      status: 'pending',
      date: '25/09/2026',
    }])
  }

  const decideJustification = (id: number, decision: 'accepted' | 'refused') => {
    const justification = justifications.find(item => item.id === id)
    setJustifications(prev => prev.map(item => item.id === id ? { ...item, status: decision } : item))
    if (decision === 'accepted' && justification) {
      setStudentAttendances(prev => prev.map(record =>
        record.id === justification.attendanceId ? { ...record, status: 'justified' } : record
      ))
    }
  }

  if (!teacher || screen === 'login') {
    return <LoginScreen onLogin={handleLogin} />
  }

  const titles: Record<Screen, string> = {
    login: '',
    dashboard: teacher.role === 'student' ? 'Tableau de bord étudiant' : teacher.role === 'admin' ? 'Tableau de bord' : 'Mon tableau de bord',
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
    'admin-reports': 'Rapports et statistiques',
    subjects: teacher.role === 'admin' ? 'Matières' : 'Mes matières',
    settings: 'Paramètres',
    'student-history': teacher.role === 'student' ? 'Mon historique' : 'Historique des présences',
    justifications: 'Mes justificatifs',
    'admin-justifications': 'Justificatifs',
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar screen={screen} setScreen={handleSetScreen} teacher={teacher} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header title={titles[screen]} teacher={teacher} setScreen={handleSetScreen} />
        <main className="flex-1 overflow-y-auto">
          {screen === 'dashboard' && teacher.role === 'student' && (
            <StudentDashboard
              account={teacher}
              records={studentAttendances.filter(record => record.studentId === teacher.studentId)}
              setScreen={handleSetScreen}
            />
          )}
          {screen === 'dashboard' && teacher.role !== 'student' && <Dashboard teacher={teacher} setScreen={handleSetScreen} onStartAttendance={handleStartAttendance} />}
          {screen === 'timetable' && <MyTimetable teacher={teacher} onStartAttendance={handleStartAttendance} />}
          {screen === 'my-presences' && <MyPresences teacher={teacher} setScreen={handleSetScreen} onStartAttendance={handleStartAttendance} />}
          {screen === 'attendance-session' && <AttendanceSession teacher={teacher} session={selectedSession} />}
          {screen === 'my-students' && <MyStudents teacher={teacher} />}
          {screen === 'my-stats' && <Reports viewer={teacher} students={students} records={studentAttendances} settings={settings} />}
          {screen === 'profile' && <Profile teacher={teacher} />}
          {screen === 'notifications' && <Notifications notifications={notifications} setNotifications={setNotifications} />}
          {screen === 'admin-teachers' && <AdminTeachers setScreen={handleSetScreen} />}
          {screen === 'admin-students' && <AdminAllStudents students={students} setStudents={setStudents} onOpenHistory={openStudentHistory} />}
          {screen === 'admin-classes' && <AdminClasses />}
          {screen === 'admin-reports' && <Reports viewer={teacher} students={students} records={studentAttendances} settings={settings} />}
          {screen === 'subjects' && <Subjects teacher={teacher} subjects={subjects} setSubjects={setSubjects} />}
          {screen === 'settings' && teacher.role === 'admin' && <AdminSettings settings={settings} onSave={setSettings} syncLogs={syncLogs} setSyncLogs={setSyncLogs} />}
          {screen === 'student-history' && (() => {
            const student = teacher.role === 'student'
              ? students.find(item => item.id === teacher.studentId)
              : historyStudent
            if (!student) return null
            return (
              <StudentHistory
                student={student}
                records={studentAttendances.filter(record => record.studentId === student.id)}
                justifications={justifications.filter(item => item.studentId === student.id)}
                canJustify={teacher.role === 'student'}
                onSubmitJustification={(attendanceId, motif, fichier) => submitJustification(student.id, attendanceId, motif, fichier)}
              />
            )
          })()}
          {screen === 'justifications' && teacher.role === 'student' && (
            <StudentJustifications
              studentId={teacher.studentId || 0}
              justifications={justifications}
              records={studentAttendances}
            />
          )}
          {screen === 'admin-justifications' && teacher.role === 'admin' && (
            <AdminJustifications
              justifications={justifications}
              records={studentAttendances}
              students={students}
              onDecision={decideJustification}
            />
          )}
        </main>
      </div>
    </div>
  )
}
