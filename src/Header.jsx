import Sidebar from './Sidebar'
import SidebarMobile from './SidebarMobile'
import { useAuth } from './AuthContext'

export default function Header({ onStatsClick, onConfigClick, onTeamClick, onLogout }) {
	const { currentUser, userProfile } = useAuth()

	return (
		<>
			{/* DESKTOP SIDEBAR - ukryty na <1024px */}
			<Sidebar 
				onStatsClick={onStatsClick}
				onConfigClick={onConfigClick}
				onTeamClick={onTeamClick}
				onLogout={onLogout}
			/>

			{/* MOBILE SIDEBAR - ukryty na >1024px */}
			<SidebarMobile 
				onStatsClick={onStatsClick}
				onConfigClick={onConfigClick}
				onTeamClick={onTeamClick}
				onLogout={onLogout}
			/>
			
			<header className='header-minimal'>
				<div className='header-minimal-content'>
					<div className='header-minimal-title'>
						<h1>CLIENT MANAGER</h1>
						<span className='header-minimal-subtitle'>Panel zarządzania</span>
					</div>
					
					<div className='header-minimal-user'>
						<div className='user-avatar'>
							{userProfile?.displayName?.[0]?.toUpperCase() || currentUser?.email?.[0]?.toUpperCase() || '?'}
						</div>
						<div className='user-details'>
							<span className='user-name'>
								{userProfile?.displayName || currentUser?.email?.split('@')[0] || 'Użytkownik'}
							</span>
							<span className='user-role'>{userProfile?.role || 'Brak roli'}</span>
						</div>
					</div>
				</div>
			</header>
		</>
	)
}