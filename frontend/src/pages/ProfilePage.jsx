import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store'
import { userApi } from '../api'
import { Btn, Card, Modal, Label, Badge, Divider, Spinner } from '../components/ui'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { Camera, Download, ArrowRight } from 'lucide-react'

export default function ProfilePage() {
  const { user, setUser, logout } = useAuthStore()
  const navigate = useNavigate()
  const [gallery, setGallery] = useState([])
  const [loadingGallery, setLoadingGallery] = useState(false)
  const [name, setName] = useState(user?.name || '')
  const [saving, setSaving] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [changingPw, setChangingPw] = useState(false)
  const [showPwModal, setShowPwModal] = useState(false)
  const [lightboxPhoto, setLightboxPhoto] = useState(null)
  const fileRef = useRef(null)

  useEffect(() => {
    setLoadingGallery(true)
    userApi.getGallery().then(({ data }) => setGallery(data)).catch(() => {}).finally(() => setLoadingGallery(false))
  }, [])

  useEffect(() => { if (user?.name) setName(user.name) }, [user])

  async function handleUploadPicture(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async (ev) => {
      try {
        const { data } = await userApi.updateProfile({ profilePictureUrl: ev.target.result })
        setUser(data)
        toast.success('Profile picture updated!')
      } catch { toast.error('Failed to upload picture') }
    }
    reader.readAsDataURL(file)
  }

  async function handleSaveName() {
    if (!name.trim()) return
    setSaving(true)
    try {
      const { data } = await userApi.updateProfile({ name: name.trim() })
      setUser(data)
      toast.success('Name updated!')
    } catch { toast.error('Failed to update name') }
    setSaving(false)
  }

  async function handleChangePassword(e) {
    e.preventDefault()
    if (!currentPassword || !newPassword) return
    setChangingPw(true)
    try {
      await userApi.changePassword({ currentPassword, newPassword })
      toast.success('Password changed!')
      setCurrentPassword('')
      setNewPassword('')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password')
    }
    setChangingPw(false)
  }

  const pfp = user?.profilePictureUrl
  const planColor = user?.plan === 'PREMIUM' ? 'gold' : user?.plan === 'PRO' ? 'purple' : 'muted'

  return (
    <div className="fade-in">
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: 'var(--white)', marginBottom: 28 }}>
        My Profile
      </div>

      {/* Profile Card */}
      <Card style={{ display: 'flex', gap: 24, alignItems: 'center', marginBottom: 24 }} className="profile-card">
        <div
          onClick={() => fileRef.current?.click()}
          style={{
            width: 80, height: 80, borderRadius: '50%', flexShrink: 0,
            background: pfp ? `url(${pfp}) center/cover` : 'linear-gradient(135deg, var(--accent), var(--green))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', border: '3px solid var(--border2)',
            fontSize: pfp ? 0 : 28, color: '#fff', fontWeight: 700,
          }}
          title="Click to change picture"
        >
          {!pfp && (user?.name?.[0]?.toUpperCase() || '?')}
        </div>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleUploadPicture} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--white)', marginBottom: 4 }}>{user?.name}</div>
          <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 6 }}>{user?.email}</div>
          <Badge color={planColor}>{user?.plan || 'FREE'} PLAN</Badge>
          <div
            onClick={() => setShowPwModal(true)}
            style={{ fontSize: 12, color: 'var(--accent)', cursor: 'pointer', marginTop: 8, fontWeight: 600 }}
          >
            Change Password
          </div>
          {user?.createdAt && (
            <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 6 }}>
              Member since {format(new Date(user.createdAt), 'MMM d, yyyy')}
            </div>
          )}
        </div>
      </Card>

      {/* Change Password Modal */}
      <Modal open={showPwModal} onClose={() => { setShowPwModal(false); setCurrentPassword(''); setNewPassword('') }} title="Change Password">
        <form onSubmit={(e) => { handleChangePassword(e).then(() => { if (!changingPw) setShowPwModal(false) }) }}>
          <div style={{ marginBottom: 10 }}>
            <Label>Current Password</Label>
            <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Enter current password" />
          </div>
          <div style={{ marginBottom: 14 }}>
            <Label>New Password</Label>
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Enter new password" />
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <Btn type="submit" loading={changingPw} disabled={!currentPassword || !newPassword}>Update Password</Btn>
            <Btn variant="ghost" type="button" onClick={() => { setShowPwModal(false); setCurrentPassword(''); setNewPassword('') }}>Cancel</Btn>
          </div>
        </form>
      </Modal>

      {/* Subscription Info */}
      <Card style={{ marginBottom: 24 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--white)', marginBottom: 14 }}>
          Subscription
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 14, color: 'var(--text)' }}>Current Plan:</span>
          <Badge color={planColor}>{user?.plan || 'FREE'}</Badge>
        </div>
        {user?.plan === 'FREE' && (
          <Btn variant="ghost" onClick={() => window.location.href = '/subscription'} style={{ marginTop: 8 }}>
            Upgrade Plan <ArrowRight size={14} style={{ display: 'inline', verticalAlign: 'middle' }} />
          </Btn>
        )}
        {user?.plan !== 'FREE' && (
          <Btn variant="ghost" onClick={() => window.location.href = '/subscription'} style={{ marginTop: 8 }}>
            Manage Plan <ArrowRight size={14} style={{ display: 'inline', verticalAlign: 'middle' }} />
          </Btn>
        )}
      </Card>

      {/* Photo Gallery */}
      <Card>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--white)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Camera size={16} /> My Gallery
        </div>
        {loadingGallery ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}><Spinner size={28} /></div>
        ) : gallery.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 32, color: 'var(--text2)', fontSize: 13 }}>
            No photos yet. Complete tasks with photos to build your gallery!
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 10 }}>
            {gallery.map((item) => (
              <div
                key={item.taskId}
                onClick={() => setLightboxPhoto(item)}
                style={{
                  position: 'relative', borderRadius: 10, overflow: 'hidden',
                  cursor: 'pointer', aspectRatio: '1', border: '1px solid var(--border2)',
                }}
              >
                <img
                  src={item.photoUrl}
                  alt={item.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
                <div style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0,
                  background: 'linear-gradient(transparent, rgba(0,0,0,0.75))',
                  padding: '16px 8px 6px', fontSize: 10, color: '#fff', fontWeight: 600,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {item.title}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Sign Out */}
      <Btn variant="danger" full onClick={() => { logout(); navigate('/login') }} style={{ marginTop: 24 }}>
        Sign Out
      </Btn>

      {/* Gallery Lightbox */}
      {lightboxPhoto && (
        <div
          onClick={() => setLightboxPhoto(null)}
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
              src={lightboxPhoto.photoUrl}
              alt={lightboxPhoto.title}
              style={{ width: '100%', maxHeight: '60vh', objectFit: 'cover', display: 'block' }}
            />
            <div style={{ padding: '16px 20px' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: 'var(--white)', marginBottom: 4 }}>
                {lightboxPhoto.title}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 16 }}>
                {lightboxPhoto.taskDate} · {lightboxPhoto.taskTime?.slice(0, 5) || ''}
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <Btn
                  full
                  onClick={() => {
                    const a = document.createElement('a')
                    a.href = lightboxPhoto.photoUrl
                    a.download = `focusflow-${lightboxPhoto.title.replace(/[^a-zA-Z0-9]/g, '_')}-${lightboxPhoto.taskDate}.jpg`
                    a.click()
                  }}
                >
                  <Download size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /> Download
                </Btn>
                <Btn variant="ghost" full onClick={() => setLightboxPhoto(null)}>Close</Btn>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
