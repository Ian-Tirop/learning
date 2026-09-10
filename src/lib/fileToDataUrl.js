// Reads a File/Blob into a base64 data URL — the upload endpoints accept
// this directly in a JSON body rather than multipart/form-data, since the
// API already parses JSON by default and images here are small (avatars,
// inline post photos), so there's no need for a multipart-parsing library.
export function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(reader.error || new Error('Could not read that file.'))
    reader.readAsDataURL(file)
  })
}
