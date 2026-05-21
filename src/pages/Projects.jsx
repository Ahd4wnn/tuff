import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'
import dayjs from 'dayjs'
import isoWeek from 'dayjs/plugin/isoWeek'
import CustomSelect from '../components/ui/CustomSelect'
import {
  Rocket,
  Laptop,
  GraduationCap,
  Briefcase,
  Folder,
  Plus,
  Check,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  ExternalLink,
  GitBranch,
  Pencil,
  Trash2,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  PauseCircle,
  Archive,
  CircleDot,
  X
} from 'lucide-react'

dayjs.extend(isoWeek)

const TYPE_ICONS = {
  startup: Rocket,
  side_project: Laptop,
  academic: GraduationCap,
  freelance: Briefcase,
  other: Folder,
}

const TYPE_OPTIONS = [
  { value: 'startup', label: 'Startup', icon: Rocket },
  { value: 'side_project', label: 'Side project', icon: Laptop },
  { value: 'academic', label: 'Academic', icon: GraduationCap },
  { value: 'freelance', label: 'Freelance', icon: Briefcase },
  { value: 'other', label: 'Other', icon: Folder },
]

const STATUS_COLORS = {
  idea:     { bg: '#ECEAE4', color: '#7A7A7A' },
  active:   { bg: '#1A1A1A', color: '#F5F4F0' },
  launched: { bg: '#C8B89A', color: '#1A1A1A' },
  paused:   { bg: '#E0DED8', color: '#7A7A7A' },
  archived: { bg: '#ECEAE4', color: '#AEACA6' },
}

const STATUS_OPTIONS = [
  { value: 'idea', label: 'Idea', icon: Lightbulb },
  { value: 'active', label: 'Active', icon: CircleDot },
  { value: 'launched', label: 'Launched', icon: CheckCircle2 },
  { value: 'paused', label: 'Paused', icon: PauseCircle },
  { value: 'archived', label: 'Archived', icon: Archive },
]

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

// Custom inline SVG for Github to prevent old lucide export issues
const GithubIcon = (props) => (
  <svg
    viewBox="0 0 24 24"
    width="1em"
    height="1em"
    stroke="currentColor"
    strokeWidth="2.2"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
)

export default function Projects() {
  const { profile } = useAuth()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editProject, setEditProject] = useState(null)
  const [expandedId, setExpandedId] = useState(null)
  const [tasks, setTasks] = useState({})
  const [githubData, setGithubData] = useState(null)
  const [githubLoading, setGithubLoading] = useState(false)
  const [showGithubSetup, setShowGithubSetup] = useState(false)
  const [githubInput, setGithubInput] = useState('')
  const [filter, setFilter] = useState('all')

  const weekStart = dayjs().startOf('isoWeek').format('YYYY-MM-DD')
  const weekEnd = dayjs().endOf('isoWeek').format('YYYY-MM-DD')

  useEffect(() => {
    if (profile?.id) {
      fetchProjects()
      if (profile.github_username) fetchGithub(profile.github_username)
    }
  }, [profile])

  async function fetchProjects() {
    setLoading(true)
    const { data } = await supabase
      .from('projects').select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
    setProjects(data || [])
    setLoading(false)
  }

  async function fetchTasks(projectId) {
    const { data } = await supabase
      .from('tasks').select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true })
    setTasks(t => ({ ...t, [projectId]: data || [] }))
  }

  async function toggleExpand(id) {
    if (expandedId === id) { setExpandedId(null); return }
    setExpandedId(id)
    if (!tasks[id]) await fetchTasks(id)
  }

  async function toggleTask(task) {
    const newStatus = task.status === 'done' ? 'todo' : 'done'
    await supabase.from('tasks').update({ status: newStatus }).eq('id', task.id)
    fetchTasks(task.project_id)
  }

  async function toggleWeeklyGoal(project) {
    await supabase.from('projects')
      .update({ weekly_goal_done: !project.weekly_goal_done })
      .eq('id', project.id)
    fetchProjects()
  }

  async function deleteProject(id) {
    await supabase.from('projects').delete().eq('id', id)
    toast.success('Project removed.')
    if (expandedId === id) setExpandedId(null)
    fetchProjects()
  }

  async function fetchGithub(username) {
    setGithubLoading(true)
    try {
      const res = await fetch(`https://api.github.com/users/${username}/events/public?per_page=100`)
      if (!res.ok) throw new Error('GitHub user not found')
      const events = await res.json()

      // Build contribution map for last 7 days
      const last7 = Array.from({ length: 7 }, (_, i) =>
        dayjs().subtract(6 - i, 'day').format('YYYY-MM-DD')
      )
      const contribMap = {}
      last7.forEach(d => { contribMap[d] = 0 })

      events.forEach(e => {
        const date = e.created_at?.split('T')[0]
        if (contribMap[date] !== undefined) {
          if (['PushEvent', 'CreateEvent', 'PullRequestEvent', 'IssuesEvent'].includes(e.type)) {
            contribMap[date]++
          }
        }
      })

      // Recent repos pushed to
      const repoSet = new Set()
      const recentRepos = []
      events.forEach(e => {
        if (e.type === 'PushEvent' && !repoSet.has(e.repo.name)) {
          repoSet.add(e.repo.name)
          recentRepos.push({
            name: e.repo.name.split('/')[1],
            fullName: e.repo.name,
            commits: e.payload?.commits?.length || 0,
            date: e.created_at?.split('T')[0],
          })
        }
      })

      const totalWeek = Object.values(contribMap).reduce((a, b) => a + b, 0)
      setGithubData({
        username,
        contribMap,
        last7,
        recentRepos: recentRepos.slice(0, 5),
        totalWeek,
      })
    } catch (err) {
      toast.error('Could not load GitHub data.')
      setGithubData(null)
    } finally {
      setGithubLoading(false)
    }
  }

  async function saveGithubUsername() {
    if (!githubInput.trim()) return
    await supabase.from('profiles')
      .update({ github_username: githubInput.trim() })
      .eq('id', profile.id)
    toast.success('GitHub connected.')
    setShowGithubSetup(false)
    fetchGithub(githubInput.trim())
  }

  const filtered = filter === 'all' ? projects : projects.filter(p => p.status === filter)
  const activeProjects = projects.filter(p => p.status === 'active')
  const weeklyGoalProjects = projects.filter(p => p.weekly_goal)
  const weeklyDone = weeklyGoalProjects.filter(p => p.weekly_goal_done).length

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
          }}>Projects.</h2>
          <p style={{ color: '#7A7A7A', fontSize: '0.85rem', margin: '0.3rem 0 0' }}>
            {activeProjects.length} active · week of {dayjs().startOf('isoWeek').format('MMM D')}
          </p>
        </div>
        <button onClick={() => { setEditProject(null); setShowModal(true) }} style={{
          background: '#1A1A1A', color: '#F5F4F0', border: 'none',
          borderRadius: '0.875rem', padding: '0.65rem 1.25rem',
          fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
          fontFamily: 'Inter, system-ui, sans-serif',
          display: 'flex', alignItems: 'center', gap: '0.35rem'
        }}>
          <Plus size={14} strokeWidth={2.5} />
          <span>New project</span>
        </button>
      </div>

      {/* Weekly goal summary card */}
      {weeklyGoalProjects.length > 0 && (
        <div style={{
          background: '#1A1A1A', borderRadius: '1.1rem',
          padding: '1.1rem 1.25rem', marginBottom: '1.25rem',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: '-20px', right: '-20px',
            width: '100px', height: '100px', borderRadius: '50%',
            border: '1px solid rgba(200,184,154,0.15)', pointerEvents: 'none',
          }} />
          <p style={{
            fontSize: '0.7rem', fontWeight: 600, color: '#C8B89A',
            margin: '0 0 0.75rem', letterSpacing: '0.08em', textTransform: 'uppercase',
          }}>This week's goals</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {weeklyGoalProjects.map(p => (
              <div key={p.id} style={{
                display: 'flex', alignItems: 'center',
                justifyContent: 'space-between', gap: '0.75rem',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flex: 1, minWidth: 0 }}>
                  <button
                    onClick={() => toggleWeeklyGoal(p)}
                    style={{
                      width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0,
                      border: `1.5px solid ${p.weekly_goal_done ? 'rgba(245,244,240,0.3)' : '#C8B89A'}`,
                      background: p.weekly_goal_done ? 'rgba(245,244,240,0.15)' : 'transparent',
                      color: p.weekly_goal_done ? '#F5F4F0' : '#C8B89A',
                      cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    {p.weekly_goal_done ? <Check size={11} strokeWidth={3} /> : <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#C8B89A' }} />}
                  </button>
                  <div style={{ minWidth: 0 }}>
                    <p style={{
                      margin: 0, fontSize: '0.8rem', fontWeight: 600,
                      color: '#F5F4F0', opacity: p.weekly_goal_done ? 0.5 : 1,
                      textDecoration: p.weekly_goal_done ? 'line-through' : 'none',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>{p.weekly_goal}</p>
                    <p style={{
                      margin: 0, fontSize: '0.68rem',
                      color: 'rgba(245,244,240,0.4)',
                    }}>{p.title}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {weeklyGoalProjects.length > 0 && (
            <div style={{ marginTop: '0.875rem' }}>
              <div style={{
                height: '3px', background: 'rgba(245,244,240,0.1)',
                borderRadius: '99px', overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%', background: '#C8B89A',
                  width: `${(weeklyDone / weeklyGoalProjects.length) * 100}%`,
                  borderRadius: '99px', transition: 'width 0.4s ease',
                }} />
              </div>
              <p style={{
                margin: '0.4rem 0 0', fontSize: '0.7rem',
                color: 'rgba(245,244,240,0.35)',
              }}>{weeklyDone}/{weeklyGoalProjects.length} weekly goals done</p>
            </div>
          )}
        </div>
      )}

      {/* GitHub contribution panel */}
      <div style={{
        background: '#ECEAE4', border: '1px solid #E0DED8',
        borderRadius: '1.1rem', padding: '1.1rem 1.25rem',
        marginBottom: '1.25rem',
      }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', marginBottom: '0.75rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: '#1A1A1A', display: 'flex', alignItems: 'center' }}><GithubIcon size={16} /></span>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1A1A1A' }}>
              GitHub — last 7 days
            </span>
          </div>
          {profile?.github_username ? (
            <button onClick={() => fetchGithub(profile.github_username)} style={{
              background: 'none', border: 'none', color: '#7A7A7A',
              fontSize: '0.75rem', cursor: 'pointer',
              fontFamily: 'Inter, system-ui, sans-serif', fontWeight: 500,
              display: 'flex', alignItems: 'center', gap: '0.2rem'
            }}>
              <RefreshCw size={11} />
              <span>refresh</span>
            </button>
          ) : (
            <button onClick={() => setShowGithubSetup(true)} style={{
              background: '#1A1A1A', color: '#F5F4F0', border: 'none',
              borderRadius: '0.6rem', padding: '0.3rem 0.75rem',
              fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer',
              fontFamily: 'Inter, system-ui, sans-serif',
            }}>Connect GitHub</button>
          )}
        </div>

        {!profile?.github_username ? (
          <p style={{ fontSize: '0.8rem', color: '#7A7A7A', margin: 0 }}>
            Connect your GitHub to see your contribution activity here.
          </p>
        ) : githubLoading ? (
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', padding: '0.5rem 0' }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{
                width: '6px', height: '6px', borderRadius: '50%',
                background: '#C8B89A',
                animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
              }} />
            ))}
          </div>
        ) : githubData ? (
          <>
            {/* Heatmap row */}
            <div style={{ marginBottom: '0.75rem' }}>
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                marginBottom: '0.35rem',
              }}>
                {githubData.last7.map(d => (
                  <div key={d} style={{ textAlign: 'center', flex: 1 }}>
                    <div style={{ fontSize: '0.6rem', color: '#7A7A7A', marginBottom: '4px' }}>
                      {DAYS_OF_WEEK[dayjs(d).day() === 0 ? 6 : dayjs(d).day() - 1]}
                    </div>
                    <div style={{
                      width: '100%', aspectRatio: '1',
                      maxWidth: '32px', margin: '0 auto',
                      borderRadius: '4px',
                      background: githubData.contribMap[d] === 0
                        ? '#E0DED8'
                        : githubData.contribMap[d] <= 2
                        ? '#C8B89A'
                        : githubData.contribMap[d] <= 5
                        ? '#7A7A7A'
                        : '#1A1A1A',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.6rem', color: githubData.contribMap[d] > 2 ? '#F5F4F0' : '#3D3D3D',
                      fontWeight: 600, transition: 'background 0.2s ease',
                    }}>
                      {githubData.contribMap[d] > 0 ? githubData.contribMap[d] : ''}
                    </div>
                  </div>
                ))}
              </div>
              <p style={{ margin: '0.5rem 0 0', fontSize: '0.75rem', color: '#7A7A7A' }}>
                <span style={{ fontWeight: 700, color: '#1A1A1A' }}>{githubData.totalWeek}</span> contributions this week
                {' · '}
                <a href={`https://github.com/${githubData.username}`} target="_blank"
                  rel="noreferrer" style={{ color: '#1A1A1A', fontWeight: 600 }}>
                  @{githubData.username}
                </a>
              </p>
            </div>

            {/* Recent repos */}
            {githubData.recentRepos.length > 0 && (
              <div style={{ borderTop: '1px solid #E0DED8', paddingTop: '0.75rem' }}>
                <p style={{
                  fontSize: '0.7rem', fontWeight: 600, color: '#7A7A7A',
                  margin: '0 0 0.5rem', textTransform: 'uppercase', letterSpacing: '0.06em',
                }}>Recent pushes</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  {githubData.recentRepos.map(r => (
                    <a key={r.fullName}
                      href={`https://github.com/${r.fullName}`}
                      target="_blank" rel="noreferrer"
                      style={{ textDecoration: 'none' }}
                    >
                      <div style={{
                        display: 'flex', justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0.45rem 0.75rem',
                        background: 'rgba(245,244,240,0.6)', borderRadius: '0.6rem',
                        transition: 'background 0.15s ease',
                      }}>
                        <span style={{
                          fontSize: '0.8rem', fontWeight: 500,
                          color: '#1A1A1A',
                        }}>{r.name}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {r.commits > 0 && (
                            <span style={{ fontSize: '0.7rem', color: '#7A7A7A' }}>
                              {r.commits} commit{r.commits !== 1 ? 's' : ''}
                            </span>
                          )}
                          <span style={{ fontSize: '0.7rem', color: '#AEACA6' }}>
                            {dayjs(r.date).format('MMM D')}
                          </span>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : null}
      </div>

      {/* GitHub setup inline modal */}
      {showGithubSetup && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 999,
          background: 'rgba(26,26,26,0.5)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '1.5rem',
        }}>
          <div style={{
            background: '#F5F4F0', borderRadius: '1.5rem',
            padding: '2rem', width: '100%', maxWidth: '400px',
          }}>
            <h3 style={{
              fontSize: '1.1rem', fontWeight: 800,
              letterSpacing: '-0.03em', color: '#1A1A1A', margin: '0 0 0.5rem',
              display: 'flex', alignItems: 'center', gap: '0.4rem'
            }}>
              <GithubIcon size={20} />
              <span>Connect GitHub</span>
            </h3>
            <p style={{
              fontSize: '0.825rem', color: '#7A7A7A',
              margin: '0 0 1.25rem', lineHeight: 1.5,
            }}>
              Enter your GitHub username to see your contribution activity inside Tuff.
              Only public activity is used — no token needed.
            </p>
            <input
              value={githubInput}
              onChange={e => setGithubInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && saveGithubUsername()}
              placeholder="your-github-username"
              style={{
                width: '100%', padding: '0.75rem 1rem',
                background: '#ECEAE4', border: '1px solid #E0DED8',
                borderRadius: '0.75rem', fontSize: '0.9rem', color: '#1A1A1A',
                outline: 'none', fontFamily: 'Inter, system-ui, sans-serif',
                boxSizing: 'border-box', marginBottom: '1rem',
              }}
            />
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={() => setShowGithubSetup(false)} style={{
                flex: 1, padding: '0.75rem', background: 'transparent',
                border: '1px solid #E0DED8', borderRadius: '0.75rem',
                color: '#7A7A7A', fontWeight: 600, cursor: 'pointer',
                fontFamily: 'Inter, system-ui, sans-serif',
              }}>Cancel</button>
              <button onClick={saveGithubUsername} style={{
                flex: 2, padding: '0.75rem', background: '#1A1A1A',
                color: '#F5F4F0', border: 'none', borderRadius: '0.75rem',
                fontWeight: 700, cursor: 'pointer',
                fontFamily: 'Inter, system-ui, sans-serif',
              }}>Connect →</button>
            </div>
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1.1rem' }}>
        {['all', 'idea', 'active', 'launched', 'paused'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '0.35rem 0.85rem', borderRadius: '99px',
            border: `1px solid ${filter === f ? '#1A1A1A' : '#E0DED8'}`,
            background: filter === f ? '#1A1A1A' : 'transparent',
            color: filter === f ? '#F5F4F0' : '#7A7A7A',
            fontSize: '0.78rem', fontWeight: 500, cursor: 'pointer',
            fontFamily: 'Inter, system-ui, sans-serif',
            transition: 'all 0.15s ease', textTransform: 'capitalize',
          }}>{f}</button>
        ))}
      </div>

      {/* Projects list */}
      {loading ? (
        <div style={{ textAlign: 'center', color: '#7A7A7A', padding: '3rem 0', fontSize: '0.875rem' }}>
          Loading...
        </div>
      ) : filtered.length === 0 ? (
        <div style={{
          background: '#ECEAE4', border: '1px solid #E0DED8',
          borderRadius: '1.25rem', padding: '2.5rem', textAlign: 'center',
        }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.75rem' }}>
            <Laptop size={36} strokeWidth={1.5} style={{ color: '#AEACA6' }} />
          </div>
          <p style={{ color: '#1A1A1A', fontWeight: 600, margin: '0 0 0.35rem', fontSize: '0.95rem' }}>
            No projects yet.
          </p>
          <p style={{ color: '#7A7A7A', fontSize: '0.825rem', margin: '0 0 1.25rem' }}>
            Build something worth talking about.
          </p>
          <button onClick={() => { setEditProject(null); setShowModal(true) }} style={{
            background: '#1A1A1A', color: '#F5F4F0', border: 'none',
            borderRadius: '0.75rem', padding: '0.6rem 1.25rem',
            fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer',
            fontFamily: 'Inter, system-ui, sans-serif',
          }}>Start a project →</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filtered.map(project => (
            <ProjectCard
              key={project.id}
              project={project}
              expanded={expandedId === project.id}
              tasks={tasks[project.id] || []}
              profile={profile}
              onExpand={() => toggleExpand(project.id)}
              onEdit={() => { setEditProject(project); setShowModal(true) }}
              onDelete={() => deleteProject(project.id)}
              onToggleTask={toggleTask}
              onToggleWeeklyGoal={() => toggleWeeklyGoal(project)}
              onTasksChange={() => fetchTasks(project.id)}
            />
          ))}
        </div>
      )}

      {showModal && (
        <ProjectModal
          project={editProject}
          profile={profile}
          onClose={() => setShowModal(false)}
          onSave={() => { setShowModal(false); fetchProjects() }}
        />
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.3); }
        }
      `}</style>
    </div>
  )
}

function ProjectCard({
  project, expanded, tasks, profile,
  onExpand, onEdit, onDelete, onToggleTask, onToggleWeeklyGoal, onTasksChange,
}) {
  const [newTask, setNewTask] = useState('')
  const status = STATUS_COLORS[project.status] || STATUS_COLORS.active
  const doneTasks = tasks.filter(t => t.status === 'done').length
  const ProjectIcon = TYPE_ICONS[project.type] || Folder

  async function addTask() {
    if (!newTask.trim()) return
    await supabase.from('tasks').insert({
      title: newTask.trim(), project_id: project.id,
      user_id: profile.id, status: 'todo',
    })
    setNewTask('')
    onTasksChange()
  }

  return (
    <div style={{
      background: '#ECEAE4', border: '1px solid #E0DED8',
      borderRadius: '1.25rem', overflow: 'hidden',
      transition: 'all 0.2s ease',
    }}>
      <div onClick={onExpand} style={{
        padding: '1.1rem 1.25rem', cursor: 'pointer',
        display: 'flex', alignItems: 'flex-start',
        justifyContent: 'space-between', gap: '1rem',
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
            <span style={{ color: '#7A7A7A', display: 'flex', alignItems: 'center' }}>
              <ProjectIcon size={16} strokeWidth={2.2} />
            </span>
            <span style={{
              padding: '0.15rem 0.6rem', borderRadius: '99px',
              fontSize: '0.68rem', fontWeight: 600,
              background: status.bg, color: status.color,
              textTransform: 'capitalize'
            }}>{project.status}</span>
            {project.tech_stack?.slice(0, 3).map(t => (
              <span key={t} style={{
                padding: '0.15rem 0.5rem', borderRadius: '99px',
                fontSize: '0.65rem', background: 'rgba(245,244,240,0.8)',
                color: '#7A7A7A', border: '1px solid #E0DED8',
              }}>{t}</span>
            ))}
          </div>
          <h3 style={{
            fontSize: '1rem', fontWeight: 700, color: '#1A1A1A',
            margin: '0 0 0.3rem', letterSpacing: '-0.02em',
          }}>{project.title}</h3>
          {project.description && (
            <p style={{
              fontSize: '0.8rem', color: '#7A7A7A',
              margin: '0 0 0.5rem', lineHeight: 1.5,
            }}>{project.description}</p>
          )}

          {/* Weekly goal inline badge */}
          {project.weekly_goal && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.3rem 0.75rem',
              background: project.weekly_goal_done ? '#C8B89A' : 'rgba(200,184,154,0.15)',
              border: `1px solid ${project.weekly_goal_done ? '#C8B89A' : 'rgba(200,184,154,0.4)'}`,
              borderRadius: '99px', marginTop: '0.25rem',
            }}>
              <span style={{ display: 'flex', alignItems: 'center', fontSize: '0.65rem', color: project.weekly_goal_done ? '#1A1A1A' : '#A89878' }}>
                {project.weekly_goal_done ? <Check size={11} strokeWidth={3} /> : <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#A89878' }} />}
              </span>
              <span style={{
                fontSize: '0.72rem', fontWeight: 600,
                color: project.weekly_goal_done ? '#1A1A1A' : '#A89878',
                textDecoration: project.weekly_goal_done ? 'line-through' : 'none',
              }}>{project.weekly_goal}</span>
            </div>
          )}

          {tasks.length > 0 && (
            <p style={{ margin: '0.5rem 0 0', fontSize: '0.7rem', color: '#7A7A7A' }}>
              {doneTasks}/{tasks.length} tasks done
            </p>
          )}
        </div>
        <span style={{ color: '#7A7A7A', display: 'flex', alignItems: 'center', flexShrink: 0, transition: 'transform 0.25s ease', transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
          <ChevronDown size={16} />
        </span>
      </div>

      {expanded && (
        <div style={{
          borderTop: '1px solid #E0DED8',
          background: 'rgba(245,244,240,0.5)',
        }}>
          {/* Tasks */}
          <div style={{ padding: '1rem 1.25rem' }}>
            <p style={{
              fontSize: '0.75rem', fontWeight: 600, color: '#3D3D3D',
              margin: '0 0 0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em',
            }}>Tasks</p>
            {tasks.length === 0 ? (
              <p style={{ fontSize: '0.8rem', color: '#7A7A7A', margin: '0 0 0.75rem' }}>
                No tasks yet.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '0.75rem' }}>
                {tasks.map(task => (
                  <div key={task.id} style={{
                    display: 'flex', alignItems: 'center', gap: '0.6rem',
                    cursor: 'pointer',
                  }} onClick={() => onToggleTask(task)}>
                    <div style={{
                      width: '18px', height: '18px', borderRadius: '50%', flexShrink: 0,
                      border: `1.5px solid ${task.status === 'done' ? '#1A1A1A' : '#C8B89A'}`,
                      background: task.status === 'done' ? '#1A1A1A' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#F5F4F0',
                    }}>
                      {task.status === 'done' ? <Check size={11} strokeWidth={3} /> : null}
                    </div>
                    <span style={{
                      fontSize: '0.85rem',
                      color: task.status === 'done' ? '#7A7A7A' : '#1A1A1A',
                      textDecoration: task.status === 'done' ? 'line-through' : 'none',
                      fontWeight: task.status === 'done' ? 400 : 500,
                    }}>{task.title}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Add task input */}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                value={newTask}
                onChange={e => setNewTask(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addTask()}
                placeholder="Add a task..."
                style={{
                  flex: 1, padding: '0.55rem 0.875rem',
                  background: '#ECEAE4', border: '1px solid #E0DED8',
                  borderRadius: '0.65rem', fontSize: '0.825rem', color: '#1A1A1A',
                  outline: 'none', fontFamily: 'Inter, system-ui, sans-serif',
                }}
              />
              <button onClick={addTask} style={{
                background: '#1A1A1A', color: '#F5F4F0', border: 'none',
                borderRadius: '0.65rem', padding: '0 0.875rem',
                fontWeight: 600, cursor: 'pointer', fontSize: '1rem',
                fontFamily: 'Inter, system-ui, sans-serif',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}><Plus size={14} strokeWidth={2.5} /></button>
            </div>
          </div>

          {/* Links */}
          {(project.url || project.repo_url) && (
            <div style={{
              borderTop: '1px solid #E0DED8',
              padding: '0.75rem 1.25rem',
              display: 'flex', gap: '0.75rem',
            }}>
              {project.url && (
                <a href={project.url} target="_blank" rel="noreferrer" style={{
                  fontSize: '0.78rem', color: '#1A1A1A', fontWeight: 600,
                  textDecoration: 'none',
                  display: 'inline-flex', alignItems: 'center', gap: '0.25rem'
                }}>
                  <ExternalLink size={12} />
                  <span>Live site</span>
                </a>
              )}
              {project.repo_url && (
                <a href={project.repo_url} target="_blank" rel="noreferrer" style={{
                  fontSize: '0.78rem', color: '#1A1A1A', fontWeight: 600,
                  textDecoration: 'none',
                  display: 'inline-flex', alignItems: 'center', gap: '0.25rem'
                }}>
                  <GithubIcon size={12} />
                  <span>Repository</span>
                </a>
              )}
            </div>
          )}

          {/* Actions */}
          <div style={{
            borderTop: '1px solid #E0DED8',
            padding: '0.75rem 1.25rem',
            display: 'flex', gap: '0.5rem',
          }}>
            <button onClick={onEdit} style={{
              flex: 1, padding: '0.5rem', background: '#1A1A1A',
              color: '#F5F4F0', border: 'none', borderRadius: '0.65rem',
              fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
              fontFamily: 'Inter, system-ui, sans-serif',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem'
            }}>
              <Pencil size={12} />
              <span>Edit</span>
            </button>
            <button onClick={onDelete} style={{
              flex: 1, padding: '0.5rem', background: 'transparent',
              border: '1px solid #E0DED8', borderRadius: '0.65rem',
              color: '#7A7A7A', fontSize: '0.78rem', fontWeight: 500,
              cursor: 'pointer', fontFamily: 'Inter, system-ui, sans-serif',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem'
            }}>
              <Trash2 size={12} />
              <span>Delete</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function ProjectModal({ project, profile, onClose, onSave }) {
  const isEdit = !!project
  const [form, setForm] = useState({
    title: project?.title || '',
    description: project?.description || '',
    type: project?.type || 'side_project',
    status: project?.status || 'active',
    tech_stack: project?.tech_stack || [],
    url: project?.url || '',
    repo_url: project?.repo_url || '',
    weekly_goal: project?.weekly_goal || '',
  })
  const [techInput, setTechInput] = useState('')
  const [saving, setSaving] = useState(false)
  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  function addTech() {
    const t = techInput.trim()
    if (!t || form.tech_stack.includes(t)) return
    set('tech_stack', [...form.tech_stack, t])
    setTechInput('')
  }

  async function handleSave() {
    if (!form.title.trim()) { toast.error('Project needs a title.'); return }
    setSaving(true)
    try {
      const payload = {
        ...form,
        week_start: dayjs().startOf('isoWeek').format('YYYY-MM-DD'),
        week_end: dayjs().endOf('isoWeek').format('YYYY-MM-DD'),
        weekly_goal_done: isEdit ? project.weekly_goal_done : false,
      }
      if (isEdit) {
        await supabase.from('projects').update(payload).eq('id', project.id)
      } else {
        await supabase.from('projects').insert({ ...payload, user_id: profile.id })
      }
      toast.success(isEdit ? 'Project updated.' : 'Project created.')
      onSave()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 999,
      background: 'rgba(26,26,26,0.5)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
    }}>
      <div style={{
        background: '#F5F4F0', width: '100%', maxWidth: '560px',
        borderRadius: '1.5rem 1.5rem 0 0', padding: '1.75rem 1.5rem',
        maxHeight: '92dvh', overflowY: 'auto',
      }}>
        <div style={{
          width: '36px', height: '4px', borderRadius: '99px',
          background: '#E0DED8', margin: '0 auto 1.5rem',
        }} />
        <h3 style={{
          fontSize: '1.2rem', fontWeight: 800, letterSpacing: '-0.03em',
          color: '#1A1A1A', margin: '0 0 1.5rem',
        }}>{isEdit ? 'Edit project' : 'New project'}</h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <MF label="Title">
            <input value={form.title} onChange={e => set('title', e.target.value)}
              placeholder="What are you building?" style={mIS} />
          </MF>
          <MF label="Description">
            <textarea value={form.description} onChange={e => set('description', e.target.value)}
              placeholder="What does it do? Who is it for?" rows={2}
              style={{ ...mIS, resize: 'none', lineHeight: 1.5 }} />
          </MF>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <MF label="Type">
              <CustomSelect
                value={form.type}
                onChange={e => set('type', e.target.value)}
                options={TYPE_OPTIONS}
              />
            </MF>
            <MF label="Status">
              <CustomSelect
                value={form.status}
                onChange={e => set('status', e.target.value)}
                options={STATUS_OPTIONS}
              />
            </MF>
          </div>

          {/* Weekly goal */}
          <MF label="This week's goal for this project">
            <input value={form.weekly_goal} onChange={e => set('weekly_goal', e.target.value)}
              placeholder="e.g. Ship the auth flow" style={mIS} />
          </MF>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <MF label="Live URL">
              <input value={form.url} onChange={e => set('url', e.target.value)}
                placeholder="https://..." style={mIS} />
            </MF>
            <MF label="Repo URL">
              <input value={form.repo_url} onChange={e => set('repo_url', e.target.value)}
                placeholder="https://github.com/..." style={mIS} />
            </MF>
          </div>

          <MF label="Tech stack">
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <input value={techInput} onChange={e => setTechInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addTech()}
                placeholder="React, FastAPI, Supabase..." style={{ ...mIS, flex: 1 }} />
              <button onClick={addTech} style={{
                background: '#1A1A1A', color: '#F5F4F0', border: 'none',
                borderRadius: '0.65rem', padding: '0 0.875rem',
                fontWeight: 600, cursor: 'pointer', fontSize: '1rem',
                fontFamily: 'Inter, system-ui, sans-serif',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}><Plus size={16} strokeWidth={2.5} /></button>
            </div>
            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
              {form.tech_stack.map(t => (
                <span key={t} style={{
                  padding: '0.25rem 0.65rem', borderRadius: '99px',
                  background: '#1A1A1A', color: '#F5F4F0',
                  fontSize: '0.72rem', fontWeight: 500,
                  display: 'flex', alignItems: 'center', gap: '0.35rem',
                }}>
                  {t}
                  <button onClick={() => set('tech_stack', form.tech_stack.filter(x => x !== t))} style={{
                    background: 'none', border: 'none', color: 'rgba(245,244,240,0.6)',
                    cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center'
                  }}>
                    <X size={10} strokeWidth={2.5} />
                  </button>
                </span>
              ))}
            </div>
          </MF>
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
          }}>{saving ? 'Saving...' : isEdit ? 'Save changes' : 'Create project'}</button>
        </div>
      </div>
    </div>
  )
}

function MF({ label, children }) {
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

const mIS = {
  width: '100%', padding: '0.7rem 0.875rem',
  background: '#ECEAE4', border: '1px solid #E0DED8',
  borderRadius: '0.75rem', fontSize: '0.875rem', color: '#1A1A1A',
  outline: 'none', fontFamily: 'Inter, system-ui, sans-serif',
  boxSizing: 'border-box',
}
