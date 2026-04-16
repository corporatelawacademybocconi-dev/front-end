import { useState, useEffect } from 'react'
import { getContactsFiltered, createContact, updateContact, deleteContact, getCompanies, createCompany } from '../api/contacts'

function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

const EMPTY_FORM = { first_name: '', last_name: '', email: '', phone: '', role: '', company: '', notes: '' }

const VIEWS = ['All', 'Associates', 'Alumni']

function isAssociate(c) {
  const r = (c.role || '').toLowerCase()
  return r.includes('associate') || r.includes('partner') || r.includes('colleague') || r.includes('collaborator')
}
function isAlumni(c) {
  const r = (c.role || '').toLowerCase()
  return r.includes('alumni') || r.includes('alum') || r.includes('graduate') || r.includes('former')
}

export default function Contacts() {
  const [contacts, setContacts]     = useState([])
  const [companies, setCompanies]   = useState([])
  const [meta, setMeta]             = useState({ count: 0, total_pages: 1, current_page: 1 })
  const [loading, setLoading]       = useState(false)
  const [showForm, setShowForm]     = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [editingId, setEditingId]   = useState(null)
  const [editForm, setEditForm]     = useState(EMPTY_FORM)
  const [activeView, setActiveView] = useState('All')

  const [search, setSearch]               = useState('')
  const [companyFilter, setCompanyFilter] = useState('')
  const [roleFilter, setRoleFilter]       = useState('')
  const [page, setPage]                   = useState(1)

  const debouncedSearch  = useDebounce(search, 300)
  const debouncedCompany = useDebounce(companyFilter, 300)
  const debouncedRole    = useDebounce(roleFilter, 300)

  const [newCompanyName, setNewCompanyName] = useState('')
  const [form, setForm] = useState(EMPTY_FORM)

  useEffect(() => {
    getCompanies().then(res => setCompanies(res.data))
  }, [])

  const fetchContacts = (params) => {
    setLoading(true)
    return getContactsFiltered(params)
      .then(res => {
        setContacts(res.data.results ?? res.data ?? [])
        setMeta({
          count:        res.data.count       ?? 0,
          total_pages:  res.data.total_pages  ?? 1,
          current_page: res.data.current_page ?? 1,
        })
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchContacts({ search: debouncedSearch, company: debouncedCompany, role: debouncedRole, page })
  }, [debouncedSearch, debouncedCompany, debouncedRole, page])

  const handleSearch  = e => { setSearch(e.target.value);        setPage(1) }
  const handleCompany = e => { setCompanyFilter(e.target.value); setPage(1) }
  const handleRole    = e => { setRoleFilter(e.target.value);    setPage(1) }

  const handleCreate = async (e) => {
    e.preventDefault()
    try {
      await createContact({ ...form, company: form.company || null, email: form.email || null })
      setForm(EMPTY_FORM)
      setShowForm(false)
      fetchContacts({ search: debouncedSearch, company: debouncedCompany, role: debouncedRole, page })
    } catch (err) { console.error('Create error:', err.response?.data) }
  }

  const handleCreateCompany = async () => {
    if (!newCompanyName) return
    try {
      const res = await createCompany({ name: newCompanyName })
      setCompanies(prev => [...prev, res.data])
      setForm(prev => ({ ...prev, company: res.data.id }))
      setNewCompanyName('')
    } catch (err) { console.error('Company error:', err.response?.data) }
  }

  const handleDelete = async (id) => {
    await deleteContact(id)
    setConfirmDelete(null)
    fetchContacts({ search: debouncedSearch, company: debouncedCompany, role: debouncedRole, page })
  }

  const startEdit = (c) => {
    setEditingId(c.id)
    setEditForm({
      first_name: c.first_name,
      last_name:  c.last_name,
      email:      c.email  || '',
      phone:      c.phone  || '',
      role:       c.role   || '',
      company:    c.company || '',
      notes:      c.notes  || '',
    })
  }

  const cancelEdit = () => { setEditingId(null); setEditForm(EMPTY_FORM) }

  const handleUpdate = async (e, id) => {
    e.preventDefault()
    try {
      await updateContact(id, { ...editForm, company: editForm.company || null, email: editForm.email || null })
      cancelEdit()
      fetchContacts({ search: debouncedSearch, company: debouncedCompany, role: debouncedRole, page })
    } catch (err) { console.error('Update error:', err.response?.data) }
  }

  // Filter contacts by active view
  const viewContacts = activeView === 'Associates'
    ? contacts.filter(isAssociate)
    : activeView === 'Alumni'
      ? contacts.filter(isAlumni)
      : contacts

  // Group filtered contacts by company → role
  const grouped = viewContacts.reduce((acc, c) => {
    const company = c.company_name || 'No Company'
    const role    = c.role || 'No Role'
    if (!acc[company]) acc[company] = {}
    if (!acc[company][role]) acc[company][role] = []
    acc[company][role].push(c)
    return acc
  }, {})

  const initials = (c) => `${c.first_name?.[0] ?? ''}${c.last_name?.[0] ?? ''}`

  return (
    <div>
      <style>{`
        .contact-card { display:flex; justify-content:space-between; align-items:center; padding:12px 16px; background:#fff; border-radius:10px; margin-top:6px; box-shadow:0 1px 3px rgba(0,0,0,0.05); transition:box-shadow 0.15s; }
        .contact-card:hover { box-shadow:0 3px 10px rgba(0,0,0,0.09); }
        .c-input { padding:9px 12px; border-radius:8px; border:1px solid #e0e0e0; font-size:14px; outline:none; transition:border-color 0.15s; width:100%; }
        .c-input:focus { border-color:#6366f1; }
        .view-tab { padding:7px 18px; border-radius:8px; border:1px solid #e0e0e0; background:#fff; font-size:13px; cursor:pointer; color:#555; font-weight:500; transition:all 0.15s; }
        .view-tab.active { background:#6366f1; color:#fff; border-color:#6366f1; }
        .view-tab:hover:not(.active) { background:#f5f3ff; border-color:#c7d2fe; }
        .company-group { margin-bottom:24px; }
        .company-heading { font-size:13px; font-weight:700; color:#6366f1; text-transform:uppercase; letter-spacing:0.06em; margin-bottom:4px; padding-bottom:6px; border-bottom:2px solid #eef2ff; }
        .role-heading { font-size:12px; color:#94a3b8; font-weight:600; text-transform:uppercase; letter-spacing:0.04em; margin:10px 0 4px; }
        .score-badge { font-size:12px; font-weight:700; padding:2px 8px; border-radius:999px; }
        .action-btn { padding:5px 8px; border-radius:6px; background:#f8fafc; border:1px solid #e2e8f0; cursor:pointer; font-size:13px; color:#555; transition:all 0.15s; text-decoration:none; display:inline-flex; align-items:center; }
        .action-btn:hover { background:#eef2ff; border-color:#c7d2fe; color:#6366f1; }
        .edit-btn { background:none; border:none; color:#94a3b8; cursor:pointer; font-size:16px; padding:4px 6px; border-radius:6px; transition:all 0.15s; }
        .edit-btn:hover { color:#6366f1; background:#eef2ff; }
        .del-btn { background:none; border:none; color:#94a3b8; cursor:pointer; font-size:14px; padding:4px 6px; border-radius:6px; transition:all 0.15s; }
        .del-btn:hover { color:#ef4444; background:#fee2e2; }
      `}</style>

      {/* Header */}
      <div style={s.header}>
        <div>
          <h2 style={s.title}>Contacts {!loading && <span style={s.count}>({meta.count})</span>}</h2>
          <p style={s.subtitle}>Manage your network</p>
        </div>
        <button style={s.btn} onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ New Contact'}
        </button>
      </div>

      {/* View tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        {VIEWS.map(v => (
          <button
            key={v}
            className={`view-tab ${activeView === v ? 'active' : ''}`}
            onClick={() => setActiveView(v)}
          >
            {v}
            {v === 'Associates' && <span style={{ marginLeft: '6px', fontSize: '11px', opacity: 0.8 }}>({contacts.filter(isAssociate).length})</span>}
            {v === 'Alumni'     && <span style={{ marginLeft: '6px', fontSize: '11px', opacity: 0.8 }}>({contacts.filter(isAlumni).length})</span>}
          </button>
        ))}
      </div>

      {/* New contact form */}
      {showForm && (
        <form onSubmit={handleCreate} style={s.form}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <input className="c-input" placeholder="First name" value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })} required />
            <input className="c-input" placeholder="Last name"  value={form.last_name}  onChange={e => setForm({ ...form, last_name: e.target.value })} required />
            <input className="c-input" placeholder="Email"      value={form.email}      onChange={e => setForm({ ...form, email: e.target.value })} />
            <input className="c-input" placeholder="Phone"      value={form.phone}      onChange={e => setForm({ ...form, phone: e.target.value })} />
            <input className="c-input" placeholder="Role (e.g. Associate, Alumni…)" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} />
            <select className="c-input" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })}>
              <option value="">Select Company</option>
              {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input className="c-input" placeholder="New company name" value={newCompanyName} onChange={e => setNewCompanyName(e.target.value)} style={{ flex: 1 }} />
            <button type="button" style={{ ...s.btn, padding: '9px 16px' }} onClick={handleCreateCompany}>+ Company</button>
          </div>
          <textarea className="c-input" placeholder="Notes" rows={3} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
          <button style={s.btn} type="submit">Create Contact</button>
        </form>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <input className="c-input" placeholder="Search…" value={search} onChange={handleSearch} style={{ maxWidth: '220px' }} />
        <select className="c-input" value={companyFilter} onChange={handleCompany} style={{ maxWidth: '180px' }}>
          <option value="">All Companies</option>
          {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <input className="c-input" placeholder="Filter by role…" value={roleFilter} onChange={handleRole} style={{ maxWidth: '180px' }} />
      </div>

      {loading && <p style={{ color: '#94a3b8', fontSize: '14px' }}>Loading…</p>}

      {/* Associates / Alumni info banner */}
      {activeView !== 'All' && !loading && viewContacts.length === 0 && (
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
          No {activeView.toLowerCase()} found. Contacts with roles containing "{activeView === 'Associates' ? 'associate, partner, colleague' : 'alumni, graduate, former'}" appear here.
        </div>
      )}

      {/* Grouped contact list */}
      {!loading && Object.entries(grouped).map(([company, roles]) => (
        <div key={company} className="company-group">
          <div className="company-heading">{company}</div>
          {Object.entries(roles).map(([role, people]) => (
            <div key={role}>
              <div className="role-heading">{role}</div>
              {[...people].sort((a, b) => b.relationship_score - a.relationship_score).map(c => (
                <div key={c.id}>
                  {editingId === c.id ? (
                    <form onSubmit={e => handleUpdate(e, c.id)} style={{ ...s.editCard }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <input className="c-input" placeholder="First name" value={editForm.first_name} onChange={e => setEditForm({ ...editForm, first_name: e.target.value })} required />
                        <input className="c-input" placeholder="Last name"  value={editForm.last_name}  onChange={e => setEditForm({ ...editForm, last_name: e.target.value })} required />
                        <input className="c-input" placeholder="Email" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} />
                        <input className="c-input" placeholder="Phone" value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} />
                        <input className="c-input" placeholder="Role" value={editForm.role} onChange={e => setEditForm({ ...editForm, role: e.target.value })} />
                        <select className="c-input" value={editForm.company} onChange={e => setEditForm({ ...editForm, company: e.target.value })}>
                          <option value="">No Company</option>
                          {companies.map(co => <option key={co.id} value={co.id}>{co.name}</option>)}
                        </select>
                      </div>
                      <textarea className="c-input" placeholder="Notes" rows={2} value={editForm.notes} onChange={e => setEditForm({ ...editForm, notes: e.target.value })} style={{ marginTop: '8px' }} />
                      <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                        <button style={s.btn} type="submit">Save</button>
                        <button type="button" style={s.cancelBtn} onClick={cancelEdit}>Cancel</button>
                      </div>
                    </form>
                  ) : (
                    <div className="contact-card">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                        <div style={s.avatar}>{initials(c)}</div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: '600', fontSize: '14px', color: '#111' }}>{c.full_name}</div>
                          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '1px' }}>
                            {c.email && <span>{c.email}</span>}
                            {c.email && c.phone && <span> · </span>}
                            {c.phone && <span>{c.phone}</span>}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                        <span style={{
                          ...s.scoreBadge,
                          background: scoreColor(c.relationship_score) + '18',
                          color: scoreColor(c.relationship_score),
                        }}>{c.relationship_score || 0}</span>
                        {c.email && <a href={`mailto:${c.email}`} className="action-btn">✉</a>}
                        {c.phone && <a href={`tel:${c.phone}`}   className="action-btn">📞</a>}
                        <button className="edit-btn" onClick={() => startEdit(c)}>✎</button>
                        <button className="del-btn"  onClick={() => setConfirmDelete(c)}>✕</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      ))}

      {/* Pagination */}
      {meta.total_pages > 1 && (
        <div style={{ display: 'flex', gap: '8px', marginTop: '20px', alignItems: 'center' }}>
          <button style={s.btn} onClick={() => setPage(p => p - 1)} disabled={page === 1}>‹ Prev</button>
          <span style={{ fontSize: '14px', color: '#555' }}>Page {meta.current_page} of {meta.total_pages}</span>
          <button style={s.btn} onClick={() => setPage(p => p + 1)} disabled={page === meta.total_pages}>Next ›</button>
        </div>
      )}

      {/* Delete modal */}
      {confirmDelete && (
        <div style={s.overlay}>
          <div style={s.modal}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>Delete contact?</h3>
            <p style={{ fontSize: '14px', color: '#555', marginBottom: '20px' }}>
              "{confirmDelete.full_name}" will be permanently removed.
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button style={s.deleteConfirmBtn} onClick={() => handleDelete(confirmDelete.id)}>Delete</button>
              <button style={s.cancelBtn} onClick={() => setConfirmDelete(null)}>Cancel</button>
            </div>
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
  header:           { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' },
  title:            { fontSize: '22px', fontWeight: '700', marginBottom: '2px' },
  subtitle:         { fontSize: '13px', color: '#888' },
  count:            { fontSize: '16px', fontWeight: 'normal', color: '#94a3b8' },
  btn:              { background: '#6366f1', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 20px', cursor: 'pointer', fontSize: '14px', fontWeight: '500' },
  cancelBtn:        { background: '#f1f5f9', color: '#374151', border: 'none', borderRadius: '8px', padding: '10px 20px', cursor: 'pointer', fontSize: '14px' },
  deleteConfirmBtn: { background: '#ef4444', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 20px', cursor: 'pointer', fontSize: '14px', fontWeight: '500' },
  form:             { background: '#fff', padding: '20px', borderRadius: '12px', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '10px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
  editCard:         { background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px', marginTop: '6px' },
  avatar:           { width: '34px', height: '34px', borderRadius: '50%', background: '#eef2ff', color: '#4338ca', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '12px', flexShrink: 0 },
  scoreBadge:       { fontSize: '12px', fontWeight: '700', padding: '2px 8px', borderRadius: '999px' },
  overlay:          { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal:            { background: '#fff', borderRadius: '14px', padding: '28px', maxWidth: '360px', width: '90%', boxShadow: '0 8px 40px rgba(0,0,0,0.18)' },
}
