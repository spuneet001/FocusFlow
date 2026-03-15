import { LocalNotifications } from '@capacitor/local-notifications'
import { Capacitor } from '@capacitor/core'

/**
 * Request notification permissions (call once on app start).
 */
export async function requestNotificationPermission() {
  if (!Capacitor.isNativePlatform()) return true
  const { display } = await LocalNotifications.checkPermissions()
  if (display === 'granted') return true
  const result = await LocalNotifications.requestPermissions()
  return result.display === 'granted'
}

/**
 * Register a handler for when a notification is tapped.
 * The callback receives { taskId, type } where type is 'start' or 'end'.
 */
export function onNotificationTapped(callback) {
  if (!Capacitor.isNativePlatform()) return
  LocalNotifications.addListener('localNotificationActionPerformed', (event) => {
    const extra = event.notification?.extra
    if (extra?.taskId && extra?.type) {
      callback({ taskId: extra.taskId, type: extra.type })
    }
  })
}

/**
 * Schedule start + end notifications for a single task.
 * Uses task.id * 10 + offset for unique notification IDs.
 */
export async function scheduleTaskNotifications(task) {
  if (!Capacitor.isNativePlatform()) return

  const granted = await requestNotificationPermission()
  if (!granted) return

  // Cancel any existing notifications for this task first
  await cancelTaskNotifications(task.id)

  const notifications = []
  const now = new Date()

  // Schedule START notification
  const startTime = task.startTime?.slice(0, 5) || task.taskTime?.slice(0, 5)
  if (startTime && task.taskDate) {
    const startDate = new Date(`${task.taskDate}T${startTime}:00`)
    if (startDate > now) {
      notifications.push({
        id: task.id * 10 + 1,
        title: 'Time to Start!',
        body: `${task.title} — tap to begin your task`,
        schedule: { at: startDate },
        sound: 'default',
        channelId: 'task-alarms',
        extra: { taskId: task.id, type: 'start' },
      })
    }
  }

  // Schedule END notification
  const endTime = task.endTime?.slice(0, 5) || startTime
  if (endTime && task.taskDate) {
    const endDate = new Date(`${task.taskDate}T${endTime}:00`)
    if (endDate > now) {
      notifications.push({
        id: task.id * 10 + 2,
        title: "Time's Up!",
        body: `${task.title} — tap to mark done or take a photo`,
        schedule: { at: endDate },
        sound: 'default',
        channelId: 'task-alarms',
        extra: { taskId: task.id, type: 'end' },
      })
    }
  }

  if (notifications.length > 0) {
    await LocalNotifications.schedule({ notifications })
  }
}

/**
 * Cancel notifications for a specific task.
 */
export async function cancelTaskNotifications(taskId) {
  if (!Capacitor.isNativePlatform()) return
  try {
    await LocalNotifications.cancel({
      notifications: [
        { id: taskId * 10 + 1 },
        { id: taskId * 10 + 2 },
      ],
    })
  } catch {
    // Ignore — notification may not exist
  }
}

/**
 * Schedule notifications for all tasks (call on app start / task refresh).
 */
export async function scheduleAllTaskNotifications(tasks) {
  if (!Capacitor.isNativePlatform()) return

  const granted = await requestNotificationPermission()
  if (!granted) return

  // Create alarm-style notification channel for Android
  try {
    await LocalNotifications.createChannel({
      id: 'task-alarms',
      name: 'Task Alarms',
      description: 'Alarm-style reminders for task start and end times',
      importance: 5, // IMPORTANCE_HIGH — heads-up notification
      sound: 'default',
      vibration: true,
      lights: true,
    })
  } catch {
    // Channel creation only works on Android, ignore on iOS
  }

  for (const task of tasks) {
    if (!task.done) {
      await scheduleTaskNotifications(task)
    }
  }
}
