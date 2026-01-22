import { useState, useEffect } from 'react'
import { db } from './firebase'
import { doc, updateDoc } from 'firebase/firestore'
import { useAuth } from './AuthContext'
import DatePicker, { registerLocale } from 'react-datepicker'
import pl from 'date-fns/locale/pl'
import 'react-datepicker/dist/react-datepicker.css'
import { format } from 'date-fns'
import { showToast } from './simpleAlerts'
import FileUpload from './FileUpload'
import './form-validation.css'
import './linked-order.css'
import './file-upload.css'

// Rejestruj polski język
registerLocale('pl', pl)

export default function AddForm({ onSubmit, editingOrder, onCancel, productTypes }) {
	const { currentUser, permissions, organizationId } = useAuth()
	
	const [formData, setFormData] = useState({
		transactionType: 'sprzedaz',
		type: '',
		client: '',
		dateStart: '',
		dateEnd: '',
		quantity: '',
		price: '',
		productDetails: {},
		// Nowe pola dla zamówień łączonych
		isLinked: false,
		linkedProducts: [],
		// Załączniki
		attachments: []
	})

	const [selectedProductType, setSelectedProductType] = useState(null)
	const [currentCurrency, setCurrentCurrency] = useState('PLN')
	
	// Stany dla DatePicker
	const [startDate, setStartDate] = useState(null)
	const [endDate, setEndDate] = useState(null)
	
	// Stan dla błędów walidacji
	const [validationErrors, setValidationErrors] = useState({
		type: false,
		client: false,
		dateStart: false,
		dateEnd: false,
		quantity: false,
		price: false,
		productDetails: {}
	})

	const availableCurrencies = ['PLN', 'EUR', 'USD', 'GBP', 'CHF', 'CZK']

	// Obsługa editingOrder
	useEffect(() => {
		if (editingOrder) {
			setFormData(editingOrder)
			const productType = productTypes.find(pt => pt.name === editingOrder.type)
			setSelectedProductType(productType || null)
			if (productType) {
				setCurrentCurrency(productType.currency || 'PLN')
			}
			
			if (editingOrder.dateStart) {
				setStartDate(new Date(editingOrder.dateStart))
			}
			if (editingOrder.dateEnd) {
				setEndDate(new Date(editingOrder.dateEnd))
			}
		} else {
			resetForm()
		}
	}, [editingOrder, productTypes])

	useEffect(() => {
		if (selectedProductType) {
			setCurrentCurrency(selectedProductType.currency || 'PLN')
		}
	}, [selectedProductType])

	if (!permissions?.canAddOrders && !editingOrder) {
		return null
	}

	if (!permissions?.canEditOrders && editingOrder) {
		return null
	}

	const resetForm = () => {
		setFormData({
			transactionType: 'sprzedaz',
			type: '',
			client: '',
			dateStart: '',
			dateEnd: '',
			quantity: '',
			price: '',
			productDetails: {},
			isLinked: false,
			linkedProducts: [],
			attachments: []
		})
		setSelectedProductType(null)
		setCurrentCurrency('PLN')
		setStartDate(null)
		setEndDate(null)
		setValidationErrors({
			type: false,
			client: false,
			dateStart: false,
			dateEnd: false,
			quantity: false,
			price: false,
			productDetails: {}
		})
	}

	const handleBasicChange = e => {
		const { name, value } = e.target
		setFormData(prev => ({ ...prev, [name]: value }))
		if (validationErrors[name]) {
			setValidationErrors(prev => ({ ...prev, [name]: false }))
		}
	}

	const handleTransactionTypeChange = (type) => {
		setFormData(prev => ({ ...prev, transactionType: type }))
	}

	const handleProductTypeChange = e => {
		const productTypeName = e.target.value
		const productType = productTypes.find(pt => pt.name === productTypeName)
		
		setSelectedProductType(productType || null)
		setFormData(prev => ({
			...prev,
			type: productTypeName,
			productDetails: {}
		}))
		if (validationErrors.type) {
			setValidationErrors(prev => ({ ...prev, type: false }))
		}
	}

	const handleProductDetailChange = e => {
		const { name, value } = e.target
		setFormData(prev => ({
			...prev,
			productDetails: {
				...prev.productDetails,
				[name]: value
			}
		}))
	}
	
	const handleStartDateChange = (date) => {
		setStartDate(date)
		if (date) {
			const formattedDate = format(date, 'yyyy-MM-dd')
			setFormData(prev => ({ ...prev, dateStart: formattedDate }))
			if (validationErrors.dateStart) {
				setValidationErrors(prev => ({ ...prev, dateStart: false }))
			}
		} else {
			setFormData(prev => ({ ...prev, dateStart: '' }))
		}
	}
	
	const handleEndDateChange = (date) => {
		setEndDate(date)
		if (date) {
			const formattedDate = format(date, 'yyyy-MM-dd')
			setFormData(prev => ({ ...prev, dateEnd: formattedDate }))
			if (validationErrors.dateEnd) {
				setValidationErrors(prev => ({ ...prev, dateEnd: false }))
			}
		} else {
			setFormData(prev => ({ ...prev, dateEnd: '' }))
		}
	}

	const handleCurrencyChange = async (newCurrency) => {
		setCurrentCurrency(newCurrency)
		
		if (selectedProductType && currentUser && organizationId) {
			try {
				const productRef = doc(db, 'organizations', organizationId, 'productTypes', selectedProductType.id)
				await updateDoc(productRef, {
					currency: newCurrency,
					updatedAt: new Date().toISOString()
				})
			} catch (err) {
				console.error('❌ Błąd aktualizacji waluty:', err)
			}
		}
	}

	// ========================================
	// OBSŁUGA ZAMÓWIEŃ ŁĄCZONYCH
	// ========================================

	const handleLinkedToggle = () => {
		setFormData(prev => ({ 
			...prev, 
			isLinked: !prev.isLinked,
			linkedProducts: !prev.isLinked ? [] : prev.linkedProducts
		}))
	}

	const handleAddLinkedProduct = () => {
		setFormData(prev => ({
			...prev,
			linkedProducts: [
				...prev.linkedProducts,
				{
					type: '',
					quantity: '',
					price: '',
					currency: 'PLN',
					unit: 'szt',
					productDetails: {}
				}
			]
		}))
	}

	const handleRemoveLinkedProduct = (index) => {
		setFormData(prev => ({
			...prev,
			linkedProducts: prev.linkedProducts.filter((_, i) => i !== index)
		}))
	}

	const handleLinkedProductChange = (index, field, value) => {
		setFormData(prev => ({
			...prev,
			linkedProducts: prev.linkedProducts.map((product, i) => {
				if (i === index) {
					if (field === 'type') {
						// Znajdź typ produktu i ustaw unit
						const productType = productTypes.find(pt => pt.name === value)
						return {
							...product,
							type: value,
							unit: productType?.unit || 'szt',
							currency: productType?.currency || 'PLN',
							productDetails: {}
						}
					}
					return { ...product, [field]: value }
				}
				return product
			})
		}))
	}

	const handleLinkedProductDetailChange = (productIndex, fieldName, value) => {
		setFormData(prev => ({
			...prev,
			linkedProducts: prev.linkedProducts.map((product, i) => {
				if (i === productIndex) {
					return {
						...product,
						productDetails: {
							...product.productDetails,
							[fieldName]: value
						}
					}
				}
				return product
			})
		}))
	}

	const getLinkedProductType = (productTypeName) => {
		return productTypes.find(pt => pt.name === productTypeName)
	}

	// ========================================
	// SUBMIT
	// ========================================

	const handleSubmit = e => {
		e.preventDefault()

		const errors = {
			type: false,
			client: false,
			dateStart: false,
			dateEnd: false,
			quantity: false,
			price: false,
			productDetails: {}
		}

		let hasError = false

		// Walidacja podstawowych pól
		if (!formData.type) {
			errors.type = true
			hasError = true
		}
		if (!formData.client) {
			errors.client = true
			hasError = true
		}
		if (!formData.dateStart) {
			errors.dateStart = true
			hasError = true
		}
		if (!formData.dateEnd) {
			errors.dateEnd = true
			hasError = true
		}
		if (!formData.quantity) {
			errors.quantity = true
			hasError = true
		}
		if (!formData.price) {
			errors.price = true
			hasError = true
		}

		// Walidacja linked products
		if (formData.isLinked) {
			for (let i = 0; i < formData.linkedProducts.length; i++) {
				const product = formData.linkedProducts[i]
				if (!product.type || !product.quantity || !product.price) {
					hasError = true
					showToast(`Wypełnij wszystkie pola dla produktu ${i + 2}`, 'error')
					break
				}
			}
		}

		if (hasError) {
			setValidationErrors(errors)
			showToast('Wypełnij wszystkie wymagane pola!', 'error')
			window.scrollTo({ top: 0, behavior: 'smooth' })
			return
		}

		const orderData = {
			...formData,
			currency: currentCurrency,
			unit: selectedProductType?.unit || 'szt'
		}

		onSubmit(orderData)

		if (!editingOrder) {
			resetForm()
		}
	}

	const handleCancelClick = () => {
		resetForm()
		onCancel()
	}

	const isSale = formData.transactionType === 'sprzedaz'

	return (
		<div className='add-form-container'>
			<form className='add-form' onSubmit={handleSubmit}>
				{editingOrder && (
					<div className='edit-mode-banner'>
						Edytujesz zamówienie
					</div>
				)}

				<div className='form-header'>
					<h2 className='form-title'>
						{editingOrder ? 'Edytuj zamówienie' : 'Dodaj nowe zamówienie'}
					</h2>
				</div>

				<div className='form-content'>
					{/* Toggle sprzedaż/zakup */}
					<div className='transaction-type-toggle'>
						<button
							type='button'
							className={`toggle-btn ${formData.transactionType === 'sprzedaz' ? 'active' : ''}`}
							onClick={() => handleTransactionTypeChange('sprzedaz')}
						>
							📤 Sprzedaż
						</button>
						<button
							type='button'
							className={`toggle-btn ${formData.transactionType === 'zakup' ? 'active' : ''}`}
							onClick={() => handleTransactionTypeChange('zakup')}
						>
							📥 Zakup
						</button>
					</div>

					{/* Podstawowe informacje */}
					<div className='form-grid'>
						<div className='form-group'>
							<label>
								{isSale ? 'Firma kupująca' : 'Firma sprzedająca'}
								<span className='required-star'>*</span>
							</label>
							<input
								type='text'
								name='client'
								placeholder={isSale ? 'Nazwa firmy kupującej' : 'Nazwa firmy sprzedającej'}
								value={formData.client}
								onChange={handleBasicChange}
								className={validationErrors.client ? 'input-error' : ''}
							/>
						</div>

						<div className='form-group'>
							<label>
								{isSale ? 'Data zamówienia' : 'Data zakupu'}
								<span className='required-star'>*</span>
							</label>
							<DatePicker
								selected={startDate}
								onChange={handleStartDateChange}
								dateFormat="dd.MM.yyyy"
								locale="pl"
								showWeekNumbers
								weekLabel="Tydz."
								placeholderText="Wybierz datę..."
								className={`date-picker-input ${validationErrors.dateStart ? 'input-error' : ''}`}
								calendarClassName="custom-datepicker"
							/>
						</div>

						<div className='form-group'>
							<label>
								{isSale ? 'Data wysyłki' : 'Data dostawy'}
								<span className='required-star'>*</span>
							</label>
							<DatePicker
								selected={endDate}
								onChange={handleEndDateChange}
								dateFormat="dd.MM.yyyy"
								locale="pl"
								showWeekNumbers
								weekLabel="Tydz."
								placeholderText="Wybierz datę..."
								className={`date-picker-input ${validationErrors.dateEnd ? 'input-error' : ''}`}
								calendarClassName="custom-datepicker"
								minDate={startDate}
							/>
						</div>
					</div>

					{/* PRODUKT GŁÓWNY */}
					<div className='product-section'>
						<h3 className='product-section-title'>
							🏷️ Produkt {formData.isLinked ? '1' : ''}
						</h3>

						<div className='form-grid'>
							<div className='form-group'>
								<label>
									Typ produktu
									<span className='required-star'>*</span>
								</label>
								{productTypes.length === 0 ? (
									<div className="no-products-warning">
										⚠️ Brak typów produktów. Skonfiguruj w zakładce "Konfiguracja".
									</div>
								) : (
									<select
										name='type'
										value={formData.type}
										onChange={handleProductTypeChange}
										className={validationErrors.type ? 'input-error' : ''}
									>
										<option value=''>-- Wybierz typ produktu --</option>
										{productTypes.map(pt => (
											<option key={pt.id} value={pt.name}>
												{pt.name}
											</option>
										))}
									</select>
								)}
							</div>

							<div className='form-group'>
								<label>
									{selectedProductType ? `Ilość (${selectedProductType.unit || 'szt'})` : 'Ilość'}
									<span className='required-star'>*</span>
								</label>
								<input
									type='number'
									name='quantity'
									placeholder='0'
									value={formData.quantity}
									onChange={handleBasicChange}
									className={validationErrors.quantity ? 'input-error' : ''}
								/>
							</div>

							<div className='form-group form-group-half'>
								<label>
									Cena za jednostkę
									<span className='required-star'>*</span>
								</label>
								<div className='price-input-wrapper'>
									<input
										type='number'
										name='price'
										placeholder='0.00'
										value={formData.price}
										onChange={handleBasicChange}
										step='0.01'
										className={`price-input ${validationErrors.price ? 'input-error' : ''}`}
									/>
									<select
										value={currentCurrency}
										onChange={(e) => handleCurrencyChange(e.target.value)}
										className='currency-select-inline'
										disabled={!selectedProductType}
									>
										{availableCurrencies.map(curr => (
											<option key={curr} value={curr}>{curr}</option>
										))}
									</select>
								</div>
							</div>
						</div>

						{/* Szczegóły produktu głównego */}
						{selectedProductType && selectedProductType.fields.length > 0 && (
							<>
								<div className='form-section-divider'>
									<h4>Szczegóły produktu: {selectedProductType.name}</h4>
									<p style={{ fontSize: '13px', color: '#6c757d', marginTop: '8px' }}>
										(opcjonalne - możesz pominąć)
									</p>
								</div>

								<div className='form-grid'>
									{selectedProductType.fields.map(field => (
										<div key={field.name} className='form-group'>
											<label>
												{field.name.charAt(0).toUpperCase() + field.name.slice(1)}
											</label>
											<input
												type={field.type}
												name={field.name}
												placeholder={field.placeholder || `Wprowadź ${field.name.toLowerCase()}`}
												value={formData.productDetails[field.name] || ''}
												onChange={handleProductDetailChange}
											/>
										</div>
									))}
								</div>
							</>
						)}
					</div>

					{/* FILE UPLOAD - ZAŁĄCZNIKI */}
					<FileUpload
						files={formData.attachments}
						onFilesChange={(files) => setFormData(prev => ({ ...prev, attachments: files }))}
						disabled={false}
					/>

					{/* CHECKBOX ZAMÓWIENIE ŁĄCZONE */}
					<div className='linked-order-checkbox'>
						<label className='checkbox-label'>
							<input
								type='checkbox'
								checked={formData.isLinked}
								onChange={handleLinkedToggle}
							/>
							<span className='checkbox-text'>
								Zamówienie łączone (wiele produktów)
							</span>
						</label>
					</div>

					{/* DODATKOWE PRODUKTY */}
					{formData.isLinked && (
						<div className='linked-products-section'>
							{formData.linkedProducts.map((product, index) => {
								const linkedProductType = getLinkedProductType(product.type)
								
								return (
									<div key={index} className='linked-product-item'>
										<div className='linked-product-header'>
											<h3 className='product-section-title'>
												🏷️ Produkt {index + 2}
											</h3>
											<button
												type='button'
												className='remove-product-btn'
												onClick={() => handleRemoveLinkedProduct(index)}
											>
												🗑️ Usuń
											</button>
										</div>

										<div className='form-grid'>
											<div className='form-group'>
												<label>
													Typ produktu
													<span className='required-star'>*</span>
												</label>
												<select
													value={product.type}
													onChange={(e) => handleLinkedProductChange(index, 'type', e.target.value)}
												>
													<option value=''>-- Wybierz typ produktu --</option>
													{productTypes.map(pt => (
														<option key={pt.id} value={pt.name}>
															{pt.name}
														</option>
													))}
												</select>
											</div>

											<div className='form-group'>
												<label>
													{linkedProductType ? `Ilość (${linkedProductType.unit || 'szt'})` : 'Ilość'}
													<span className='required-star'>*</span>
												</label>
												<input
													type='number'
													placeholder='0'
													value={product.quantity}
													onChange={(e) => handleLinkedProductChange(index, 'quantity', e.target.value)}
												/>
											</div>

											<div className='form-group form-group-half'>
												<label>
													Cena za jednostkę
													<span className='required-star'>*</span>
												</label>
												<div className='price-input-wrapper'>
													<input
														type='number'
														placeholder='0.00'
														value={product.price}
														onChange={(e) => handleLinkedProductChange(index, 'price', e.target.value)}
														step='0.01'
														className='price-input'
													/>
													<select
														value={product.currency}
														onChange={(e) => handleLinkedProductChange(index, 'currency', e.target.value)}
														className='currency-select-inline'
													>
														{availableCurrencies.map(curr => (
															<option key={curr} value={curr}>{curr}</option>
														))}
													</select>
												</div>
											</div>
										</div>

										{/* Szczegóły dodatkowego produktu */}
										{linkedProductType && linkedProductType.fields.length > 0 && (
											<>
												<div className='form-section-divider'>
													<h4>Szczegóły produktu: {linkedProductType.name}</h4>
													<p style={{ fontSize: '13px', color: '#6c757d', marginTop: '8px' }}>
														(opcjonalne - możesz pominąć)
													</p>
												</div>

												<div className='form-grid'>
													{linkedProductType.fields.map(field => (
														<div key={field.name} className='form-group'>
															<label>
																{field.name.charAt(0).toUpperCase() + field.name.slice(1)}
															</label>
															<input
																type={field.type}
																placeholder={field.placeholder || `Wprowadź ${field.name.toLowerCase()}`}
																value={product.productDetails[field.name] || ''}
																onChange={(e) => handleLinkedProductDetailChange(index, field.name, e.target.value)}
															/>
														</div>
													))}
												</div>
											</>
										)}
									</div>
								)
							})}

							<button
								type='button'
								className='add-product-btn'
								onClick={handleAddLinkedProduct}
							>
								➕ Dodaj kolejny produkt
							</button>
						</div>
					)}
				</div>

				{/* Akcje */}
				<div className='form-actions'>
					{editingOrder && (
						<button type='button' onClick={handleCancelClick} className='cancel-btn'>
							Anuluj
						</button>
					)}
					<button type='submit' className='save-btn'>
						{editingOrder ? '✔ Zapisz zmiany' : '+ Dodaj zamówienie'}
					</button>
				</div>
			</form>
		</div>
	)
}