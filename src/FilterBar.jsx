import { useState } from 'react'
import { exportOrdersToPDF } from './PDFExport'

export default function FilterBar({ onFilterChange, filteredOrders, allOrders, productTypes, currentFilters }) {
	const [searchTerm, setSearchTerm] = useState('')
	const [dateFrom, setDateFrom] = useState('')
	const [dateTo, setDateTo] = useState('')
	const [status, setStatus] = useState('all')
	const [transactionType, setTransactionType] = useState('all')

	const handleSearchChange = e => {
		const value = e.target.value
		setSearchTerm(value)
		onFilterChange({ searchTerm: value, dateFrom, dateTo, status, transactionType })
	}

	const handleDateFromChange = e => {
		const value = e.target.value
		setDateFrom(value)
		onFilterChange({ searchTerm, dateFrom: value, dateTo, status, transactionType })
	}

	const handleDateToChange = e => {
		const value = e.target.value
		setDateTo(value)
		onFilterChange({ searchTerm, dateFrom, dateTo: value, status, transactionType })
	}

	const handleStatusChange = e => {
		const value = e.target.value
		setStatus(value)
		onFilterChange({ searchTerm, dateFrom, dateTo, status: value, transactionType })
	}

	const handleTransactionTypeChange = type => {
		setTransactionType(type)
		onFilterChange({ searchTerm, dateFrom, dateTo, status, transactionType: type })
	}

	const handleClearFilters = () => {
		setSearchTerm('')
		setDateFrom('')
		setDateTo('')
		setStatus('all')
		setTransactionType('all')
		onFilterChange({ searchTerm: '', dateFrom: '', dateTo: '', status: 'all', transactionType: 'all' })
	}

	const handleExportPDF = () => {
		console.log('🔍 Kliknięto eksport PDF')
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
							<option value='zrealizowane'>Zrealizowane</option>
							<option value='oplacone'>Opłacone</option>
							<option value='anulowane'>Anulowane</option>
						</select>
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
