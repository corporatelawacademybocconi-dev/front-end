import { useState, useEffect } from 'react'
import { getContacts, createContact, deleteContact, getCompanies, createCompany } from '../api/contacts'

export default function Contacts() {
  const [contacts, setContacts] = useState([])
  const [companies, setCompanies] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [companyFilter, setCompanyFilter] = useState('')
  const [roleFilter, setRoleFilter] = useState('')

  const [newCompanyName, setNewCompanyName] = useState('')

  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    role: '',
    company: '',
    notes: ''
  })

  useEffect(() => {
    getContacts().then(res => setContacts(res.data))
    getCompanies().then(res => setCompanies(res.data))
  }, [])

  // 🔥 Debounce search (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
    }, 300)

    return () => clearTimeout(timer)
  }, [search])

  const handleCreate = async (e) => {
    e.preventDefault()

    try {
      const res = await createContact({
        ...form,
        company: form.company || null,
        email: form.email || null
      })

      setContacts([...contacts, res.data])

      setForm({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        role: '',
        company: '',
        notes: ''
      })

      setShowForm(false)

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
    setContacts(prev => prev.filter(c => c.id !== id))
  }

  const getCompanyName = (contact) => {
    const company = companies.find(c => c.id === contact.company)
    return company ? company.name : 'No Company'
  }

  // 🔥 Optimized filter
  const filteredContacts = contacts.filter(c => {
    const company = getCompanyName(c)
    const role = c.role || 'No Role'
    const q = debouncedSearch.toLowerCase()

    return (
      (!q ||
        `${c.first_name} ${c.last_name}`.toLowerCase().includes(q) ||
        (c.email || '').toLowerCase().includes(q) ||
        company.toLowerCase().includes(q) ||
        role.toLowerCase().includes(q)
      ) &&
      (companyFilter ? String(c.company) === companyFilter : true) &&
      (roleFilter ? role === roleFilter : true)
    )
  })

  // GROUP + SORT
  const groupedContacts = filteredContacts.reduce((acc, contact) => {
    const company = getCompanyName(contact)
    const role = contact.role || 'No Role'

    if (!acc[company]) acc[company] = {}
    if (!acc[company][role]) acc[company][role] = []

    acc[company][role].push(contact)
    return acc
  }, {})

  const roles = [...new Set(contacts.map(c => c.role || 'No Role'))]

  return (
    <div style={{ padding: '20px' }}>

      <div style={styles.header}>
        <h2>Contacts</h2>
        <button style={styles.btn} onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ New Contact'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} style={styles.form}>
          <input style={styles.input} placeholder="First name" value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })} required />
          <input style={styles.input} placeholder="Last name" value={form.last_name} onChange={e => setForm({ ...form, last_name: e.target.value })} required />
          <input style={styles.input} placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          <input style={styles.input} placeholder="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />

          <select style={styles.input} value={form.company} onChange={e => setForm({ ...form, company: e.target.value })}>
            <option value="">Select Company</option>
            {companies.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              style={styles.input}
              placeholder="New company"
              value={newCompanyName}
              onChange={e => setNewCompanyName(e.target.value)}
            />
            <button type="button" style={styles.btn} onClick={handleCreateCompany}>+</button>
          </div>

          <input style={styles.input} placeholder="Role" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} />
          <textarea style={styles.input} placeholder="Notes" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />

          <button style={styles.btn}>Create</button>
        </form>
      )}

      {/* 🔍 SEARCH + FILTERS */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <input
          style={styles.input}
          placeholder="Search..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        <select style={styles.input} value={companyFilter} onChange={e => setCompanyFilter(e.target.value)}>
          <option value="">All Companies</option>
          {companies.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <select style={styles.input} value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
          <option value="">All Roles</option>
          {roles.map(r => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>

      {/* LIST */}
      {Object.entries(groupedContacts).map(([company, roles]) => (
        <div key={company}>
          <h3>{company}</h3>

          {Object.entries(roles).map(([role, people]) => (
            <div key={role}>
              <h4>{role}</h4>

              {[...people].sort((a, b) => b.relationship_score - a.relationship_score).map(c => (
                <div key={c.id} style={styles.card}>
                  <div>{c.full_name}</div>

                  <button
                    style={styles.deleteBtn}
                    onClick={() => setConfirmDelete(c)}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          ))}
        </div>
      ))}

      {/* DELETE MODAL */}
      {confirmDelete && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <p>Delete {confirmDelete.full_name}?</p>

            <button
              style={styles.btn}
              onClick={() => {
                handleDelete(confirmDelete.id)
                setConfirmDelete(null)
              }}
            >
              Delete
            </button>

            <button onClick={() => setConfirmDelete(null)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  )
}

const styles = {
  header: { display: 'flex', justifyContent: 'space-between', marginBottom: '20px' },
  btn: { padding: '8px', background: '#6366f1', color: '#fff', border: 'none', cursor: 'pointer' },
  form: { display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' },
  input: { padding: '8px', border: '1px solid #ddd' },
  card: { display: 'flex', justifyContent: 'space-between', padding: '10px', background: '#fff', marginTop: '5px' },
  deleteBtn: { border: 'none', background: 'none', color: 'red', cursor: 'pointer' },
  modalOverlay: {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  modal: { background: '#fff', padding: '20px', borderRadius: '8px' }
}