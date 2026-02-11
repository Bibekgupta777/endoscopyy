const html_to_pdf = require('html-pdf-node');

const generateReportPDF = async (reportData, settings) => {
    // Basic HTML template for the report
    let options = { format: 'A4' };
    let file = { content: `
        <html>
            <head>
                <style>
                    body { font-family: sans-serif; padding: 20px; }
                    .header { text-align: center; border-bottom: 2px solid #000; }
                    .patient-info { display: flex; justify-content: space-between; margin: 20px 0; }
                    .image-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
                    .image-item img { width: 100%; border: 1px solid #ccc; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>${settings.hospitalName}</h1>
                    <p>${settings.hospitalAddress}</p>
                </div>
                <div class="patient-info">
                    <div>Patient: ${reportData.patient.name}</div>
                    <div>ID: ${reportData.patient.patientId}</div>
                    <div>Date: ${new Date(reportData.procedureDate).toLocaleDateString()}</div>
                </div>
                <h3>Findings</h3>
                <p>${reportData.comments || 'No comments'}</p>
                
                <div class="image-grid">
                    ${reportData.images.filter(img => img.isSelected).map(img => `
                        <div class="image-item">
                            <img src="http://localhost:5000/${img.path}" />
                            <p>${img.caption || ''}</p>
                        </div>
                    `).join('')}
                </div>
            </body>
        </html>
    `};

    return await html_to_pdf.generatePdf(file, options);
};

module.exports = generateReportPDF;