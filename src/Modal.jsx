export default function Modal({ isOpen, onClose, onConfirm, message }) {
	if (!isOpen) return null

	return (
		<div className='modal-overlay' onClick={onClose}>
			<div className='modal-content' onClick={e => e.stopPropagation()}>
				<h3 className='modal-title'>Potwierdź usunięcie</h3>
				<p className='modal-message'>{message}</p>
				<div className='modal-buttons'>
					<button className='modal-btn-cancel' onClick={onClose}>
						Anuluj
					</button>
					<button className='modal-btn-confirm' onClick={onConfirm}>
						Usuń
					</button>
				</div>
			</div>
		</div>
	)
}
