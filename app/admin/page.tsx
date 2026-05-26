'use client'
import { useState, useEffect } from 'react'
import { database, storage } from '../lib/firebase'
import { ref, push, remove, onValue } from 'firebase/database'
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'

const ADMIN_USER = 'admin'
const ADMIN_PASS = 'Cars2026!'

interface Car {
  id: string
  name: string
  year: number
  price: number
  engine: string
  km: number
  description: string
  image_url: string
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
  const [imageFile, setImageFile] = useState<File | null>(null)

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
    if (username === ADMIN_USER && password === ADMIN_PASS) {
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
    let imageUrl = form.image_url
    if (imageFile) {
      try {
        const imgRef = storageRef(storage, `cars/${Date.now()}_${imageFile.name}`)
        await uploadBytes(imgRef, imageFile)
        imageUrl = await getDownloadURL(imgRef)
      } catch (error) {
        alert('Error uploading image')
        setLoading(false)
        return
      }
    }
    const carsRef = ref(database, 'cars')
    push(carsRef, {
      name: form.name,
      year: parseInt(form.year),
      price: parseInt(form.price),
      engine: form.engine,
      km: parseInt(form.km),
      description: form.description,
      image_url: imageUrl,
    }).then(() => {
      alert('Car added!')
      setForm({ name: '', year: '', price: '', engine: '', km: '', description: '', image_url: '' })
      setImageFile(null)
    }).catch((error) => alert('Error: ' + error.message))
      .finally(() => setLoading(false))
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
            <input
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={inputStyle}
              required
            />
            <input
              placeholder="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={inputStyle}
              required
            />
            {loginError && <p style={{ color: 'red', marginBottom: '1rem', textAlign: 'center' }}>{loginError}</p>}
            <button type="submit" style={{ width: '100%', padding: '14px', background: '#0B1F3A', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>
              Login
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', fontFamily: 'Arial', backgroundColor: '#f9f9f9', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ color: '#000' }}>🚗 Admin Panel</h1>
        <button onClick={handleLogout} style={{ padding: '8px 16px', background: '#666', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
          Logout
        </button>
      </div>
      <div style={{ background: '#ffffff', padding: '2rem', borderRadius: '10px', marginBottom: '2rem', border: '1px solid #ddd' }}>
        <h2 style={{ color: '#000', marginBottom: '1.5rem' }}>Add Car</h2>
        <form onSubmit={handleSubmit}>
          <input placeholder="Car Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={inputStyle} required />
          <input placeholder="Year" type="number" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} style={inputStyle} />
          <input placeholder="Price" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} style={inputStyle} />
          <input placeholder="Engine" value={form.engine} onChange={(e) => setForm({ ...form, engine: e.target.value })} style={inputStyle} />
          <input placeholder="KM" type="number" value={form.km} onChange={(e) => setForm({ ...form, km: e.target.value })} style={inputStyle} />
          <input placeholder="Upload Image" type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} style={inputStyle} />
          <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }} />
          <button type="submit" disabled={loading} style={{ width: '100%', padding: '12px 24px', background: '#0B1F3A', color: 'white', border: 'none', borderRadius: '5px', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 'bold', fontSize: '16px' }}>
            {loading ? 'Loading...' : 'Add Car'}
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
                {car.image_url && <img src={car.image_url} alt={car.name} style={{ width: '100%', height: '200px', objectFit: 'cover' }} />}
                <div style={{ padding: '1rem' }}>
                  <h3 style={{ color: '#000', marginBottom: '0.5rem' }}>{car.name}</h3>
                  <p style={{ color: '#666', marginBottom: '0.5rem' }}>{car.year} · {car.engine} · {car.km} km</p>
                  <p style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#0B1F3A', marginBottom: '1rem' }}>₪ {car.price?.toLocaleString()}</p>
                  <button onClick={() => deleteCar(car.id)} style={{ width: '100%', padding: '8px', background: '#C0392B', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
