import { useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { db } from './firebase'
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy, getDoc } from 'firebase/firestore'
import AddForm from './AddForm'
import Header from './Header'
import OrdersTable from './OrdersTable'
import Modal from './Modal'
import FilterBar from './FilterBar'
import Statistics from './Statistics'
import Pagination from './Pagination'
import ProductConfigurator from './ProductConfigurator'
import TeamManagement from './TeamManagement'
import { showToast } from './simpleAlerts'
import FeedbackModal from './FeedbackModal'
import { useFeedbackTrigger } from './useFeedbackTrigger'

export default function Dashboard() {
	const { currentUser, organizationId, logout } = useAuth()
	const [orders, setOrders] = useState([])
	const [editingId, setEditingId] = useState(null)
	const [deleteModalOpen, setDeleteModalOpen] = useState(false)
	const [orderToDelete, setOrderToDelete] = useState(null)
	const [filters, setFilters] = useState({
		searchTerm: '',
		dateFrom: '',
		dateTo: '',
		status: 'all',
		transactionType: 'all',
	})
	const [statsOpen, setStatsOpen] = useState(false)
	const [configOpen, setConfigOpen] = useState(false)
	const [teamOpen, setTeamOpen] = useState(false)
	const [currentPage, setCurrentPage] = useState(1)
	const [itemsPerPage, setItemsPerPage] = useState(10)
	const [loading, setLoading] = useState(true)
	const [productTypes, setProductTypes] = useState([])

	// ✅ FEEDBACK HOOK - DODANE
	const {
		shouldShowFeedback,
		handleFeedbackSubmitted,
		handleFeedbackClosed,
		handleRemindLater,
		handleNeverShow
	} = useFeedbackTrigger(orders.length)

	// Debug logi (możesz usunąć po testach)
	useEffect(() => {
		console.log('📊 Orders count:', orders.length)
		console.log('📊 Should show feedback:', shouldShowFeedback)
	}, [orders.length, shouldShowFeedback])

	useEffect(() => {
		if (!currentUser || !organizationId) {
			setOrders([])
			setLoading(false)
			return
		}

		const ordersRef = collection(db, 'organizations', organizationId, 'orders')
		const q = query(ordersRef, orderBy('createdAt', 'desc'))

		const unsubscribe = onSnapshot(
			q,
			snapshot => {
				const ordersData = snapshot.docs.map(doc => ({
					id: doc.id,
					...doc.data(),
				}))
				setOrders(ordersData)
				setLoading(false)
			},
			error => {
				console.error('Error fetching orders:', error)
				setLoading(false)
			}
		)

		return () => unsubscribe()
	}, [currentUser, organizationId])

	useEffect(() => {
		if (!currentUser || !organizationId) {
			setProductTypes([])
			return
		}

		const productTypesRef = collection(db, 'organizations', organizationId, 'productTypes')
		const unsubscribe = onSnapshot(productTypesRef, snapshot => {
			const typesData = snapshot.docs.map(doc => ({
				id: doc.id,
				...doc.data(),
			}))
			setProductTypes(typesData)
		})

		return () => unsubscribe()
	}, [currentUser, organizationId])


	const handleAddOrder = async orderData => {
		if (!currentUser || !organizationId) return

		try {
			if (editingId) {
				const orderRef = doc(db, 'organizations', organizationId, 'orders', editingId)
				await updateDoc(orderRef, {
					...orderData,
					updatedAt: new Date().toISOString(),
				})
				setEditingId(null)
				// ✅ TOAST - Edytowano zamówienie
				showToast('Zamówienie zostało zaktualizowane', 'success')
			} else {
				const ordersRef = collection(db, 'organizations', organizationId, 'orders')
				await addDoc(ordersRef, {
					...orderData,
					status: 'w-trakcie',
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString(),
				})
				// ✅ TOAST - Dodano zamówienie
				showToast('Zamówienie zostało dodane', 'success')
			}
		} catch (error) {
			console.error('Error adding/updating order:', error)
			// ❌ TOAST - Błąd
			showToast('Wystąpił błąd. Spróbuj ponownie.', 'error')
		}
	}

	const handleEdit = id => {
		setEditingId(id)
		window.scrollTo({ top: 0, behavior: 'smooth' })
	}

	const handleDeleteClick = id => {
		console.log('🗑️ Próba usunięcia zamówienia ID:', id)
		setOrderToDelete(id)
		setDeleteModalOpen(true)
	}

	const handleDeleteConfirm = async () => {
		if (!currentUser || !organizationId || !orderToDelete) return

		console.log('🗑️ Potwierdzenie usunięcia:')
		console.log('  Order ID:', orderToDelete)
		console.log('  Organization ID:', organizationId)

		try {
			const orderRef = doc(db, 'organizations', organizationId, 'orders', orderToDelete)
			await deleteDoc(orderRef)
			setDeleteModalOpen(false)
			setOrderToDelete(null)
			// ✅ TOAST - Usunięto zamówienie
			showToast('Zamówienie zostało usunięte', 'success')
			console.log('✅ Zamówienie usunięte pomyślnie')
		} catch (error) {
			console.error('❌ Error deleting order:', error)
			// ❌ TOAST - Błąd usuwania
			showToast('Nie udało się usunąć zamówienia', 'error')
		}
	}

	const handleDeleteCancel = () => {
		setDeleteModalOpen(false)
		setOrderToDelete(null)
	}

	const handleCancelEdit = () => {
		setEditingId(null)
	}

	const handleFilterChange = newFilters => {
		setFilters(newFilters)
		setCurrentPage(1)
	}

	const handleStatusChange = async (orderId, newStatus) => {
		if (!currentUser || !organizationId) return

		// ✅ DEBUG - Loguj ID zamówienia
		console.log('🔄 Zmiana statusu:')
		console.log('  Order ID:', orderId)
		console.log('  Nowy status:', newStatus)

		try {
			const orderRef = doc(db, 'organizations', organizationId, 'orders', orderId)
			await updateDoc(orderRef, {
				status: newStatus,
				updatedAt: new Date().toISOString(),
			})
			// ✅ TOAST - Zmieniono status
			const statusLabels = {
				'w-trakcie': 'W trakcie',
				'oplacone': 'Opłacone',
				'zrealizowane': 'Zrealizowane',
				'anulowane': 'Anulowane'
			}
			showToast(`Status zmieniony na: ${statusLabels[newStatus]}`, 'success')
			console.log('✅ Status zaktualizowany pomyślnie')
		} catch (error) {
			console.error('❌ Error updating status:', error)
			// ❌ TOAST - Błąd zmiany statusu
			showToast('Nie udało się zmienić statusu', 'error')
		}
	}

	const handleStatsToggle = () => {
		setStatsOpen(!statsOpen)
	}

	const handleConfigToggle = () => {
		setConfigOpen(!configOpen)
	}

	const handleTeamToggle = () => {
		setTeamOpen(!teamOpen)
	}

	const handlePageChange = page => {
		setCurrentPage(page)
		window.scrollTo({ top: 400, behavior: 'smooth' })
	}

	const handleItemsPerPageChange = newItemsPerPage => {
		setItemsPerPage(newItemsPerPage)
		setCurrentPage(1)
	}

	const getFilteredOrders = () => {
		return orders.filter(order => {
			const matchesBasicFields =
				order.type.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
				order.client.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
				(order.dimensions && order.dimensions.toLowerCase().includes(filters.searchTerm.toLowerCase())) ||
				(order.wood && order.wood.toLowerCase().includes(filters.searchTerm.toLowerCase()))

			let matchesProductDetails = false
			if (order.productDetails && typeof order.productDetails === 'object') {
				matchesProductDetails = Object.entries(order.productDetails).some(([key, value]) => {
					const keyMatch = key.toLowerCase().includes(filters.searchTerm.toLowerCase())
					const valueMatch = value && value.toString().toLowerCase().includes(filters.searchTerm.toLowerCase())
					return keyMatch || valueMatch
				})
			}

			const matchesSearch = matchesBasicFields || matchesProductDetails
			const matchesDateFrom = filters.dateFrom ? order.dateStart >= filters.dateFrom : true
			const matchesDateTo = filters.dateTo ? order.dateStart <= filters.dateTo : true
			const matchesStatus = filters.status === 'all' ? true : order.status === filters.status
			const matchesTransactionType =
				filters.transactionType === 'all' ? true : (order.transactionType || 'sprzedaz') === filters.transactionType

			return matchesSearch && matchesDateFrom && matchesDateTo && matchesStatus && matchesTransactionType
		})
	}

	const editingOrder = editingId ? orders.find(order => order.id === editingId) : null
	const filteredOrders = getFilteredOrders()

	const totalPages = Math.ceil(filteredOrders.length / itemsPerPage)
	const startIndex = (currentPage - 1) * itemsPerPage
	const endIndex = startIndex + itemsPerPage
	const currentOrders = filteredOrders.slice(startIndex, endIndex)

	return (
		<>
			<div style={{ paddingTop: '80px' }}>
				<Header
					onStatsClick={handleStatsToggle}
					onConfigClick={handleConfigToggle}
					onTeamClick={handleTeamToggle}
					onLogout={logout}
				/>
				<AddForm
					onSubmit={handleAddOrder}
					editingOrder={editingOrder}
					onCancel={handleCancelEdit}
					productTypes={productTypes}
				/>
				{orders.length > 0 && (
					<FilterBar
						onFilterChange={handleFilterChange}
						filteredOrders={filteredOrders}
						allOrders={orders}
						productTypes={productTypes}
						currentFilters={filters}
					/>
				)}
				{loading ? (
					<div style={{ textAlign: 'center', padding: '40px', fontSize: '18px', color: '#6c757d' }}>
						Ładowanie zamówień...
					</div>
				) : (
					<OrdersTable
						orders={currentOrders}
						onEdit={handleEdit}
						onDelete={handleDeleteClick}
						onStatusChange={handleStatusChange}
						productTypes={productTypes}
					/>
				)}
				{filteredOrders.length > 0 && (
					<Pagination
						currentPage={currentPage}
						totalPages={totalPages}
						onPageChange={handlePageChange}
						itemsPerPage={itemsPerPage}
						onItemsPerPageChange={handleItemsPerPageChange}
					/>
				)}
				<Modal
					isOpen={deleteModalOpen}
					onClose={handleDeleteCancel}
					onConfirm={handleDeleteConfirm}
					message='Czy na pewno chcesz usunąć to zamówienie? Tej operacji nie można cofnąć.'
				/>
				<Statistics orders={orders} isOpen={statsOpen} onClose={() => setStatsOpen(false)} productTypes={productTypes} />
				<ProductConfigurator isOpen={configOpen} onClose={() => setConfigOpen(false)} />
				<TeamManagement isOpen={teamOpen} onClose={() => setTeamOpen(false)} />
			</div>

			{/* ✅ FEEDBACK MODAL - DODANY */}
			<FeedbackModal
				isOpen={shouldShowFeedback}
				onClose={handleFeedbackClosed}
				onSubmit={handleFeedbackSubmitted}
				onRemindLater={handleRemindLater}
				onNeverShow={handleNeverShow}
			/>
		</>
	)
}