import { useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import './Sidebar.css'

export default function Sidebar({ onStatsClick, onConfigClick, onTeamClick, onLogout }) {
	const { userProfile, permissions } = useAuth()
	const [isOpen, setIsOpen] = useState(false)

	useEffect(() => {
		if (isOpen) {
			document.body.style.overflow = 'hidden'
		} else {
			document.body.style.overflow = ''
		}

		return () => {
			document.body.style.overflow = ''
		}
	}, [isOpen])

	const handleItemClick = (callback) => {
		callback()
		setIsOpen(false)
	}

	return (
		<>
			{/* Sidebar panel */}
			<aside className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
				<div className="sidebar-header">
					<h2>Menu</h2>
					<button 
						className="sidebar-close"
						onClick={() => setIsOpen(false)}>
						✕
					</button>
				</div>

				<div className="sidebar-user">
					<div className="sidebar-avatar">
						{userProfile?.displayName?.[0]?.toUpperCase() || '?'}
					</div>
					<div className="sidebar-user-info">
						<div className="sidebar-user-name">
							{userProfile?.displayName || 'Użytkownik'}
						</div>
						<div className="sidebar-user-role">
							{userProfile?.role || 'Brak roli'}
						</div>
					</div>
				</div>

				<nav className="sidebar-nav">
					{permissions?.canViewStatistics && (
						<button 
							className="sidebar-item"
							onClick={() => handleItemClick(onStatsClick)}>
							<span className="sidebar-icon">📊</span>
							Statystyki
						</button>
					)}

					{permissions?.canConfigureProducts && (
						<button 
							className="sidebar-item"
							onClick={() => handleItemClick(onConfigClick)}>
							<span className="sidebar-icon">⚙️</span>
							Konfiguracja
						</button>
					)}

					{permissions?.canManageTeam && (
						<button 
							className="sidebar-item"
							onClick={() => handleItemClick(onTeamClick)}>
							<span className="sidebar-icon">👥</span>
							Zespół
						</button>
					)}
				</nav>

				<button 
					className="sidebar-logout"
					onClick={onLogout}>
					Wyloguj się
				</button>
			</aside>

			{/* Overlay */}
			{isOpen && (
				<div 
					className="sidebar-overlay" 
					onClick={() => setIsOpen(false)}
				/>
			)}

			{/* Toggle button */}
			<button 
				className={`sidebar-toggle ${isOpen ? 'open' : ''}`}
				onClick={() => setIsOpen(!isOpen)}
				aria-label="Toggle menu">
				<span></span>
				<span></span>
				<span></span>
			</button>
		</>
	)
}