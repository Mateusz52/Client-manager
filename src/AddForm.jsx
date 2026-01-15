import { useState, useEffect } from 'react'
import { db } from './firebase'
import { doc, updateDoc } from 'firebase/firestore'
import { useAuth } from './AuthContext'
import { useAlert } from './AlertProvider'
import DatePicker, { registerLocale } from 'react-datepicker'
import pl from 'date-fns/locale/pl'
import 'react-datepicker/dist/react-datepicker.css'
import { format } from 'date-fns'

// Rejestruj polski język
registerLocale('pl', pl)

export default function AddForm({ onSubmit, editingOrder, onCancel, productTypes }) {
	const { currentUser, permissions, organizationId } = useAuth()
	const { error } = useAlert()
	
	const [formData, setFormData] = useState({
		transactionType: 'sprzedaz',
		type: '',
		client: '',
		dateStart: '',
		dateEnd: '',
		quantity: '',
		price: '',
		productDetails: {}
	})

	const [selectedProductType, setSelectedProductType] = useState(null)
	const [currentCurrency, setCurrentCurrency] = useState('PLN')
	
	// Stany dla DatePicker
	const [startDate, setStartDate] = useState(null)
	const [endDate, setEndDate] = useState(null)

	const availableCurrencies = ['PLN', 'EUR', 'USD', 'GBP', 'CHF', 'CZK']

	useEffect(() => {
		if (editingOrder) {
			setFormData(editingOrder)
			const productType = productTypes.find(pt => pt.name === editingOrder.type)
			setSelectedProductType(productType || null)
			if (productType) {
				setCurrentCurrency(productType.currency || 'PLN')
			}
			
			// Ustaw daty dla DatePicker
			if (editingOrder.dateStart) {
				setStartDate(new Date(editingOrder.dateStart))
			}
			if (editingOrder.dateEnd) {
				setEndDate(new Date(editingOrder.dateEnd))
			}
		}
	}, [editingOrder, productTypes])

	useEffect(() => {
		if (selectedProductType) {
			setCurrentCurrency(selectedProductType.currency || 'PLN')
		}
	}, [selectedProductType])

	// Sprawdź uprawnienia PO wszystkich hookach
	if (!permissions?.canAddOrders && !editingOrder) {
		return null
	}

	if (!permissions?.canEditOrders && editingOrder) {
		return null
	}

	const handleBasicChange = e => {
		const { name, value } = e.target
		setFormData(prev => ({ ...prev, [name]: value }))
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
	
	// Handler dla DatePicker - Data zamówienia
	const handleStartDateChange = (date) => {
		setStartDate(date)
		if (date) {
			const formattedDate = format(date, 'yyyy-MM-dd')
			setFormData(prev => ({ ...prev, dateStart: formattedDate }))
		} else {
			setFormData(prev => ({ ...prev, dateStart: '' }))
		}
	}
	
	// Handler dla DatePicker - Data wysyłki
	const handleEndDateChange = (date) => {
		setEndDate(date)
		if (date) {
			const formattedDate = format(date, 'yyyy-MM-dd')
			setFormData(prev => ({ ...prev, dateEnd: formattedDate }))
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
				console.log('✅ Waluta zaktualizowana w konfiguracji produktu')
			} catch (err) {
				console.error('❌ Błąd aktualizacji waluty:', err)
			}
		}
	}

	const handleSubmit = e => {
		e.preventDefault()

		if (!formData.type || !formData.client || !formData.dateStart || !formData.dateEnd || !formData.quantity || !formData.price) {
			error('Wypełnij wszystkie podstawowe pola!', 'Niekompletny formularz')
			return
		}

		if (selectedProductType) {
			for (let field of selectedProductType.fields) {
				if (!formData.productDetails[field.name]) {
					error(`Wypełnij pole: ${field.name}`, 'Brakujące pole')
					return
				}
			}
		}

		const orderData = {
			...formData,
			currency: currentCurrency,
			unit: selectedProductType?.unit || 'szt'
		}

		onSubmit(orderData)

		setFormData({
			transactionType: 'sprzedaz',
			type: '',
			client: '',
			dateStart: '',
			dateEnd: '',
			quantity: '',
			price: '',
			productDetails: {}
		})
		setSelectedProductType(null)
		setCurrentCurrency('PLN')
		setStartDate(null)
		setEndDate(null)
	}

	const handleCancelClick = () => {
		setFormData({
			transactionType: 'sprzedaz',
			type: '',
			client: '',
			dateStart: '',
			dateEnd: '',
			quantity: '',
			price: '',
			productDetails: {}
		})
		setSelectedProductType(null)
		setCurrentCurrency('PLN')
		setStartDate(null)
		setEndDate(null)
		onCancel()
	}

	const isSale = formData.transactionType === 'sprzedaz'

	return (
		<div className='add-form-container'>
			<form className='add-form' onSubmit={handleSubmit}>
				{/* Banner trybu edycji */}
				{editingOrder && (
					<div className='edit-mode-banner'>
						Edytujesz zamówienie
					</div>
				)}

				{/* Header */}
				<div className='form-header'>
					<h2 className='form-title'>
						{editingOrder ? 'Edytuj zamówienie' : 'Dodaj nowe zamówienie'}
					</h2>
				</div>

				{/* Treść formularza */}
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

					{/* Grid z polami */}
					<div className='form-grid'>
						{/* Typ produktu */}
						<div className='form-group'>
							<label>Typ produktu</label>
							{productTypes.length === 0 ? (
								<div className="no-products-warning">
									⚠️ Brak typów produktów. Skonfiguruj w zakładce "Konfiguracja".
								</div>
							) : (
								<select
									name='type'
									value={formData.type}
									onChange={handleProductTypeChange}
									required
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

						{/* Klient */}
						<div className='form-group'>
							<label>{isSale ? 'Firma kupująca' : 'Firma sprzedająca'}</label>
							<input
								type='text'
								name='client'
								placeholder={isSale ? 'Nazwa firmy kupującej' : 'Nazwa firmy sprzedającej'}
								value={formData.client}
								onChange={handleBasicChange}
								required
							/>
						</div>

						{/* Data zamówienia - DATEPICKER */}
						<div className='form-group'>
							<label>{isSale ? 'Data zamówienia' : 'Data zakupu'}</label>
							<DatePicker
								selected={startDate}
								onChange={handleStartDateChange}
								dateFormat="dd.MM.yyyy"
								locale="pl"
								showWeekNumbers
								weekLabel="Tydz."
								placeholderText="Wybierz datę..."
								className="date-picker-input"
								calendarClassName="custom-datepicker"
								required
							/>
						</div>

						{/* Data wysyłki - DATEPICKER */}
						<div className='form-group'>
							<label>{isSale ? 'Data wysyłki' : 'Data dostawy'}</label>
							<DatePicker
								selected={endDate}
								onChange={handleEndDateChange}
								dateFormat="dd.MM.yyyy"
								locale="pl"
								showWeekNumbers
								weekLabel="Tydz."
								placeholderText="Wybierz datę..."
								className="date-picker-input"
								calendarClassName="custom-datepicker"
								minDate={startDate}
								required
							/>
						</div>

						{/* Ilość */}
						<div className='form-group'>
							<label>{selectedProductType ? `Ilość (${selectedProductType.unit || 'szt'})` : 'Ilość'}</label>
							<input
								type='number'
								name='quantity'
								placeholder='0'
								value={formData.quantity}
								onChange={handleBasicChange}
								required
							/>
						</div>

						{/* Cena z walutą */}
						<div className='form-group form-group-half'>
							<label>Cena za jednostkę</label>
							<div className='price-input-wrapper'>
								<input
									type='number'
									name='price'
									placeholder='0.00'
									value={formData.price}
									onChange={handleBasicChange}
									step='0.01'
									className='price-input'
									required
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
							{selectedProductType && (
								<span className='currency-hint'>
									💡 Zmiana waluty zaktualizuje konfigurację produktu "{selectedProductType.name}"
								</span>
							)}
						</div>
					</div>

					{/* Szczegóły produktu */}
					{selectedProductType && selectedProductType.fields.length > 0 && (
						<>
							<div className='form-section-divider'>
								<h3>Szczegóły produktu: {selectedProductType.name}</h3>
							</div>

							<div className='form-grid'>
								{selectedProductType.fields.map(field => (
									<div key={field.name} className='form-group'>
										<label>{field.name.charAt(0).toUpperCase() + field.name.slice(1)}</label>
										<input
											type={field.type}
											name={field.name}
											placeholder={field.placeholder}
											value={formData.productDetails[field.name] || ''}
											onChange={handleProductDetailChange}
											required
										/>
									</div>
								))}
							</div>
						</>
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