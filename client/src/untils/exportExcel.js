//================================
// Export Excel (CSV)
//================================

export const exportToCSV = (filename, headers, dataRows) => {
    if (!dataRows || !dataRows.length) {
        alert('Tidak ada data yang dapat diexport!')
        return;
    }
    //1. Baris Header
    let csvContent = headers.join(',') + '\n'
    //2. Baris Data
    dataRows.forEach(row => {
        const formattedRow = row.map(field => {
            if (field === null || field === undefined) return '""'
            const stringField = String(field).replace(/"/g, '""')
            return `"${stringField}"`
        })
        csvContent += formattedRow.join(',') + '\n'
    });
    //3.Byte Order Mark
    const blob = new Blob(['\\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)

    //4. Trigger Unduh Otomatis
    const link = document.createElement('a');
    link.setAttribute('href', url)
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click();
    document.body.removeChild(link)
}