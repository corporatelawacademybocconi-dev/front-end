import { useState, useEffect } from 'react'
import { getProjects, getTasks } from '../api/projects'
import { getTopContacts } from '../api/contacts'
import client from '../api/client'
import { getGoals } from '../api/goals'
import { Calendar, dayjsLocalizer } from 'react-big-calendar'
import dayjs from 'dayjs'
import localizedFormat from 'dayjs/plugin/localizedFormat'
import localeData from 'dayjs/plugin/localeData'
import 'react-big-calendar/lib/css/react-big-calendar.css'

dayjs.extend(localizedFormat)
dayjs.extend(localeData)

const localizer = dayjsLocalizer(dayjs)

export default function Dashboard() {
  const [projects, setProjects] = useState([])
  const [tasks, setTasks] = useState([])
  const [topContacts, setTopContacts] = useState([])
  const [contactCount, setContactCount] = useState(0)
  const [goals, setGoals] = useState([])
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    getProjects().then(res => setProjects(res.data))
    getTasks().then(res => setTasks(res.data))
    getTopContacts(5).then(res => {
      setTopContacts(res.data.results)
      setContactCount(res.data.count)
    })
    getGoals().then(res => setGoals(res.data))
  }, [])

  const activeProjects = projects.filter(p => p.status === 'active')
  const totalTasks = projects.reduce((acc, p) => acc + p.task_count, 0)
  const maxTasks = Math.max(...projects.map(p => p.task_count), 1)

  const calendarEvents = [
    ...tasks.filter(t => t.due_date).map(t => ({
      title: t.title,
      start: new Date(t.due_date),
      end: new Date(t.due_date),
    })),
    ...goals.filter(g => g.target_date).map(g => ({
      title: `🎯 ${g.title}`,
      start: new Date(g.target_date),
      end: new Date(g.target_date),
    })),
  ]

  const timelineItems = [
    ...projects.map(p => ({ type: 'project', label: p.name, date: p.created_at, status: p.status, color: '#6366f1' })),
    ...goals.map(g => ({ type: 'goal', label: g.title, date: g.created_at, status: g.status, color: '#8b5cf6' })),
    ...tasks.filter(t => t.due_date).map(t => ({ type: 'task', label: t.title, date: t.due_date, status: t.status, color: '#f59e0b' })),
  ].sort((a, b) => new Date(a.date) - new Date(b.date))

  const statusCounts = {
    active: projects.filter(p => p.status === 'active').length,
    on_hold: projects.filter(p => p.status === 'on_hold').length,
    completed: projects.filter(p => p.status === 'completed').length,
    archived: projects.filter(p => p.status === 'archived').length,
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
      setTopContacts(res.data.results)
      setContactCount(res.data.count)
    })
  } catch (err) {
    console.error(err)
  }
}
  return (
    <div>
      <style>{`
        .rbc-btn-group button {
          background: #fff !important; color: #444 !important;
          border: 1px solid #e0e0e0 !important; padding: 6px 12px !important;
          cursor: pointer !important; font-size: 13px !important;
        }
        .rbc-btn-group button.rbc-active { background: #6366f1 !important; color: #fff !important; border-color: #6366f1 !important; }
        .rbc-toolbar-label { font-weight: 600 !important; font-size: 15px !important; }
        .rbc-event { background: #6366f1 !important; border-radius: 6px !important; border: none !important; font-size: 12px !important; }
        .rbc-today { background: #eef2ff !important; }
      `}</style>

      <h2 style={styles.title}>Dashboard</h2>
      <p style={styles.subtitle}>Welcome back, here's your overview.</p>

      <div style={styles.tabs}>
        {['overview', 'calendar', 'timeline'].map(tab => (
          <button
            key={tab}
            style={{ ...styles.tab, ...(activeTab === tab ? styles.tabActive : {}) }}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <div style={styles.statsGrid}>
        <div style={{ ...styles.statCard, borderTop: '3px solid #6366f1' }}>
          <div style={styles.statValue}>{activeProjects.length}</div>
          <div style={styles.statLabel}>Active projects</div>
        </div>
        <div style={{ ...styles.statCard, borderTop: '3px solid #f59e0b' }}>
          <div style={styles.statValue}>{totalTasks}</div>
          <div style={styles.statLabel}>Total tasks</div>
        </div>
        <div style={{ ...styles.statCard, borderTop: '3px solid #10b981' }}>
          <div style={styles.statValue}>{contactCount}</div>
          <div style={styles.statLabel}>Contacts</div>
        </div>
        
      </div>

      {activeTab === 'overview' && (
        <>
          <div style={styles.twoCol}>
            {/* Tasks per project - bar chart */}
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>Tasks per project</h3>
              {projects.length === 0
                ? <p style={styles.empty}>No projects yet</p>
                : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
                    {projects.map(p => (
                      <div key={p.id}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                          <span style={{ color: '#444', fontWeight: '500' }}>{p.name.length > 20 ? p.name.slice(0, 20) + '…' : p.name}</span>
                          <span style={{ color: '#6366f1', fontWeight: '600' }}>{p.task_count}</span>
                        </div>
                        <div style={{ height: '8px', background: '#f0f0f0', borderRadius: '999px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${(p.task_count / maxTasks) * 100}%`, background: '#6366f1', borderRadius: '999px', transition: 'width 0.4s' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )
              }
            </div>

            {/* Project status - donut via CSS */}
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>Project status</h3>
              {projects.length === 0
                ? <p style={styles.empty}>No projects yet</p>
                : (
                  <div>
                    {[
                      { label: 'Active', key: 'active', color: '#6366f1' },
                      { label: 'On hold', key: 'on_hold', color: '#f59e0b' },
                      { label: 'Completed', key: 'completed', color: '#10b981' },
                      { label: 'Archived', key: 'archived', color: '#94a3b8' },
                    ].map(s => (
                      <div key={s.key} style={{ marginBottom: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: s.color, display: 'inline-block' }} />
                            {s.label}
                          </span>
                          <span style={{ fontWeight: '600', color: s.color }}>{statusCounts[s.key]}</span>
                        </div>
                        <div style={{ height: '6px', background: '#f0f0f0', borderRadius: '999px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${(statusCounts[s.key] / totalProjects) * 100}%`, background: s.color, borderRadius: '999px' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )
              }
            </div>
          </div>

          <div style={styles.twoCol}>
            {/* Goal progress */}
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>Goal progress</h3>
              {goals.length === 0
                ? <p style={styles.empty}>No goals yet</p>
                : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
                    {goals.map(g => (
                      <div key={g.id}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                          <span style={{ color: '#444', fontWeight: '500' }}>{g.title.length > 20 ? g.title.slice(0, 20) + '…' : g.title}</span>
                          <span style={{ color: '#8b5cf6', fontWeight: '600' }}>{g.progress}%</span>
                        </div>
                        <div style={{ height: '8px', background: '#f0f0f0', borderRadius: '999px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${g.progress}%`, background: `hsl(${g.progress * 1.2}, 70%, 50%)`, borderRadius: '999px', transition: 'width 0.4s' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )
              }
            </div>

            
          </div>

          <div style={styles.section}>
  <h3 style={styles.sectionTitle}>Top contacts</h3>

  {topContacts.length === 0 && (
    <p style={styles.empty}>No contacts yet</p>
  )}

{topContacts.map(c => (
  <div key={c.id} style={styles.row}>
    <div style={styles.avatar}>
      {c.first_name[0]}{c.last_name[0]}
    </div>

    <div style={{ flex: 1 }}>
      <div style={styles.rowTitle}>{c.full_name}</div>

      <div style={{ fontSize: '12px', color: '#999' }}>
        {c.role || 'No role'}
        {c.lastInteractionDate && (
          <> · Last: {new Date(c.lastInteractionDate).toLocaleDateString()}</>
        )}
      </div>
    </div>

    <div style={{ textAlign: 'right' }}>
      <div style={{ fontWeight: '600', color: scoreColor(c.relationship_score) }}>
        {c.relationship_score || 0}
      </div>

    <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
        {c.email && <a href={`mailto:${c.email}`} style={styles.actionBtn}>✉</a>}
        {c.phone && <a href={`tel:${c.phone}`} style={styles.actionBtn}>📞</a>}
        <button style={styles.actionBtn} onClick={() => handleQuickInteraction(c)}>+</button>
</div>
    </div>
  </div>
))}
</div>
        </>
      )}

      {activeTab === 'calendar' && (
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Calendar — tasks & goal deadlines</h3>
          <p style={{ fontSize: '13px', color: '#999', marginBottom: '16px' }}>Tasks and goals with due dates appear here.</p>
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

      {activeTab === 'timeline' && (
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Timeline — projects, goals & tasks</h3>
          {timelineItems.length === 0 && <p style={styles.empty}>Nothing to show yet.</p>}
          <div style={{ marginTop: '16px', position: 'relative' }}>
            <div style={styles.timelineLine} />
            {timelineItems.map((item, i) => (
              <div key={i} style={styles.timelineItem}>
                <div style={{ ...styles.timelineDot, background: item.color }} />
                <div style={styles.timelineContent}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={styles.timelineType}>{item.type}</span>
                    <span style={styles.timelineLabel}>{item.label}</span>
                  </div>
                  <div style={styles.timelineDate}>{dayjs(item.date).format('MMM D, YYYY')}</div>
                </div>
                <span style={{ ...styles.badge, background: item.color + '22', color: item.color }}>
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )}
const scoreColor = (s) => {
    if (!s) return '#999'
    if (s >= 70) return '#16a34a'
    if (s >= 40) return '#d97706'
    return '#dc2626'
  }
const styles = {
  title: { fontSize: '24px', fontWeight: '700', marginBottom: '4px' },
  subtitle: { fontSize: '14px', color: '#888', marginBottom: '24px' },
  tabs: { display: 'flex', gap: '8px', marginBottom: '24px' },
  tab: { padding: '8px 20px', borderRadius: '8px', border: '1px solid #e0e0e0', background: '#fff', fontSize: '14px', cursor: 'pointer', color: '#444', fontWeight: '500' },
  tabActive: { background: '#6366f1', color: '#fff', border: '1px solid #6366f1' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' },
  statCard: { background: '#fff', borderRadius: '12px', padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  statValue: { fontSize: '32px', fontWeight: '700', color: '#111' },
  statLabel: { fontSize: '13px', color: '#888', marginTop: '4px' },
  twoCol: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' },
  section: { background: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', marginBottom: '16px' },
  sectionTitle: { fontSize: '15px', fontWeight: '600', marginBottom: '8px', color: '#111' },
  row: { display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 0', borderBottom: '1px solid #f5f5f5' },
  rowTitle: { flex: 1, fontSize: '14px', fontWeight: '500' },
  rowMeta: { fontSize: '12px', color: '#999' },
  avatar: { width: '28px', height: '28px', borderRadius: '50%', background: '#e0e7ff', color: '#4338ca', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '600', fontSize: '11px', flexShrink: 0 },
  empty: { fontSize: '13px', color: '#bbb', textAlign: 'center', padding: '16px 0' },
  timelineLine: { position: 'absolute', left: '11px', top: 0, bottom: 0, width: '2px', background: '#f0f0f0' },
  timelineItem: { display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px', position: 'relative' },
  timelineDot: { width: '24px', height: '24px', borderRadius: '50%', flexShrink: 0, zIndex: 1 },
  timelineContent: { flex: 1 },
  timelineType: { fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', color: '#999', letterSpacing: '0.05em' },
  timelineLabel: { fontSize: '14px', fontWeight: '500' },
  timelineDate: { fontSize: '12px', color: '#999', marginTop: '2px' },
  badge: { fontSize: '11px', fontWeight: '600', padding: '3px 8px', borderRadius: '999px' },
  actionBtn: {
    padding: '4px 6px',
    borderRadius: '6px',
    background: '#f3f4f6',
    border: 'none',
    cursor: 'pointer'
  },
}