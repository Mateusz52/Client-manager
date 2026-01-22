import { useState, useEffect } from 'react'

/**
 * Hook zarządzający wyświetlaniem feedbacku
 * - Pierwsze pokazanie: po 10 zamówieniach
 * - Następne: co 20 zamówień (30, 50, 70...)
 */
export function useFeedbackTrigger(ordersCount) {
	const [shouldShowFeedback, setShouldShowFeedback] = useState(false)

	useEffect(() => {
		// Sprawdź czy użytkownik wyłączył feedback
		const neverShow = localStorage.getItem('feedbackNeverShow')
		if (neverShow === 'true') {
			return
		}

		// Pobierz liczbę razy kiedy pokazano feedback
		const timesShown = parseInt(localStorage.getItem('feedbackTimesShown') || '0', 10)
		
		// Pobierz ostatnią liczbę zamówień przy której pokazano feedback
		const lastOrderCount = parseInt(localStorage.getItem('feedbackLastOrderCount') || '0', 10)

		// Oblicz próg dla następnego pokazania
		let threshold
		if (timesShown === 0) {
			// Pierwsze pokazanie - po 10 zamówieniach
			threshold = 10
		} else {
			// Kolejne pokazania - co 20 zamówień od ostatniego pokazania
			threshold = lastOrderCount + 20
		}

		// Pokaż feedback jeśli przekroczono próg
		if (ordersCount >= threshold && ordersCount > lastOrderCount) {
			// Małe opóźnienie żeby nie wyskakiwało od razu
			const timer = setTimeout(() => {
				setShouldShowFeedback(true)
			}, 2000)

			return () => clearTimeout(timer)
		}
	}, [ordersCount])

	const handleFeedbackSubmitted = () => {
		// Zwiększ licznik pokazań
		const timesShown = parseInt(localStorage.getItem('feedbackTimesShown') || '0', 10)
		localStorage.setItem('feedbackTimesShown', (timesShown + 1).toString())
		
		// Zapisz liczbę zamówień przy której pokazano
		localStorage.setItem('feedbackLastOrderCount', ordersCount.toString())
		
		setShouldShowFeedback(false)
	}

	const handleRemindLater = () => {
		// Przypomnij za ~10 zamówień
		// Ustawiamy lastOrderCount tak, żeby za 20 zamówień od teraz było przypomnienie
		const fakeLastCount = ordersCount - 10
		localStorage.setItem('feedbackLastOrderCount', fakeLastCount.toString())
		
		setShouldShowFeedback(false)
	}

	const handleNeverShow = () => {
		localStorage.setItem('feedbackNeverShow', 'true')
		setShouldShowFeedback(false)
	}

	const handleFeedbackClosed = () => {
		setShouldShowFeedback(false)
	}

	return {
		shouldShowFeedback,
		handleFeedbackSubmitted,
		handleFeedbackClosed,
		handleRemindLater,
		handleNeverShow
	}
}