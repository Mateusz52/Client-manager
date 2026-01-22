import { useState } from 'react'
import { storage } from './firebase'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { showToast } from './simpleAlerts'
import './file-upload.css'

export default function FileUpload({ files = [], onFilesChange, disabled = false }) {
	const [uploading, setUploading] = useState(false)
	const [uploadProgress, setUploadProgress] = useState({})

	const MAX_FILES = 10
	const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
	const UPLOAD_TIMEOUT = 30000 // 30 sekund timeout

	const handleFileSelect = async (e) => {
		const selectedFiles = Array.from(e.target.files)
		
		if (files.length + selectedFiles.length > MAX_FILES) {
			showToast(`Możesz dodać maksymalnie ${MAX_FILES} plików`, 'error')
			return
		}

		// Sprawdź rozmiar plików
		const oversizedFiles = selectedFiles.filter(file => file.size > MAX_FILE_SIZE)
		if (oversizedFiles.length > 0) {
			showToast(`Niektóre pliki są za duże (max 10MB)`, 'error')
			return
		}

		setUploading(true)

		try {
			// Sprawdź czy Storage jest dostępny
			if (!storage) {
				throw new Error('Firebase Storage nie jest skonfigurowany')
			}

			const uploadedFiles = []

			for (let i = 0; i < selectedFiles.length; i++) {
				const file = selectedFiles[i]
				const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
				
				console.log(`📤 Przesyłanie: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`)
				
				setUploadProgress(prev => ({ ...prev, [file.name]: 0 }))

				try {
					const storageRef = ref(storage, `attachments/${fileName}`)

					// Upload z timeoutem
					const uploadPromise = uploadBytes(storageRef, file)
					const timeoutPromise = new Promise((_, reject) => 
						setTimeout(() => reject(new Error('Timeout')), UPLOAD_TIMEOUT)
					)

					await Promise.race([uploadPromise, timeoutPromise])
					
					setUploadProgress(prev => ({ ...prev, [file.name]: 50 }))
					
					const url = await getDownloadURL(storageRef)
					
					uploadedFiles.push({
						name: file.name,
						url: url,
						type: file.type,
						size: file.size,
						uploadedAt: new Date().toISOString(),
						storagePath: `attachments/${fileName}`
					})

					setUploadProgress(prev => ({ ...prev, [file.name]: 100 }))
					console.log(`✅ Przesłano: ${file.name}`)
				} catch (error) {
					console.error(`❌ Błąd przesyłania ${file.name}:`, error)
					
					if (error.message === 'Timeout') {
						showToast(`Przekroczono limit czasu dla: ${file.name}`, 'error')
					} else if (error.code === 'storage/unauthorized') {
						showToast('Brak uprawnień - włącz Firebase Storage w konsoli', 'error')
						throw new Error('Storage nie włączony')
					} else {
						showToast(`Błąd przesyłania: ${file.name}`, 'error')
					}
				}
			}

			if (uploadedFiles.length > 0) {
				onFilesChange([...files, ...uploadedFiles])
				showToast(`Przesłano ${uploadedFiles.length} plik(ów)`, 'success')
			}
			
			// Reset input
			e.target.value = ''
		} catch (error) {
			console.error('❌ Błąd uploadu:', error)
			
			if (error.message.includes('Storage nie')) {
				showToast('⚠️ Firebase Storage nie jest włączony! Sprawdź instrukcję.', 'error')
			} else {
				showToast('Błąd podczas przesyłania plików', 'error')
			}
		} finally {
			setUploading(false)
			setUploadProgress({})
		}
	}

	const handleRemoveFile = async (index) => {
		const fileToRemove = files[index]
		
		try {
			// Usuń z Firebase Storage
			if (fileToRemove.storagePath) {
				const storageRef = ref(storage, fileToRemove.storagePath)
				await deleteObject(storageRef)
			}

			// Usuń z listy
			const newFiles = files.filter((_, i) => i !== index)
			onFilesChange(newFiles)
			showToast('Plik usunięty', 'success')
		} catch (error) {
			console.error('❌ Błąd usuwania:', error)
			showToast('Błąd podczas usuwania pliku', 'error')
		}
	}

	const formatFileSize = (bytes) => {
		if (bytes === 0) return '0 B'
		const k = 1024
		const sizes = ['B', 'KB', 'MB']
		const i = Math.floor(Math.log(bytes) / Math.log(k))
		return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
	}

	const getFileIcon = (type) => {
		if (type.startsWith('image/')) return '🖼️'
		if (type === 'application/pdf') return '📄'
		if (type.includes('word') || type.includes('document')) return '📝'
		if (type.includes('excel') || type.includes('spreadsheet')) return '📊'
		return '📎'
	}

	const isImage = (type) => type.startsWith('image/')

	return (
		<div className='file-upload-section'>
			<div className='file-upload-header'>
				<h3 className='file-upload-title'>
					📎 Załączniki
				</h3>
				<div className='file-upload-actions'>
					<span className='file-upload-counter'>
						{files.length} / {MAX_FILES}
					</span>
					{files.length < MAX_FILES && !disabled && (
						<label className='file-upload-button-mini'>
							<input
								type='file'
								multiple
								onChange={handleFileSelect}
								disabled={uploading}
								accept='image/*,.pdf,.doc,.docx,.xls,.xlsx'
								style={{ display: 'none' }}
							/>
							<span className='file-upload-icon'>📎</span>
							<span className='file-upload-text'>
								{uploading ? 'Przesyłanie...' : 'Dodaj'}
							</span>
						</label>
					)}
				</div>
			</div>

			{files.length === 0 && !uploading && (
				<p className='file-upload-hint-empty'>
					Zdjęcia, faktury, dokumenty (max 10MB)
				</p>
			)}

			{/* Progress */}
			{uploading && Object.keys(uploadProgress).length > 0 && (
				<div className='file-upload-progress'>
					{Object.entries(uploadProgress).map(([name, progress]) => (
						<div key={name} className='progress-item'>
							<span className='progress-name'>{name}</span>
							<div className='progress-bar'>
								<div 
									className='progress-fill' 
									style={{ width: `${progress}%` }}
								/>
							</div>
						</div>
					))}
				</div>
			)}

			{/* Files List - KOMPAKTOWA */}
			{files.length > 0 && (
				<div className='files-grid'>
					{files.map((file, index) => (
						<div key={index} className='file-item-compact'>
							{isImage(file.type) ? (
								<div className='file-preview-compact'>
									<img src={file.url} alt={file.name} />
								</div>
							) : (
								<div className='file-icon-compact'>
									{getFileIcon(file.type)}
								</div>
							)}
							
							<div className='file-info-compact'>
								<div className='file-name-compact'>{file.name}</div>
								<div className='file-meta-compact'>
									{formatFileSize(file.size)}
								</div>
							</div>

							<div className='file-actions-compact'>
								<a 
									href={file.url} 
									target='_blank' 
									rel='noopener noreferrer'
									className='file-action-btn-compact download-btn'
									title='Pobierz'
								>
									⬇️
								</a>
								{!disabled && (
									<button
										type='button'
										onClick={() => handleRemoveFile(index)}
										className='file-action-btn-compact remove-btn'
										title='Usuń'
									>
										🗑️
									</button>
								)}
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	)
}