export default function Statistics({ orders, isOpen, onClose, productTypes }) {
	// Filtruj tylko zrealizowane zamówienia
	const completedOrders = (orders || []).filter(order => order.status === 'zrealizowane' || order.status === 'oplacone')
	

	// Podziel na sprzedaż i zakup
	const salesOrders = completedOrders.filter(order => (order.transactionType || 'sprzedaz') === 'sprzedaz')
	const purchaseOrders = completedOrders.filter(order => order.transactionType === 'zakup')

	// Filtruj zrealizowane zamówienia z bieżącego roku
	const currentYear = new Date().getFullYear()
	const completedOrdersThisYear = completedOrders.filter(order => {
		if (!order.dateStart) return false
		const orderYear = new Date(order.dateStart).getFullYear()
		return orderYear === currentYear
	})

	const salesOrdersThisYear = salesOrders.filter(order => {
		if (!order.dateStart) return false
		const orderYear = new Date(order.dateStart).getFullYear()
		return orderYear === currentYear
	})

	const purchaseOrdersThisYear = purchaseOrders.filter(order => {
		if (!order.dateStart) return false
		const orderYear = new Date(order.dateStart).getFullYear()
		return orderYear === currentYear
	})

	// Obliczenia statystyk (tylko zrealizowane)
	const totalOrders = completedOrders.length
	const totalSales = salesOrders.length
	const totalPurchases = purchaseOrders.length
	const totalOrdersThisYear = completedOrdersThisYear.length

	// Suma wszystkich produktów (ilość)
	const totalProducts = completedOrders.reduce((sum, order) => {
		const quantity = parseInt(order.quantity) || 0
		return sum + quantity
	}, 0)

	const totalSalesProducts = salesOrders.reduce((sum, order) => {
		const quantity = parseInt(order.quantity) || 0
		return sum + quantity
	}, 0)

	const totalPurchasesProducts = purchaseOrders.reduce((sum, order) => {
		const quantity = parseInt(order.quantity) || 0
		return sum + quantity
	}, 0)

	// Åączna wartość z obsługą różnych walut - SPRZEDAÅ»
	const salesValuesByCurrency = salesOrders.reduce((acc, order) => {
		const price = parseFloat(order.price) || 0
		const quantity = parseInt(order.quantity) || 0
		const totalValue = price * quantity

		const currency = order.currency || productTypes?.find(pt => pt.name === order.type)?.currency || 'PLN'

		if (!acc[currency]) {
			acc[currency] = 0
		}
		acc[currency] += totalValue

		return acc
	}, {})

	// Åączna wartość z obsługą różnych walut - ZAKUP
	const purchaseValuesByCurrency = purchaseOrders.reduce((acc, order) => {
		const price = parseFloat(order.price) || 0
		const quantity = parseInt(order.quantity) || 0
		const totalValue = price * quantity

		const currency = order.currency || productTypes?.find(pt => pt.name === order.type)?.currency || 'PLN'

		if (!acc[currency]) {
			acc[currency] = 0
		}
		acc[currency] += totalValue

		return acc
	}, {})

	// Statystyki według typu produktu - SPRZEDAÅ»
	const salesStatsByProductType = salesOrders.reduce((acc, order) => {
		const productName = order.type || 'Nieznany'
		
		if (!acc[productName]) {
			acc[productName] = {
				count: 0,
				totalQuantity: 0,
				totalValue: 0,
				currency: 'PLN',
				unit: 'szt'
			}
		}

		const currency = order.currency || productTypes?.find(pt => pt.name === productName)?.currency || 'PLN'
		const unit = order.unit || productTypes?.find(pt => pt.name === productName)?.unit || 'szt'
		
		acc[productName].currency = currency
		acc[productName].unit = unit

		acc[productName].count += 1
		acc[productName].totalQuantity += parseInt(order.quantity) || 0
		
		const price = parseFloat(order.price) || 0
		const quantity = parseInt(order.quantity) || 0
		acc[productName].totalValue += price * quantity

		return acc
	}, {})

	// Statystyki według typu produktu - ZAKUP
	const purchaseStatsByProductType = purchaseOrders.reduce((acc, order) => {
		const productName = order.type || 'Nieznany'
		
		if (!acc[productName]) {
			acc[productName] = {
				count: 0,
				totalQuantity: 0,
				totalValue: 0,
				currency: 'PLN',
				unit: 'szt'
			}
		}

		const currency = order.currency || productTypes?.find(pt => pt.name === productName)?.currency || 'PLN'
		const unit = order.unit || productTypes?.find(pt => pt.name === productName)?.unit || 'szt'
		
		acc[productName].currency = currency
		acc[productName].unit = unit

		acc[productName].count += 1
		acc[productName].totalQuantity += parseInt(order.quantity) || 0
		
		const price = parseFloat(order.price) || 0
		const quantity = parseInt(order.quantity) || 0
		acc[productName].totalValue += price * quantity

		return acc
	}, {})

	if (!isOpen) return null

	return (
		<>
			<div className='statistics-overlay' onClick={onClose}></div>
			<div className={`statistics-panel ${isOpen ? 'open' : ''}`}>
				<div className='statistics-header'>
					<h2 className='statistics-title'>Statystyki</h2>
					<button className='close-stats-btn' onClick={onClose}>
						âœ•
					</button>
				</div>

				<div className='statistics-content'>
					{totalOrders === 0 ? (
						<div className='no-stats'>
							<p>Brak danych do wyświetlenia</p>
							<span>Zrealizuj zamówienia, aby zobaczyć statystyki</span>
						</div>
					) : (
						<>
							<div className='stats-info-banner'>
								<span>âœ… Statystyki obejmują tylko zrealizowane zamówienia</span>
							</div>

							{/* Statystyki ogólne */}
							<div className='stats-grid'>
								<div className='stat-card stat-primary'>
									<div className='stat-icon'>ðŸ“¦</div>
									<div className='stat-content'>
										<div className='stat-value'>{totalOrders}</div>
										<div className='stat-label'>Wszystkie zamówienia</div>
									</div>
								</div>

								<div className='stat-card stat-success'>
									<div className='stat-icon'>ðŸ“¤</div>
									<div className='stat-content'>
										<div className='stat-value'>{totalSales}</div>
										<div className='stat-label'>Sprzedaż</div>
									</div>
								</div>

								<div className='stat-card stat-info'>
									<div className='stat-icon'>ðŸ“¥</div>
									<div className='stat-content'>
										<div className='stat-value'>{totalPurchases}</div>
										<div className='stat-label'>Zakup</div>
									</div>
								</div>
							</div>

							{/* SPRZEDAÅ» */}
							{totalSales > 0 && (
								<>
									<div className='status-stats'>
										<h3 className='status-stats-title'>ðŸ“¤ Sprzedaż</h3>
										
										<div className='stats-grid'>
											<div className='stat-card stat-success'>
												<div className='stat-icon'>ðŸ“Š</div>
												<div className='stat-content'>
													<div className='stat-value'>{totalSalesProducts}</div>
													<div className='stat-label'>Suma produktów</div>
												</div>
											</div>

											{Object.entries(salesValuesByCurrency).map(([currency, value]) => (
												<div className='stat-card stat-success' key={currency}>
													<div className='stat-icon'>ðŸ’°</div>
													<div className='stat-content'>
														<div className='stat-value'>{value.toFixed(2)} {currency}</div>
														<div className='stat-label'>Åączna wartość</div>
													</div>
												</div>
											))}
										</div>

										{/* Rozbicie według produktów - SPRZEDAÅ» */}
										{Object.keys(salesStatsByProductType).length > 0 && (
											<>
												<h4 className='subsection-title'>Rozbicie według produktów</h4>
												<div className='product-stats-grid'>
													{Object.entries(salesStatsByProductType).map(([productName, stats]) => (
														<div className='product-stat-card sale-card' key={productName}>
															<h4 className='product-stat-name'>{productName}</h4>
															<div className='product-stat-details'>
																<div className='product-stat-item'>
																	<span className='product-stat-label'>Zamówienia:</span>
																	<span className='product-stat-value'>{stats.count}</span>
																</div>
																<div className='product-stat-item'>
																	<span className='product-stat-label'>Ilość ({stats.unit}):</span>
																	<span className='product-stat-value'>{stats.totalQuantity}</span>
																</div>
																<div className='product-stat-item'>
																	<span className='product-stat-label'>Wartość:</span>
																	<span className='product-stat-value'>
																		{stats.totalValue.toFixed(2)} {stats.currency}
																	</span>
																</div>
															</div>
														</div>
													))}
												</div>
											</>
										)}
									</div>
								</>
							)}

							{/* ZAKUP */}
							{totalPurchases > 0 && (
								<>
									<div className='status-stats'>
										<h3 className='status-stats-title'>ðŸ“¥ Zakup</h3>
										
										<div className='stats-grid'>
											<div className='stat-card stat-info'>
												<div className='stat-icon'>ðŸ“Š</div>
												<div className='stat-content'>
													<div className='stat-value'>{totalPurchasesProducts}</div>
													<div className='stat-label'>Suma produktów</div>
												</div>
											</div>

											{Object.entries(purchaseValuesByCurrency).map(([currency, value]) => (
												<div className='stat-card stat-info' key={currency}>
													<div className='stat-icon'>ðŸ’°</div>
													<div className='stat-content'>
														<div className='stat-value'>{value.toFixed(2)} {currency}</div>
														<div className='stat-label'>Åączna wartość</div>
													</div>
												</div>
											))}
										</div>

										{/* Rozbicie według produktów - ZAKUP */}
										{Object.keys(purchaseStatsByProductType).length > 0 && (
											<>
												<h4 className='subsection-title'>Rozbicie według produktów</h4>
												<div className='product-stats-grid'>
													{Object.entries(purchaseStatsByProductType).map(([productName, stats]) => (
														<div className='product-stat-card purchase-card' key={productName}>
															<h4 className='product-stat-name'>{productName}</h4>
															<div className='product-stat-details'>
																<div className='product-stat-item'>
																	<span className='product-stat-label'>Zamówienia:</span>
																	<span className='product-stat-value'>{stats.count}</span>
																</div>
																<div className='product-stat-item'>
																	<span className='product-stat-label'>Ilość ({stats.unit}):</span>
																	<span className='product-stat-value'>{stats.totalQuantity}</span>
																</div>
																<div className='product-stat-item'>
																	<span className='product-stat-label'>Wartość:</span>
																	<span className='product-stat-value'>
																		{stats.totalValue.toFixed(2)} {stats.currency}
																	</span>
																</div>
															</div>
														</div>
													))}
												</div>
											</>
										)}
									</div>
								</>
							)}

							{/* Statystyki z bieżącego roku */}
							<div className='status-stats'>
								<h3 className='status-stats-title'>ðŸŽ¯ Zrealizowane w {currentYear} roku</h3>

								{totalOrdersThisYear === 0 ? (
									<div className='no-stats-year'>
										<p>Brak zrealizowanych zamówień z {currentYear} roku</p>
									</div>
								) : (
									<div className='year-stats-grid'>
										<div className='year-stats-card'>
											<div className='year-stat-icon'>ðŸ“¦</div>
											<div className='year-stat-content'>
												<div className='year-stat-value'>{totalOrdersThisYear}</div>
												<div className='year-stat-label'>Wszystkich</div>
											</div>
										</div>
										<div className='year-stats-card sale-year-card'>
											<div className='year-stat-icon'>ðŸ“¤</div>
											<div className='year-stat-content'>
												<div className='year-stat-value'>{salesOrdersThisYear.length}</div>
												<div className='year-stat-label'>Sprzedaż</div>
											</div>
										</div>
										<div className='year-stats-card purchase-year-card'>
											<div className='year-stat-icon'>ðŸ“¥</div>
											<div className='year-stat-content'>
												<div className='year-stat-value'>{purchaseOrdersThisYear.length}</div>
												<div className='year-stat-label'>Zakup</div>
											</div>
										</div>
									</div>
								)}
							</div>
						</>
					)}
				</div>
			</div>
		</>
	)
}