import { useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { useAlert } from './AlertProvider'
import { db } from './firebase'
import { collection, addDoc, deleteDoc, doc, onSnapshot, updateDoc } from 'firebase/firestore'

export default function ProductConfigurator({ isOpen, onClose }) {
	const { currentUser, organizationId } = useAuth()
	const { alert, confirm, success, error } = useAlert()
	
	const [products, setProducts] = useState([])
	const [step, setStep] = useState('list')
	const [editingProductId, setEditingProductId] = useState(null)
	const [newProduct, setNewProduct] = useState({
		name: '',
		currency: 'PLN',
		unit: 'szt',
		fields: [],
	})

	const currencies = [
		{ code: 'PLN', symbol: 'zł', name: 'Polski złoty' },
		{ code: 'EUR', symbol: '€', name: 'Euro' },
		{ code: 'USD', symbol: '$', name: 'Dolar amerykański' },
		{ code: 'GBP', symbol: '£', name: 'Funt brytyjski' },
		{ code: 'CZK', symbol: 'Kč', name: 'Korona czeska' },
	]

	const units = [
		{ code: 'szt', name: 'Sztuki' },
		{ code: 'm3', name: 'Metry sześcienne (m³)' },
		{ code: 'm2', name: 'Metry kwadratowe (m²)' },
		{ code: 'm', name: 'Metry (m)' },
		{ code: 'l', name: 'Litry (l)' },
		{ code: 'kg', name: 'Kilogramy (kg)' },
		{ code: 't', name: 'Tony (t)' },
	]

	useEffect(() => {
		if (!currentUser || !organizationId) return

		const productsRef = collection(db, 'organizations', organizationId, 'productTypes')
		const unsubscribe = onSnapshot(productsRef, snapshot => {
			const productsData = snapshot.docs.map(doc => ({
				id: doc.id,
				...doc.data(),
			}))
			setProducts(productsData)
		})

		return () => unsubscribe()
	}, [currentUser, organizationId])

	const templates = {
		paleta: {
			name: 'Paleta',
			icon: '🪵',
			description: 'Standardowa paleta drewniana',
			currency: 'PLN',
			unit: 'szt',
			fields: [
				{ name: 'Wymiary', type: 'text' },
				{ name: 'Rodzaj drewna', type: 'text' },
				{ name: 'Cena za sztukę', type: 'text' },
			],
		},
		deska: {
			name: 'Deska paletowa',
			icon: '📏',
			description: 'Pojedyncza deska do palet',
			currency: 'PLN',
			unit: 'szt',
			fields: [
				{ name: 'Długość', type: 'text' },
				{ name: 'Szerokość', type: 'text' },
				{ name: 'Grubość', type: 'text' },
				{ name: 'Rodzaj drewna', type: 'text' },
				{ name: 'Cena za sztukę', type: 'text' },
			],
		},
	}

	const handleSelectTemplate = templateKey => {
		setNewProduct(templates[templateKey])
		setStep('custom')
	}

	const handleEditProduct = product => {
		setEditingProductId(product.id)
		setNewProduct({
			name: product.name,
			currency: product.currency || 'PLN',
			unit: product.unit || 'szt',
			fields: product.fields,
		})
		setStep('custom')
	}

	const handleSaveProduct = async () => {
		if (!currentUser || !organizationId) return

		// Walidacja
		if (!newProduct.name) {
			error('Produkt musi mieć nazwę!', 'Brak nazwy')
			return
		}

		if (newProduct.fields.length === 0) {
			error('Dodaj przynajmniej jedno pole!', 'Brak pól')
			return
		}

		// Sprawdź czy wszystkie pola mają nazwy
		for (let field of newProduct.fields) {
			if (!field.name) {
				error('Każdy parametr musi mieć nazwę!', 'Puste pole')
				return
			}
		}

		try {
			if (editingProductId) {
				// Aktualizacja istniejącego produktu
				const productRef = doc(db, 'organizations', organizationId, 'productTypes', editingProductId)
				await updateDoc(productRef, {
					name: newProduct.name,
					currency: newProduct.currency,
					unit: newProduct.unit,
					fields: newProduct.fields,
					updatedAt: new Date().toISOString(),
				})
				success('Produkt został zaktualizowany!')
			} else {
				// Dodanie nowego produktu
				const productsRef = collection(db, 'organizations', organizationId, 'productTypes')
				await addDoc(productsRef, {
					...newProduct,
					createdAt: new Date().toISOString(),
				})
				success('Produkt został dodany!')
			}

			// Reset
			setNewProduct({ name: '', currency: 'PLN', unit: 'szt', fields: [] })
			setEditingProductId(null)
			setStep('list')
		} catch (err) {
			console.error('Error saving product:', err)
			error('Nie udało się zapisać produktu.', 'Błąd zapisu')
		}
	}

	const handleDeleteProduct = async productId => {
		if (!currentUser || !organizationId) return
		
		confirm(
			'Czy na pewno chcesz usunąć ten produkt?\n\nWszystkie zamówienia korzystające z tego produktu stracą informacje o typie.',
			async () => {
				try {
					const productRef = doc(db, 'organizations', organizationId, 'productTypes', productId)
					await deleteDoc(productRef)
					success('Produkt został usunięty!')
				} catch (err) {
					console.error('Error deleting product:', err)
					error('Nie udało się usunąć produktu.', 'Błąd usuwania')
				}
			},
			'Usuń produkt'
		)
	}

	const handleBack = () => {
		setStep('list')
		setNewProduct({ name: '', currency: 'PLN', unit: 'szt', fields: [] })
		setEditingProductId(null)
	}

	const getCurrencySymbol = code => {
		const currency = currencies.find(c => c.code === code)
		return currency ? currency.symbol : code
	}

	if (!isOpen) return null

	return (
		<>
			<div className='configurator-overlay' onClick={onClose}></div>
			<div className={`configurator-panel ${isOpen ? 'open' : ''}`}>
				<div className='configurator-header'>
					<h2 className='configurator-title'>
						{step === 'list' && '📦 Twoje produkty'}
						{step === 'template' && '✨ Wybierz szablon'}
						{step === 'custom' && (editingProductId ? '✏️ Edytuj produkt' : '✏️ Nowy produkt')}
					</h2>
					<button className='close-configurator-btn' onClick={onClose}>
						✕
					</button>
				</div>

				<div className='configurator-content'>
					{/* KROK 1: Lista produktów */}
					{step === 'list' && (
						<>
							<div className='info-box'>
								<p>
									💡 <strong>Jak to działa?</strong>
								</p>
								<p>
									Dodaj typy produktów, którym operujesz. Każdy produkt może mieć swoje unikalne parametry (np.
									wymiary, rodzaj drewna, cena).
								</p>
							</div>

							<button className='big-action-btn' onClick={() => setStep('template')}>
								➕ Dodaj nowy produkt
							</button>

							{products.length === 0 ? (
								<div className='empty-state'>
									<div className='empty-icon'>📭</div>
									<h3>Brak produktów</h3>
									<p>Kliknij przycisk powyżej, aby dodać pierwszy produkt</p>
								</div>
							) : (
								<div className='products-simple-list'>
									{products.map(product => (
										<div key={product.id} className='product-simple-card'>
											<div className='product-simple-header'>
												<div>
													<h3>{product.name}</h3>
													<div className='product-badges'>
														<span className='currency-badge'>
															{getCurrencySymbol(product.currency || 'PLN')} {product.currency || 'PLN'}
														</span>
														<span className='unit-badge'>{product.unit || 'szt'}</span>
													</div>
												</div>
												<div className='product-actions'>
													<button
														className='edit-simple-btn'
														onClick={() => handleEditProduct(product)}
														title='Edytuj produkt'>
														✏️
													</button>
													<button
														className='delete-simple-btn'
														onClick={() => handleDeleteProduct(product.id)}
														title='Usuń produkt'>
														🗑️
													</button>
												</div>
											</div>
											<div className='product-simple-fields'>
												{product.fields.map((field, index) => (
													<div key={index} className='field-badge'>
														{field.name}
													</div>
												))}
											</div>
										</div>
									))}
								</div>
							)}
						</>
					)}

					{/* KROK 2: Wybór szablonu */}
					{step === 'template' && (
						<>
							<button className='back-btn' onClick={handleBack}>
								← Wróć
							</button>

							<div className='info-box'>
								<p>Wybierz gotowy szablon lub stwórz własny produkt</p>
							</div>

							<div className='templates-grid'>
								{Object.keys(templates).map(key => (
									<div key={key} className='template-card' onClick={() => handleSelectTemplate(key)}>
										<div className='template-icon'>{templates[key].icon}</div>
										<h3>{templates[key].name}</h3>
										<p>{templates[key].description}</p>
										<div className='template-fields-preview'>{templates[key].fields.length} pól do wypełnienia</div>
									</div>
								))}
							</div>

							<div className='divider'>
								<span>lub</span>
							</div>

							<button
								className='secondary-btn'
								onClick={() => {
									setNewProduct({
										name: '',
										currency: 'PLN',
										unit: 'szt',
										fields: [{ name: '', type: 'text' }],
									})
									setStep('custom')
								}}>
								✏️ Stwórz własny produkt
							</button>
						</>
					)}

					{/* KROK 3: Edycja produktu */}
					{step === 'custom' && (
						<>
							<button className='back-btn' onClick={handleBack}>
								← Wróć
							</button>

							<div className='custom-form'>
								<div className='form-section'>
									<label className='form-label'>
										Nazwa produktu
										<span className='required'>*</span>
									</label>
									<input
										type='text'
										className='form-input'
										placeholder='np. Paleta EUR, Deska 120cm'
										value={newProduct.name}
										onChange={e => setNewProduct(prev => ({ ...prev, name: e.target.value }))}
									/>
								</div>

								<div className='form-section'>
									<label className='form-label'>
										Waluta cenowa
										<span className='hint'>Wybierz walutę, w której będziesz podawać ceny</span>
									</label>
									<select
										className='currency-select'
										value={newProduct.currency}
										onChange={e => setNewProduct(prev => ({ ...prev, currency: e.target.value }))}>
										{currencies.map(currency => (
											<option key={currency.code} value={currency.code}>
												{currency.symbol} {currency.code} - {currency.name}
											</option>
										))}
									</select>
								</div>

								<div className='form-section'>
									<label className='form-label'>
										Jednostka miary
										<span className='hint'>W jakiej jednostce będziesz zamawiać ten produkt?</span>
									</label>
									<select
										className='currency-select'
										value={newProduct.unit}
										onChange={e => setNewProduct(prev => ({ ...prev, unit: e.target.value }))}>
										{units.map(unit => (
											<option key={unit.code} value={unit.code}>
												{unit.code} - {unit.name}
											</option>
										))}
									</select>
								</div>

								<div className='form-section'>
									<label className='form-label'>
										Parametry produktu
										<span className='hint'>Jakie informacje chcesz zbierać dla tego produktu?</span>
									</label>

									{newProduct.fields.map((field, index) => (
										<div key={index} className='param-edit-row'>
											<div className='param-number'>{index + 1}</div>
											<div className='param-inputs'>
												<input
													type='text'
													className='param-name-input'
													placeholder='Nazwa parametru (np. Wymiary, Rodzaj drewna, Cena)'
													value={field.name}
													onChange={e => {
														const updatedFields = [...newProduct.fields]
														updatedFields[index].name = e.target.value
														setNewProduct(prev => ({ ...prev, fields: updatedFields }))
													}}
												/>
											</div>
											{newProduct.fields.length > 1 && (
												<button
													className='remove-param-btn'
													onClick={() => {
														const updatedFields = newProduct.fields.filter((_, i) => i !== index)
														setNewProduct(prev => ({ ...prev, fields: updatedFields }))
													}}
													title='Usuń parametr'>
													🗑️
												</button>
											)}
										</div>
									))}

									<button
										className='add-param-btn'
										onClick={() => {
											setNewProduct(prev => ({
												...prev,
												fields: [...prev.fields, { name: '', type: 'text' }],
											}))
										}}>
										➕ Dodaj kolejny parametr
									</button>
								</div>

								<button className='big-action-btn save-btn' onClick={handleSaveProduct}>
									{editingProductId ? '✓ Zapisz zmiany' : '✓ Zapisz produkt'}
								</button>
							</div>
						</>
					)}
				</div>
			</div>
		</>
	)
}