import { useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import './SidebarMobile.css'

export default function SidebarMobile({ onStatsClick, onConfigClick, onTeamClick, onLogout }) {
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
			{/* BURGER BUTTON */}
			<button 
				className={`mobile-burger ${isOpen ? 'mobile-burger-open' : ''}`}
				onClick={() => setIsOpen(!isOpen)}
				aria-label="Menu">
				<span></span>
				<span></span>
				<span></span>
			</button>

			{/* OVERLAY */}
			{isOpen && (
				<div 
					className="mobile-sidebar-overlay" 
					onClick={() => setIsOpen(false)}
				/>
			)}

			{/* SIDEBAR PANEL */}
			<div className={`mobile-sidebar ${isOpen ? 'mobile-sidebar-open' : ''}`}>
				{/* Header */}
				<div className="mobile-sidebar-header">
					<h2>Menu</h2>
					<button 
						className="mobile-sidebar-close"
						onClick={() => setIsOpen(false)}>
						✕
					</button>
				</div>

				{/* User Info */}
				<div className="mobile-sidebar-user">
					<div className="mobile-sidebar-avatar">
						{userProfile?.displayName?.[0]?.toUpperCase() || '?'}
					</div>
					<div className="mobile-sidebar-user-info">
						<div className="mobile-sidebar-user-name">
							{userProfile?.displayName || 'Użytkownik'}
						</div>
						<div className="mobile-sidebar-user-role">
							{userProfile?.role || 'Brak roli'}
						</div>
					</div>
				</div>

				{/* Navigation */}
				<nav className="mobile-sidebar-nav">
					{permissions?.canViewStatistics && (
						<button 
							className="mobile-sidebar-item"
							onClick={() => handleItemClick(onStatsClick)}>
							<span className="mobile-sidebar-icon">📊</span>
							Statystyki
						</button>
					)}

					{permissions?.canConfigureProducts && (
						<button 
							className="mobile-sidebar-item"
							onClick={() => handleItemClick(onConfigClick)}>
							<span className="mobile-sidebar-icon">⚙️</span>
							Konfiguracja
						</button>
					)}

					{permissions?.canManageTeam && (
						<button 
							className="mobile-sidebar-item"
							onClick={() => handleItemClick(onTeamClick)}>
							<span className="mobile-sidebar-icon">👥</span>
							Zespół
						</button>
					)}
				</nav>

				{/* Logout */}
				<button 
					className="mobile-sidebar-logout"
					onClick={onLogout}>
					Wyloguj się
				</button>
			</div>
		</>
	)
}
