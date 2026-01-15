export default function Pagination({ currentPage, totalPages, onPageChange, itemsPerPage, onItemsPerPageChange }) {
	const getPageNumbers = () => {
		const pages = []
		const maxVisiblePages = 5

		if (totalPages <= maxVisiblePages) {
			// Jeśli stron jest mało, pokaż wszystkie
			for (let i = 1; i <= totalPages; i++) {
				pages.push(i)
			}
		} else {
			// Zawsze pokaż pierwszą stronę
			pages.push(1)

			let startPage = Math.max(2, currentPage - 1)
			let endPage = Math.min(totalPages - 1, currentPage + 1)

			if (currentPage <= 3) {
				endPage = 4
			}

			if (currentPage >= totalPages - 2) {
				startPage = totalPages - 3
			}

			if (startPage > 2) {
				pages.push('...')
			}

			for (let i = startPage; i <= endPage; i++) {
				pages.push(i)
			}

			if (endPage < totalPages - 1) {
				pages.push('...')
			}

			// Zawsze pokaż ostatnią stronę
			pages.push(totalPages)
		}

		return pages
	}

	if (totalPages <= 1) return null

	return (
		<div className='pagination-container'>
			<div className='pagination-info'>
				<label htmlFor='items-per-page'>Wyświetl:</label>
				<select
					id='items-per-page'
					value={itemsPerPage}
					onChange={e => onItemsPerPageChange(Number(e.target.value))}
					className='items-per-page-select'>
					<option value={5}>5</option>
					<option value={10}>10</option>
					<option value={20}>20</option>
					<option value={50}>50</option>
				</select>
				<span>na stronę</span>
			</div>

			<div className='pagination-controls'>
				<button
					className='pagination-btn pagination-btn-prev'
					onClick={() => onPageChange(currentPage - 1)}
					disabled={currentPage === 1}>
					‹ Poprzednia
				</button>

				<div className='pagination-numbers'>
					{getPageNumbers().map((page, index) =>
						page === '...' ? (
							<span key={`ellipsis-${index}`} className='pagination-ellipsis'>
								...
							</span>
						) : (
							<button
								key={page}
								className={`pagination-number ${currentPage === page ? 'active' : ''}`}
								onClick={() => onPageChange(page)}>
								{page}
							</button>
						)
					)}
				</div>

				<button
					className='pagination-btn pagination-btn-next'
					onClick={() => onPageChange(currentPage + 1)}
					disabled={currentPage === totalPages}>
					Następna ›
				</button>
			</div>

			<div className='pagination-summary'>
				Strona {currentPage} z {totalPages}
			</div>
		</div>
	)
}
