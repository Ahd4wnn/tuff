import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'
import CustomSelect from '../components/ui/CustomSelect'
import { 
  Briefcase, 
  Heart, 
  Coins, 
  Users, 
  GraduationCap, 
  User, 
  Rocket, 
  Target, 
  ChevronUp, 
  ChevronDown, 
  Check, 
  X,
  CirclePause,
  CircleOff,
  CircleCheck,
  CircleDot
} from 'lucide-react'

const CATEGORY_OPTIONS = [
  { value: 'career',        label: 'Career',        icon: Briefcase    },
  { value: 'health',        label: 'Health',        icon: Heart        },
  { value: 'finance',       label: 'Finance',       icon: Coins        },
  { value: 'relationships', label: 'Relationships', icon: Users        },
  { value: 'learning',      label: 'Learning',      icon: GraduationCap },
  { value: 'personal',      label: 'Personal',      icon: User         },
  { value: 'startup',       label: 'Startup',       icon: Rocket       },
]

const STATUS_OPTIONS = [
  { value: 'active',    label: 'Active',    icon: CircleDot   },
  { value: 'completed', label: 'Completed', icon: CircleCheck },
  { value: 'paused',    label: 'Paused',    icon: CirclePause },
  { value: 'dropped',   label: 'Dropped',   icon: CircleOff   },
]

// Kept for GoalCard badge colours
const STATUS_COLORS = {
  active: { bg: '#1A1A1A', color: '#F5F4F0' },
  completed: { bg: '#C8B89A', color: '#1A1A1A' },
  paused: { bg: '#ECEAE4', color: '#7A7A7A' },
  dropped: { bg: '#ECEAE4', color: '#AEACA6' },
}

// Legacy map used in GoalCard icon rendering
const CATEGORY_ICONS = {
  career: Briefcase, health: Heart, finance: Coins,
  relationships: Users, learning: GraduationCap, personal: User, startup: Rocket,
}

export default function Goals() {
  const { profile } = useAuth()
  const [goals, setGoals] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editGoal, setEditGoal] = useState(null)
  const [expandedId, setExpandedId] = useState(null)
  const [milestones, setMilestones] = useState({})
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    if (profile?.id) fetchGoals()
  }, [profile])

  async function fetchGoals() {
    setLoading(true)
    const { data } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
    setGoals(data || [])
    setLoading(false)
  }

  async function fetchMilestones(goalId) {
    const { data } = await supabase
      .from('milestones')
      .select('*')
      .eq('goal_id', goalId)
      .order('created_at', { ascending: true })
    setMilestones(m => ({ ...m, [goalId]: data || [] }))
  }

  async function toggleExpand(goalId) {
    if (expandedId === goalId) { setExpandedId(null); return }
    setExpandedId(goalId)
    if (!milestones[goalId]) await fetchMilestones(goalId)
  }

  async function toggleMilestone(milestone) {
    const newDone = !milestone.is_done

    // 1. Flip the milestone
    await supabase.from('milestones')
      .update({ is_done: newDone })
      .eq('id', milestone.id)

    // 2. Re-fetch all milestones for this goal so we have the fresh truth
    const { data: allMilestones } = await supabase
      .from('milestones')
      .select('is_done')
      .eq('goal_id', milestone.goal_id)

    // 3. Recalculate progress percentage
    if (allMilestones && allMilestones.length > 0) {
      const doneCount = allMilestones.filter(m => m.is_done).length
      const progress = Math.round((doneCount / allMilestones.length) * 100)
      await supabase.from('goals')
        .update({ progress })
        .eq('id', milestone.goal_id)
    }

    // 4. Refresh local state
    await fetchMilestones(milestone.goal_id)
    await fetchGoals()
  }

  async function deleteGoal(id) {
    await supabase.from('goals').delete().eq('id', id)
    toast.success('Goal removed.')
    fetchGoals()
  }

  const filtered = filter === 'all' ? goals : goals.filter(g => g.status === filter)
  const activeCount = goals.filter(g => g.status === 'active').length
  const completedCount = goals.filter(g => g.status === 'completed').length

  return (
    <div style={{ paddingBottom: '2rem' }}>

      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'flex-start', marginBottom: '1.5rem',
      }}>
        <div>
          <h2 style={{
            fontSize: 'clamp(1.75rem, 5vw, 2.2rem)', fontWeight: 900,
            letterSpacing: '-0.04em', color: '#1A1A1A', margin: 0,
          }}>Goals.</h2>
          <p style={{ color: '#7A7A7A', fontSize: '0.85rem', margin: '0.3rem 0 0' }}>
            {activeCount} active · {completedCount} completed
          </p>
        </div>
        <button onClick={() => { setEditGoal(null); setShowModal(true) }} style={{
          background: '#1A1A1A', color: '#F5F4F0', border: 'none',
          borderRadius: '0.875rem', padding: '0.65rem 1.25rem',
          fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
          fontFamily: 'Inter, system-ui, sans-serif', letterSpacing: '-0.01em',
        }}>+ Add goal</button>
      </div>

      {/* Filter tabs */}
      <div style={{
        display: 'flex', gap: '0.4rem',
        flexWrap: 'wrap', marginBottom: '1.25rem',
      }}>
        {['all', 'active', 'completed', 'paused'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '0.35rem 0.85rem',
            borderRadius: '99px', border: '1px solid',
            borderColor: filter === f ? '#1A1A1A' : '#E0DED8',
            background: filter === f ? '#1A1A1A' : 'transparent',
            color: filter === f ? '#F5F4F0' : '#7A7A7A',
            fontSize: '0.78rem', fontWeight: 500,
            cursor: 'pointer', fontFamily: 'Inter, system-ui, sans-serif',
            transition: 'all 0.15s ease', textTransform: 'capitalize',
          }}>{f}</button>
        ))}
      </div>

      {/* Goals list */}
      {loading ? (
        <div style={{ textAlign: 'center', color: '#7A7A7A', padding: '3rem 0', fontSize: '0.875rem' }}>
          Loading...
        </div>
      ) : filtered.length === 0 ? (
        <div style={{
          background: '#ECEAE4', border: '1px solid #E0DED8',
          borderRadius: '1.25rem', padding: '2.5rem',
          textAlign: 'center',
        }}>
          <div style={{ marginBottom: '0.75rem', display: 'flex', justifyContent: 'center' }}>
            <Target size={40} strokeWidth={1.5} style={{ color: '#7A7A7A' }} />
          </div>
          <p style={{ color: '#1A1A1A', fontWeight: 600, margin: '0 0 0.35rem', fontSize: '0.95rem' }}>
            No goals yet.
          </p>
          <p style={{ color: '#7A7A7A', fontSize: '0.825rem', margin: '0 0 1.25rem' }}>
            Set your first goal and start moving.
          </p>
          <button onClick={() => { setEditGoal(null); setShowModal(true) }} style={{
            background: '#1A1A1A', color: '#F5F4F0', border: 'none',
            borderRadius: '0.75rem', padding: '0.6rem 1.25rem',
            fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer',
            fontFamily: 'Inter, system-ui, sans-serif',
          }}>Set a goal →</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filtered.map(goal => (
            <GoalCard
              key={goal.id}
              goal={goal}
              expanded={expandedId === goal.id}
              milestones={milestones[goal.id] || []}
              onExpand={() => toggleExpand(goal.id)}
              onEdit={() => { setEditGoal(goal); setShowModal(true) }}
              onDelete={() => deleteGoal(goal.id)}
              onToggleMilestone={toggleMilestone}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <GoalModal
          goal={editGoal}
          profile={profile}
          onClose={() => setShowModal(false)}
          onSave={() => { setShowModal(false); fetchGoals() }}
        />
      )}
    </div>
  )
}

function GoalCard({ goal, expanded, milestones, onExpand, onEdit, onDelete, onToggleMilestone }) {
  const status = STATUS_COLORS[goal.status] || STATUS_COLORS.active
  const doneMilestones = milestones.filter(m => m.is_done).length

  return (
    <div style={{
      background: '#ECEAE4', border: '1px solid #E0DED8',
      borderRadius: '1.25rem', overflow: 'hidden',
      transition: 'all 0.2s ease',
    }}>
      {/* Card header */}
      <div
        onClick={onExpand}
        style={{
          padding: '1.1rem 1.25rem', cursor: 'pointer',
          display: 'flex', alignItems: 'flex-start',
          justifyContent: 'space-between', gap: '1rem',
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
            <span style={{ display: 'flex', alignItems: 'center' }}>
              {(() => {
                const CategoryIcon = CATEGORY_ICONS[goal.category] || Target
                return <CategoryIcon size={16} strokeWidth={2.2} style={{ color: '#7A7A7A' }} />
              })()}
            </span>
            <span style={{
              fontSize: '0.68rem', fontWeight: 600,
              letterSpacing: '0.06em', textTransform: 'uppercase',
              color: '#7A7A7A',
            }}>{goal.category}</span>
            <span style={{
              padding: '0.15rem 0.6rem', borderRadius: '99px',
              fontSize: '0.68rem', fontWeight: 600,
              background: status.bg, color: status.color,
            }}>{goal.status}</span>
          </div>
          <h3 style={{
            fontSize: '1rem', fontWeight: 700,
            color: '#1A1A1A', margin: '0 0 0.4rem',
            letterSpacing: '-0.02em',
          }}>{goal.title}</h3>
          {goal.description && (
            <p style={{
              fontSize: '0.8rem', color: '#7A7A7A',
              margin: '0 0 0.6rem', lineHeight: 1.5,
            }}>{goal.description}</p>
          )}

          {/* Progress bar */}
          <div style={{
            height: '4px', background: '#E0DED8',
            borderRadius: '99px', overflow: 'hidden',
          }}>
            <div style={{
              height: '100%', background: '#1A1A1A',
              width: `${goal.progress || 0}%`,
              borderRadius: '99px', transition: 'width 0.4s ease',
            }} />
          </div>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            marginTop: '0.35rem',
          }}>
            <span style={{ fontSize: '0.7rem', color: '#7A7A7A' }}>
              {milestones.length > 0 ? `${doneMilestones}/${milestones.length} milestones` : 'No milestones'}
            </span>
            <span style={{ fontSize: '0.7rem', color: '#7A7A7A', fontWeight: 600 }}>
              {goal.progress || 0}%
            </span>
          </div>
        </div>

        <span style={{ color: '#7A7A7A', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </span>
      </div>

      {/* Expanded: milestones + actions */}
      {expanded && (
        <div style={{
          borderTop: '1px solid #E0DED8',
          padding: '1rem 1.25rem',
          background: 'rgba(245,244,240,0.5)',
        }}>
          {milestones.length === 0 ? (
            <p style={{ fontSize: '0.8rem', color: '#7A7A7A', margin: '0 0 1rem' }}>
              No milestones added yet.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
              {milestones.map(m => (
                <div key={m.id} style={{
                  display: 'flex', alignItems: 'center', gap: '0.65rem',
                  cursor: 'pointer',
                }} onClick={() => onToggleMilestone(m)}>
                  <div style={{
                    width: '18px', height: '18px', borderRadius: '50%', flexShrink: 0,
                    border: `1.5px solid ${m.is_done ? '#1A1A1A' : '#C8B89A'}`,
                    background: m.is_done ? '#1A1A1A' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#F5F4F0',
                  }}>
                    {m.is_done && <Check size={11} strokeWidth={3} />}
                  </div>
                  <span style={{
                    fontSize: '0.85rem', color: m.is_done ? '#7A7A7A' : '#1A1A1A',
                    textDecoration: m.is_done ? 'line-through' : 'none',
                    fontWeight: m.is_done ? 400 : 500,
                  }}>{m.title}</span>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={onEdit} style={{
              flex: 1, padding: '0.55rem',
              background: '#1A1A1A', color: '#F5F4F0',
              border: 'none', borderRadius: '0.65rem',
              fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
              fontFamily: 'Inter, system-ui, sans-serif',
            }}>Edit</button>
            <button onClick={onDelete} style={{
              padding: '0.55rem 1rem',
              background: 'transparent', color: '#7A7A7A',
              border: '1px solid #E0DED8', borderRadius: '0.65rem',
              fontSize: '0.8rem', fontWeight: 500, cursor: 'pointer',
              fontFamily: 'Inter, system-ui, sans-serif',
            }}>Delete</button>
          </div>
        </div>
      )}
    </div>
  )
}

function GoalModal({ goal, profile, onClose, onSave }) {
  const isEdit = !!goal
  const [form, setForm] = useState({
    title: goal?.title || '',
    description: goal?.description || '',
    category: goal?.category || 'personal',
    status: goal?.status || 'active',
    target_date: goal?.target_date || '',
    progress: goal?.progress || 0,
  })
  const [milestoneInput, setMilestoneInput] = useState('')
  const [milestones, setMilestones] = useState([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (goal?.id) {
      supabase.from('milestones').select('*')
        .eq('goal_id', goal.id).order('created_at')
        .then(({ data }) => setMilestones(data || []))
    }
  }, [goal])

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  async function handleSave() {
    if (!form.title.trim()) { toast.error('Title is required.'); return }
    setSaving(true)
    try {
      let goalId = goal?.id
      if (isEdit) {
        await supabase.from('goals').update(form).eq('id', goalId)
      } else {
        const { data } = await supabase.from('goals')
          .insert({ ...form, user_id: profile.id }).select().single()
        goalId = data.id
      }
      // Save new milestones
      const newOnes = milestones.filter(m => !m.id)
      if (newOnes.length > 0) {
        await supabase.from('milestones').insert(
          newOnes.map(m => ({ title: m.title, goal_id: goalId, user_id: profile.id }))
        )
      }
      toast.success(isEdit ? 'Goal updated.' : 'Goal created.')
      onSave()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  function addMilestone() {
    if (!milestoneInput.trim()) return
    setMilestones(m => [...m, { title: milestoneInput.trim(), is_done: false }])
    setMilestoneInput('')
  }

  async function deleteMilestone(m, idx) {
    if (m.id) {
      await supabase.from('milestones').delete().eq('id', m.id)
    }
    setMilestones(ms => ms.filter((_, i) => i !== idx))
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 999,
      background: 'rgba(26,26,26,0.5)',
      backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'flex-end',
      justifyContent: 'center', padding: '0',
    }}>
      <div style={{
        background: '#F5F4F0', width: '100%',
        maxWidth: '560px', borderRadius: '1.5rem 1.5rem 0 0',
        padding: '1.75rem 1.5rem',
        maxHeight: '92dvh', overflowY: 'auto',
      }}>
        {/* Handle */}
        <div style={{
          width: '36px', height: '4px', borderRadius: '99px',
          background: '#E0DED8', margin: '0 auto 1.5rem',
        }} />

        <h3 style={{
          fontSize: '1.2rem', fontWeight: 800,
          letterSpacing: '-0.03em', color: '#1A1A1A', margin: '0 0 1.5rem',
        }}>{isEdit ? 'Edit goal' : 'New goal'}</h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <ModalField label="Title">
            <input value={form.title} onChange={e => set('title', e.target.value)}
              placeholder="What do you want to achieve?" style={mInputStyle} />
          </ModalField>

          <ModalField label="Description">
            <textarea value={form.description} onChange={e => set('description', e.target.value)}
              placeholder="Why does this matter to you?" rows={2}
              style={{ ...mInputStyle, resize: 'none', lineHeight: 1.5 }} />
          </ModalField>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <ModalField label="Category">
              <CustomSelect
                value={form.category}
                onChange={e => set('category', e.target.value)}
                options={CATEGORY_OPTIONS}
              />
            </ModalField>
            <ModalField label="Status">
              <CustomSelect
                value={form.status}
                onChange={e => set('status', e.target.value)}
                options={STATUS_OPTIONS}
              />
            </ModalField>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <ModalField label="Target date">
              <input type="date" value={form.target_date}
                onChange={e => set('target_date', e.target.value)} style={mInputStyle} />
            </ModalField>
            <ModalField label={`Progress: ${form.progress}%`}>
              <input type="range" min={0} max={100} value={form.progress}
                onChange={e => set('progress', parseInt(e.target.value))}
                style={{ width: '100%', marginTop: '0.6rem', accentColor: '#1A1A1A' }} />
            </ModalField>
          </div>

          {/* Milestones */}
          <ModalField label="Milestones">
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <input
                value={milestoneInput}
                onChange={e => setMilestoneInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addMilestone()}
                placeholder="Add a milestone..."
                style={{ ...mInputStyle, flex: 1 }}
              />
              <button onClick={addMilestone} style={{
                background: '#1A1A1A', color: '#F5F4F0', border: 'none',
                borderRadius: '0.65rem', padding: '0 0.875rem',
                fontWeight: 600, cursor: 'pointer', fontSize: '1rem',
                fontFamily: 'Inter, system-ui, sans-serif',
              }}>+</button>
            </div>
            {milestones.map((m, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.5rem 0.75rem',
                background: '#ECEAE4', borderRadius: '0.65rem',
                marginBottom: '0.35rem',
              }}>
                <span style={{ fontSize: '0.85rem', color: '#1A1A1A' }}>{m.title}</span>
                <button onClick={() => deleteMilestone(m, i)} style={{
                  background: 'none', border: 'none', color: '#7A7A7A',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0,
                }}>
                  <X size={14} />
                </button>
              </div>
            ))}
          </ModalField>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.75rem' }}>
          <button onClick={onClose} style={{
            flex: 1, padding: '0.875rem', background: 'transparent',
            border: '1px solid #E0DED8', borderRadius: '0.875rem',
            color: '#7A7A7A', fontWeight: 600, cursor: 'pointer',
            fontFamily: 'Inter, system-ui, sans-serif', fontSize: '0.9rem',
          }}>Cancel</button>
          <button onClick={handleSave} disabled={saving} style={{
            flex: 2, padding: '0.875rem',
            background: saving ? '#7A7A7A' : '#1A1A1A',
            color: '#F5F4F0', border: 'none', borderRadius: '0.875rem',
            fontWeight: 700, fontSize: '0.9rem',
            cursor: saving ? 'not-allowed' : 'pointer',
            fontFamily: 'Inter, system-ui, sans-serif',
          }}>{saving ? 'Saving...' : isEdit ? 'Save changes' : 'Create goal'}</button>
        </div>
      </div>
    </div>
  )
}

function ModalField({ label, children }) {
  return (
    <div>
      <label style={{
        display: 'block', fontSize: '0.75rem', fontWeight: 500,
        color: '#3D3D3D', marginBottom: '0.35rem',
      }}>{label}</label>
      {children}
    </div>
  )
}

const mInputStyle = {
  width: '100%', padding: '0.7rem 0.875rem',
  background: '#ECEAE4', border: '1px solid #E0DED8',
  borderRadius: '0.75rem', fontSize: '0.875rem', color: '#1A1A1A',
  outline: 'none', fontFamily: 'Inter, system-ui, sans-serif',
  boxSizing: 'border-box',
}
