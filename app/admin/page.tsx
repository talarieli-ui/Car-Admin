'use client'
import { useState, useEffect } from 'react'
import { database, storage } from '../lib/firebase'
import { ref, push, remove, onValue } from 'firebase/database'
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
  const [form, setForm] = useState({
    name: '',
    year: '',
    price: '',
    engine: '',
    km: '',
    description: '',
    image_url: '',
  })
  const [loading, setLoading] = useState(false)
  const [imageFiles, setImageFiles] = useState<FileList | null>(null)
  const [uploadProgress, setUploadProgress] = useState('')

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
          id: key,
          ...data[key],
          images: data[key].images || (data[key].image_url ? [data[key].image_url] : []),
        }))
        setCars(carsList)
      } else {
        setCars([])
      }
    })
    return () => unsubscribe()
  }, [isLoggedIn])

  function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    const found = USERS.find(u => u.username === username && u.password === password)
    if (found) {
      setIsLoggedIn(true)
      sessionStorage.setItem('admin_logged_in', 'true')
      setLoginError('')
    } else {
      setLoginError('Wrong username or password')
    }
  }

  function handleLogout() {
    setIsLoggedIn(false)
    sessionStorage.removeItem('admin_logged_in')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const imageUrls: string[] = []

    if (imageFiles && imageFiles.length > 0) {
      for (let i = 0; i < imageFiles.length; i++) {
        try {
          setUploadProgress(`Uploading image ${i + 1} of ${imageFiles.length}...`)
          const file = imageFiles[i]
          const imgRef = storageRef(storage, `cars/${Date.now()}_${file.name}`)
          await uploadBytes(imgRef, file)
          const url = await getDownloadURL(imgRef)
          imageUrls.push(url)
        } catch (error) {
          alert('Error uploading image ' + (i + 1))
          setLoading(false)
          setUploadProgress('')
          return
        }
      }
    }

    setUploadProgress('Saving car...')
    const carsRef = ref(database, 'cars')
    push(carsRef, {
      name: form.name,
      year: parseInt(form.year),
      price: parseInt(form.price),
      engine: form.engine,
      km: parseInt(form.km),
      description: form.description,
      image_url: imageUrls[0] || '',
      images: imageUrls,
    }).then(() => {
      alert('Car added with ' + imageUrls.length + ' images!')
      setForm({ name: '', year: '', price: '', engine: '', km: '', description: '', image_url: '' })
      setImageFiles(null)
      const fileInput = document.getElementById('file-input') as HTMLInputElement
      if (fileInput) fileInput.value = ''
    }).catch((error) => alert('Error: ' + error.message))
      .finally(() => { setLoading(false); setUploadProgress('') })
  }

  function deleteCar(id: string) {
    if (!confirm('Are you sure?')) return
    const carRef = ref(database, `cars/${id}`)
    remove(carRef)
  }

  const inputStyle = {
    padding: '12px',
    marginBottom: '12px',
    width: '100%',
    borderRadius: '5px',
    border: '2px solid #ccc',
    fontSize: '16px',
    boxSizing: 'border-box' as const,
    backgroundColor: '#ffffff',
    color: '#000000',
  }

  if (!isLoggedIn) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f0f0f0', fontFamily: 'Arial' }}>
        <div style={{ background: 'white', padding: '3rem', borderRadius: '16px', width: '400px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
          <h1 style={{ textAlign: 'center', marginBottom: '2rem', color: '#0B1F3A' }}>🔒 Admin Login</h1>
          <form onSubmit={handleLogin}>
            <input placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} style={inputStyle} required />
            <input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle} required />
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
      <div style={{ background: '#ffffff', padding: '2rem', borderRadius: '10px', marginBottom: '2rem', border: '1px solid #ddd' }}>
        <h2 style={{ color: '#000', marginBottom: '1.5rem' }}>Add Car</h2>
        <form onSubmit={handleSubmit}>
          <input placeholder="Car Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={inputStyle} required />
          <input placeholder="Year" type="number" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} style={inputStyle} />
          <input placeholder="Price" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} style={inputStyle} />
          <input placeholder="Engine" value={form.engine} onChange={(e) => setForm({ ...form, engine: e.target.value })} style={inputStyle} />
          <input placeholder="KM" type="number" value={form.km} onChange={(e) => setForm({ ...form, km: e.target.value })} style={inputStyle} />
          <div style={{ marginBottom: '12px', padding: '16px', border: '2px dashed #C9A84C', borderRadius: '8px', background: '#FFFDF5' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#0B1F3A' }}>
              Upload Images (select multiple)
            </label>
            <input
              id="file-input"
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => setImageFiles(e.target.files)}
              style={{ fontSize: '14px' }}
            />
            {imageFiles && imageFiles.length > 0 && (
              <p style={{ marginTop: '8px', color: '#1A7A4A', fontWeight: 'bold' }}>
                {imageFiles.length} images selected
              </p>
            )}
          </div>
          <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }} />
          {uploadProgress && <p style={{ color: '#C9A84C', fontWeight: 'bold', marginBottom: '12px' }}>{uploadProgress}</p>}
          <button type="submit" disabled={loading} style={{ width: '100%', padding: '12px 24px', background: '#0B1F3A', color: 'white', border: 'none', borderRadius: '5px', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 'bold', fontSize: '16px' }}>
            {loading ? 'Uploading...' : 'Add Car'}
          </button>
        </form>
      </div>
      <div>
        <h2 style={{ color: '#000' }}>Existing Cars ({cars.length})</h2>
        {cars.length === 0 ? (
          <p style={{ color: '#666' }}>No cars added yet</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem', marginTop: '1rem' }}>
            {cars.map((car) => (
              <div key={car.id} style={{ border: '1px solid #ddd', borderRadius: '10px', overflow: 'hidden', background: 'white' }}>
                {car.images && car.images.length > 0 && (
                  <div style={{ position: 'relative' }}>
                    <img src={car.images[0]} alt={car.name} style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
                    {car.images.length > 1 && (
                      <span style={{ position: 'absolute', bottom: '8px', left: '8px', background: 'rgba(0,0,0,0.6)', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '12px' }}>
                        {car.images.length} images
                      </span>
                    )}
                  </div>
                )}
                <div style={{ padding: '1rem' }}>
                  <h3 style={{ color: '#000', marginBottom: '0.5rem' }}>{car.name}</h3>
                  <p style={{ color: '#666', marginBottom: '0.5rem' }}>{car.year} · {car.engine} · {car.km} km</p>
                  <p style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#0B1F3A', marginBottom: '1rem' }}>₪ {car.price?.toLocaleString()}</p>
                  <button onClick={() => deleteCar(car.id)} style={{ width: '100%', padding: '8px', background: '#C0392B', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
