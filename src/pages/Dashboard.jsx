import { useState, useEffect } from 'react'
import { getProjects, getTasks } from '../api/projects'
import { getTopContacts } from '../api/contacts'
import client from '../api/client'
import { getGoals } from '../api/goals'
import { Calendar, dayjsLocalizer } from 'react-big-calendar'
import dayjs from 'dayjs'
import localizedFormat from 'dayjs/plugin/localizedFormat'
import localeData from 'dayjs/plugin/localeData'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import MoneyTracker from '../components/MoneyTracker'

dayjs.extend(localizedFormat)
dayjs.extend(localeData)
dayjs.extend(utc)
dayjs.extend(timezone)

const localizer = dayjsLocalizer(dayjs)

export default function Dashboard() {
  const [projects, setProjects]       = useState([])
  const [tasks, setTasks]             = useState([])
  const [topContacts, setTopContacts] = useState([])
  const [contactCount, setContactCount] = useState(0)
  const [goals, setGoals]             = useState([])
  const [activeTab, setActiveTab]     = useState('overview')

  useEffect(() => {
    getProjects().then(res => setProjects(res.data ?? []))
    getTasks().then(res => setTasks(res.data ?? []))
    getTopContacts(5).then(res => {
      setTopContacts(res.data.results ?? res.data ?? [])
      setContactCount(res.data.count ?? res.data.length ?? 0)
    })
    getGoals().then(res => setGoals(res.data ?? []))
  }, [])

  const activeProjects = projects.filter(p => p.status === 'active')
  const totalTasks     = projects.reduce((acc, p) => acc + (p.task_count || 0), 0)
  const maxTasks       = Math.max(...projects.map(p => p.task_count || 0), 1)

  const calendarEvents = [
    ...tasks.filter(t => t.due_date).map(t => ({
      title: t.title,
      start: new Date(t.due_date),
      end:   new Date(t.due_date),
    })),
    ...goals.filter(g => g.target_date).map(g => ({
      title: `🎯 ${g.title}`,
      start: new Date(g.target_date),
      end:   new Date(g.target_date),
    })),
  ]

  const timelineItems = [
    ...projects.map(p => ({ type: 'project', label: p.name,   date: p.created_at,  status: p.status, color: '#6366f1' })),
    ...goals.map(g =>    ({ type: 'goal',    label: g.title,  date: g.created_at,  status: g.status, color: '#8b5cf6' })),
    ...tasks.filter(t => t.due_date).map(t => ({ type: 'task', label: t.title, date: t.due_date, status: t.status, color: '#f59e0b' })),
  ].sort((a, b) => new Date(a.date) - new Date(b.date))

  const statusCounts = {
    active:    projects.filter(p => p.status === 'active').length,
    on_hold:   projects.filter(p => p.status === 'on_hold').length,
    completed: projects.filter(p => p.status === 'completed').length,
    archived:  projects.filter(p => p.status === 'archived').length,
  }
  const totalProjects = projects.length || 1

  const handleQuickInteraction = async (contact) => {
    try {
      await client.post('/interactions/', {
        contact: contact.id,
        type: 'other',
        notes: 'Quick interaction',
        date: dayjs().format('YYYY-MM-DD'),
      })
      getTopContacts(5).then(res => {
        setTopContacts(res.data.results ?? res.data ?? [])
        setContactCount(res.data.count ?? res.data.length ?? 0)
      })
    } catch (err) { console.error(err) }
  }

  const tabs = ['overview', 'money', 'calendar', 'timeline']

  return (
    <div>
      <style>{`
        .rbc-btn-group button { background:#fff !important; color:#444 !important; border:1px solid #e0e0e0 !important; padding:6px 12px !important; cursor:pointer !important; font-size:13px !important; }
        .rbc-btn-group button.rbc-active { background:#6366f1 !important; color:#fff !important; border-color:#6366f1 !important; }
        .rbc-toolbar-label { font-weight:600 !important; font-size:15px !important; }
        .rbc-event { background:#6366f1 !important; border-radius:6px !important; border:none !important; font-size:12px !important; }
        .rbc-today { background:#eef2ff !important; }
        .dash-tab { padding:8px 20px; border-radius:8px; border:1px solid #e0e0e0; background:#fff; font-size:14px; cursor:pointer; color:#444; font-weight:500; transition:all 0.15s; }
        .dash-tab:hover:not(.dash-tab-active) { background:#f5f3ff; border-color:#c7d2fe; }
        .dash-tab-active { background:#6366f1 !important; color:#fff !important; border-color:#6366f1 !important; }
        .stat-card { background:#fff; border-radius:12px; padding:20px 24px; box-shadow:0 1px 4px rgba(0,0,0,0.06); transition:box-shadow 0.2s; }
        .stat-card:hover { box-shadow:0 4px 16px rgba(0,0,0,0.10); }
        .contact-row { display:flex; align-items:center; gap:12px; padding:10px 0; border-bottom:1px solid #f5f5f5; }
        .contact-row:last-child { border-bottom:none; }
      `}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
        <div>
          <h2 style={s.title}>Dashboard</h2>
          <p style={s.subtitle}>Welcome back — {dayjs().format('dddd, MMMM D')}</p>
        </div>
      </div>

      <div style={s.tabs}>
        {tabs.map(tab => (
          <button
            key={tab}
            className={`dash-tab ${activeTab === tab ? 'dash-tab-active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'money' ? '💰 Money' : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Stats — always visible */}
      <div style={s.statsGrid}>
        {[
          { value: activeProjects.length, label: 'Active projects', color: '#6366f1' },
          { value: totalTasks,            label: 'Total tasks',     color: '#f59e0b' },
          { value: contactCount,          label: 'Contacts',        color: '#10b981' },
          { value: goals.filter(g => g.status === 'active').length, label: 'Active goals', color: '#8b5cf6' },
        ].map((stat, i) => (
          <div key={i} className="stat-card" style={{ borderTop: `3px solid ${stat.color}` }}>
            <div style={s.statValue}>{stat.value}</div>
            <div style={s.statLabel}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <>
          <div style={s.twoCol}>
            <div style={s.section}>
              <h3 style={s.sectionTitle}>Tasks per project</h3>
              {projects.length === 0
                ? <p style={s.empty}>No projects yet</p>
                : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
                    {projects.map(p => (
                      <div key={p.id}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                          <span style={{ color: '#444', fontWeight: '500' }}>{p.name.length > 22 ? p.name.slice(0, 22) + '…' : p.name}</span>
                          <span style={{ color: '#6366f1', fontWeight: '600' }}>{p.task_count}</span>
                        </div>
                        <div style={{ height: '7px', background: '#f0f0f0', borderRadius: '999px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${((p.task_count || 0) / maxTasks) * 100}%`, background: '#6366f1', borderRadius: '999px', transition: 'width 0.4s' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )
              }
            </div>

            <div style={s.section}>
              <h3 style={s.sectionTitle}>Project status</h3>
              {projects.length === 0
                ? <p style={s.empty}>No projects yet</p>
                : (
                  <div>
                    {[
                      { label: 'Active',    key: 'active',    color: '#6366f1' },
                      { label: 'On hold',   key: 'on_hold',   color: '#f59e0b' },
                      { label: 'Completed', key: 'completed', color: '#10b981' },
                      { label: 'Archived',  key: 'archived',  color: '#94a3b8' },
                    ].map(st => (
                      <div key={st.key} style={{ marginBottom: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: st.color, display: 'inline-block' }} />
                            {st.label}
                          </span>
                          <span style={{ fontWeight: '600', color: st.color }}>{statusCounts[st.key]}</span>
                        </div>
                        <div style={{ height: '6px', background: '#f0f0f0', borderRadius: '999px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${(statusCounts[st.key] / totalProjects) * 100}%`, background: st.color, borderRadius: '999px' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )
              }
            </div>
          </div>

          <div style={s.twoCol}>
            <div style={s.section}>
              <h3 style={s.sectionTitle}>Goal progress</h3>
              {goals.length === 0
                ? <p style={s.empty}>No goals yet</p>
                : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
                    {goals.slice(0, 5).map(g => (
                      <div key={g.id}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                          <span style={{ color: '#444', fontWeight: '500' }}>{g.title.length > 22 ? g.title.slice(0, 22) + '…' : g.title}</span>
                          <span style={{ color: '#8b5cf6', fontWeight: '600' }}>{g.progress}%</span>
                        </div>
                        <div style={{ height: '7px', background: '#f0f0f0', borderRadius: '999px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${g.progress}%`, background: `hsl(${g.progress * 1.2}, 65%, 50%)`, borderRadius: '999px', transition: 'width 0.4s' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )
              }
            </div>

            <div style={s.section}>
              <h3 style={s.sectionTitle}>Top contacts</h3>
              {topContacts.length === 0 && <p style={s.empty}>No contacts yet</p>}
              {topContacts.map(c => (
                <div key={c.id} className="contact-row">
                  <div style={s.avatar}>{c.first_name?.[0]}{c.last_name?.[0]}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '14px', fontWeight: '500', color: '#111' }}>{c.full_name}</div>
                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                      {c.role || 'No role'}
                      {c.lastInteractionDate && <> · {new Date(c.lastInteractionDate).toLocaleDateString()}</>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: scoreColor(c.relationship_score) }}>{c.relationship_score || 0}</span>
                    {c.email && <a href={`mailto:${c.email}`} style={s.actionBtn}>✉</a>}
                    {c.phone && <a href={`tel:${c.phone}`}   style={s.actionBtn}>📞</a>}
                    <button style={s.actionBtn} onClick={() => handleQuickInteraction(c)}>+</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* MONEY TAB — embedded MoneyTracker widget */}
      {activeTab === 'money' && (
        <div style={{ margin: '0 -8px' }}>
          <MoneyTracker />
        </div>
      )}

      {/* CALENDAR TAB */}
      {activeTab === 'calendar' && (
        <div style={s.section}>
          <h3 style={s.sectionTitle}>Calendar — tasks &amp; goal deadlines</h3>
          <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '16px' }}>Tasks and goals with due dates appear here.</p>
          <div style={{ height: 560 }}>
            <Calendar
              localizer={localizer}
              events={calendarEvents}
              startAccessor="start"
              endAccessor="end"
              style={{ height: '100%' }}
              views={['month']}
              defaultView="month"
            />
          </div>
        </div>
      )}

      {/* TIMELINE TAB */}
      {activeTab === 'timeline' && (
        <div style={s.section}>
          <h3 style={s.sectionTitle}>Timeline — projects, goals &amp; tasks</h3>
          {timelineItems.length === 0 && <p style={s.empty}>Nothing to show yet.</p>}
          <div style={{ marginTop: '16px', position: 'relative' }}>
            <div style={s.timelineLine} />
            {timelineItems.map((item, i) => (
              <div key={i} style={s.timelineItem}>
                <div style={{ ...s.timelineDot, background: item.color }} />
                <div style={s.timelineContent}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={s.timelineType}>{item.type}</span>
                    <span style={s.timelineLabel}>{item.label}</span>
                  </div>
                  <div style={s.timelineDate}>{dayjs(item.date).format('MMM D, YYYY')}</div>
                </div>
                <span style={{ ...s.badge, background: item.color + '22', color: item.color }}>{item.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

const scoreColor = (score) => {
  if (!score) return '#94a3b8'
  if (score >= 70) return '#16a34a'
  if (score >= 40) return '#d97706'
  return '#dc2626'
}

const s = {
  title:        { fontSize: '24px', fontWeight: '700', marginBottom: '4px' },
  subtitle:     { fontSize: '14px', color: '#94a3b8', marginBottom: '24px' },
  tabs:         { display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' },
  statsGrid:    { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' },
  statValue:    { fontSize: '32px', fontWeight: '700', color: '#111' },
  statLabel:    { fontSize: '13px', color: '#888', marginTop: '4px' },
  twoCol:       { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' },
  section:      { background: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', marginBottom: '16px' },
  sectionTitle: { fontSize: '15px', fontWeight: '600', marginBottom: '12px', color: '#111' },
  avatar:       { width: '32px', height: '32px', borderRadius: '50%', background: '#eef2ff', color: '#4338ca', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '11px', flexShrink: 0 },
  actionBtn:    { padding: '4px 8px', borderRadius: '6px', background: '#f8fafc', border: '1px solid #e2e8f0', cursor: 'pointer', fontSize: '13px', textDecoration: 'none', color: '#555' },
  empty:        { fontSize: '13px', color: '#bbb', textAlign: 'center', padding: '16px 0' },
  timelineLine: { position: 'absolute', left: '11px', top: 0, bottom: 0, width: '2px', background: '#f0f0f0' },
  timelineItem: { display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px', position: 'relative' },
  timelineDot:  { width: '24px', height: '24px', borderRadius: '50%', flexShrink: 0, zIndex: 1 },
  timelineContent: { flex: 1 },
  timelineType: { fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', color: '#999', letterSpacing: '0.05em' },
  timelineLabel: { fontSize: '14px', fontWeight: '500' },
  timelineDate: { fontSize: '12px', color: '#999', marginTop: '2px' },
  badge:        { fontSize: '11px', fontWeight: '600', padding: '3px 8px', borderRadius: '999px' },
}
