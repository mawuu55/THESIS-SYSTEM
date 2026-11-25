import { useEffect, useState } from 'react'
import { useReveal } from './useReveal'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { isConfigured, supabase } from '../lib/supabase'
import { Icon } from './Icons'
import { Logo } from './Logos'

/** Public + applicant shell: top bar (applicants have only 3 destinations and mostly use phones). */
export function Layout() {
  const { session, profile, signOut } = useAuth()
  const isLanding = useLocation().pathname === '/'
  const navigate = useNavigate()
  const role = profile?.role
  const [unread, setUnread] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)
  // the top bar is see-through over the public page's photo, and turns to frosted glass once the page scrolls
  const [scrolled, setScrolled] = useState(false)
  const doSignOut = async () => {
    await signOut()
    navigate('/')
  }
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 24)
    on()
    window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [])
  useReveal()
  const path = useLocation().pathname
  // close the phone menu whenever the page changes
  useEffect(() => setMenuOpen(false), [path])
  // close the phone menu when tapping outside it or pressing Escape (owner, Nov 24)
  useEffect(() => {
    if (!menuOpen) return
    const outside = (e: PointerEvent) => {
      const t = e.target as Element | null
      if (t && !t.closest('#main-nav') && !t.closest('.menu-toggle')) setMenuOpen(false)
    }
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuOpen(false) }
    document.addEventListener('pointerdown', outside)
    document.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('pointerdown', outside)
      document.removeEventListener('keydown', esc)
    }
  }, [menuOpen])

  useEffect(() => {
    if (!profile || role !== 'applicant') return
    let live = true
    supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .is('read_at', null)
      .then(({ count }) => live && setUnread(count ?? 0))
    const cleared = () => setUnread(0)
    window.addEventListener('messages-read', cleared)
    return () => {
      live = false
      window.removeEventListener('messages-read', cleared)
    }
  }, [profile, role, path])

  return (
    <div className="shell">
      <header className={`topbar${isLanding && !scrolled && !menuOpen ? ' over-hero' : ''}${scrolled ? ' scrolled' : ''}`}>
        <div className="topbar-inner">
          <Link to="/" className="brand">
            {/* MESO in the top bar; the city seal is in the hero below (owner, Nov 24) */}
            <span className="brandmark-wrap" aria-hidden="true"><Logo which="meso" size={38} /></span>
            <span className="brand-text">
              <strong>Scholarship Portal</strong>
            </span>
          </Link>
          {session && role === 'applicant' && (
            <Link to="/app/messages" className="mobile-only bell-link" aria-label={`Messages, ${unread} unread`}>
              <Icon name="bell" size={22} />
              {unread > 0 && <span className="side-badge bell-badge">{unread}</span>}
            </Link>
          )}
          <button type="button" className={`menu-toggle hamburger mobile-only ${menuOpen ? 'open' : ''}`} aria-expanded={menuOpen} aria-controls="main-nav"
            aria-label={menuOpen ? 'Close the menu' : 'Open the menu'} onClick={() => setMenuOpen((o) => !o)}>
            <span aria-hidden="true" /><span aria-hidden="true" /><span aria-hidden="true" />
          </button>
          {/* logo on the left, the pages in the middle, the account actions on the right (owner, Nov 24) */}
          <nav id="main-nav" className={`nav ${menuOpen ? 'open' : ''}`} aria-label="Main">
            {session ? (
              <>
                <NavLink to="/app" end>Home</NavLink>
                {role === 'applicant' && <NavLink to="/app/application">My application</NavLink>}
                {role === 'applicant' && (
                  <NavLink to="/app/messages" aria-label={`Messages, ${unread} unread`}>
                    Messages{unread > 0 && <span className="nav-count">{unread}</span>}
                  </NavLink>
                )}
                {(role === 'evaluator' || role === 'admin') && <NavLink to="/staff">Staff workspace</NavLink>}
                <NavLink to={role === 'evaluator' || role === 'admin' ? '/staff/profile' : '/profile'}>Profile</NavLink>
                {/* phones: the menu also holds Sign out, at the bottom */}
                <button className="link-button nav-signout mobile-only" onClick={doSignOut}><Icon name="logout" size={18} /><span>Sign out</span></button>
              </>
            ) : (
              <>
                <NavLink to="/signin" className="mobile-only">Sign in</NavLink>
                <NavLink to="/check" className="button small mobile-only">Apply now</NavLink>
              </>
            )}
          </nav>
          <div className="nav-end desktop-only">
            {session ? (
              <button className="link-button nav-signout" title="Sign out" onClick={doSignOut}><Icon name="logout" size={18} /><span>Sign out</span></button>
            ) : (
              <>
                <NavLink to="/signin" className="nav-pill">Sign in</NavLink>
                <NavLink to="/check" className="button small nav-cta">Apply now</NavLink>
              </>
            )}
          </div>
        </div>
      </header>
      {!isConfigured && (
        <div className="banner warn top">
          Supabase is not configured. Copy <code>web/.env.example</code> to <code>web/.env.local</code>.
        </div>
      )}
      <main className={`content ${session && role === 'applicant' ? 'has-tabbar' : ''}`}>
        <Outlet />
      </main>
      {session && role === 'applicant' && (
        <nav className="tabbar mobile-only" aria-label="Applicant">
          <NavLink to="/app" end><Icon name="home" size={22} /><span>Home</span></NavLink>
          <NavLink to="/app/application"><Icon name="file" size={22} /><span>Application</span></NavLink>
          <NavLink to="/app/messages"><Icon name="bell" size={22} /><span>Messages</span>{unread > 0 && <i className="tab-badge">{unread}</i>}</NavLink>
          <NavLink to="/profile"><Icon name="user" size={22} /><span>Profile</span></NavLink>
        </nav>
      )}
      {/* full footer on the landing page; other pages show only the copyright line (owner, 2026-11-09) */}
      <footer className={isLanding ? 'footer' : 'footer footer-compact'}>
        {isLanding && (
        <div className="footer-inner">
          <div className="footer-brand">
            <div className="footer-logos">
              <Logo which="mandaluyong" size={52} />
              <Logo which="meso" size={52} />
            </div>
            <strong>Scholarship Portal</strong>
            <p>
              The City of Mandaluyong scholarship for incoming 1st and 2nd year students of Rizal Technological University,
              run by the Mandaluyong Educational Service Office.
            </p>
          </div>
          <nav className="footer-col" aria-label="For applicants">
            <h2>For applicants</h2>
            {session ? (
              <>
                <Link to="/app">My dashboard</Link>
                {role === 'applicant' && <Link to="/app/application">My application</Link>}
                <Link to="/profile">Profile</Link>
              </>
            ) : (
              <>
                <Link to="/signup">Create an account</Link>
                <Link to="/signin">Sign in</Link>
                <Link to="/forgot-password">Forgot password</Link>
              </>
            )}
          </nav>
          <div className="footer-col">
            <h2>How it works</h2>
            <span>1. Apply online: RTU COR and grades</span>
            <span>2. Qualifying exam at RTU</span>
            <span>3. Step 2 requirements</span>
            <span>4. Interview at Mandaluyong City Hall</span>
            <span>5. Result in the portal</span>
          </div>
          <div className="footer-col">
            <h2>Your data</h2>
            <span>Protected under the Data Privacy Act of 2012 (RA 10173)</span>
            <span>Documents are stored privately</span>
            <span>Every staff action is logged</span>
            <Link to="/signup">Read the privacy notice</Link>
          </div>
        </div>
        )}
        <div className="footer-bottom">
          <div className="footer-bottom-inner">
            <span>© {new Date().getFullYear()} City of Mandaluyong · Educational Service Office</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
