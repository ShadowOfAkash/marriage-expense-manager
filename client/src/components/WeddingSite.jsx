import React, { useEffect, useState } from 'react'
import { api } from '../utils/api'

export default function WeddingSite() {
  const [groups, setGroups] = useState(null)
  const [content, setContent] = useState({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    let active = true
    api.getWeddingSite().then(data => {
      if (!active) return
      setGroups(data.groups)
      setContent(data.content)
    }).catch(err => {
      if (active) setError(err.message)
    })
    return () => { active = false }
  }, [])

  async function publish(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setNotice('')
    try {
      const data = await api.saveWeddingSite(content)
      setContent(data.content)
      setNotice('Wedding website updated.')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-8">
      <header>
        <h1 className="text-2xl font-bold text-zinc-950">Wedding Website</h1>
        <p className="mt-1 text-sm text-zinc-600">Manage the information shown on your public wedding invitation.</p>
      </header>
      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {!groups && !error && <p role="status">Loading wedding website…</p>}
      {groups && (
        <form onSubmit={publish} className="space-y-5">
          <fieldset disabled={saving} className="space-y-5">
            {Object.entries(groups).map(([name, fields]) => (
              <section key={name} className="rounded-xl border border-zinc-200 bg-white p-5">
                <h2 className="mb-4 font-semibold text-zinc-950">{name}</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {Object.entries(fields).map(([key, field]) => {
                    const props = {
                      required: true,
                      value: content[key] ?? '',
                      onChange: event => {
                        const value = event.target.value
                        setContent(previous => ({ ...previous, [key]: value }))
                        setNotice('')
                      },
                      className: 'w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-950',
                    }
                    return (
                      <label key={key} className="space-y-1 text-sm font-medium text-zinc-700">
                        <span>{field.label}</span>
                        {field.default.length > 75
                          ? <textarea {...props} maxLength={1000} rows={3} />
                          : <input {...props} type={key.endsWith('At') ? 'datetime-local' : 'text'} maxLength={1000} />}
                      </label>
                    )
                  })}
                </div>
              </section>
            ))}
            <button type="submit" className="rounded-lg bg-[#234c6a] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
              {saving ? 'Publishing…' : 'Publish website changes'}
            </button>
          </fieldset>
          <p role="status" className="text-sm text-zinc-700">{notice}</p>
        </form>
      )}
    </div>
  )
}
