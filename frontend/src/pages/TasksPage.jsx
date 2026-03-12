import { useState, useEffect, useRef } from 'react'
import { useTaskStore } from '../store'
import { tasksApi } from '../api'
import { Btn, Card, Modal, Badge, Label, Divider, PageHeader, StatCard, Empty, Spinner } from '../components/ui'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { playSound } from '../utils/soundUtils'

const TUNES = ['🔔 Bell', '🎵 Chime', '📣 Alert', '🎶 Melody', '🔊 Ping']
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH']
const CATEGORIES = ['MANUAL', 'FITNESS', 'WORK', 'LEARNING', 'NUTRITION', 'WELLNESS', 'AI_PLAN']
const PRIORITY_COLOR = { LOW: 'green', MEDIUM: 'gold', HIGH: 'red' }
const CATEGORY_ICONS = { FITNESS: '🏃', WORK: '💼', LEARNING: '📚', NUTRITION: '🥗', WELLNESS: '🧘', AI_PLAN: '🤖', MANUAL: '✏️' }

const EMPTY_FORM = {
  title: '', description: '', taskDate: format(new Date(), 'yyyy-MM-dd'),
  taskTime: '09:00', startTime: '09:00', endTime: '10:00', alarmTune: TUNES[0], priority: 'MEDIUM', category: 'MANUAL',
}

export default function TasksPage() {
  const { tasks, fetchAll, create, update, toggleDone, delete: deleteTask, updateEndTime, markStartReminderShown, loading } = useTaskStore()
  const [showAdd, setShowAdd] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const today = format(new Date(), 'yyyy-MM-dd')
  const [selectedDate, setSelectedDate] = useState(today)
  const [form, setForm] = useState({ title: '', description: '', taskDate: today, taskTime: '09:00', startTime: '09:00', endTime: '10:00', alarmTune: TUNES[0], priority: 'MEDIUM', category: 'MANUAL' })
  const [saving, setSaving] = useState(false)
  const [alarmTask, setAlarmTask] = useState(null)
  const [startTimeReminder, setStartTimeReminder] = useState(null)
  const [alertedIds] = useState(new Set())
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [changeEndTimeModal, setChangeEndTimeModal] = useState(null)
  const [newEndTime, setNewEndTime] = useState('')
  const [showCameraModal, setShowCameraModal] = useState(false)
  const [cameraStream, setCameraStream] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [lightboxTask, setLightboxTask] = useState(null)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)

  useEffect(() => { fetchAll() }, [])

  // Alarm checker - Check both start and end times
  useEffect(() => {
    const id = setInterval(() => {
      const now = new Date()
      const currentDate = format(now, 'yyyy-MM-dd')
      const currentTime = format(now, 'HH:mm')
      
      console.log('🔔 Alarm check:', { currentDate, currentTime, tasksCount: tasks.length })
      
      tasks.forEach((t) => {
        // Check date match first
        if (t.taskDate !== currentDate) return

        // Skip completed tasks
        if (t.done) return

        // Compute fallbacks for legacy tasks: prefer explicit start/end, else use taskTime
        const effectiveStart = t.startTime ? t.startTime.slice(0, 5) : (t.taskTime ? t.taskTime.slice(0, 5) : null)
        const effectiveEnd = t.endTime ? t.endTime.slice(0, 5) : (t.startTime ? t.startTime.slice(0, 5) : (t.taskTime ? t.taskTime.slice(0, 5) : null))
        const startReminderShown = !!t.startTimeReminderShown

        console.log(`📋 Task ${t.id}: ${t.title}`, {
          startTime: t.startTime,
          endTime: t.endTime,
          taskTime: t.taskTime,
          effectiveStart,
          effectiveEnd,
          startTimeReminderShown: startReminderShown,
          alertedIds: Array.from(alertedIds)
        })

        // Check for START time reminder (use fallback) — trigger only when minute matches
        if (effectiveStart && !startReminderShown && !alertedIds.has(`start-${t.id}`)) {
          console.log(`⏱️ Comparing start times: task=${effectiveStart} vs current=${currentTime}`)
          if (effectiveStart === currentTime) {
            console.log('✅ START REMINDER TRIGGERED for task', t.id)
            alertedIds.add(`start-${t.id}`)
            setStartTimeReminder(t)
          }
        }

        // Check for END time reminder (use fallback) — trigger only when minute matches
        if (effectiveEnd && !alertedIds.has(`end-${t.id}`)) {
          console.log(`⏱️ Comparing end times: task=${effectiveEnd} vs current=${currentTime}`)
          if (effectiveEnd === currentTime) {
            console.log('✅ END REMINDER TRIGGERED for task', t.id)
            alertedIds.add(`end-${t.id}`)
            setAlarmTask(t)
          }
        }
      })
    }, 30000) // Run every 30 seconds
    return () => {
      clearInterval(id)
      console.log('🛑 Alarm checker stopped')
    }
  }, [tasks])

  // Play sound when end time alarm triggers
  useEffect(() => {
    if (alarmTask && alarmTask.alarmTune) {
      console.log('🔊 Playing END time sound:', alarmTask.alarmTune)
      playSound(alarmTask.alarmTune)
    }
  }, [alarmTask])

  // Play sound when start time alarm triggers
  useEffect(() => {
    if (startTimeReminder && startTimeReminder.alarmTune) {
      console.log('🔊 Playing START time sound:', startTimeReminder.alarmTune)
      playSound(startTimeReminder.alarmTune)
    }
  }, [startTimeReminder])

  async function handleAdd(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        ...form,
        taskDate: form.taskDate,
        taskTime: form.startTime + ':00',
        startTime: form.startTime + ':00',
        endTime: form.endTime + ':00',
        alarmTune: form.alarmTune.replace(/^[^\s]+ /, ''),
      }
      console.log('📤 Payload:', payload)
      if (editingTask) {
        console.log('🔄 Updating task', editingTask.id, 'with payload:', payload)
        const response = await update(editingTask.id, payload)
        console.log('📦 Backend response:', response)
        console.log('✅ Task updated successfully')
        await fetchAll()
        console.log('🔄 Tasks refreshed')
        toast.success('Task updated!')
        setEditingTask(null)
      } else {
        console.log('➕ Creating new task')
        await create(payload)
        console.log('✅ Task created successfully')
        await fetchAll()
        console.log('🔄 Tasks refreshed')
        toast.success('Task added!')
      }
      setShowAdd(false)
      setForm({ title: '', description: '', taskDate: selectedDate, taskTime: '09:00', startTime: '09:00', endTime: '10:00', alarmTune: TUNES[0], priority: 'MEDIUM', category: 'MANUAL' })
    } catch (err) { 
      console.error('❌ Error:', err)
      toast.error(editingTask ? 'Failed to update task' : 'Failed to add task') 
    }
    setSaving(false)
  }

  function handleEditTask(task) {
    console.log('✏️ Editing task:', task)
    setEditingTask(task)
    // Find the matching tune from TUNES array
    const matchingTune = TUNES.find(t => t.includes(task.alarmTune)) || TUNES[0]
    setForm({
      title: task.title,
      description: task.description,
      taskDate: task.taskDate,
      taskTime: task.taskTime?.slice(0, 5) || '09:00',
      startTime: task.startTime?.slice(0, 5) || '09:00',
      endTime: task.endTime?.slice(0, 5) || '10:00',
      alarmTune: matchingTune,
      priority: task.priority,
      category: task.category,
    })
    console.log('📝 Form set, opening modal')
    setShowAdd(true)
  }

  async function handleToggle(id) {
    try { await toggleDone(id) }
    catch { toast.error('Could not update task') }
  }

  async function handleDelete(id, title, isDone, taskDate, taskTime) {
    const today = format(new Date(), 'yyyy-MM-dd')
    const now = new Date()
    const currentTimeStr = format(now, 'HH:mm:ss')
    
    if (isDone) {
      toast.error('Cannot delete completed tasks (affects weekly report)')
      return
    }
    if (taskDate < today) {
      toast.error('Cannot delete past tasks (affects weekly report)')
      return
    }
    if (taskDate === today && taskTime && taskTime < currentTimeStr) {
      toast.error('Cannot delete past tasks (affects weekly report)')
      return
    }
    setDeleteConfirm({ id, title })
  }

  async function confirmDelete() {
    try {
      await deleteTask(deleteConfirm.id)
      toast.success('Task deleted!')
      setDeleteConfirm(null)
    } catch { toast.error('Delete failed') }
  }

  async function handleUpdateEndTime() {
    if (!changeEndTimeModal || !newEndTime) return
    try {
      await updateEndTime(changeEndTimeModal.id, { endTime: newEndTime + ':00' })
      console.log('✅ End time updated, refreshing tasks')
      await fetchAll()
      toast.success('End time updated!')
      setChangeEndTimeModal(null)
      setNewEndTime('')
    } catch (err) {
      console.error('❌ Error updating end time:', err)
      toast.error(err.message || 'Failed to update end time')
    }
  }

  async function handleStartReminderClose() {
    if (!startTimeReminder) return
    try {
      await markStartReminderShown(startTimeReminder.id)
      setStartTimeReminder(null)
    } catch (err) {
      console.error('Failed to mark start reminder', err)
      setStartTimeReminder(null)
    }
  }

  function handleCaptureAndShare() {
    setShowCameraModal(true)
  }

  async function startCamera() {
    try {
      console.log('📸 Requesting camera access...')
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
      console.log('✅ Camera access granted')
      setCameraStream(stream)
      // videoRef may not be mounted yet; the useEffect below will attach it
    } catch (err) {
      console.error('❌ Camera error:', err)
      if (err.name === 'NotAllowedError') {
        toast.error('Camera access denied. Please enable camera in browser settings.')
      } else if (err.name === 'NotFoundError') {
        toast.error('No camera found on this device.')
      } else {
        toast.error('Camera error: ' + err.message)
      }
    }
  }

  // Attach stream to video element once both are ready
  useEffect(() => {
    if (cameraStream && videoRef.current) {
      videoRef.current.srcObject = cameraStream
    }
  }, [cameraStream])

  function capturePhoto() {
    if (videoRef.current && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d')
      ctx.save()
      ctx.scale(-1, 1)
      ctx.drawImage(videoRef.current, -canvasRef.current.width, 0)
      ctx.restore()
      const photoData = canvasRef.current.toDataURL('image/jpeg')
      setPhotoPreview(photoData)
      console.log('📦 Photo captured')
    }
  }

  function handleGalleryUpload(e) {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setPhotoPreview(event.target?.result)
        console.log('📁 Photo selected from gallery')
      }
      reader.readAsDataURL(file)
    }
  }

  async function confirmAndMarkDone() {
    if (!alarmTask || !photoPreview) return
    try {
      console.log('📸 Uploading photo to backend...')
      await tasksApi.uploadPhoto(alarmTask.id, photoPreview)
      console.log('✅ Photo uploaded successfully')
      
      // Now mark as done
      console.log('✅ Marking task as done with photo')
      await handleToggle(alarmTask.id)
      toast.success('Task marked done with photo! 📸')
      setAlarmTask(null)
      setShowCameraModal(false)
      setPhotoPreview(null)
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop())
        setCameraStream(null)
      }
    } catch (err) {
      console.error('❌ Error:', err)
      toast.error('Failed to mark task as done')
    }
  }

  function closeCameraModal() {
    setShowCameraModal(false)
    setPhotoPreview(null)
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop())
      setCameraStream(null)
    }
  }

  const selectedTasks = tasks.filter((t) => t.taskDate === selectedDate)
  const remaining = selectedTasks.filter((t) => !t.done)
  const completed = selectedTasks.filter((t) => t.done)

  function f(k, v) { setForm((p) => ({ ...p, [k]: v })) }

  return (
    <div className="fade-in">
      <div className="page-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: 'var(--white)', marginBottom: 4 }}>
            Today's Focus
          </div>
          <div style={{ fontSize: 13, color: 'var(--text2)' }}>
            {selectedDate}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => { setSelectedDate(e.target.value); setForm(p => ({ ...p, taskDate: e.target.value })) }}
            className="date-picker"
            style={{
              padding: '8px 12px', borderRadius: 10, border: '1px solid var(--border2)',
              background: 'var(--surface)', color: 'var(--white)', fontSize: 14, cursor: 'pointer',
              colorScheme: 'dark', height: 38, width: 200,
            }}
          />
          <button onClick={() => { setEditingTask(null); setShowAdd(true); setForm({ title: '', description: '', taskDate: selectedDate, taskTime: '09:00', startTime: '09:00', endTime: '10:00', alarmTune: TUNES[0], priority: 'MEDIUM', category: 'MANUAL' }) }} style={{
            width: 38, height: 38, borderRadius: 10, border: 'none',
            background: 'var(--accent)', color: '#fff', fontSize: 16, fontWeight: 700,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'opacity 0.2s',
          }}>
            +
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-row" style={{ display: 'flex', gap: 14, marginBottom: 28 }}>
        <StatCard label="Remaining" value={remaining.length} icon="📋" />
        <StatCard label="Completed" value={completed.length} icon="✅" color="var(--green)" />
      </div>

      {/* Task list - Remaining tasks first */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Spinner size={32} /></div>
      ) : selectedTasks.length === 0 ? (
        <Empty icon="🗒️" message={`No tasks on ${selectedDate}. Add one or use the AI Agent!`} action={<Btn onClick={() => { setEditingTask(null); setShowAdd(true); setForm({ title: '', description: '', taskDate: selectedDate, taskTime: '09:00', startTime: '09:00', endTime: '10:00', alarmTune: TUNES[0], priority: 'MEDIUM', category: 'MANUAL' }) }}>+ Add First Task</Btn>} />
      ) : (
        <>
          {remaining.length > 0 && (
            <>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                📋 Remaining
              </div>
              {remaining.map((t) => {
                const now = new Date()
                const currentTimeStr = format(now, 'HH:mm:ss')
                const isPastTask = selectedDate < today || (selectedDate === today && t.taskTime && t.taskTime < currentTimeStr)
                return (
                <Card key={t.id} onClick={() => handleEditTask(t)} style={{ display: 'flex', gap: 14, marginBottom: 12, transition: 'opacity 0.2s', cursor: 'pointer' }}>
                  {/* Checkbox */}
                  <div onClick={(e) => { e.stopPropagation(); handleToggle(t.id) }} style={{
                    width: 22, height: 22, borderRadius: 6, marginTop: 2, flexShrink: 0,
                    border: '2px solid var(--border2)',
                    background: 'transparent', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, color: '#fff', transition: 'all 0.15s',
                  }}>
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontWeight: 600, color: 'var(--white)' }}>
                        {CATEGORY_ICONS[t.category] || '📌'} {t.title}
                      </span>
                      <Badge color={PRIORITY_COLOR[t.priority]}>{t.priority}</Badge>
                      {t.aiGenerated && <Badge color="purple">AI</Badge>}
                    </div>
                    {t.description && <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 6 }}>{t.description}</div>}
                    <div style={{ fontSize: 11, color: 'var(--text2)' }}>
                      ⏰ {(t.startTime || t.taskTime)?.slice(0, 5)} → {(t.endTime || t.startTime || t.taskTime)?.slice(0, 5)} &nbsp; 🔔 {t.alarmTune}
                    </div>
                  </div>

                  <button onClick={(e) => { e.stopPropagation(); handleDelete(t.id, t.title, t.done, t.taskDate, t.taskTime) }} style={{
                    background: 'transparent', border: 'none', color: isPastTask ? 'var(--text2)' : 'var(--text2)',
                    cursor: isPastTask ? 'not-allowed' : 'pointer', fontSize: 16, padding: '4px 6px', flexShrink: 0,
                    opacity: isPastTask ? 0.5 : 1,
                    title: isPastTask ? 'Cannot delete past tasks (affects weekly report)' : '',
                  }}>✕</button>
                </Card>
                )
              })}
            </>
          )}

          {completed.length > 0 && (
            <>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 12, marginTop: 24, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                ✅ Completed
              </div>
              {completed.map((t) => (
                <Card key={t.id} style={{ display: 'flex', gap: 14, marginBottom: 12, opacity: 0.55, transition: 'opacity 0.2s' }}>
                  {/* Checkbox */}
                  <div onClick={() => handleToggle(t.id)} style={{
                    width: 22, height: 22, borderRadius: 6, marginTop: 2, flexShrink: 0,
                    border: '2px solid var(--green)',
                    background: 'var(--green)', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, color: '#fff', transition: 'all 0.15s',
                  }}>
                    ✓
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontWeight: 600, textDecoration: 'line-through', color: 'var(--text2)' }}>
                        {CATEGORY_ICONS[t.category] || '📌'} {t.title}
                      </span>
                      <Badge color={PRIORITY_COLOR[t.priority]}>{t.priority}</Badge>
                      {t.aiGenerated && <Badge color="purple">AI</Badge>}
                    </div>
                    {t.description && <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 6 }}>{t.description}</div>}
                    <div style={{ fontSize: 11, color: 'var(--text2)' }}>
                      ⏰ {(t.startTime || t.taskTime)?.slice(0, 5)} → {(t.endTime || t.startTime || t.taskTime)?.slice(0, 5)} &nbsp; 🔔 {t.alarmTune}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    {t.completionPhotoUrl && (
                      <img
                        src={t.completionPhotoUrl}
                        alt="Done"
                        onClick={() => setLightboxTask(t)}
                        style={{
                          width: 28, height: 28, borderRadius: 6, objectFit: 'cover',
                          border: '1px solid var(--border2)', cursor: 'pointer',
                        }}
                      />
                    )}
                    <button onClick={() => handleDelete(t.id, t.title, t.done, t.taskDate, t.taskTime)} style={{
                      background: 'transparent', border: 'none', color: 'var(--text2)', opacity: 0.5,
                      cursor: 'not-allowed', fontSize: 16, padding: '4px 6px', flexShrink: 0,
                      title: 'Cannot delete completed tasks (affects weekly report)',
                    }}>✕</button>
                  </div>
                </Card>
              ))}
            </>
          )}
        </>
      )}

      {/* Delete Confirmation Modal */}
      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Delete Task">
        <div>
          <div style={{ fontSize: 14, color: 'var(--text2)', marginBottom: 24 }}>
            Are you sure you want to delete <strong>"{deleteConfirm?.title}"</strong>? This action cannot be undone.
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button onClick={() => setDeleteConfirm(null)} style={{
              padding: '9px 18px', borderRadius: 8, border: '1px solid var(--border)',
              background: 'transparent', color: 'var(--text)', fontSize: 13, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'var(--font-body)',
            }}>
              Cancel
            </button>
            <button onClick={confirmDelete} style={{
              padding: '9px 18px', borderRadius: 8, border: 'none',
              background: 'var(--red)', color: '#fff', fontSize: 13, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'var(--font-body)',
            }}>
              Delete
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Delete Task">
        <div>
          <div style={{ fontSize: 14, color: 'var(--text2)', marginBottom: 24 }}>
            Are you sure you want to delete <strong>"{deleteConfirm?.title}"</strong>? This action cannot be undone.
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button onClick={() => setDeleteConfirm(null)} style={{
              padding: '9px 18px', borderRadius: 8, border: '1px solid var(--border)',
              background: 'transparent', color: 'var(--text)', fontSize: 13, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'var(--font-body)',
            }}>
              Cancel
            </button>
            <button onClick={confirmDelete} style={{
              padding: '9px 18px', borderRadius: 8, border: 'none',
              background: 'var(--red)', color: '#fff', fontSize: 13, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'var(--font-body)',
            }}>
              Delete
            </button>
          </div>
        </div>
      </Modal>

      {/* Add Task Modal */}
      <Modal open={showAdd} onClose={() => { setShowAdd(false); setEditingTask(null); setForm({ title: '', description: '', taskDate: selectedDate, taskTime: '09:00', startTime: '09:00', endTime: '10:00', alarmTune: TUNES[0], priority: 'MEDIUM', category: 'MANUAL' }) }} title={editingTask ? '✏️ Edit Task' : '➕ Add Task'}>
        <form onSubmit={handleAdd}>
          {[{ label: 'Title', key: 'title', placeholder: 'e.g. Morning run', required: true }, { label: 'Description', key: 'description', placeholder: 'Optional details' }].map(({ label, key, placeholder, required }) => (
            <div key={key} style={{ marginBottom: 14 }}>
              <Label>{label}</Label>
              <input placeholder={placeholder} value={form[key]} onChange={(e) => f(key, e.target.value)} required={required} />
            </div>
          ))}
          <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
            <div style={{ flex: 1 }}>
              <Label>Date</Label>
              <input type="date" value={form.taskDate} onChange={(e) => f('taskDate', e.target.value)} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
            <div style={{ flex: 1 }}>
              <Label>Start Time</Label>
              <input type="time" value={form.startTime} onChange={(e) => f('startTime', e.target.value)} />
            </div>
            <div style={{ flex: 1 }}>
              <Label>End Time</Label>
              <input type="time" value={form.endTime} onChange={(e) => f('endTime', e.target.value)} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
            <div style={{ flex: 1 }}>
              <Label>Priority</Label>
              <select value={form.priority} onChange={(e) => f('priority', e.target.value)}>
                {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <Label>Category</Label>
              <select value={form.category} onChange={(e) => f('category', e.target.value)}>
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div style={{ marginBottom: 22 }}>
            <Label>Alarm Tune</Label>
            <select value={form.alarmTune} onChange={(e) => f('alarmTune', e.target.value)}>
              {TUNES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <Btn type="submit" full loading={saving}>{editingTask ? 'Update Task' : 'Add Task'}</Btn>
            <Btn variant="ghost" type="button" onClick={() => setShowAdd(false)}>Cancel</Btn>
          </div>
        </form>
      </Modal>

      {/* Alarm Popup */}
      <Modal open={!!alarmTask} onClose={() => setAlarmTask(null)}>
        {alarmTask && (
          <div style={{ textAlign: 'center' }}>
            <div className="alarm-pulse" style={{ fontSize: 52, marginBottom: 12, display: 'inline-block' }}>⏰</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, color: 'var(--accent)', marginBottom: 6, animation: 'alarmPulse 0.6s ease infinite' }}>
              Time's Up!
            </div>
            <div style={{ fontSize: 17, fontWeight: 600, marginBottom: 4 }}>{alarmTask.title}</div>
            {alarmTask.description && <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 8 }}>{alarmTask.description}</div>}
            <Badge color="purple">{alarmTask.alarmTune} 🔊</Badge>
            <Divider style={{ margin: '20px 0' }} />
            <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 18 }}>
              📸 Take a photo after completing this task and share on social media — <strong>optional</strong>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 16 }}>
              <Btn onClick={() => { handleToggle(alarmTask.id); setAlarmTask(null) }}>✓ Mark Done</Btn>
              <Btn variant="success" onClick={handleCaptureAndShare}>📸 Share & Done</Btn>
            </div>
            <Btn variant="ghost" full onClick={() => setAlarmTask(null)}>Not Finished(Close)</Btn>
          </div>
        )}
      </Modal>

      {/* Start Time Reminder Modal */}
      <Modal open={!!startTimeReminder} onClose={() => handleStartReminderClose()}>
        {startTimeReminder && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 52, marginBottom: 12 }}>📋</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, color: 'var(--white)', marginBottom: 6 }}>
              Time to Start!
            </div>
            <div style={{ fontSize: 17, fontWeight: 600, marginBottom: 4 }}>{startTimeReminder.title}</div>
            {startTimeReminder.description && <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 12 }}>{startTimeReminder.description}</div>}
            <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 12 }}>
              ⏱️ <strong>Start:</strong> {startTimeReminder.startTime?.slice(0, 5)} &nbsp; <strong>End:</strong> {startTimeReminder.endTime?.slice(0, 5)}
            </div>
            {startTimeReminder.goalContext && <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 12, fontStyle: 'italic' }}>"{startTimeReminder.goalContext}"</div>}
            <Divider style={{ margin: '16px 0' }} />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <Btn onClick={() => handleStartReminderClose()}>✓ Start Task</Btn>
              <Btn variant="ghost" onClick={() => handleStartReminderClose()}>Dismiss</Btn>
            </div>
          </div>
        )}
      </Modal>

      {/* Change End Time Modal */}
      <Modal open={!!changeEndTimeModal} onClose={() => { setChangeEndTimeModal(null); setNewEndTime(''); }} title="Change End Time">
        {changeEndTimeModal && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 12 }}>
                Current End Time: <strong>{changeEndTimeModal.endTime?.slice(0, 5)}</strong>
              </div>
              <div style={{ fontSize: 13, color:  changeEndTimeModal.endTimeChanges >= 2 ? 'var(--red)' : 'var(--text2)', marginBottom: 16 }}>
                Changes Remaining: <strong>{2 - changeEndTimeModal.endTimeChanges}</strong>
              </div>
              {changeEndTimeModal.endTimeChanges >= 2 ? (
                <div style={{ padding: 12, background: 'var(--red-s)', borderRadius: 8, borderLeft: '3px solid var(--red)', fontSize: 13, color: 'var(--text2)' }}>
                  ⛔ Maximum 2 end time changes reached. Cannot modify further.
                </div>
              ) : (
                <>
                  <Label>New End Time</Label>
                  <input type="time" value={newEndTime} onChange={(e) => setNewEndTime(e.target.value)} />
                </>
              )}
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => { setChangeEndTimeModal(null); setNewEndTime(''); }} style={{
                padding: '9px 18px', borderRadius: 8, border: '1px solid var(--border)',
                background: 'transparent', color: 'var(--text)', fontSize: 13, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'var(--font-body)',
              }}>
                Cancel
              </button>
              {changeEndTimeModal.endTimeChanges < 2 && (
                <button onClick={handleUpdateEndTime} disabled={!newEndTime} style={{
                  padding: '9px 18px', borderRadius: 8, border: 'none',
                  background: 'var(--accent)', color: '#fff', fontSize: 13, fontWeight: 600,
                  cursor: newEndTime ? 'pointer' : 'not-allowed', fontFamily: 'var(--font-body)',
                  opacity: newEndTime ? 1 : 0.5,
                }}>
                  Update End Time
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>
      {/* Photo Lightbox */}
      {lightboxTask && (
        <div
          onClick={() => setLightboxTask(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 24,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: 480, width: '100%', background: 'var(--surface)',
              borderRadius: 16, overflow: 'hidden',
              border: '1px solid var(--border2)',
            }}
          >
            <img
              src={lightboxTask.completionPhotoUrl}
              alt={lightboxTask.title}
              style={{ width: '100%', maxHeight: '60vh', objectFit: 'cover', display: 'block' }}
            />
            <div style={{ padding: '16px 20px' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: 'var(--white)', marginBottom: 4 }}>
                {CATEGORY_ICONS[lightboxTask.category] || '📌'} {lightboxTask.title}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 16 }}>
                {lightboxTask.taskDate} &nbsp;·&nbsp; {(lightboxTask.endTime || lightboxTask.startTime || lightboxTask.taskTime)?.slice(0, 5)}
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <Btn
                  full
                  onClick={() => {
                    const a = document.createElement('a')
                    a.href = lightboxTask.completionPhotoUrl
                    a.download = `focusflow-${lightboxTask.title.replace(/[^a-zA-Z0-9]/g, '_')}-${lightboxTask.taskDate}.jpg`
                    a.click()
                  }}
                >
                  ⬇ Download
                </Btn>
                <Btn variant="ghost" full onClick={() => setLightboxTask(null)}>Close</Btn>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Camera Modal */}
      <Modal open={showCameraModal} onClose={closeCameraModal} title={photoPreview ? '📸 Photo Preview' : '📷 Capture Photo'}>
        {!photoPreview ? (
          <div>
            {!cameraStream ? (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>📷</div>
                <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 20 }}>
                  Take a photo to share your task completion
                </div>
                <div style={{ display: 'flex', gap: 10, flexDirection: 'column' }}>
                  <Btn full onClick={startCamera}>📷 Open Camera</Btn>
                  <input
                    type="file"
                    id="gallery-upload"
                    accept="image/*"
                    onChange={handleGalleryUpload}
                    style={{ display: 'none' }}
                  />
                  <Btn 
                    full 
                    variant="ghost" 
                    onClick={() => document.getElementById('gallery-upload').click()}
                  >
                    📁 Upload from Gallery
                  </Btn>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center' }}>
                <video
                  ref={videoRef}
                  style={{
                    width: '100%',
                    borderRadius: 12,
                    marginBottom: 16,
                    background: 'var(--surface)',
                    transform: 'scaleX(-1)',
                  }}
                  autoPlay
                  playsInline
                />
                <canvas
                  ref={canvasRef}
                  style={{ display: 'none' }}
                  width={640}
                  height={480}
                />
                <div style={{ display: 'flex', gap: 10 }}>
                  <Btn full onClick={capturePhoto} variant="success">
                    📸 Capture Photo
                  </Btn>
                  <Btn
                    full
                    variant="ghost"
                    onClick={() => {
                      if (cameraStream) {
                        cameraStream.getTracks().forEach(track => track.stop())
                        setCameraStream(null)
                      }
                    }}
                  >
                    Close Camera
                  </Btn>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <img
              src={photoPreview}
              style={{
                width: '100%',
                borderRadius: 12,
                marginBottom: 16,
                maxHeight: 400,
                objectFit: 'cover',
              }}
              alt="Preview"
            />
            <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 16 }}>
              ✅ Photo captured! Ready to mark this task as done?
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <Btn full onClick={confirmAndMarkDone} variant="success">
                ✓ Confirm & Mark Done
              </Btn>
              <Btn
                full
                variant="ghost"
                onClick={() => {
                  setPhotoPreview(null)
                  if (cameraStream === null) {
                    startCamera()
                  }
                }}
              >
                🔄 Retake
              </Btn>
            </div>
          </div>
        )}
      </Modal>    </div>
  )
}
