import { useState, useEffect } from 'react'
import { reportsApi } from '../api'
import { useAuthStore } from '../store'
import { Btn, Card, PageHeader, StatCard, Divider, Spinner, Badge } from '../components/ui'
import toast from 'react-hot-toast'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, isThisWeek } from 'date-fns'
import { CheckCircle2, TrendingUp, Flame, ClipboardList, Sparkles, Lock, BarChart3 } from 'lucide-react'

function getMonday(date) {
  const d = startOfWeek(date, { weekStartsOn: 1 })
  return format(d, 'yyyy-MM-dd')
}

export default function ReportPage() {
  const { user } = useAuthStore()
  const isPro = user?.plan === 'PRO' || user?.plan === 'PREMIUM'
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(false)
  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()))

  const weekStartDate = new Date(weekStart + 'T00:00:00')
  const weekEndDate = endOfWeek(weekStartDate, { weekStartsOn: 1 })
  const isCurrent = isThisWeek(weekStartDate, { weekStartsOn: 1 })

  async function loadReport(ws) {
    setLoading(true)
    try {
      const target = ws || weekStart
      const { data } = await reportsApi.getByWeek(target)
      setReport(data)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load report')
    }
    setLoading(false)
  }

  useEffect(() => { loadReport() }, [weekStart])

  function goToPrevWeek() {
    const prev = format(subWeeks(weekStartDate, 1), 'yyyy-MM-dd')
    setWeekStart(prev)
  }

  function goToNextWeek() {
    const next = format(addWeeks(weekStartDate, 1), 'yyyy-MM-dd')
    setWeekStart(next)
  }

  const pct = report?.completionPercentage?.toFixed(0) ?? 0

  return (
    <div className="fade-in">
      <PageHeader
        title="Weekly Report"
        sub="Track your consistency and growth"
        action={<Btn onClick={() => loadReport()} loading={loading} variant="ghost">Refresh</Btn>}
      />

      {/* Week Navigation */}
      <div className="week-nav" style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16,
        marginBottom: 24, padding: '12px 0',
      }}>
        <button onClick={goToPrevWeek} style={{
          background: 'var(--surface)', border: '1px solid var(--border2)', color: 'var(--white)',
          width: 36, height: 36, borderRadius: 10, fontSize: 16, fontWeight: 700,
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          ‹
        </button>
        <div style={{ textAlign: 'center' }}>
          <div className="week-nav-label" style={{ fontSize: 15, fontWeight: 700, color: 'var(--white)' }}>
            {format(weekStartDate, 'MMM d')} — {format(weekEndDate, 'MMM d, yyyy')}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>
            {isCurrent ? 'This Week' : `Week of ${format(weekStartDate, 'MMM d')}`}
          </div>
        </div>
        <button onClick={goToNextWeek} style={{
          background: 'var(--surface)', border: '1px solid var(--border2)', color: 'var(--white)',
          width: 36, height: 36, borderRadius: 10, fontSize: 16, fontWeight: 700,
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          ›
        </button>
      </div>

      {loading && !report ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Spinner size={36} /></div>
      ) : report ? (
        <>
          {/* Summary cards */}
          <div className="stats-row" style={{ display: 'flex', gap: 14, marginBottom: 24 }}>
            <StatCard label="Tasks Done"    value={report.completedTasks} icon={<CheckCircle2 size={22} />} color="var(--green)" />
            <StatCard label="Completion"    value={`${pct}%`}             icon={<TrendingUp size={22} />} color="var(--accent)" />
            <StatCard label="Day Streak"    value={<>{report.streakDays ?? 0} <Flame size={16} style={{ display: 'inline', verticalAlign: 'middle' }} /></>} icon="" color="var(--gold)" />
            <StatCard label="Total Planned" value={report.totalTasks}     icon={<ClipboardList size={22} />} color="var(--text2)" />
          </div>

          {/* Bar chart */}
         {report.dailyStats && (
                     <Card style={{ marginBottom: 20 }}>
                       <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--white)', marginBottom: 20 }}>
                         Daily Completion
                       </div>
                       <ResponsiveContainer width="100%" height={180}>
                         <BarChart data={report.dailyStats} barGap={4}>
                           <XAxis dataKey="day" tick={{ fill: 'var(--text2)', fontSize: 12 }} axisLine={false} tickLine={false} />
                           <YAxis hide />
                           <Tooltip
                             cursor={false}
                             contentStyle={{ background: '#1a1a2a', border: '1px solid #2a2a3d', borderRadius: 8, fontSize: 12 }}
                             labelStyle={{ color: '#ffffff' }}
                             itemStyle={{ color: '#9898b8' }}
                             formatter={(v, n) => [v, n === 'done' ? 'Completed' : 'Total']}
                           />
                           <Bar dataKey="total" fill="var(--border2)" radius={[4, 4, 0, 0]} />
                           <Bar dataKey="done"  fill="var(--accent)" radius={[4, 4, 0, 0]} />
                         </BarChart>
                       </ResponsiveContainer>
                       <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
                         <LegendDot color="var(--accent)" label="Completed" />
                         <LegendDot color="var(--border2)" label="Total" />
                       </div>
                     </Card>
                   )}

          {/* Progress bar */}
          <Card style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontWeight: 600 }}>Week Completion</span>
              <Badge color={pct >= 80 ? 'green' : pct >= 50 ? 'gold' : 'red'}>{pct}%</Badge>
            </div>
            <div style={{ height: 8, background: 'var(--border)', borderRadius: 8, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg, var(--accent), var(--green))`, borderRadius: 8, transition: 'width 1s ease' }} />
            </div>
            <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 8 }}>
              {report.completedTasks} of {report.totalTasks} tasks completed
              &nbsp;· Week of {report.weekStart}
            </div>
          </Card>

          {/* AI Narrative */}
          {isPro ? (
            <Card glow={!!report.aiNarrative}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--white)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Sparkles size={16} /> AI Insights
              </div>
              {report.aiNarrative ? (
                <div style={{ fontSize: 14, lineHeight: 1.9, color: 'var(--text)' }}>
                  {report.aiNarrative.split('\n').map((line, i) => <div key={i}>{line || <br />}</div>)}
                </div>
              ) : (
                <div style={{ color: 'var(--text2)' }}>AI insights will appear once you have tasks this week.</div>
              )}
            </Card>
          ) : (
            <Card style={{ textAlign: 'center', padding: 32 }}>
              <div style={{ color: 'var(--text2)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}><Lock size={16} /> AI-powered insights available on Pro plan</div>
              <Btn onClick={() => window.location.href = '/subscription'}>Upgrade to Pro</Btn>
            </Card>
          )}
        </>
      ) : (
        <Card style={{ textAlign: 'center', padding: 48 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}><BarChart3 size={40} color="var(--text2)" /></div>
          <div style={{ color: 'var(--text2)', marginBottom: 16 }}>No report data yet. Add tasks and check back!</div>
          <Btn onClick={loadReport}>Generate Report</Btn>
        </Card>
      )}
    </div>
  )
}

function LegendDot({ color, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text2)' }}>
      <div style={{ width: 10, height: 10, borderRadius: 2, background: color }} />
      {label}
    </div>
  )
}
