import { useState, useEffect } from 'react'
import { getGoals, createGoal, updateGoal, deleteGoal } from '../api/goals'

export default function Goals() {
  const [goals, setGoals] = useState([])
  const [showGoalForm, setShowGoalForm] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [goalForm, setGoalForm] = useState({
    title: '',
    category: 'other',
    status: 'active',
    progress: 0,
  })

  useEffect(() => {
    getGoals().then(res => setGoals(res.data))
  }, [])

  const handleCreateGoal = async (e) => {
    e.preventDefault()
    const res = await createGoal(goalForm)
    setGoals(prev => [...prev, res.data])
    setGoalForm({ title: '', category: 'other', status: 'active', progress: 0 })
    setShowGoalForm(false)
  }

  const handleProgressChange = async (goal, progress) => {
    const res = await updateGoal(goal.id, { progress: parseInt(progress) })
    setGoals(prev => prev.map(g => g.id === goal.id ? res.data : g))
  }

  const handleDelete = async (id) => {
    await deleteGoal(id)
    setGoals(prev => prev.filter(g => g.id !== id))
    setConfirmDelete(null)
  }

  return (
    <div>
      <style>{`
        .goal-card { background:#fff; border-radius:14px; padding:20px; box-shadow:0 1px 4px rgba(0,0,0,0.06); transition:box-shadow 0.2s; }
        .goal-card:hover { box-shadow:0 4px 16px rgba(0,0,0,0.10); }
        .goal-del-btn { background:none; border:none; color:#cbd5e1; cursor:pointer; font-size:15px; padding:4px 6px; border-radius:6px; transition:color 0.15s,background 0.15s; }
        .goal-del-btn:hover { color:#ef4444; background:#fee2e2; }
        .goal-input { width:100%; padding:10px 12px; border-radius:8px; border:1px solid #e0e0e0; font-size:14px; outline:none; transition:border-color 0.15s; }
        .goal-input:focus { border-color:#6366f1; }
      `}</style>

      <div style={s.header}>
        <div>
          <h2 style={s.title}>Goals</h2>
          <p style={s.subtitle}>{goals.length} goal{goals.length !== 1 ? 's' : ''} total</p>
        </div>
        <button style={s.btn} onClick={() => setShowGoalForm(!showGoalForm)}>
          {showGoalForm ? 'Cancel' : '+ New Goal'}
        </button>
      </div>

      {showGoalForm && (
        <form onSubmit={handleCreateGoal} style={s.form}>
          <input
            className="goal-input"
            placeholder="Goal title"
            value={goalForm.title}
            onChange={e => setGoalForm({ ...goalForm, title: e.target.value })}
            required
          />
          <div style={{ display: 'flex', gap: '12px' }}>
            <select className="goal-input" value={goalForm.category} onChange={e => setGoalForm({ ...goalForm, category: e.target.value })}>
              <option value="health">Health</option>
              <option value="career">Career</option>
              <option value="finance">Finance</option>
              <option value="learning">Learning</option>
              <option value="relationships">Relationships</option>
              <option value="other">Other</option>
            </select>
            <select className="goal-input" value={goalForm.status} onChange={e => setGoalForm({ ...goalForm, status: e.target.value })}>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="abandoned">Abandoned</option>
            </select>
          </div>
          <button style={s.btn} type="submit">Create Goal</button>
        </form>
      )}

      <div style={s.grid}>
        {goals.map(g => (
          <div key={g.id} className="goal-card">
            <div style={s.cardHeader}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span style={{ ...s.badge, ...categoryColor(g.category) }}>{g.category}</span>
                  <span style={{ ...s.badge, ...statusColor(g.status) }}>{g.status}</span>
                </div>
                <span style={s.cardTitle}>{g.title}</span>
              </div>
              <button
                className="goal-del-btn"
                title="Delete goal"
                onClick={() => setConfirmDelete(g)}
              >✕</button>
            </div>

            <div style={{ marginTop: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '12px', color: '#999' }}>Progress</span>
                <span style={{ fontSize: '12px', fontWeight: '600', color: '#6366f1' }}>{g.progress}%</span>
              </div>
              <div style={s.progressBar}>
                <div style={{ ...s.progressFill, width: `${g.progress}%`, background: `hsl(${g.progress * 1.2}, 65%, 50%)` }} />
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={g.progress}
                onChange={e => handleProgressChange(g, e.target.value)}
                style={{ width: '100%', marginTop: '10px', accentColor: '#6366f1' }}
              />
            </div>

            <div style={{ fontSize: '12px', color: '#aaa', marginTop: '8px' }}>
              {g.habit_count || 0} habit{g.habit_count !== 1 ? 's' : ''}
              {g.target_date && <> · Due {new Date(g.target_date).toLocaleDateString()}</>}
            </div>
          </div>
        ))}
      </div>

      {goals.length === 0 && <p style={s.empty}>No goals yet. Set your first one!</p>}

      {/* Delete confirmation modal */}
      {confirmDelete && (
        <div style={s.overlay}>
          <div style={s.modal}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>Delete goal?</h3>
            <p style={{ fontSize: '14px', color: '#555', marginBottom: '20px' }}>
              "{confirmDelete.title}" will be permanently removed.
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button style={s.deleteConfirmBtn} onClick={() => handleDelete(confirmDelete.id)}>
                Delete
              </button>
              <button style={s.cancelBtn} onClick={() => setConfirmDelete(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const categoryColor = (c) => ({
  health:        { background: '#dcfce7', color: '#166534' },
  career:        { background: '#e0f2fe', color: '#0369a1' },
  finance:       { background: '#fef9c3', color: '#854d0e' },
  learning:      { background: '#f3e8ff', color: '#6b21a8' },
  relationships: { background: '#fce7f3', color: '#9d174d' },
  other:         { background: '#f1f5f9', color: '#475569' },
}[c] || {})

const statusColor = (s) => ({
  active:    { background: '#e0f2fe', color: '#0369a1' },
  completed: { background: '#dcfce7', color: '#166534' },
  abandoned: { background: '#fee2e2', color: '#991b1b' },
}[s] || {})

const s = {
  header:           { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' },
  title:            { fontSize: '22px', fontWeight: '700', marginBottom: '2px' },
  subtitle:         { fontSize: '13px', color: '#888' },
  btn:              { background: '#6366f1', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 20px', cursor: 'pointer', fontSize: '14px', fontWeight: '500' },
  form:             { background: '#fff', padding: '24px', borderRadius: '12px', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  grid:             { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' },
  cardHeader:       { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' },
  cardTitle:        { fontWeight: '600', fontSize: '15px', color: '#111' },
  badge:            { fontSize: '11px', padding: '3px 8px', borderRadius: '999px', fontWeight: '500' },
  progressBar:      { height: '7px', background: '#f0f0f0', borderRadius: '999px', overflow: 'hidden' },
  progressFill:     { height: '100%', borderRadius: '999px', transition: 'width 0.4s' },
  empty:            { textAlign: 'center', marginTop: '48px', color: '#bbb', fontSize: '14px' },
  overlay:          { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal:            { background: '#fff', borderRadius: '14px', padding: '28px', maxWidth: '360px', width: '90%', boxShadow: '0 8px 40px rgba(0,0,0,0.18)' },
  deleteConfirmBtn: { background: '#ef4444', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 20px', cursor: 'pointer', fontSize: '14px', fontWeight: '500' },
  cancelBtn:        { background: '#f1f5f9', color: '#374151', border: 'none', borderRadius: '8px', padding: '10px 20px', cursor: 'pointer', fontSize: '14px' },
}
