import { useState } from 'react'
import { useAuth } from './AuthContext'

export default function OrdersTable({ orders, onEdit, onDelete, onStatusChange, productTypes }) {
	const { permissions } = useAuth()
	const [expandedOrderId, setExpandedOrderId] = useState(null)

	if (orders.length === 0) {
		return (
			<div className='no-orders'>
				<p>Brak zamówień do wyświetlenia</p>
				<span>Dodaj pierwsze zamówienie używając formularza powyżej</span>
			</div>
		)
	}

	const handleStatusChange = (orderId, newStatus) => {
		onStatusChange(orderId, newStatus)
	}

	const toggleDetails = (orderId) => {
		setExpandedOrderId(expandedOrderId === orderId ? null : orderId)
	}

	

	const getCurrencyForOrder = (order) => {
		if (order.currency) {
			return order.currency
		}
		const productType = productTypes?.find(pt => pt.name === order.type)
		return productType?.currency || 'PLN'
	}

	const getUnitForOrder = (order) => {
		if (order.unit) {
			return order.unit
		}
		const productType = productTypes?.find(pt => pt.name === order.type)
		return productType?.unit || 'szt'
	}

	return (
		<div className='orders-table-container'>
			<h2 className='table-title'>Lista zamówień</h2>
			
			{/* WIDOK DESKTOP - TABELA */}
			<table className='orders-table desktop-only'>
				<thead>
					<tr>
						<th>Typ</th>
						<th>Status</th>
						<th>Typ produktu</th>
						<th>Firma</th>
						<th>Data zamówienia</th>
						<th>Data wysyłki</th>
						<th>Akcje</th>
					</tr>
				</thead>
				<tbody>
					{orders.map(order => {
						const isPurchase = order.transactionType === 'zakup'
						
						return (
							<>
								<tr key={order.id} className={isPurchase ? 'purchase-row' : 'sale-row'}>
									<td data-label='Typ' className='transaction-type-cell'>
										<span className={`transaction-badge ${isPurchase ? 'badge-purchase' : 'badge-sale'}`}>
											{isPurchase ? '📥 Zakup' : '📤 Sprzedaż'}
										</span>
									</td>
									<td data-label='Status' className='status-cell'>
										<select 
											value={order.status}
											onChange={e => handleStatusChange(order.id, e.target.value)}
											className={`status-select status-${order.status}`}
											disabled={!permissions?.canEditOrders}>
											<option value='w-trakcie'>W trakcie</option>
											<option value='oplacone'>Opłacone</option>
											<option value='zrealizowane'>Zrealizowane</option>
											<option value='anulowane'>Anulowane</option>
										</select>
									</td>
									<td data-label='Typ produktu'>{order.type || '-'}</td>
									<td data-label='Firma'>{order.client}</td>
									<td data-label='Data zamówienia'>{order.dateStart}</td>
									<td data-label='Data wysyłki'>{order.dateEnd}</td>
									<td className='actions-cell'>
										<button 
											className='btn-details' 
											onClick={() => toggleDetails(order.id)}>
											{expandedOrderId === order.id ? 'Ukryj' : 'Szczegóły'}
										</button>
										{permissions?.canEditOrders && (
											<button className='btn-edit' onClick={() => onEdit(order.id)}>
												Edytuj
											</button>
										)}
										{permissions?.canDeleteOrders && (
											<button className='btn-delete' onClick={() => onDelete(order.id)}>
												Usuń
											</button>
										)}
									</td>
								</tr>
								{expandedOrderId === order.id && (
									<tr className='order-details-row'>
										<td colSpan='7'>
											<div className='order-details-content'>
												<h3>📋 Szczegóły zamówienia</h3>
												<div className='details-grid'>
													<div className='details-section'>
														<h4>Informacje podstawowe</h4>
														<div className='details-items'>
															<div className='detail-item'>
																<span className='detail-label'>Typ transakcji:</span>
																<span className='detail-value'>
																	<span className={`transaction-badge ${isPurchase ? 'badge-purchase' : 'badge-sale'}`}>
																		{isPurchase ? '📥 Zakup' : '📤 Sprzedaż'}
																	</span>
																</span>
															</div>
															<div className='detail-item'>
																<span className='detail-label'>Ilość ({getUnitForOrder(order)}):</span>
																<span className='detail-value'>{order.quantity || '-'}</span>
															</div>
															<div className='detail-item'>
																<span className='detail-label'>Cena ({getCurrencyForOrder(order)}):</span>
																<span className='detail-value'>{order.price || '-'}</span>
															</div>
														</div>
													</div>

													{order.productDetails && Object.keys(order.productDetails).length > 0 && (
														<div className='details-section'>
															<h4>Parametry produktu</h4>
															<div className='details-items'>
																{Object.entries(order.productDetails).map(([key, value]) => (
																	<div className='detail-item' key={key}>
																		<span className='detail-label'>{key}:</span>
																		<span className='detail-value'>{value || '-'}</span>
																	</div>
																))}
															</div>
														</div>
													)}
												</div>
											</div>
										</td>
									</tr>
								)}
							</>
						)
					})}
				</tbody>
			</table>

			{/* WIDOK MOBILE - KARTY */}
			<div className='orders-cards mobile-only'>
				{orders.map(order => {
					const isPurchase = order.transactionType === 'zakup'
					const isExpanded = expandedOrderId === order.id
					
					return (
						<div key={order.id} className={`order-card ${isPurchase ? 'card-purchase' : 'card-sale'}`}>
							<div className='card-header'>
								<span className={`transaction-badge ${isPurchase ? 'badge-purchase' : 'badge-sale'}`}>
									{isPurchase ? '📥 Zakup' : '📤 Sprzedaż'}
								</span>
								<select 
									value={order.status}
									onChange={e => handleStatusChange(order.id, e.target.value)}
									className={`status-select status-${order.status}`}
									disabled={!permissions?.canEditOrders}>
									<option value='w-trakcie'>W trakcie</option>
									<option value='oplacone'>Opłacone</option>
									<option value='zrealizowane'>Zrealizowane</option>
									<option value='anulowane'>Anulowane</option>
								</select>
							</div>

							<div className='card-body'>
								<h3 className='card-product-type'>{order.type || '-'}</h3>
								<p className='card-client'>🏢 {order.client}</p>
								<div className='card-dates'>
									<span>📅 {order.dateStart}</span>
									<span>→</span>
									<span>🚚 {order.dateEnd}</span>
								</div>
							</div>

							{isExpanded && (
								<div className='card-details'>
									<div className='card-detail-section'>
										<h4>Informacje podstawowe</h4>
										<div className='card-detail-item'>
											<span>Ilość:</span>
											<strong>{order.quantity} {getUnitForOrder(order)}</strong>
										</div>
										<div className='card-detail-item'>
											<span>Cena:</span>
											<strong>{order.price} {getCurrencyForOrder(order)}</strong>
										</div>
									</div>

									{order.productDetails && Object.keys(order.productDetails).length > 0 && (
										<div className='card-detail-section'>
											<h4>Parametry produktu</h4>
											{Object.entries(order.productDetails).map(([key, value]) => (
												<div className='card-detail-item' key={key}>
													<span>{key}:</span>
													<strong>{value || '-'}</strong>
												</div>
											))}
										</div>
									)}
								</div>
							)}

							<div className='card-actions'>
								<button 
									className='btn-details-card' 
									onClick={() => toggleDetails(order.id)}>
									{isExpanded ? '▲ Ukryj' : '▼ Szczegóły'}
								</button>
								{permissions?.canEditOrders && (
									<button className='btn-edit-card' onClick={() => onEdit(order.id)}>
										✏️ Edytuj
									</button>
								)}
								{permissions?.canDeleteOrders && (
									<button className='btn-delete-card' onClick={() => onDelete(order.id)}>
										🗑️ Usuń
									</button>
								)}
							</div>
						</div>
					)
				})}
			</div>
		</div>
	)
}