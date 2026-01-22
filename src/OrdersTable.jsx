import { useState } from 'react'
import { useAuth } from './AuthContext'
import { getOrderTotalValue, getTotalProductsCount, isLinkedOrder } from './linkedOrderHelpers'

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
						<th>Produkty</th>
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
											<option value='wyprodukowane'>Wyprodukowane</option>
											<option value='oplacone'>Opłacone</option>
											<option value='zrealizowane'>Zrealizowane</option>
											<option value='anulowane'>Anulowane</option>
										</select>
									</td>
									<td data-label='Produkty'>
										{isLinkedOrder(order) ? (
											<div className='linked-products-badge'>
												🔗 {order.type} +{getTotalProductsCount(order) - 1} więcej
											</div>
										) : (
											order.type || '-'
										)}
									</td>
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
												
												{/* PRODUKT GŁÓWNY */}
												<div className='details-grid'>
													<div className='details-section'>
														<h4>🏷️ Produkt główny: {order.type}</h4>
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
																<span className='detail-label'>Cena za jednostkę:</span>
																<span className='detail-value'>{order.price} {getCurrencyForOrder(order)}/{getUnitForOrder(order)}</span>
															</div>
															<div className='detail-item'>
																<span className='detail-label'>Wartość:</span>
																<span className='detail-value detail-value-highlight'>
																	{(order.quantity * order.price).toFixed(2)} {getCurrencyForOrder(order)}
																</span>
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

												{/* DODATKOWE PRODUKTY - JEŚLI ZAMÓWIENIE ŁĄCZONE */}
												{isLinkedOrder(order) && (
													<div className='linked-products-details'>
														<h4>🔗 Dodatkowe produkty w zamówieniu:</h4>
														
														{order.linkedProducts.map((product, index) => (
															<div key={index} className='linked-product-detail-item'>
																<div className='product-detail-header'>
																	<strong>🏷️ Produkt {index + 2}: {product.type}</strong>
																</div>
																<div className='product-detail-grid'>
																	<div>
																		<span className='detail-label'>Ilość:</span>
																		<span className='detail-value'>{product.quantity} {product.unit}</span>
																	</div>
																	<div>
																		<span className='detail-label'>Cena za jednostkę:</span>
																		<span className='detail-value'>{product.price} {product.currency}/{product.unit}</span>
																	</div>
																	<div>
																		<span className='detail-label'>Wartość:</span>
																		<span className='detail-value detail-value-highlight'>
																			{(product.quantity * product.price).toFixed(2)} {product.currency}
																		</span>
																	</div>
																</div>
																
																{/* Customowe parametry dodatkowego produktu */}
																{product.productDetails && Object.keys(product.productDetails).length > 0 && (
																	<div className='custom-params-section'>
																		<strong>Parametry:</strong>
																		{Object.entries(product.productDetails).map(([key, value]) => (
																			<div key={key} className='custom-param'>
																				<span className='param-key'>{key}:</span>
																				<span className='param-value'>{value}</span>
																			</div>
																		))}
																	</div>
																)}
															</div>
														))}
													</div>
												)}

												{/* ZAŁĄCZNIKI */}
												{order.attachments && order.attachments.length > 0 && (
													<div className='attachments-section'>
														<h4>📎 Załączniki ({order.attachments.length})</h4>
														<div className='attachments-grid'>
															{order.attachments.map((file, index) => (
																<div key={index} className='attachment-item'>
																	{file.type && file.type.startsWith('image/') ? (
																		<div className='attachment-preview'>
																			<img src={file.url} alt={file.name} />
																		</div>
																	) : (
																		<div className='attachment-icon'>
																			{file.type === 'application/pdf' ? '📄' : 
																			 file.type?.includes('word') ? '📝' : 
																			 file.type?.includes('excel') ? '📊' : '📎'}
																		</div>
																	)}
																	<div className='attachment-info'>
																		<div className='attachment-name'>{file.name}</div>
																		<a 
																			href={file.url} 
																			target='_blank' 
																			rel='noopener noreferrer'
																			className='attachment-download'
																		>
																			⬇️ Pobierz
																		</a>
																	</div>
																</div>
															))}
														</div>
													</div>
												)}
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
									<option value='wyprodukowane'>Wyprodukowane</option>
									<option value='oplacone'>Opłacone</option>
									<option value='zrealizowane'>Zrealizowane</option>
									<option value='anulowane'>Anulowane</option>
								</select>
							</div>

							<div className='card-body'>
								<h3 className='card-product-type'>
									{isLinkedOrder(order) ? (
										<>🔗 {order.type} +{getTotalProductsCount(order) - 1} więcej</>
									) : (
										order.type || '-'
									)}
								</h3>
								<p className='card-client'>🏢 {order.client}</p>
								<div className='card-dates'>
									<span>📅 {order.dateStart}</span>
									<span>→</span>
									<span>🚚 {order.dateEnd}</span>
								</div>
							</div>

							{isExpanded && (
								<div className='card-details'>
									{/* Produkt główny */}
									<div className='card-detail-section'>
										<h4>🏷️ Produkt główny: {order.type}</h4>
										<div className='card-detail-item'>
											<span>Ilość:</span>
											<strong>{order.quantity} {getUnitForOrder(order)}</strong>
										</div>
										<div className='card-detail-item'>
											<span>Cena:</span>
											<strong>{order.price} {getCurrencyForOrder(order)}</strong>
										</div>
										<div className='card-detail-item'>
											<span>Wartość:</span>
											<strong className='highlight-value'>
												{(order.quantity * order.price).toFixed(2)} {getCurrencyForOrder(order)}
											</strong>
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

									{/* Dodatkowe produkty - mobile */}
									{isLinkedOrder(order) && (
										<div className='card-linked-products'>
											<h4>🔗 Dodatkowe produkty:</h4>
											{order.linkedProducts.map((product, index) => (
												<div key={index} className='card-linked-product-item'>
													<h5>Produkt {index + 2}: {product.type}</h5>
													<div className='card-detail-item'>
														<span>Ilość:</span>
														<strong>{product.quantity} {product.unit}</strong>
													</div>
													<div className='card-detail-item'>
														<span>Cena:</span>
														<strong>{product.price} {product.currency}</strong>
													</div>
													<div className='card-detail-item'>
														<span>Wartość:</span>
														<strong className='highlight-value'>
															{(product.quantity * product.price).toFixed(2)} {product.currency}
														</strong>
													</div>
													
													{product.productDetails && Object.keys(product.productDetails).length > 0 && (
														<div className='card-product-params'>
															<strong>Parametry:</strong>
															{Object.entries(product.productDetails).map(([key, value]) => (
																<div key={key} className='card-param-item'>
																	<span>{key}:</span> {value}
																</div>
															))}
														</div>
													)}
												</div>
											))}
										</div>
									)}

									{/* Załączniki - mobile */}
									{order.attachments && order.attachments.length > 0 && (
										<div className='card-attachments'>
											<h4>📎 Załączniki ({order.attachments.length})</h4>
											<div className='card-attachments-list'>
												{order.attachments.map((file, index) => (
													<div key={index} className='card-attachment-item'>
														{file.type && file.type.startsWith('image/') ? (
															<div className='card-attachment-preview'>
																<img src={file.url} alt={file.name} />
															</div>
														) : (
															<div className='card-attachment-icon'>
																{file.type === 'application/pdf' ? '📄' : 
																 file.type?.includes('word') ? '📝' : 
																 file.type?.includes('excel') ? '📊' : '📎'}
															</div>
														)}
														<div className='card-attachment-info'>
															<div className='card-attachment-name'>{file.name}</div>
															<a 
																href={file.url} 
																target='_blank' 
																rel='noopener noreferrer'
																className='card-attachment-download'
															>
																⬇️ Pobierz
															</a>
														</div>
													</div>
												))}
											</div>
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