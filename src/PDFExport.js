import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

// Funkcja do konwersji polskich znaków
const replacePolishChars = (text) => {
	if (!text) return text
	const polishChars = {
		'ą': 'a', 'ć': 'c', 'ę': 'e', 'ł': 'l', 'ń': 'n', 'ó': 'o', 'ś': 's', 'ź': 'z', 'ż': 'z',
		'Ą': 'A', 'Ć': 'C', 'Ę': 'E', 'Ł': 'L', 'Ń': 'N', 'Ó': 'O', 'Ś': 'S', 'Ź': 'Z', 'Ż': 'Z'
	}
	return text.replace(/[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/g, char => polishChars[char] || char)
}

export const exportOrdersToPDF = (orders, filters, productTypes) => {
	console.log('📄 Eksport PDF - Start')

	if (!orders || orders.length === 0) {
		alert('Brak zamówień do eksportu!')
		return
	}

	try {
		const doc = new jsPDF()

		// Nagłówek dokumentu
		doc.setFontSize(16)
		doc.setFont('helvetica', 'bold')
		doc.text(replacePolishChars('Raport zamówień'), 14, 15)

		// Informacje o filtrach - kompaktowo
		doc.setFontSize(8)
		doc.setFont('helvetica', 'normal')
		let yPos = 22

		const filterInfo = []
		if (filters.searchTerm) filterInfo.push(`Szukane: ${replacePolishChars(filters.searchTerm)}`)
		if (filters.status !== 'all') {
			const statusMap = { 'w-trakcie': 'W trakcie', 'zrealizowane': 'Zrealizowane', 'anulowane': 'Anulowane' }
			filterInfo.push(`Status: ${replacePolishChars(statusMap[filters.status])}`)
		}
		if (filters.transactionType !== 'all') {
			const typeMap = { 'sprzedaz': 'Sprzedaz', 'zakup': 'Zakup' }
			filterInfo.push(`Typ: ${replacePolishChars(typeMap[filters.transactionType])}`)
		}
		if (filters.dateFrom) filterInfo.push(`Od: ${filters.dateFrom}`)
		if (filters.dateTo) filterInfo.push(`Do: ${filters.dateTo}`)
		
		if (filterInfo.length > 0) {
			doc.text(filterInfo.join(' | '), 14, yPos)
			yPos += 5
		}

		// FILTRUJ - usuń anulowane
		const activeOrders = orders.filter(order => order.status !== 'anulowane')
		
		doc.text(`Data: ${new Date().toLocaleDateString('pl-PL')} | Zamowien: ${activeOrders.length}`, 14, yPos)
		yPos += 8

		const getCurrency = (order) => {
			if (order.currency) return order.currency
			const productType = productTypes?.find(pt => pt.name === order.type)
			return productType?.currency || 'PLN'
		}

		const getUnit = (order) => {
			if (order.unit) return order.unit
			const productType = productTypes?.find(pt => pt.name === order.type)
			return productType?.unit || 'szt'
		}

		const statusMap = {
			'w-trakcie': 'W trakcie',
			'zrealizowane': 'Zrealizowane'
		}

		const typeMap = {
			'sprzedaz': 'S',
			'zakup': 'Z'
		}

		// Główna tabela - kompaktowa
		const tableData = []
		
		activeOrders.forEach((order, index) => {
			// Wiersz główny
			tableData.push([
				`${index + 1}`,
				typeMap[order.transactionType] || 'S',
				replacePolishChars(order.type) || '-',
				replacePolishChars(order.client) || '-',
				`${order.quantity || 0} ${replacePolishChars(getUnit(order))}`,
				`${order.price || 0} ${getCurrency(order)}`,
				order.dateStart || '-',
				order.dateEnd || '-',
				statusMap[order.status]?.substring(0, 1) || '-'
			])

			// Wiersz ze szczegółami (jeśli są)
			if (order.productDetails && typeof order.productDetails === 'object' && Object.keys(order.productDetails).length > 0) {
				const details = Object.entries(order.productDetails)
					.map(([key, value]) => `${replacePolishChars(key)}: ${replacePolishChars(value)}`)
					.join(' | ')
				
				tableData.push([
					{ content: `Szczegoly: ${details}`, colSpan: 9, styles: { fontStyle: 'italic', fontSize: 7, textColor: [100, 100, 100] } }
				])
			}
		})

		// Generowanie głównej tabeli
		autoTable(doc, {
			head: [[replacePolishChars('#'), 'T', replacePolishChars('Produkt'), 'Firma', replacePolishChars('Ilosc'), 'Cena', 'Zamow.', replacePolishChars('Wysylka'), 'S']],
			body: tableData,
			startY: yPos,
			styles: {
				fontSize: 7,
				cellPadding: 1.5,
				lineWidth: 0.1,
				lineColor: [200, 200, 200]
			},
			headStyles: {
				fillColor: [148, 193, 30],
				textColor: [255, 255, 255],
				fontStyle: 'bold',
				fontSize: 7,
				cellPadding: 2
			},
			alternateRowStyles: {
				fillColor: [250, 250, 250]
			},
			columnStyles: {
				0: { cellWidth: 8 },   // #
				1: { cellWidth: 8 },   // Typ (S/Z)
				2: { cellWidth: 35 },  // Produkt
				3: { cellWidth: 35 },  // Firma
				4: { cellWidth: 22 },  // Ilość
				5: { cellWidth: 25 },  // Cena
				6: { cellWidth: 22 },  // Data zamówienia
				7: { cellWidth: 22 },  // Data wysyłki
				8: { cellWidth: 8 }    // Status (W/Z/A)
			},
			margin: { left: 14, right: 14, top: 10, bottom: 10 },
			didDrawPage: (data) => {
				// Stopka na każdej stronie
				doc.setFontSize(7)
				doc.setTextColor(150)
				doc.text(`Strona ${data.pageNumber}`, doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 10, { align: 'center' })
			}
		})

		// Podsumowanie - kompaktowe
		const finalY = doc.lastAutoTable.finalY + 5

		// Sprawdź czy jest miejsce, jeśli nie - nowa strona
		if (finalY > 250) {
			doc.addPage()
			yPos = 20
		} else {
			yPos = finalY
		}

		// Obliczenia sum
		const totalQuantity = activeOrders.reduce((sum, order) => sum + (parseInt(order.quantity) || 0), 0)
		
		const valuesByCurrency = activeOrders.reduce((acc, order) => {
			const price = parseFloat(order.price) || 0
			const quantity = parseInt(order.quantity) || 0
			const totalValue = price * quantity
			const currency = getCurrency(order)

			if (!acc[currency]) {
				acc[currency] = 0
			}
			acc[currency] += totalValue

			return acc
		}, {})

		// Linia separatora
		doc.setDrawColor(148, 193, 30)
		doc.setLineWidth(0.5)
		doc.line(14, yPos, 196, yPos)
		yPos += 5

		doc.setFontSize(10)
		doc.setFont('helvetica', 'bold')
		doc.setTextColor(0)
		doc.text('PODSUMOWANIE', 14, yPos)
		yPos += 6

		doc.setFontSize(9)
		doc.setFont('helvetica', 'normal')
		doc.text(replacePolishChars(`Liczba zamówień: ${activeOrders.length}`), 14, yPos)
		doc.text(replacePolishChars(`Laczna ilosc: ${totalQuantity}`), 80, yPos)
		yPos += 5

		Object.entries(valuesByCurrency).forEach(([currency, value]) => {
			doc.text(replacePolishChars(`Wartosc (${currency}): ${value.toFixed(2)} ${currency}`), 14, yPos)
			yPos += 4
		})

		// Legenda na końcu
		yPos += 3
		doc.setFontSize(7)
		doc.setTextColor(100)
		doc.text(replacePolishChars('Legenda: T - Typ (S=Sprzedaz, Z=Zakup) | S - Status (W=W trakcie, Z=Zrealizowane)'), 14, yPos)

		// Zapisz PDF
		const fileName = `zamowienia_${new Date().toISOString().split('T')[0]}.pdf`
		doc.save(fileName)
		
		console.log('✅ PDF wygenerowany pomyślnie!')
	} catch (error) {
		console.error('❌ Błąd podczas generowania PDF:', error)
		alert('Wystąpił błąd podczas generowania PDF: ' + error.message)
	}
}