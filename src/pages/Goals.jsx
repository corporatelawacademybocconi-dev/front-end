import { useState, useEffect } from 'react'
import { getGoals, createGoal, updateGoal } from '../api/goals'

export default function Goals() {
  const [goals, setGoals] = useState([])
  const [showGoalForm, setShowGoalForm] = useState(false)
  const [goalForm, setGoalForm] = useState({
    title: '',
    category: 'other',
    status: 'active',
    progress: 0
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

  return (
    <div>
      <div style={styles.header}>
        <h2 style={styles.title}>Goals</h2>
        <button style={styles.btn} onClick={() => setShowGoalForm(!showGoalForm)}>
          {showGoalForm ? 'Cancel' : '+ New Goal'}
        </button>
      </div>

      {showGoalForm && (
        <form onSubmit={handleCreateGoal} style={styles.form}>
          <input
            style={styles.input}
            placeholder="Goal title"
            value={goalForm.title}
            onChange={e => setGoalForm({ ...goalForm, title: e.target.value })}
            required
          />

          <div style={{ display: 'flex', gap: '12px' }}>
            <select style={styles.input} value={goalForm.category} onChange={e => setGoalForm({ ...goalForm, category: e.target.value })}>
              <option value="health">Health</option>
              <option value="career">Career</option>
              <option value="finance">Finance</option>
              <option value="learning">Learning</option>
              <option value="relationships">Relationships</option>
              <option value="other">Other</option>
            </select>

            <select style={styles.input} value={goalForm.status} onChange={e => setGoalForm({ ...goalForm, status: e.target.value })}>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="abandoned">Abandoned</option>
            </select>
          </div>

          <button style={styles.btn} type="submit">Create Goal</button>
        </form>
      )}

      <div style={styles.grid}>
        {goals.map(g => (
          <div key={g.id} style={styles.card}>
            <div style={styles.cardHeader}>
              <span style={styles.cardTitle}>{g.title}</span>
              <span style={{ ...styles.badge, ...categoryColor(g.category) }}>{g.category}</span>
            </div>

            <div style={{ marginTop: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '12px', color: '#999' }}>Progress</span>
                <span style={{ fontSize: '12px', fontWeight: '600', color: '#6366f1' }}>{g.progress}%</span>
              </div>

              <div style={styles.progressBar}>
                <div style={{ ...styles.progressFill, width: `${g.progress}%` }} />
              </div>

              <input
                type="range"
                min="0"
                max="100"
                value={g.progress}
                onChange={e => handleProgressChange(g, e.target.value)}
                style={{ width: '100%', marginTop: '8px' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
              <span style={{ fontSize: '12px', color: '#999' }}>{g.habit_count || 0} habits</span>
              <span style={{ ...styles.badge, ...statusColor(g.status) }}>{g.status}</span>
            </div>
          </div>
        ))}
      </div>

      {goals.length === 0 && <p style={styles.empty}>No goals yet. Set your first one!</p>}
    </div>
  )
}

const categoryColor = (c) => ({
  health: { background: '#dcfce7', color: '#166534' },
  career: { background: '#e0f2fe', color: '#0369a1' },
  finance: { background: '#fef9c3', color: '#854d0e' },
  learning: { background: '#f3e8ff', color: '#6b21a8' },
  relationships: { background: '#fce7f3', color: '#9d174d' },
  other: { background: '#f1f5f9', color: '#475569' }
}[c] || {})

const statusColor = (s) => ({
  active: { background: '#e0f2fe', color: '#0369a1' },
  completed: { background: '#dcfce7', color: '#166534' },
  abandoned: { background: '#fee2e2', color: '#991b1b' }
}[s] || {})

const styles = {
  header: { display: 'flex', justifyContent: 'space-between', marginBottom: '24px' },
  title: { fontSize: '20px', fontWeight: '600' },
  btn: { background: '#6366f1', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 20px', cursor: 'pointer' },
  form: { background: '#fff', padding: '24px', borderRadius: '12px', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '12px' },
  input: { padding: '10px', borderRadius: '8px', border: '1px solid #e0e0e0' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' },
  card: { background: '#fff', borderRadius: '12px', padding: '20px' },
  cardHeader: { display: 'flex', justifyContent: 'space-between' },
  cardTitle: { fontWeight: '600' },
  badge: { fontSize: '11px', padding: '3px 8px', borderRadius: '999px' },
  progressBar: { height: '6px', background: '#f0f0f0', borderRadius: '999px' },
  progressFill: { height: '100%', background: '#6366f1' },
  empty: { textAlign: 'center', marginTop: '24px', color: '#999' }
}