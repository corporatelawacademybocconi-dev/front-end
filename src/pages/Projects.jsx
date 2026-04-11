import { useState, useEffect } from 'react'
import { getProjects, createProject, deleteProject, updateProject, createTask, updateTask, deleteTask } from '../api/projects'
import dayjs from 'dayjs'

export default function Projects() {
  const [projects, setProjects] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [selectedProject, setSelectedProject] = useState(null)
  const [taskForm, setTaskForm] = useState({ title: '', priority: 'medium', status: 'todo', due_date: '' })
  const [form, setForm] = useState({ name: '', description: '', status: 'active', due_date: '' })

  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = async () => {
    const res = await getProjects()
    setProjects(res.data)
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    const res = await createProject(form)
    setProjects([...projects, res.data])
    setForm({ name: '', description: '', status: 'active', due_date: '' })
    setShowForm(false)
  }

  const handleDelete = async (id) => {
    await deleteProject(id)
    setProjects(projects.filter(p => p.id !== id))
    if (selectedProject?.id === id) setSelectedProject(null)
  }

  const handleStatusChange = async (project, status) => {
    const res = await updateProject(project.id, { status })
    setProjects(projects.map(p => p.id === project.id ? res.data : p))
    if (selectedProject?.id === project.id) setSelectedProject(res.data)
  }

  const handleAddTask = async (e) => {
    e.preventDefault()
    const res = await createTask({ ...taskForm, project: selectedProject.id })
    const updated = { ...selectedProject, tasks: [...selectedProject.tasks, res.data] }
    setSelectedProject(updated)
    setProjects(projects.map(p => p.id === updated.id ? updated : p))
    setTaskForm({ title: '', priority: 'medium', status: 'todo', due_date: '' })
  }

  const handleTaskStatus = async (task) => {
    const nextStatus = task.status === 'todo' ? 'in_progress' : task.status === 'in_progress' ? 'done' : 'todo'
    const res = await updateTask(task.id, { status: nextStatus })
    const updatedTasks = selectedProject.tasks.map(t => t.id === task.id ? res.data : t)
    const updated = { ...selectedProject, tasks: updatedTasks }
    setSelectedProject(updated)
    setProjects(projects.map(p => p.id === updated.id ? updated : p))
  }

  const handleDeleteTask = async (taskId) => {
    await deleteTask(taskId)
    const updatedTasks = selectedProject.tasks.filter(t => t.id !== taskId)
    const updated = { ...selectedProject, tasks: updatedTasks }
    setSelectedProject(updated)
    setProjects(projects.map(p => p.id === updated.id ? updated : p))
  }

  return (
    <div style={{ display: 'flex', gap: '24px' }}>
      <div style={{ flex: 1 }}>
        <div style={styles.header}>
          <h2 style={styles.title}>Projects</h2>
          <button style={styles.btn} onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : '+ New Project'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleCreate} style={styles.form}>
            <input
              style={styles.input}
              placeholder="Project name"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              required
            />
            <input
              style={styles.input}
              placeholder="Description"
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
            />
            <select
              style={styles.input}
              value={form.status}
              onChange={e => setForm({ ...form, status: e.target.value })}
            >
              <option value="active">Active</option>
              <option value="on_hold">On Hold</option>
              <option value="completed">Completed</option>
              <option value="archived">Archived</option>
            </select>
            <input
              style={styles.input}
              type="date"
              value={form.due_date}
              onChange={e => setForm({ ...form, due_date: e.target.value })}
            />
            <button style={styles.btn} type="submit">Create</button>
          </form>
        )}

        <div style={styles.grid}>
          {projects.map(p => (
            <div
              key={p.id}
              style={{ ...styles.card, ...(selectedProject?.id === p.id ? styles.cardSelected : {}) }}
              onClick={() => setSelectedProject(p)}
            >
              <div style={styles.cardHeader}>
                <span style={styles.cardTitle}>{p.name}</span>
                <span style={{ ...styles.badge, ...statusColor(p.status) }}>{p.status}</span>
              </div>
              {p.description && <p style={styles.desc}>{p.description}</p>}
              {p.due_date && (
                <p style={{ fontSize: '12px', color: '#6366f1', marginBottom: '8px' }}>
                  📅 {dayjs(p.due_date).format('MMM D, YYYY')}
                </p>
              )}
              <div style={styles.cardFooter}>
                <select
                  style={styles.statusSelect}
                  value={p.status}
                  onClick={e => e.stopPropagation()}
                  onChange={e => handleStatusChange(p, e.target.value)}
                >
                  <option value="active">Active</option>
                  <option value="on_hold">On Hold</option>
                  <option value="completed">Completed</option>
                  <option value="archived">Archived</option>
                </select>
                <button
                  style={styles.deleteBtn}
                  onClick={e => { e.stopPropagation(); handleDelete(p.id) }}
                >Delete</button>
              </div>
            </div>
          ))}
        </div>

        {projects.length === 0 && (
          <p style={styles.empty}>No projects yet. Create your first one!</p>
        )}
      </div>

      {selectedProject && (
        <div style={styles.taskPanel}>
          <div style={styles.header}>
            <h3 style={styles.title}>{selectedProject.name}</h3>
            <button style={styles.closeBtn} onClick={() => setSelectedProject(null)}>✕</button>
          </div>

          <form onSubmit={handleAddTask} style={styles.taskForm}>
            <input
              style={styles.input}
              placeholder="New task title"
              value={taskForm.title}
              onChange={e => setTaskForm({ ...taskForm, title: e.target.value })}
              required
            />
            <input
              style={styles.input}
              type="date"
              value={taskForm.due_date}
              onChange={e => setTaskForm({ ...taskForm, due_date: e.target.value })}
            />
            <div style={{ display: 'flex', gap: '8px' }}>
              <select
                style={styles.input}
                value={taskForm.priority}
                onChange={e => setTaskForm({ ...taskForm, priority: e.target.value })}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
              <button style={styles.btn} type="submit">Add</button>
            </div>
          </form>

          <div style={{ marginTop: '16px' }}>
            {selectedProject.tasks?.length === 0 && (
              <p style={styles.empty}>No tasks yet.</p>
            )}
            {selectedProject.tasks?.map(task => (
              <div key={task.id} style={styles.taskItem}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                  <span
                    style={{ ...styles.taskStatus, ...taskStatusColor(task.status) }}
                    onClick={() => handleTaskStatus(task)}
                    title="Click to advance status"
                  >
                    {task.status === 'done' ? '✓' : task.status === 'in_progress' ? '◑' : '○'}
                  </span>
                  <div>
                    <div style={{ fontSize: '14px', textDecoration: task.status === 'done' ? 'line-through' : 'none', color: task.status === 'done' ? '#999' : '#111' }}>
                      {task.title}
                    </div>
                    {task.due_date && (
                      <div style={{ fontSize: '11px', color: '#6366f1' }}>📅 {dayjs(task.due_date).format('MMM D, YYYY')}</div>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ ...styles.badge, ...priorityColor(task.priority) }}>{task.priority}</span>
                  <button style={styles.deleteBtn} onClick={() => handleDeleteTask(task.id)}>✕</button>
                </div>
              </div>
            ))}
          </div>

          {selectedProject.history?.length > 0 && (
            <div style={{ marginTop: '24px' }}>
              <h4 style={{ fontSize: '13px', fontWeight: '600', color: '#999', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>History</h4>
              {selectedProject.history.slice().reverse().map(h => (
                <div key={h.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f0f0f0', fontSize: '13px' }}>
                  <span style={{ color: '#444' }}>
                    Status: <span style={{ color: '#999', textDecoration: 'line-through' }}>{h.old_value}</span>
                    {' → '}
                    <span style={{ color: '#6366f1', fontWeight: '500' }}>{h.new_value}</span>
                  </span>
                  <span style={{ color: '#bbb', fontSize: '11px' }}>
                    {dayjs(h.timestamp).format('MMM D, YYYY')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const statusColor = (s) => ({ active: { background: '#e0f2fe', color: '#0369a1' }, on_hold: { background: '#fef9c3', color: '#854d0e' }, completed: { background: '#dcfce7', color: '#166534' }, archived: { background: '#f1f5f9', color: '#475569' } }[s] || {})
const priorityColor = (p) => ({ low: { background: '#f1f5f9', color: '#475569' }, medium: { background: '#e0f2fe', color: '#0369a1' }, high: { background: '#fef9c3', color: '#854d0e' }, urgent: { background: '#fee2e2', color: '#991b1b' } }[p] || {})
const taskStatusColor = (s) => ({ todo: { color: '#999' }, in_progress: { color: '#6366f1' }, done: { color: '#16a34a' } }[s] || {})

const styles = {
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  title: { fontSize: '20px', fontWeight: '600' },
  btn: { background: '#6366f1', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 20px', fontSize: '14px', cursor: 'pointer', fontWeight: '500' },
  form: { background: '#fff', padding: '24px', borderRadius: '12px', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  input: { padding: '10px 14px', borderRadius: '8px', border: '1px solid #e0e0e0', fontSize: '14px', outline: 'none', flex: 1 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' },
  card: { background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', cursor: 'pointer', border: '2px solid transparent' },
  cardSelected: { border: '2px solid #6366f1' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' },
  cardTitle: { fontWeight: '600', fontSize: '15px' },
  badge: { fontSize: '11px', fontWeight: '600', padding: '3px 8px', borderRadius: '999px' },
  desc: { fontSize: '13px', color: '#666', marginBottom: '8px' },
  cardFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' },
  statusSelect: { padding: '4px 8px', borderRadius: '6px', border: '1px solid #e0e0e0', fontSize: '12px', cursor: 'pointer' },
  deleteBtn: { background: 'none', border: 'none', color: '#e53e3e', fontSize: '12px', cursor: 'pointer' },
  empty: { color: '#999', textAlign: 'center', marginTop: '24px', fontSize: '14px' },
  taskPanel: { width: '360px', background: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', alignSelf: 'flex-start', position: 'sticky', top: '24px' },
  taskForm: { display: 'flex', flexDirection: 'column', gap: '8px' },
  taskItem: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f0f0f0' },
  taskStatus: { cursor: 'pointer', fontSize: '16px', minWidth: '20px', textAlign: 'center' },
  closeBtn: { background: 'none', border: 'none', fontSize: '16px', cursor: 'pointer', color: '#999' },
}