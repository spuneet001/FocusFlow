import { useState, useRef, useEffect } from 'react'
import { useAuthStore, useTaskStore } from '../store'
import { aiApi } from '../api'
import { Btn, Card, Badge, Label, Divider, PageHeader, Spinner, Empty } from '../components/ui'
import toast from 'react-hot-toast'

const GOAL_SUGGESTIONS = [
  { icon: '🏃', label: 'Lose weight & get fit' },
  { icon: '📚', label: 'Learn a new skill' },
  { icon: '🧘', label: 'Reduce stress & meditate' },
  { icon: '💰', label: 'Save money & budget' },
  { icon: '😴', label: 'Improve sleep habits' },
  { icon: '🍎', label: 'Eat healthier' },
]

export default function AgentPage() {
  const { user } = useAuthStore()
  const { addMany } = useTaskStore()
  const isPro = user?.plan === 'PRO' || user?.plan === 'PREMIUM'

  const [step, setStep]         = useState('prompt') // prompt | chat
  const [goal, setGoal]         = useState('')
  const [planId, setPlanId]     = useState(null)
  const [chat, setChat]         = useState([])
  const [input, setInput]       = useState('')
  const [genLoading, setGenLoading] = useState(false)
  const [chatLoading, setChatLoading] = useState(false)
  const chatEndRef = useRef(null)

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [chat])

  async function generatePlan() {
    if (!goal.trim()) return
    setGenLoading(true)
    try {
      const { data } = await aiApi.generatePlan(goal)
      setPlanId(data.id)
      setChat([{ role: 'assistant', content: `✨ Here's your personalised plan for: **${goal}**\n\n${data.generatedPlan}\n\n---\nAsk me to adjust anything — timing, intensity, diet preferences, and I'll refine it. I can also add specific tasks directly to your todo list!` }])
      setStep('chat')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate plan')
    }
    setGenLoading(false)
  }

  async function sendMessage() {
    if (!input.trim() || chatLoading) return
    const userMsg = { role: 'user', content: input }
    const newChat = [...chat, userMsg]
    setChat(newChat)
    setInput('')
    setChatLoading(true)

    try {
      const { data } = await aiApi.chat(input, planId, newChat)
      setChat((p) => [...p, { role: 'assistant', content: data.reply }])

      // Sync added tasks to local store
      if (data.tasksAdded?.length > 0) {
        addMany(data.tasksAdded)
        toast.success(`${data.tasksAdded.length} task(s) added to your list!`)
      }
    } catch {
      toast.error('AI is temporarily unavailable')
    }
    setChatLoading(false)
  }

  if (!isPro) {
    return (
      <div className="fade-in">
        <PageHeader title="AI Agent" sub="Your personal AI life coach" />
        <Card style={{ textAlign: 'center', padding: '56px 32px' }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>🤖</div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, color: 'var(--white)', marginBottom: 10 }}>
            Unlock AI Agent
          </h2>
          <p style={{ color: 'var(--text2)', maxWidth: 380, margin: '0 auto 28px', lineHeight: 1.8 }}>
            Generate personalised action plans, refine them with AI chat, and automatically populate your todo list.
          </p>
          <Btn onClick={() => window.location.href = '/subscription'}>View Plans →</Btn>
        </Card>
      </div>
    )
  }

  return (
    <div className="fade-in agent-page" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 72px)' }}>
      <PageHeader
        title="AI Agent"
        sub="Tell me your goal — I'll build your action plan"
        action={step === 'chat' && (
          <Btn variant="ghost" onClick={() => { setStep('prompt'); setGoal(''); setChat([]); setPlanId(null) }}>
            ← New Goal
          </Btn>
        )}
      />

      {step === 'prompt' && (
        <Card style={{ flex: 1 }}>
          <Label>What do you want to achieve?</Label>
          <textarea
            rows={4}
            placeholder="e.g. I want to lose 8kg in 3 months. I prefer gym workouts and Mediterranean food..."
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            style={{ resize: 'none', marginBottom: 16 }}
          />

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
            {GOAL_SUGGESTIONS.map((s) => (
              <button key={s.label} onClick={() => setGoal(s.label)} style={{
                background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8,
                padding: '8px 14px', color: 'var(--text)', fontSize: 13, cursor: 'pointer',
                display: 'flex', gap: 6, alignItems: 'center', transition: 'border-color 0.15s',
              }}>
                {s.icon} {s.label}
              </button>
            ))}
          </div>

          <Btn onClick={generatePlan} loading={genLoading} size="lg">
            ✨ Generate My Plan
          </Btn>
        </Card>
      )}

      {step === 'chat' && (
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          <div style={{ marginBottom: 10 }}>
            <Badge color="green">Goal: {goal.slice(0, 60)}{goal.length > 60 ? '...' : ''}</Badge>
          </div>

          {/* Chat window */}
          <Card style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, padding: '16px', minHeight: 0 }}>
            {chat.map((m, i) => (
              <div key={i} style={{
                alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '80%',
                background: m.role === 'user' ? 'var(--accent-s2)' : 'var(--card2)',
                border: `1px solid ${m.role === 'user' ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius: m.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                padding: '10px 14px', fontSize: 13, lineHeight: 1.7,
              }}>
                {m.content.split('\n').map((line, j) => (
                  <div key={j}>{line.startsWith('**') ? <strong>{line.replace(/\*\*/g, '')}</strong> : line || <br />}</div>
                ))}
              </div>
            ))}
            {chatLoading && (
              <div style={{ alignSelf: 'flex-start', display: 'flex', gap: 8, alignItems: 'center', color: 'var(--text2)', fontSize: 13 }}>
                <Spinner size={14} /> Thinking...
              </div>
            )}
            <div ref={chatEndRef} />
          </Card>

          {/* Input */}
          <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
            <input
              placeholder='Refine your plan, e.g. "Make the diet vegetarian" or "Add tasks to my todo list"'
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              style={{ flex: 1 }}
            />
            <Btn onClick={sendMessage} loading={chatLoading}>Send</Btn>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 8 }}>
            💡 Say "add [task] to my todo" and I'll automatically create it in your task list
          </div>
        </div>
      )}
    </div>
  )
}
