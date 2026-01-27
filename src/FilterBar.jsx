import { useState } from 'react'
import { exportOrdersToPDF } from './PDFExport'

export default function FilterBar({ onFilterChange, filteredOrders, allOrders, productTypes, currentFilters }) {
	const [searchTerm, setSearchTerm] = useState('')
	const [dateFrom, setDateFrom] = useState('')
	const [dateTo, setDateTo] = useState('')
	const [dateType, setDateType] = useState('dateEnd') // ✅ NOWE - domyślnie data wysyłki
	const [status, setStatus] = useState('all')
	const [transactionType, setTransactionType] = useState('all')

	const handleSearchChange = e => {
		const value = e.target.value
		setSearchTerm(value)
		onFilterChange({ searchTerm: value, dateFrom, dateTo, dateType, status, transactionType })
	}

	const handleDateFromChange = e => {
		const value = e.target.value
		setDateFrom(value)
		onFilterChange({ searchTerm, dateFrom: value, dateTo, dateType, status, transactionType })
	}

	const handleDateToChange = e => {
		const value = e.target.value
		setDateTo(value)
		onFilterChange({ searchTerm, dateFrom, dateTo: value, dateType, status, transactionType })
	}

	// ✅ NOWA FUNKCJA - wybór typu daty
	const handleDateTypeChange = (type) => {
		setDateType(type)
		onFilterChange({ searchTerm, dateFrom, dateTo, dateType: type, status, transactionType })
	}

	const handleStatusChange = e => {
		const value = e.target.value
		setStatus(value)
		onFilterChange({ searchTerm, dateFrom, dateTo, dateType, status: value, transactionType })
	}

	const handleTransactionTypeChange = type => {
		setTransactionType(type)
		onFilterChange({ searchTerm, dateFrom, dateTo, dateType, status, transactionType: type })
	}

	const handleClearFilters = () => {
		setSearchTerm('')
		setDateFrom('')
		setDateTo('')
		setDateType('dateEnd') // ✅ Reset do domyślnej (wysyłka)
		setStatus('all')
		setTransactionType('all')
		onFilterChange({ searchTerm: '', dateFrom: '', dateTo: '', dateType: 'dateEnd', status: 'all', transactionType: 'all' })
	}

	const handleExportPDF = () => {
		console.log('📄 Kliknięto eksport PDF')
		console.log('Przefiltrowane zamówienia:', filteredOrders)
		console.log('Liczba:', filteredOrders.length)

		if (filteredOrders.length === 0) {
			alert('Brak zamówień do eksportu!')
			return
		}

		try {
			exportOrdersToPDF(filteredOrders, currentFilters, productTypes)
			console.log('✅ Funkcja exportOrdersToPDF wywołana')
		} catch (error) {
			console.error('❌ Błąd:', error)
			alert('Błąd: ' + error.message)
		}
	}

	return (
		<div className='filter-bar'>
			<div className='filter-container'>
				<div className='filter-header-row'>
					<h3 className='filter-title'>Filtruj zamówienia</h3>
					<button onClick={handleExportPDF} className='export-pdf-btn'>
						📄 Eksportuj do PDF ({filteredOrders.length})
					</button>
				</div>

				{/* Szybkie przyciski typ transakcji */}
				<div className='transaction-quick-filter'>
					<button
						type='button'
						className={`quick-filter-btn ${transactionType === 'all' ? 'active' : ''}`}
						onClick={() => handleTransactionTypeChange('all')}>
						📋 Wszystkie
					</button>
					<button
						type='button'
						className={`quick-filter-btn ${transactionType === 'sprzedaz' ? 'active' : ''}`}
						onClick={() => handleTransactionTypeChange('sprzedaz')}>
						📤 Sprzedaż
					</button>
					<button
						type='button'
						className={`quick-filter-btn ${transactionType === 'zakup' ? 'active' : ''}`}
						onClick={() => handleTransactionTypeChange('zakup')}>
						📥 Zakup
					</button>
				</div>

				<div className='filter-grid'>
					<div className='filter-item'>
						<label>Szukaj</label>
						<input
							type='text'
							placeholder='Szukaj po firmie, produkcie, parametrach...'
							value={searchTerm}
							onChange={handleSearchChange}
							className='filter-input'
						/>
					</div>

					<div className='filter-item'>
						<label>Status</label>
						<select value={status} onChange={handleStatusChange} className='filter-input filter-select'>
							<option value='all'>Wszystkie</option>
							<option value='w-trakcie'>W trakcie</option>
							<option value='wyprodukowane'>Wyprodukowane</option>
							<option value='zrealizowane'>Zrealizowane</option>
							<option value='oplacone'>Opłacone</option>
							<option value='anulowane'>Anulowane</option>
						</select>
					</div>

					{/* ✅ NOWA SEKCJA - Wybór typu daty */}
					<div className='filter-item filter-date-type' style={{ gridColumn: '1 / -1' }}>
						<label style={{ marginBottom: '8px', display: 'block', fontWeight: '600' }}>
							Filtruj według daty:
						</label>
						<div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
							<label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: 'normal' }}>
								<input
									type='radio'
									name='dateType'
									value='dateStart'
									checked={dateType === 'dateStart'}
									onChange={() => handleDateTypeChange('dateStart')}
									style={{ cursor: 'pointer', width: '16px', height: '16px' }}
								/>
								<span>📅 Data zamówienia</span>
							</label>
							<label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: 'normal' }}>
								<input
									type='radio'
									name='dateType'
									value='dateEnd'
									checked={dateType === 'dateEnd'}
									onChange={() => handleDateTypeChange('dateEnd')}
									style={{ cursor: 'pointer', width: '16px', height: '16px' }}
								/>
								<span>🚚 Data wysyłki</span>
							</label>
						</div>
					</div>

					<div className='filter-item'>
						<label>Data od</label>
						<input type='date' value={dateFrom} onChange={handleDateFromChange} className='filter-input' />
					</div>

					<div className='filter-item'>
						<label>Data do</label>
						<input type='date' value={dateTo} onChange={handleDateToChange} className='filter-input' />
					</div>

					<div className='filter-item filter-button-container'>
						<button onClick={handleClearFilters} className='clear-filters-btn'>
							Wyczyść filtry
						</button>
					</div>
				</div>
			</div>
		</div>
	)
}