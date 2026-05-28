'use client'
import { useState, useEffect } from 'react'
import { database, storage } from '../lib/firebase'
import { ref, push, set, remove, onValue } from 'firebase/database'
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'

const USERS = [
  { username: 'Talar', password: 'Keren0208#^' },
  { username: 'yaniv', password: 'Tal0905#^' },
]

interface Car {
  id: string
  name: string
  year: number
  price: number
  engine: string
  km: number
  description: string
  image_url: string
  images: string[]
}

export default function AdminPanel() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [cars, setCars] = useState<Car[]>([])
  const [form, setForm] = useState({ name: '', year: '', price: '', engine: '', km: '', description: '' })
  const [loading, setLoading] = useState(false)
  const [imageFiles, setImageFiles] = useState<FileList | null>(null)
  const [uploadProgress, setUploadProgress] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [existingImages, setExistingImages] = useState<string[]>([])

  useEffect(() => {
    const saved = sessionStorage.getItem('admin_logged_in')
    if (saved === 'true') setIsLoggedIn(true)
  }, [])

  useEffect(() => {
    if (!isLoggedIn) return
    const carsRef = ref(database, 'cars')
    const unsubscribe = onValue(carsRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        const carsList = Object.keys(data).map((key) => ({
          id: key, ...data[key],
          images: data[key].images || (data[key].image_url ? [data[key].image_url] : []),
        }))
        setCars(carsList)
      } else { setCars([]) }
    })
    return () => unsubscribe()
  }, [isLoggedIn])

  function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    const found = USERS.find(u => u.username === username && u.password === password)
    if (found) { setIsLoggedIn(true); sessionStorage.setItem('admin_logged_in', 'true'); setLoginError('') }
    else { setLoginError('Wrong username or password') }
  }

  function handleLogout() { setIsLoggedIn(false); sessionStorage.removeItem('admin_logged_in') }

  function startEdit(car: Car) {
    setEditingId(car.id)
    setForm({
      name: car.name || '',
      year: String(car.year || ''),
      price: String(car.price || ''),
      engine: car.engine || '',
      km: String(car.km || ''),
      description: car.description || '',
    })
    setExistingImages(car.images || [])
    setImageFiles(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function cancelEdit() {
    setEditingId(null)
    setForm({ name: '', year: '', price: '', engine: '', km: '', description: '' })
    setExistingImages([])
    setImageFiles(null)
  }

  function removeExistingImage(idx: number) {
    setExistingImages(prev => prev.filter((_, i) => i !== idx))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const newImageUrls: string[] = []

    if (imageFiles && imageFiles.length > 0) {
      for (let i = 0; i < imageFiles.length; i++) {
        try {
          setUploadProgress(`Uploading image ${i + 1} of ${imageFiles.length}...`)
          const file = imageFiles[i]
          const imgRef = storageRef(storage, `cars/${Date.now()}_${file.name}`)
          await uploadBytes(imgRef, file)
          const url = await getDownloadURL(imgRef)
          newImageUrls.push(url)
        } catch (error) {
          alert('Error uploading image ' + (i + 1))
          setLoading(false); setUploadProgress(''); return
        }
      }
    }

    const allImages = [...existingImages, ...newImageUrls]
    const carData = {
      name: form.name,
      year: parseInt(form.year) || 0,
      price: parseInt(form.price) || 0,
      engine: form.engine,
      km: parseInt(form.km) || 0,
      description: form.description,
      image_url: allImages[0] || '',
      images: allImages,
    }

    setUploadProgress('Saving...')

    try {
      if (editingId) {
        await set(ref(database, `cars/${editingId}`), carData)
        alert('Car updated!')
      } else {
        await push(ref(database, 'cars'), carData)
        alert('Car added with ' + allImages.length + ' images!')
      }
      cancelEdit()
      const fileInput = document.getElementById('file-input') as HTMLInputElement
      if (fileInput) fileInput.value = ''
    } catch (error: any) {
      alert('Error: ' + error.message)
    } finally { setLoading(false); setUploadProgress('') }
  }

  function deleteCar(id: string) {
    if (!confirm('Are you sure?')) return
    remove(ref(database, `cars/${id}`))
  }

  const S: React.CSSProperties = { padding: '12px', marginBottom: '12px', width: '100%', borderRadius: '8px', border: '2px solid #ddd', fontSize: '16px', boxSizing: 'border-box', backgroundColor: '#fff', color: '#000', fontFamily: 'Arial' }

  if (!isLoggedIn) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f0f0f0', fontFamily: 'Arial' }}>
        <div style={{ background: 'white', padding: '3rem', borderRadius: '16px', width: '400px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
          <h1 style={{ textAlign: 'center', marginBottom: '2rem', color: '#0B1F3A' }}>🔒 Admin Login</h1>
          <form onSubmit={handleLogin}>
            <input placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} style={S} required />
            <input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={S} required />
            {loginError && <p style={{ color: 'red', marginBottom: '1rem', textAlign: 'center' }}>{loginError}</p>}
            <button type="submit" style={{ width: '100%', padding: '14px', background: '#0B1F3A', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>Login</button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', fontFamily: 'Arial', backgroundColor: '#f9f9f9', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ color: '#000' }}>🚗 Admin Panel</h1>
        <button onClick={handleLogout} style={{ padding: '8px 16px', background: '#666', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Logout</button>
      </div>

      <div style={{ background: editingId ? '#FFF8E1' : '#fff', padding: '2rem', borderRadius: '12px', marginBottom: '2rem', border: editingId ? '2px solid #C9A84C' : '1px solid #ddd' }}>
        <h2 style={{ color: '#000', marginBottom: '1.5rem' }}>
          {editingId ? '✏️ Edit Car' : '➕ Add Car'}
          {editingId && <button onClick={cancelEdit} style={{ marginRight: '1rem', padding: '4px 12px', background: '#eee', border: '1px solid #ccc', borderRadius: '5px', cursor: 'pointer', fontSize: '14px' }}>Cancel</button>}
        </h2>
        <form onSubmit={handleSubmit}>
          <input placeholder="Car Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={S} required />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <input placeholder="Year" type="number" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} style={S} />
            <input placeholder="Price" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} style={S} />
            <input placeholder="Engine" value={form.engine} onChange={(e) => setForm({ ...form, engine: e.target.value })} style={S} />
            <input placeholder="KM" type="number" value={form.km} onChange={(e) => setForm({ ...form, km: e.target.value })} style={S} />
          </div>
          <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} style={{ ...S, minHeight: '80px', resize: 'vertical' }} />

          {existingImages.length > 0 && (
            <div style={{ marginBottom: '12px' }}>
              <p style={{ fontWeight: 'bold', marginBottom: '8px', color: '#333' }}>Current Images (click X to remove):</p>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {existingImages.map((img, idx) => (
                  <div key={idx} style={{ position: 'relative', width: '100px', height: '75px' }}>
                    <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px', border: '2px solid #ddd' }} />
                    <button type="button" onClick={() => removeExistingImage(idx)} style={{ position: 'absolute', top: '-6px', right: '-6px', width: '22px', height: '22px', background: '#C0392B', color: 'white', border: 'none', borderRadius: '50%', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ marginBottom: '12px', padding: '16px', border: '2px dashed #C9A84C', borderRadius: '8px', background: '#FFFDF5' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#0B1F3A' }}>
              {editingId ? 'Add More Images' : 'Upload Images'} (select multiple)
            </label>
            <input id="file-input" type="file" accept="image/*" multiple onChange={(e) => setImageFiles(e.target.files)} style={{ fontSize: '14px' }} />
            {imageFiles && imageFiles.length > 0 && <p style={{ marginTop: '8px', color: '#1A7A4A', fontWeight: 'bold' }}>{imageFiles.length} new images selected</p>}
          </div>

          {uploadProgress && <p style={{ color: '#C9A84C', fontWeight: 'bold', marginBottom: '12px' }}>{uploadProgress}</p>}
          <button type="submit" disabled={loading} style={{ width: '100%', padding: '14px', background: editingId ? '#C9A84C' : '#0B1F3A', color: editingId ? '#0B1F3A' : 'white', border: 'none', borderRadius: '8px', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 'bold', fontSize: '16px' }}>
            {loading ? 'Uploading...' : editingId ? '💾 Save Changes' : '➕ Add Car'}
          </button>
        </form>
      </div>

      <div>
        <h2 style={{ color: '#000', marginBottom: '1rem' }}>Existing Cars ({cars.length})</h2>
        {cars.length === 0 ? <p style={{ color: '#666' }}>No cars added yet</p> : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {cars.map((car) => (
              <div key={car.id} style={{ border: '1px solid #ddd', borderRadius: '12px', overflow: 'hidden', background: 'white' }}>
                {car.images && car.images.length > 0 ? (
                  <div style={{ position: 'relative' }}>
                    <img src={car.images[0]} alt={car.name} style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
                    {car.images.length > 1 && <span style={{ position: 'absolute', bottom: '8px', left: '8px', background: 'rgba(0,0,0,0.6)', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '12px' }}>{car.images.length} images</span>}
                  </div>
                ) : (
                  <div style={{ width: '100%', height: '200px', background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>No Image</div>
                )}
                <div style={{ padding: '1rem' }}>
                  <h3 style={{ color: '#000', marginBottom: '0.3rem' }}>{car.name}</h3>
                  <p style={{ color: '#666', marginBottom: '0.3rem', fontSize: '0.85rem' }}>{car.year} · {car.engine} · {car.km} km</p>
                  <p style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#0B1F3A', marginBottom: '1rem' }}>₪ {car.price?.toLocaleString()}</p>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => startEdit(car)} style={{ flex: 1, padding: '8px', background: '#C9A84C', color: '#0B1F3A', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>✏️ Edit</button>
                    <button onClick={() => deleteCar(car.id)} style={{ flex: 1, padding: '8px', background: '#C0392B', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>🗑️ Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
