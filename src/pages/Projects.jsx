import { useState, useEffect, useCallback } from 'react'
import { getProjects, createProject, deleteProject, updateProject, createTask, updateTask, deleteTask } from '../api/projects'
import dayjs from 'dayjs'

// ─── Event templates ────────────────────────────────────────────────────────

const EVENT_TEMPLATES = {
  conference: {
    name: 'Conference',
    icon: '🎙',
    description: 'Multi-session public event',
    tasks: [
      { title: 'Book venue', priority: 'high' },
      { title: 'Set up registration page', priority: 'high' },
      { title: 'Invite speakers', priority: 'high' },
      { title: 'Arrange catering', priority: 'medium' },
      { title: 'Design print materials', priority: 'medium' },
      { title: 'Send attendee reminders', priority: 'low' },
      { title: 'Post-event survey', priority: 'low' },
    ],
  },
  workshop: {
    name: 'Workshop',
    icon: '🛠',
    description: 'Hands-on learning session',
    tasks: [
      { title: 'Define learning objectives', priority: 'high' },
      { title: 'Prepare materials & exercises', priority: 'high' },
      { title: 'Book room / platform', priority: 'medium' },
      { title: 'Send invitations', priority: 'medium' },
      { title: 'Prepare feedback form', priority: 'low' },
    ],
  },
  meetup: {
    name: 'Meetup',
    icon: '☕',
    description: 'Casual community gathering',
    tasks: [
      { title: 'Choose venue', priority: 'medium' },
      { title: 'Create event page', priority: 'medium' },
      { title: 'Promote on socials', priority: 'medium' },
      { title: 'Confirm headcount', priority: 'low' },
    ],
  },
  launch: {
    name: 'Launch',
    icon: '🚀',
    description: 'Product or campaign go-live',
    tasks: [
      { title: 'Finalize deliverable', priority: 'urgent' },
      { title: 'QA & review', priority: 'urgent' },
      { title: 'Prepare announcement', priority: 'high' },
      { title: 'Brief stakeholders', priority: 'high' },
      { title: 'Schedule social posts', priority: 'medium' },
      { title: 'Monitor post-launch', priority: 'medium' },
      { title: 'Collect feedback', priority: 'low' },
    ],
  },
}

// ─── Constants ───────────────────────────────────────────────────────────────

const EMPTY_PROJECT_FORM = { name: '', description: '', status: 'active', due_date: '', project_type: 'project' }
const EMPTY_TASK_FORM = { title: '', priority: 'medium', status: 'todo', due_date: '' }
const TASK_STATUS_CYCLE = { todo: 'in_progress', in_progress: 'done', done: 'todo' }

// ─── Helpers ─────────────────────────────────────────────────────────────────

const statusMeta = {
  active: { label: 'Active', bg: '#E1F5EE', color: '#0F6E56' },
  on_hold: { label: 'On hold', bg: '#FAEEDA', color: '#854F0B' },
  completed: { label: 'Completed', bg: '#EAF3DE', color: '#3B6D11' },
  archived: { label: 'Archived', bg: '#F1EFE8', color: '#5F5E5A' },
}

const priorityMeta = {
  low: { bg: '#F1EFE8', color: '#5F5E5A' },
  medium: { bg: '#E6F1FB', color: '#185FA5' },
  high: { bg: '#FAEEDA', color: '#854F0B' },
  urgent: { bg: '#FCEBEB', color: '#A32D2D' },
}

const taskStatusMeta = {
  todo: { color: '#bbb' },
  in_progress: { color: '#534AB7' },
  done: { color: '#3B6D11' },
}

function Badge({ value, map }) {
  const meta = map[value] || { bg: '#eee', color: '#666', label: value }
  return (
    <span style={{
      fontSize: 11, fontWeight: 500, padding: '2px 8px',
      borderRadius: 999, background: meta.bg, color: meta.color,
    }}>
      {meta.label || value}
    </span>
  )
}

function TaskProgress({ tasks = [] }) {
  if (!tasks.length) return null
  const done = tasks.filter(t => t.status === 'done').length
  const pct = Math.round((done / tasks.length) * 100)
  return (
    <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid #f0f0f0' }}>
      <div style={{ height: 3, background: '#f0f0f0', borderRadius: 999, overflow: 'hidden', marginBottom: 4 }}>
        <div style={{ width: `${pct}%`, height: '100%', background: '#7F77DD', borderRadius: 999, transition: 'width 0.3s' }} />
      </div>
      <span style={{ fontSize: 11, color: '#999' }}>{done}/{tasks.length} tasks · {pct}%</span>
    </div>
  )
}

// ─── Modal: New Project ───────────────────────────────────────────────────────

function NewProjectModal({ onClose, onSubmit }) {
  const [form, setForm] = useState({ name: '', description: '', due_date: '' })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  return (
    <ModalShell title="New project" sub="A general project with tasks and a deadline." onClose={onClose}>
      <Field label="Name">
        <input style={s.input} placeholder="Project name" value={form.name} onChange={e => set('name', e.target.value)} required />
      </Field>
      <Field label="Description">
        <input style={s.input} placeholder="Optional" value={form.description} onChange={e => set('description', e.target.value)} />
      </Field>
      <Field label="Due date">
        <input style={s.input} type="date" value={form.due_date} onChange={e => set('due_date', e.target.value)} />
      </Field>
      <div style={s.modalFooter}>
        <button style={s.btnCancel} onClick={onClose}>Cancel</button>
        <button style={s.btnPrimary} onClick={() => form.name.trim() && onSubmit({ ...form, project_type: 'project', status: 'active' })}>
          Create project
        </button>
      </div>
    </ModalShell>
  )
}

// ─── Modal: New Event ─────────────────────────────────────────────────────────

function NewEventModal({ onClose, onSubmit }) {
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [form, setForm] = useState({ name: '', description: '', due_date: '' })
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const tpl = selectedTemplate ? EVENT_TEMPLATES[selectedTemplate] : null

  return (
    <ModalShell title="New event" sub="Choose a template to start with an auto-generated workflow." onClose={onClose}>
      {/* Template picker */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
        {Object.entries(EVENT_TEMPLATES).map(([key, t]) => (
          <div
            key={key}
            onClick={() => setSelectedTemplate(key === selectedTemplate ? null : key)}
            style={{
              border: selectedTemplate === key ? '1.5px solid #7F77DD' : '1px solid #e5e7eb',
              borderRadius: 10, padding: '10px 12px', cursor: 'pointer',
              background: selectedTemplate === key ? '#EEEDFE' : '#fff',
              transition: 'all 0.15s',
            }}
          >
            <div style={{ fontSize: 18, marginBottom: 3 }}>{t.icon}</div>
            <div style={{ fontSize: 13, fontWeight: 500 }}>{t.name}</div>
            <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>{t.description}</div>
          </div>
        ))}
      </div>

      {/* Workflow preview */}
      {tpl ? (
        <div style={{ background: '#f7f7f8', border: '1px solid #ececec', borderRadius: 8, padding: '10px 12px', marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#888', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Workflow — {tpl.tasks.length} tasks
          </div>
          {tpl.tasks.map((t, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#555', padding: '2px 0' }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#7F77DD', flexShrink: 0, display: 'inline-block' }} />
              {t.title}
              <Badge value={t.priority} map={priorityMeta} />
            </div>
          ))}
        </div>
      ) : (
        <div style={{ fontSize: 12, color: '#aaa', marginBottom: 12 }}>
          Select a template to preview its workflow.
        </div>
      )}

      <Field label="Event name">
        <input style={s.input} placeholder="My event" value={form.name} onChange={e => set('name', e.target.value)} />
      </Field>
      <Field label="Description">
        <input style={s.input} placeholder="Optional" value={form.description} onChange={e => set('description', e.target.value)} />
      </Field>
      <Field label="Date">
        <input style={s.input} type="date" value={form.due_date} onChange={e => set('due_date', e.target.value)} />
      </Field>

      <div style={s.modalFooter}>
        <button style={s.btnCancel} onClick={onClose}>Cancel</button>
        <button
          style={s.btnPrimary}
          onClick={() => form.name.trim() && onSubmit({
            ...form,
            project_type: 'event',
            status: 'active',
            event_template: selectedTemplate,
            _templateTasks: tpl ? tpl.tasks : [],
          })}
        >
          Create event
        </button>
      </div>
    </ModalShell>
  )
}

// ─── Shared modal shell ───────────────────────────────────────────────────────

function ModalShell({ title, sub, onClose, children }) {
  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.modal} onClick={e => e.stopPropagation()}>
        <div style={{ marginBottom: 4, fontSize: 16, fontWeight: 600 }}>{title}</div>
        <div style={{ fontSize: 13, color: '#888', marginBottom: 16 }}>{sub}</div>
        {children}
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <label style={{ display: 'block', fontSize: 12, color: '#888', marginBottom: 4 }}>{label}</label>
      {children}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function Projects() {
  const [projects, setProjects] = useState([])
  const [selectedProject, setSelectedProject] = useState(null)
  const [taskForm, setTaskForm] = useState(EMPTY_TASK_FORM)
  const [activeTab, setActiveTab] = useState('all')   // 'all' | 'project' | 'event'
  const [modal, setModal] = useState(null)            // null | 'project' | 'event'
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState(EMPTY_PROJECT_FORM)

  useEffect(() => { loadProjects() }, [])

  const loadProjects = async () => {
    const res = await getProjects()
    setProjects(res.data)
  }

  // ── CRUD: projects ──────────────────────────────────────────────────────────

  const handleCreateProject = async (formData) => {
    const { _templateTasks, ...payload } = formData
    const res = await createProject(payload)
    const newProject = res.data

    // If the event had template tasks, create them all in parallel
    if (_templateTasks?.length) {
      const taskResults = await Promise.all(
        _templateTasks.map(t => createTask({ ...t, status: 'todo', project: newProject.id }))
      )
      newProject.tasks = taskResults.map(r => r.data)
    }

    setProjects(prev => [newProject, ...prev])
    setModal(null)
    setSelectedProject(newProject)
  }

  const handleDelete = async (id) => {
    await deleteProject(id)
    setProjects(prev => prev.filter(p => p.id !== id))
    if (selectedProject?.id === id) setSelectedProject(null)
  }

  const handleStatusChange = async (project, status) => {
    const res = await updateProject(project.id, { status })
    const updated = res.data
    setProjects(prev => prev.map(p => p.id === updated.id ? updated : p))
    if (selectedProject?.id === updated.id) setSelectedProject(updated)
  }

  const handleUpdateProject = async (e, id) => {
    e.preventDefault()
    e.stopPropagation()
    const res = await updateProject(id, editForm)
    const updated = res.data
    setProjects(prev => prev.map(p => p.id === id ? updated : p))
    if (selectedProject?.id === id) setSelectedProject(updated)
    setEditingId(null)
    setEditForm(EMPTY_PROJECT_FORM)
  }

  // ── CRUD: tasks ─────────────────────────────────────────────────────────────

  const applyTaskUpdate = useCallback((projectId, updatedTasks) => {
    const updated = p => ({ ...p, tasks: updatedTasks })
    setSelectedProject(prev => prev?.id === projectId ? updated(prev) : prev)
    setProjects(prev => prev.map(p => p.id === projectId ? updated(p) : p))
  }, [])

  const handleAddTask = async (e) => {
    e.preventDefault()
    const res = await createTask({ ...taskForm, project: selectedProject.id })
    applyTaskUpdate(selectedProject.id, [...(selectedProject.tasks || []), res.data])
    setTaskForm(EMPTY_TASK_FORM)
  }

  const handleTaskStatus = async (task) => {
    const nextStatus = TASK_STATUS_CYCLE[task.status] || 'todo'
    const res = await updateTask(task.id, { status: nextStatus })
    applyTaskUpdate(
      selectedProject.id,
      selectedProject.tasks.map(t => t.id === task.id ? res.data : t)
    )
  }

  const handleDeleteTask = async (taskId) => {
    await deleteTask(taskId)
    applyTaskUpdate(
      selectedProject.id,
      selectedProject.tasks.filter(t => t.id !== taskId)
    )
  }

  // ── Filtered list ───────────────────────────────────────────────────────────

  const visibleProjects = projects.filter(p =>
    activeTab === 'all' || (p.project_type || 'project') === activeTab
  )

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div style={{ display: 'flex', gap: 20 }}>
      {/* Left column */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Top bar */}
        <div style={s.topBar}>
          {/* Tabs */}
          <div style={s.tabs}>
            {['all', 'project', 'event'].map(t => (
              <button
                key={t}
                style={{ ...s.tab, ...(activeTab === t ? s.tabActive : {}) }}
                onClick={() => setActiveTab(t)}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}s
              </button>
            ))}
          </div>
          {/* Actions */}
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={s.btnOutline} onClick={() => setModal('project')}>+ Project</button>
            <button style={{ ...s.btnOutline, ...s.btnEvent }} onClick={() => setModal('event')}>+ Event</button>
          </div>
        </div>

        {/* Grid */}
        <div style={s.grid}>
          {visibleProjects.map(p => {
            const isEvent = (p.project_type || 'project') === 'event'
            const tplMeta = p.event_template ? EVENT_TEMPLATES[p.event_template] : null
            const isSelected = selectedProject?.id === p.id
            const isEditing = editingId === p.id

            return (
              <div
                key={p.id}
                style={{ ...s.card, ...(isSelected ? s.cardSelected : {}) }}
                onClick={() => !isEditing && setSelectedProject(p)}
              >
                {isEditing ? (
                  <form
                    onSubmit={e => handleUpdateProject(e, p.id)}
                    onClick={e => e.stopPropagation()}
                    style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
                  >
                    <input style={s.inputSm} placeholder="Name" value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} required />
                    <input style={s.inputSm} placeholder="Description" value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} />
                    <select style={s.inputSm} value={editForm.status} onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))}>
                      <option value="active">Active</option>
                      <option value="on_hold">On Hold</option>
                      <option value="completed">Completed</option>
                      <option value="archived">Archived</option>
                    </select>
                    <input style={s.inputSm} type="date" value={editForm.due_date} onChange={e => setEditForm(f => ({ ...f, due_date: e.target.value }))} />
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button style={s.btnPrimary} type="submit">Save</button>
                      <button type="button" style={s.btnCancel} onClick={e => { e.stopPropagation(); setEditingId(null) }}>Cancel</button>
                    </div>
                  </form>
                ) : (
                  <>
                    {/* Card header */}
                    <div style={s.cardHeader}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <span style={s.cardTitle}>{p.name}</span>
                          {isEvent && (
                            <span style={{ fontSize: 11, background: '#EEEDFE', color: '#534AB7', borderRadius: 999, padding: '1px 7px', fontWeight: 500 }}>
                              event
                            </span>
                          )}
                        </div>
                        {tplMeta && (
                          <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>
                            {tplMeta.icon} {tplMeta.name} template
                          </div>
                        )}
                      </div>
                      <Badge value={p.status} map={statusMeta} />
                    </div>

                    {p.description && <p style={s.cardDesc}>{p.description}</p>}
                    {p.due_date && (
                      <p style={{ fontSize: 11, color: '#534AB7', marginBottom: 8 }}>
                        {dayjs(p.due_date).format('MMM D, YYYY')}
                      </p>
                    )}

                    {/* Footer */}
                    <div style={s.cardFooter}>
                      <select
                        style={s.statusSelect}
                        value={p.status}
                        onClick={e => e.stopPropagation()}
                        onChange={e => handleStatusChange(p, e.target.value)}
                      >
                        <option value="active">Active</option>
                        <option value="on_hold">On Hold</option>
                        <option value="completed">Completed</option>
                        <option value="archived">Archived</option>
                      </select>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          style={s.iconBtn}
                          onClick={e => { e.stopPropagation(); setEditingId(p.id); setEditForm({ name: p.name, description: p.description || '', status: p.status, due_date: p.due_date || '' }) }}
                        >✎</button>
                        <button style={{ ...s.iconBtn, color: '#e53e3e' }} onClick={e => { e.stopPropagation(); handleDelete(p.id) }}>✕</button>
                      </div>
                    </div>

                    <TaskProgress tasks={p.tasks} />
                  </>
                )}
              </div>
            )
          })}
        </div>

        {visibleProjects.length === 0 && (
          <p style={s.empty}>
            {activeTab === 'event' ? 'No events yet. Create your first one!' : activeTab === 'project' ? 'No projects yet.' : 'Nothing here yet.'}
          </p>
        )}
      </div>

      {/* Right panel */}
      {selectedProject && (
        <div style={s.panel}>
          <div style={s.panelHeader}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600 }}>{selectedProject.name}</div>
              <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>
                {selectedProject.event_template && EVENT_TEMPLATES[selectedProject.event_template]
                  ? `${EVENT_TEMPLATES[selectedProject.event_template].icon} ${EVENT_TEMPLATES[selectedProject.event_template].name} · `
                  : ''}
                {selectedProject.due_date ? dayjs(selectedProject.due_date).format('MMM D, YYYY') : ''}
              </div>
            </div>
            <button style={s.closeBtn} onClick={() => setSelectedProject(null)}>✕</button>
          </div>

          {/* Task form */}
          <form onSubmit={handleAddTask} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <input
              style={s.input}
              placeholder="New task…"
              value={taskForm.title}
              onChange={e => setTaskForm(f => ({ ...f, title: e.target.value }))}
              required
            />
            <div style={{ display: 'flex', gap: 6 }}>
              <input
                style={{ ...s.input, flex: 1 }}
                type="date"
                value={taskForm.due_date}
                onChange={e => setTaskForm(f => ({ ...f, due_date: e.target.value }))}
              />
              <select
                style={{ ...s.input, flex: 1 }}
                value={taskForm.priority}
                onChange={e => setTaskForm(f => ({ ...f, priority: e.target.value }))}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
              <button style={s.btnPrimary} type="submit">Add</button>
            </div>
          </form>

          {/* Tasks */}
          <div style={{ marginTop: 16 }}>
            <div style={s.sectionLabel}>Tasks</div>
            {(!selectedProject.tasks?.length) && <p style={s.empty}>No tasks yet.</p>}
            {selectedProject.tasks?.map(task => (
              <div key={task.id} style={s.taskItem}>
                <span
                  style={{ ...s.taskCircle, color: taskStatusMeta[task.status]?.color || '#999' }}
                  onClick={() => handleTaskStatus(task)}
                  title="Click to advance status"
                >
                  {task.status === 'done' ? '✓' : task.status === 'in_progress' ? '◑' : '○'}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 13,
                    textDecoration: task.status === 'done' ? 'line-through' : 'none',
                    color: task.status === 'done' ? '#aaa' : '#111',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    {task.title}
                  </div>
                  {task.due_date && (
                    <div style={{ fontSize: 11, color: '#534AB7' }}>{dayjs(task.due_date).format('MMM D, YYYY')}</div>
                  )}
                </div>
                <Badge value={task.priority} map={priorityMeta} />
                <button style={{ ...s.iconBtn, color: '#e53e3e', marginLeft: 4 }} onClick={() => handleDeleteTask(task.id)}>✕</button>
              </div>
            ))}
          </div>

          {/* History */}
          {selectedProject.history?.length > 0 && (
            <div style={{ marginTop: 24 }}>
              <div style={s.sectionLabel}>History</div>
              {selectedProject.history.slice().reverse().map(h => (
                <div key={h.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #f0f0f0', fontSize: 12 }}>
                  <span style={{ color: '#555' }}>
                    <span style={{ color: '#bbb', textDecoration: 'line-through' }}>{h.old_value}</span>
                    {' → '}
                    <span style={{ color: '#534AB7', fontWeight: 500 }}>{h.new_value}</span>
                  </span>
                  <span style={{ color: '#ccc', fontSize: 11 }}>{dayjs(h.timestamp).format('MMM D, YYYY')}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {modal === 'project' && <NewProjectModal onClose={() => setModal(null)} onSubmit={handleCreateProject} />}
      {modal === 'event' && <NewEventModal onClose={() => setModal(null)} onSubmit={handleCreateProject} />}
    </div>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = {
  topBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  tabs: { display: 'flex', gap: 4, background: '#f0f0f1', borderRadius: 8, padding: 4 },
  tab: { padding: '5px 14px', borderRadius: 6, fontSize: 13, cursor: 'pointer', border: 'none', background: 'transparent', color: '#888', fontWeight: 500 },
  tabActive: { background: '#fff', color: '#111', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' },
  btnOutline: { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: '7px 14px', fontSize: 13, cursor: 'pointer', fontWeight: 500, color: '#111' },
  btnEvent: { background: '#EEEDFE', borderColor: '#AFA9EC', color: '#534AB7' },
  btnPrimary: { background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, cursor: 'pointer', fontWeight: 500, whiteSpace: 'nowrap' },
  btnCancel: { background: '#f1f5f9', color: '#374151', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, cursor: 'pointer' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 },
  card: { background: '#fff', borderRadius: 12, padding: '16px 18px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', cursor: 'pointer', border: '1.5px solid transparent', transition: 'border-color 0.15s' },
  cardSelected: { borderColor: '#7F77DD' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 8 },
  cardTitle: { fontWeight: 600, fontSize: 14, lineHeight: 1.3 },
  cardDesc: { fontSize: 12, color: '#777', marginBottom: 6, lineHeight: 1.4 },
  cardFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  statusSelect: { padding: '3px 6px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 11, cursor: 'pointer', background: '#fff' },
  iconBtn: { background: 'none', border: 'none', fontSize: 13, cursor: 'pointer', color: '#aaa', padding: '2px 4px', borderRadius: 4 },
  empty: { color: '#bbb', textAlign: 'center', marginTop: 32, fontSize: 13 },
  input: { padding: '8px 12px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13, outline: 'none', width: '100%', background: '#fff' },
  inputSm: { padding: '6px 8px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 12, outline: 'none', width: '100%' },
  panel: { width: 340, background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.05)', alignSelf: 'flex-start', position: 'sticky', top: 24, border: '1px solid #f0f0f0' },
  panelHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, paddingBottom: 14, borderBottom: '1px solid #f0f0f0' },
  closeBtn: { background: 'none', border: 'none', fontSize: 15, cursor: 'pointer', color: '#bbb' },
  sectionLabel: { fontSize: 11, fontWeight: 600, color: '#bbb', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10, marginTop: 14 },
  taskItem: { display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: '1px solid #f5f5f5' },
  taskCircle: { cursor: 'pointer', fontSize: 15, minWidth: 18, textAlign: 'center', flexShrink: 0 },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { background: '#fff', borderRadius: 14, padding: 24, width: 440, maxWidth: '95vw', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' },
  modalFooter: { display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16, paddingTop: 14, borderTop: '1px solid #f0f0f0' },
}