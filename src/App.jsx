import { createClient } from '@supabase/supabase-js'
import { useCallback, useEffect, useState } from 'react'
import './App.css'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const supabaseBucket = import.meta.env.VITE_SUPABASE_BUCKET
const youtubeChannelId = import.meta.env.VITE_YOUTUBE_CHANNEL_ID

const supabase =
  supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null

const navItems = [
  { id: 'gallery', label: 'Image and Photo' },
  { id: 'live', label: 'Live Streaming' },
  { id: 'pasteur', label: 'Our Pasteur' },
  { id: 'about', label: 'About Us' },
  { id: 'branham', label: 'William Marrion Branham' },
  { id: 'preaching', label: 'Preaching' },
]

const preachingTracks = [
  {
    title: 'Faith in daily life',
    text: 'Practical teaching that strengthens families, work lives, and personal prayer.',
  },
  {
    title: 'Sound doctrine',
    text: 'Rooted messages that point hearts back to Scripture and the love of Christ.',
  },
  {
    title: 'Worship gatherings',
    text: 'Spirit-led praise, testimonies, and time in the Word for all ages.',
  },
]

const pastorDetails = [
  { label: 'Ministry focus', value: 'Prayer, discipleship, and community care.' },
  { label: 'Office hours', value: 'Tuesday - Thursday | 10:00 - 14:00' },
  { label: 'Counseling', value: 'By appointment with the pastoral team.' },
]

const branhamLibrary = [
  {
    title: 'The Rapture',
    meta: 'Preparing the church for the coming of the Lord.',
    url: 'https://branham.org/messageaudio',
  },
  {
    title: 'An Absolute',
    meta: 'Anchoring faith in the unchanging Word.',
    url: 'https://branham.org/messageaudio',
  },
  {
    title: 'The Seven Church Ages',
    meta: 'A prophetic overview of the church through history.',
    url: 'https://branham.org/messageaudio',
  },
  {
    title: 'Questions and Answers',
    meta: 'Timeless counsel for believers seeking clarity.',
    url: 'https://branham.org/messageaudio',
  },
  {
    title: 'The Door',
    meta: 'Grace and invitation for every seeker.',
    url: 'https://branham.org/messageaudio',
  },
  {
    title: 'Why?',
    meta: 'A message on purpose, trials, and trust in God.',
    url: 'https://branham.org/messageaudio',
  },
]

const quoteSlides = [
  {
    text: 'The Lord is my shepherd; I shall not want.',
    source: 'Psalm 23:1',
  },
  {
    text: 'Jesus Christ the same yesterday, and today, and forever.',
    source: 'Hebrews 13:8',
  },
  {
    text: 'Faith is the substance of things hoped for, the evidence of things not seen.',
    source: 'Hebrews 11:1',
  },
  {
    text: 'The Bible is the absolute, and faith comes by hearing the Word of God.',
    source: 'William Marrion Branham',
  },
  {
    text: 'Let the Word speak; it is the voice of God to His people.',
    source: 'William Marrion Branham',
  },
]

const liveSchedule = [
  { title: 'Morning Prayer', time: '05:45 - 06:30' },
  { title: 'Midweek Word', time: '18:00 - 19:00' },
  { title: 'Sunday Service', time: '09:30 - 12:00' },
]

const details = [
  {
    title: 'Location',
    text: 'Johannesburg, Gauteng - gathering across the city and online.',
  },
  {
    title: 'Contact Line',
    text: '+27 11 555 0123 | info@elperetz-tabernacle.co.za',
  },
  {
    title: 'Streaming Channels',
    text: 'Live portal, YouTube mirror, and weekly worship sessions.',
  },
]

const galleryFallback = [
  'Prayer rooms',
  'Live worship',
  'Community outreach',
  'Streaming studio',
  'Youth choir',
  'Events & gatherings',
]

function App() {
  const [galleryItems, setGalleryItems] = useState([])
  const [galleryState, setGalleryState] = useState('idle')
  const [galleryMessage, setGalleryMessage] = useState('')
  const [videoItems, setVideoItems] = useState([])
  const [videoState, setVideoState] = useState('idle')
  const [videoMessage, setVideoMessage] = useState('')
  const [activeVideo, setActiveVideo] = useState(null)
  const [activeImage, setActiveImage] = useState(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const listStorageItems = useCallback(
    async (prefixes) => {
      if (!supabase || !supabaseBucket) {
        return { items: [] }
      }

      const pageSize = 100
      let allItems = []

      for (const prefix of prefixes) {
        let offset = 0

        while (true) {
          const { data, error } = await supabase.storage.from(supabaseBucket).list(prefix, {
            limit: pageSize,
            offset,
            sortBy: { column: 'created_at', order: 'desc' },
          })

          if (error) {
            return { error }
          }

          if (!data || data.length === 0) {
            break
          }

          const filtered = data.filter((item) => item.name && (item.id || item.metadata))
          allItems = allItems.concat(filtered.map((item) => ({ ...item, prefix })))

          if (data.length < pageSize) {
            break
          }

          offset += data.length
        }
      }

      return { items: allItems }
    },
    [supabase, supabaseBucket]
  )

  const loadGallery = useCallback(async () => {
    if (!supabase || !supabaseBucket) {
      setGalleryItems([])
      setGalleryState('idle')
      return
    }

    setGalleryState('loading')
    setGalleryMessage('')
    const { items: allItems, error } = await listStorageItems(['uploads/images', 'images'])

    if (error) {
      setGalleryState('error')
      setGalleryMessage(error.message)
      return
    }

    if (!allItems || allItems.length === 0) {
      setGalleryItems([])
      setGalleryState('success')
      setGalleryMessage('')
      return
    }

    const pathItems = allItems.map((item) => ({
      name: item.name,
      path: `${item.prefix}/${item.name}`,
    }))
    const paths = pathItems.map((item) => item.path)
    const { data: signedData, error: signedError } = await supabase.storage
      .from(supabaseBucket)
      .createSignedUrls(paths, 60 * 60)

    const urlMap = new Map()

    if (!signedError && signedData) {
      signedData.forEach((entry) => {
        if (entry?.signedUrl) {
          urlMap.set(entry.path, entry.signedUrl)
        }
      })
    }

    const items = pathItems
      .map((item) => {
        let url = urlMap.get(item.path) || ''

        if (!url) {
          const { data: urlData } = supabase.storage.from(supabaseBucket).getPublicUrl(item.path)
          url = urlData?.publicUrl || ''
        }

        return {
          name: item.name,
          url,
          path: item.path,
        }
      })
      .filter((item) => item.url)

    if (items.length === 0) {
      setGalleryState('error')
      setGalleryMessage('No accessible images found in storage.')
      return
    }

    setGalleryItems(items)
    setGalleryState('success')
    setGalleryMessage('')
  }, [listStorageItems, supabase, supabaseBucket])

  const loadVideos = useCallback(async () => {
    if (!supabase || !supabaseBucket) {
      setVideoItems([])
      setVideoState('idle')
      return
    }

    setVideoState('loading')
    setVideoMessage('')
    const { items: allItems, error } = await listStorageItems(['uploads/videos', 'videos'])

    if (error) {
      setVideoState('error')
      setVideoMessage(error.message)
      return
    }

    if (!allItems || allItems.length === 0) {
      setVideoItems([])
      setVideoState('success')
      setVideoMessage('')
      return
    }

    const pathItems = allItems.map((item) => ({
      name: item.name,
      path: `${item.prefix}/${item.name}`,
    }))
    const paths = pathItems.map((item) => item.path)
    const { data: signedData, error: signedError } = await supabase.storage
      .from(supabaseBucket)
      .createSignedUrls(paths, 60 * 60)

    const urlMap = new Map()

    if (!signedError && signedData) {
      signedData.forEach((entry) => {
        if (entry?.signedUrl) {
          urlMap.set(entry.path, entry.signedUrl)
        }
      })
    }

    const items = pathItems
      .map((item) => {
        let url = urlMap.get(item.path) || ''

        if (!url) {
          const { data: urlData } = supabase.storage.from(supabaseBucket).getPublicUrl(item.path)
          url = urlData?.publicUrl || ''
        }

        return {
          name: item.name,
          url,
          path: item.path,
        }
      })
      .filter((item) => item.url)

    if (items.length === 0) {
      setVideoState('error')
      setVideoMessage('No accessible videos found in storage.')
      return
    }

    setVideoItems(items)
    setVideoState('success')
    setVideoMessage('')
  }, [listStorageItems, supabase, supabaseBucket])

  useEffect(() => {
    loadGallery()
  }, [loadGallery])

  useEffect(() => {
    loadVideos()
  }, [loadVideos])

  useEffect(() => {
    if (!activeImage) {
      return undefined
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setActiveImage(null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [activeImage])

  const gallerySlides =
    galleryItems.length > 0
      ? galleryItems
      : galleryFallback.map((label) => ({ label, id: label }))
  const galleryLoop = gallerySlides.length > 0 ? gallerySlides.concat(gallerySlides) : []
  const carouselDuration = Math.max(24, gallerySlides.length * 6)
  const quoteLoop = quoteSlides.concat(quoteSlides)
  const handleActivateVideo = (path) => {
    setActiveVideo(path)
  }
  const handleToggleMenu = () => {
    setIsMenuOpen((prev) => !prev)
  }
  const handleCloseMenu = () => {
    setIsMenuOpen(false)
  }
  const handleOpenImage = (item) => {
    if (!item.url) {
      return
    }

    setActiveImage(item)
  }
  const handleCloseImage = () => {
    setActiveImage(null)
  }
  const liveEmbedUrl = youtubeChannelId
    ? `https://www.youtube.com/embed/live_stream?channel=${youtubeChannelId}`
    : ''

  return (
    <div className="app">
      <header className="site-header">
        <div className="top-strip">
          <div className="top-strip-inner">
            <span>Johannesburg, South Africa</span>
            <div className="top-links">
              <a href="#video-library">Library</a>
              <a href="#live">Live Streaming</a>
              <a href="#contact">Contact Us</a>
            </div>
          </div>
        </div>
        <nav className="topbar">
          <div className="brand">
            <img className="brand-logo" src="/elperetzlogo.png" alt="EL-PERETZ Tabernacle logo" />
            <div>
              <p className="brand-title">EL-PERETZ TABERNACLE JHB</p>
              <p className="brand-subtitle">Services, worship, and community in Johannesburg</p>
            </div>
          </div>
          <div className="nav-links">
            {navItems.map((item) => (
              <a key={item.id} href={`#${item.id}`}>
                {item.label}
              </a>
            ))}
          </div>
          <div className="nav-actions">
            <a className="nav-cta" href="#detail">
              Plan a visit
            </a>
            <button
              className="menu-toggle"
              type="button"
              onClick={handleToggleMenu}
              aria-expanded={isMenuOpen}
              aria-controls="mobile-nav"
            >
              Menu
            </button>
          </div>
        </nav>
        {isMenuOpen ? <div className="mobile-backdrop" onClick={handleCloseMenu} /> : null}
        <div className={`mobile-nav ${isMenuOpen ? 'open' : ''}`} id="mobile-nav">
          <div className="mobile-nav-header">
            <span>Menu</span>
            <button className="menu-close" type="button" onClick={handleCloseMenu}>
              Close
            </button>
          </div>
          <div className="mobile-links">
            {navItems.map((item) => (
              <a key={item.id} href={`#${item.id}`} onClick={handleCloseMenu}>
                {item.label}
              </a>
            ))}
          </div>
          <a className="primary" href="#live" onClick={handleCloseMenu}>
            Watch live
          </a>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="hero-content">
            <div className="hero-text">
              <p className="eyebrow">Welcome to EL-PERETZ TABERNACLE JHB</p>
              <h1>Worship, teaching, and fellowship live from EL-PERETZ TABERNACLE JHB.</h1>
              <p className="hero-description">
                Colossians 3:16 - Let the word of Christ dwell in You richly, teaching and
                admonishing one another with Psalms, hymns, and thanksfullness in Your Hearts to
                God.
              </p>
              <div className="hero-actions">
                <a className="primary" href="#live">
                  Watch live
                </a>
                <a className="ghost" href="#gallery">
                  View gallery
                </a>
              </div>
            </div>

            <div className="hero-panel">
              <div className="connect-card">
                <span className="live-badge">Plan Your Visit</span>
                <h3>Service times and welcome</h3>
                <p>We would love to host you for worship, prayer, and the Word.</p>
                <div className="schedule">
                  {liveSchedule.map((item) => (
                    <div key={item.title}>
                      <span>{item.title}</span>
                      <small>{item.time}</small>
                    </div>
                  ))}
                </div>
                <div className="hero-actions">
                  <a className="primary" href="#contact">
                    Contact us
                  </a>
                  <a className="ghost" href="#detail">
                    Visit details
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section id="about" className="section reveal brand-backdrop">
          <div className="section-header">
            <p className="eyebrow">About us</p>
            <h2>We are a house of prayer, worship, and streaming ministry.</h2>
          </div>
          <div className="section-grid">
            <div className="card">
              <h3>Mission</h3>
              <p>
                We amplify voices of faith through live streaming, prayer rooms, and community events
                across Johannesburg.
              </p>
            </div>
            <div className="card">
              <h3>Vision</h3>
              <p>
                To build a digital tabernacle where everyone can worship and feel at home online.
              </p>
            </div>
            <div className="card">
              <h3>Community</h3>
              <p>
                Local outreach, discipleship, and creative teams keep the atmosphere warm and
                welcoming.
              </p>
            </div>
          </div>
        </section>

        <section id="pasteur" className="section alt reveal">
          <div className="section-header">
            <p className="eyebrow">Our Pasteur</p>
            <h2>Pastoral leadership grounded in humility and prayer.</h2>
          </div>
          <div className="section-split pastor-profile">
            <div className="portrait">
              <img
                src="/elper1.jpeg"
                alt="EL-PERETZ lead pastor"
                loading="lazy"
                decoding="async"
              />
            </div>
            <div className="section-body">
              <h3>Lead Pastor</h3>
              <p>
                Our pastor equips the church with practical teaching, mentorship, and an open-door
                approach to guidance and care.
              </p>
              <div className="pastor-details">
                {pastorDetails.map((item) => (
                  <div key={item.label}>
                    <span>{item.label}</span>
                    <strong>{item.value}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="branham" className="section reveal">
          <div className="section-header">
            <p className="eyebrow">William Marrion Branham</p>
            <h2>Honoring the legacy of a ministry that influenced generations.</h2>
          </div>
          <div className="section-split">
            <div className="card">
              <h3>Historical impact</h3>
              <p>
                A global message of restoration and faith continues to inspire believers across
                continents.
              </p>
              <p className="card-note">
                Explore the message library and revisit classic sermons on faith, grace, and the
                power of Scripture.
              </p>
            </div>
            <div className="library-grid">
              {branhamLibrary.map((item) => (
                <a key={item.title} className="library-card" href={item.url} target="_blank" rel="noreferrer">
                  <h4>{item.title}</h4>
                  <p>{item.meta}</p>
                  <span>Open sermon</span>
                </a>
              ))}
            </div>
          </div>
        </section>

        <section id="live" className="section alt reveal brand-backdrop">
          <div className="section-header">
            <p className="eyebrow">Live streaming</p>
            <h2>Join the service in real time, wherever you are.</h2>
          </div>
          <div className="live-layout">
            <div className="stream-card">
              <span className="live-badge">Live Streaming</span>
              <h3>Join the live sanctuary broadcast</h3>
              <p>Worship with us in real time, wherever you are.</p>
              <a className="primary" href="#live">
                Enter live room
              </a>
              <div className="stream-embed">
                {liveEmbedUrl ? (
                  <iframe
                    src={liveEmbedUrl}
                    title="EL-PERETZ live stream"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <div className="video-placeholder">
                    <p>Add your YouTube Live channel ID to show the live stream.</p>
                    <span>Set VITE_YOUTUBE_CHANNEL_ID in your .env file.</span>
                  </div>
                )}
              </div>
            </div>
            <div className="live-details">
              <div className="section-grid">
                <div className="card">
                  <h3>Stream portal</h3>
                  <p>
                    A clean, low-latency stream with chat moderation, prayer requests, and instant
                    translations.
                  </p>
                </div>
                <div className="card">
                  <h3>Prayer rooms</h3>
                  <p>
                    Dedicated prayer rooms for testimonies and intercession, letting every voice be
                    heard.
                  </p>
                </div>
                <div className="card">
                  <h3>On-demand</h3>
                  <p>
                    Access past services and edited highlights for replay, study, and sharing.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="preaching" className="section reveal">
          <div className="section-header">
            <p className="eyebrow">Preaching</p>
            <h2>Teaching that speaks to everyday life and online audiences.</h2>
          </div>
          <div className="section-grid">
            {preachingTracks.map((item) => (
              <div key={item.title} className="card">
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </div>
            ))}
          </div>
          <div className="quote-marquee" aria-label="Preaching highlights">
            <div className="quote-track">
              {quoteLoop.map((quote, index) => (
                <div key={`${quote.source}-${index}`} className="quote-card">
                  <p>"{quote.text}"</p>
                  <span>{quote.source}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="video-library" className="section reveal">
          <div className="section-header">
            <p className="eyebrow">Video Library</p>
            <h2>Replay our latest sermons, testimonies, and worship sets.</h2>
          </div>
          {videoItems.length > 0 ? (
            <div className="video-grid">
              {videoItems.map((item) => (
                <div key={item.path} className="video-card">
                  {activeVideo === item.path ? (
                    <video
                      src={item.url}
                      controls
                      autoPlay
                      preload="metadata"
                      playsInline
                      onEnded={() => setActiveVideo(null)}
                    />
                  ) : (
                    <button
                      className="video-poster"
                      type="button"
                      onClick={() => handleActivateVideo(item.path)}
                      aria-label={`Play ${item.name}`}
                    >
                      <span className="video-play">Play</span>
                      <span className="video-caption">Click to load</span>
                    </button>
                  )}
                  <div className="video-meta">
                    <span title={item.name}>{item.name}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
          {videoState === 'loading' ? (
            <p className="gallery-note">Loading latest videos...</p>
          ) : null}
          {videoState === 'success' && videoItems.length === 0 ? (
            <p className="gallery-note">No videos are available yet.</p>
          ) : null}
          {videoState === 'error' ? (
            <p className="gallery-note error">{videoMessage || 'Unable to load videos.'}</p>
          ) : null}
        </section>

        <section id="gallery" className="section reveal">
          <div className="section-header">
            <p className="eyebrow">Image and Photo</p>
            <h2>Snapshots of worship, community, and outreach.</h2>
          </div>
          <div className="gallery-carousel" style={{ '--carousel-duration': `${carouselDuration}s` }}>
            <div className="carousel-track">
              {galleryLoop.map((item, index) => (
                <button
                  key={`${item.path || item.id || item.label}-${index}`}
                  className={`carousel-item ${item.url ? 'media' : 'placeholder'}`}
                  type="button"
                  onClick={() => handleOpenImage(item)}
                  disabled={!item.url}
                  aria-label={item.url ? 'Open image' : item.label}
                >
                  {item.url ? (
                    <img
                      src={item.url}
                      alt="EL-PERETZ gallery photo"
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <span>{item.label}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
          {galleryState === 'loading' ? (
            <p className="gallery-note">Loading latest photos...</p>
          ) : null}
          {galleryState === 'success' && galleryItems.length === 0 ? (
            <p className="gallery-note">No photos are available yet.</p>
          ) : null}
          {galleryState === 'error' ? (
            <p className="gallery-note error">
              {galleryMessage || 'Unable to load the gallery. Check Supabase bucket access and policies.'}
            </p>
          ) : null}
        </section>

        <section id="contact" className="section alt reveal brand-backdrop">
          <div className="section-header">
            <p className="eyebrow">Contact us</p>
            <h2>Reach out for prayer, visits, or streaming support.</h2>
          </div>
          <div className="section-split">
            <div className="card">
              <h3>We are listening</h3>
              <p>
                Share your prayer requests, testimony ideas, or volunteer interests and our team will
                respond quickly.
              </p>
              <div className="tag-list">
                <span>Prayer line</span>
                <span>Media team</span>
                <span>Visitor care</span>
              </div>
            </div>
            <form className="contact-form">
              <label>
                Full name
                <input type="text" placeholder="Your name" />
              </label>
              <label>
                Email address
                <input type="email" placeholder="you@email.com" />
              </label>
              <label>
                Message
                <textarea rows="4" placeholder="Tell us how we can help." />
              </label>
              <button className="primary" type="button">
                Send message
              </button>
            </form>
          </div>
        </section>

        <section id="detail" className="section reveal">
          <div className="section-header">
            <p className="eyebrow">Detail</p>
            <h2>Everything you need before you visit or stream.</h2>
          </div>
          <div className="section-grid">
            {details.map((item) => (
              <div key={item.title} className="card">
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {activeImage ? (
        <div className="lightbox" onClick={handleCloseImage} role="dialog" aria-modal="true">
          <div className="lightbox-content" onClick={(event) => event.stopPropagation()}>
            <button className="lightbox-close" type="button" onClick={handleCloseImage}>
              Close
            </button>
            <img src={activeImage.url} alt="EL-PERETZ gallery view" decoding="async" />
          </div>
        </div>
      ) : null}

      <footer className="footer">
        <div>
          <p className="brand-title">EL-PERETZ TABERNACLE JHB</p>
          <p className="brand-subtitle">Online services with love and excellence.</p>
        </div>
        <div className="footer-links">
          {navItems.map((item) => (
            <a key={item.id} href={`#${item.id}`}>
              {item.label}
            </a>
          ))}
        </div>
      </footer>
    </div>
  )
}

export default App
