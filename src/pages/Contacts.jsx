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

export default function Contacts() {
  const [contacts, setContacts]     = useState([])
  const [companies, setCompanies]   = useState([])
  const [meta, setMeta]             = useState({ count: 0, total_pages: 1, current_page: 1 })
  const [loading, setLoading]       = useState(false)
  const [showForm, setShowForm]     = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [editingId, setEditingId]   = useState(null)
  const [editForm, setEditForm]     = useState(EMPTY_FORM)

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
        setContacts(res.data.results)
        setMeta({
          count:        res.data.count,
          total_pages:  res.data.total_pages,
          current_page: res.data.current_page,
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
    } catch (err) {
      console.error('Create error:', err.response?.data)
    }
  }

  const handleCreateCompany = async () => {
    if (!newCompanyName) return
    try {
      const res = await createCompany({ name: newCompanyName })
      setCompanies(prev => [...prev, res.data])
      setForm(prev => ({ ...prev, company: res.data.id }))
      setNewCompanyName('')
    } catch (err) {
      console.error('Company error:', err.response?.data)
    }
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
      email:      c.email || '',
      phone:      c.phone || '',
      role:       c.role  || '',
      company:    c.company || '',
      notes:      c.notes || '',
    })
  }

  const cancelEdit = () => { setEditingId(null); setEditForm(EMPTY_FORM) }

  const handleUpdate = async (e, id) => {
    e.preventDefault()
    try {
      await updateContact(id, { ...editForm, company: editForm.company || null, email: editForm.email || null })
      cancelEdit()
      fetchContacts({ search: debouncedSearch, company: debouncedCompany, role: debouncedRole, page })
    } catch (err) {
      console.error('Update error:', err.response?.data)
    }
  }

  const grouped = contacts.reduce((acc, c) => {
    const company = c.company_name || 'No Company'
    const role    = c.role || 'No Role'
    if (!acc[company]) acc[company] = {}
    if (!acc[company][role]) acc[company][role] = []
    acc[company][role].push(c)
    return acc
  }, {})

  return (
    <div style={{ padding: '20px' }}>

      <div style={styles.header}>
        <h2>Contacts {!loading && <span style={styles.count}>({meta.count})</span>}</h2>
        <button style={styles.btn} onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ New Contact'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} style={styles.form}>
          <input style={styles.input} placeholder="First name" value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })} required />
          <input style={styles.input} placeholder="Last name"  value={form.last_name}  onChange={e => setForm({ ...form, last_name: e.target.value })} required />
          <input style={styles.input} placeholder="Email"      value={form.email}      onChange={e => setForm({ ...form, email: e.target.value })} />
          <input style={styles.input} placeholder="Phone"      value={form.phone}      onChange={e => setForm({ ...form, phone: e.target.value })} />
          <select style={styles.input} value={form.company} onChange={e => setForm({ ...form, company: e.target.value })}>
            <option value="">Select Company</option>
            {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input style={styles.input} placeholder="New company" value={newCompanyName} onChange={e => setNewCompanyName(e.target.value)} />
            <button type="button" style={styles.btn} onClick={handleCreateCompany}>+</button>
          </div>
          <input    style={styles.input} placeholder="Role"  value={form.role}  onChange={e => setForm({ ...form, role: e.target.value })} />
          <textarea style={styles.input} placeholder="Notes" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
          <button style={styles.btn}>Create</button>
        </form>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <input style={styles.input} placeholder="Search..." value={search} onChange={handleSearch} />
        <select style={styles.input} value={companyFilter} onChange={handleCompany}>
          <option value="">All Companies</option>
          {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <input style={styles.input} placeholder="Role..." value={roleFilter} onChange={handleRole} />
      </div>

      {loading && <p style={{ color: '#888' }}>Loading…</p>}

      {/* Grouped contact list */}
      {!loading && Object.entries(grouped).map(([company, roles]) => (
        <div key={company}>
          <h3>{company}</h3>
          {Object.entries(roles).map(([role, people]) => (
            <div key={role}>
              <h4>{role}</h4>
              {[...people].sort((a, b) => b.relationship_score - a.relationship_score).map(c => (
                <div key={c.id}>
                  {editingId === c.id ? (
                    <form onSubmit={e => handleUpdate(e, c.id)} style={{ ...styles.card, flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input style={styles.input} placeholder="First name" value={editForm.first_name} onChange={e => setEditForm({ ...editForm, first_name: e.target.value })} required />
                        <input style={styles.input} placeholder="Last name"  value={editForm.last_name}  onChange={e => setEditForm({ ...editForm, last_name: e.target.value })} required />
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input style={styles.input} placeholder="Email" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} />
                        <input style={styles.input} placeholder="Phone" value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} />
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input style={styles.input} placeholder="Role" value={editForm.role} onChange={e => setEditForm({ ...editForm, role: e.target.value })} />
                        <select style={styles.input} value={editForm.company} onChange={e => setEditForm({ ...editForm, company: e.target.value })}>
                          <option value="">No Company</option>
                          {companies.map(co => <option key={co.id} value={co.id}>{co.name}</option>)}
                        </select>
                      </div>
                      <textarea style={styles.input} placeholder="Notes" value={editForm.notes} onChange={e => setEditForm({ ...editForm, notes: e.target.value })} />
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button style={styles.btn} type="submit">Save</button>
                        <button type="button" style={styles.cancelBtn} onClick={cancelEdit}>Cancel</button>
                      </div>
                    </form>
                  ) : (
                    <div style={styles.card}>
                      <div>
                        <div>{c.full_name}</div>
                        {c.email && <div style={{ fontSize: '12px', color: '#888' }}>{c.email}</div>}
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button style={styles.editBtn} onClick={() => startEdit(c)}>✎</button>
                        <button style={styles.deleteBtn} onClick={() => setConfirmDelete(c)}>✕</button>
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
          <button style={styles.btn} onClick={() => setPage(p => p - 1)} disabled={page === 1}>‹ Prev</button>
          <span style={{ fontSize: '14px', color: '#555' }}>Page {meta.current_page} of {meta.total_pages}</span>
          <button style={styles.btn} onClick={() => setPage(p => p + 1)} disabled={page === meta.total_pages}>Next ›</button>
        </div>
      )}

      {/* Delete modal */}
      {confirmDelete && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <p>Delete {confirmDelete.full_name}?</p>
            <button style={styles.btn} onClick={() => handleDelete(confirmDelete.id)}>Delete</button>
            <button onClick={() => setConfirmDelete(null)} style={{ marginLeft: '8px' }}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  )
}

const styles = {
  header:       { display: 'flex', justifyContent: 'space-between', marginBottom: '20px' },
  count:        { fontSize: '16px', fontWeight: 'normal', color: '#888' },
  btn:          { padding: '8px', background: '#6366f1', color: '#fff', border: 'none', cursor: 'pointer' },
  cancelBtn:    { padding: '8px', background: '#e5e7eb', color: '#374151', border: 'none', cursor: 'pointer' },
  editBtn:      { border: 'none', background: 'none', color: '#6366f1', cursor: 'pointer', fontSize: '16px' },
  form:         { display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' },
  input:        { padding: '8px', border: '1px solid #ddd', flex: 1 },
  card:         { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: '#fff', marginTop: '5px' },
  deleteBtn:    { border: 'none', background: 'none', color: 'red', cursor: 'pointer' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  modal:        { background: '#fff', padding: '20px', borderRadius: '8px' },
}
