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
        body: `${task.title} — starts now`,
        schedule: { at: startDate },
        sound: 'default',
        channelId: 'task-reminders',
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
        body: `${task.title} — deadline reached`,
        schedule: { at: endDate },
        sound: 'default',
        channelId: 'task-reminders',
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

  // Create the notification channel for Android
  try {
    await LocalNotifications.createChannel({
      id: 'task-reminders',
      name: 'Task Reminders',
      description: 'Start and end time reminders for your tasks',
      importance: 5, // Max importance
      sound: 'default',
      vibration: true,
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
