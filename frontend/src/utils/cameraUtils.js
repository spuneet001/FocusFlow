import { Camera as CapCamera, CameraResultType, CameraSource } from '@capacitor/camera'
import { Capacitor } from '@capacitor/core'

/**
 * Take a photo using native camera (on mobile) or return null (on web).
 * Returns a base64 data URL string.
 */
export async function takePhoto() {
  if (!Capacitor.isNativePlatform()) return null

  const image = await CapCamera.getPhoto({
    quality: 80,
    resultType: CameraResultType.DataUrl,
    source: CameraSource.Camera,
    correctOrientation: true,
  })
  return image.dataUrl
}

/**
 * Pick photo from gallery using native picker (on mobile) or return null (on web).
 * Returns a base64 data URL string.
 */
export async function pickFromGallery() {
  if (!Capacitor.isNativePlatform()) return null

  const image = await CapCamera.getPhoto({
    quality: 80,
    resultType: CameraResultType.DataUrl,
    source: CameraSource.Photos,
    correctOrientation: true,
  })
  return image.dataUrl
}
