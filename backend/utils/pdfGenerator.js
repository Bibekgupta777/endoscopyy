const html_to_pdf = require('html-pdf-node');
const fs = require('fs');
const path = require('path');

// Safe folder name
const sanitizeFolderName = (name) => {
  if (!name || typeof name !== 'string') return 'Unknown';
  return name.replace(/[<>:"/\\|?*]/g, '_').replace(/\s+/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '').substring(0, 100) || 'Unknown';
};

// Base64 converter for local files
const getBase64Image = (imagePath) => {
  try {
    if (!imagePath) return '';
    const projectRoot = path.join(__dirname, '..');
    const absolutePath = path.join(projectRoot, imagePath.replace(/^\//, '').replace(/^uploads\//, ''));
    
    // Look in uploads or uploads/endoscopy-images
    const pathsToTry = [
      absolutePath,
      path.join(projectRoot, 'uploads', absolutePath),
      path.join(projectRoot, 'uploads', 'endoscopy-images', path.basename(absolutePath))
    ];

    for (const p of pathsToTry) {
      if (fs.existsSync(p)) {
        const bitmap = fs.readFileSync(p);
        const ext = path.extname(p).toLowerCase();
        const mimeType = ext === '.png' ? 'image/png' : 'image/jpeg';
        return `data:${mimeType};base64,${bitmap.toString('base64')}`;
      }
    }
  } catch (err) {
    console.error('⚠️ Could not convert image to base64:', err.message);
  }
  return null;
};

// Date formatter
const formatDate = (dateStr) => {
  try {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-');
  } catch (e) { return 'Invalid date'; }
};

// Findings Value Renderer (Red if not normal)
const renderVal = (val) => {
  if (!val || typeof val !== 'string') return '';
  const isAbnormal = val.toLowerCase().trim() !== 'normal';
  return `<span style="font-weight: 700; ${isAbnormal ? 'color: #dc2626;' : 'color: #111827;'}">${val}</span>`;
};

// Image Card HTML Component
const renderImageCard = (src, caption) => `
  <div style="border: 2px solid #1f2937; background: white; border-radius: 2px; display: flex; flex-direction: column; overflow: hidden; width: 100%; box-sizing: border-box; page-break-inside: avoid;">
    <div style="background: black; width: 100%; height: 140px; overflow: hidden;">
      <img src="${src}" style="width: 100%; height: 100%; object-fit: cover;" />
    </div>
    <div style="height: 20px; font-size: 10px; color: #111827; text-align: center; font-weight: bold; display: flex; align-items: center; justify-content: center; border-top: 2px solid #1f2937; background: #f9fafb; overflow: hidden;">
      <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; padding: 0 4px;">${caption || '&nbsp;'}</span>
    </div>
  </div>
`;

const generateReportPDF = async (reportData, settings, options = {}) => {
  try {
    let pdfOptions = { 
      format: 'A4',
      margin: { top: '5mm', right: '15mm', bottom: '9mm', left: '15mm' }, // Mimicking your frontend print margins
      args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    };
    
    const serverUrl = options.serverUrl || 'http://localhost:5000';

    // 1. Process Findings (Exact same logic as your React component)
    let sf = { 
      oralCavity: '', oesophagus: { upper: '', middle: '', lowerGE: '' },
      stomach: { fundus: '', body: '', antrum: '', pRing: '' },
      duodenum: { bulb: '', d2: '', papilla: '' }, comments: ''
    };

    if (typeof reportData.customImpression === 'string' && reportData.customImpression.startsWith('{')) {
      try { sf = JSON.parse(reportData.customImpression); } catch (e) {}
    } else if (reportData.structuredFindings) {
      sf = reportData.structuredFindings;
    }

    // 2. Process Images (Filter selected, split into right (3) and bottom (4))
    const selectedImages = (Array.isArray(reportData.images) ? reportData.images.filter(img => img && img.isSelected !== false) : []).slice(0, 7);
    
    const processedImages = selectedImages.map(img => {
      const imgPath = typeof img === 'string' ? img : (img.path || '');
      const base64Src = getBase64Image(imgPath);
      const fullUrl = base64Src || (imgPath.startsWith('http') ? imgPath : `${serverUrl}/${imgPath}`);
      const caption = typeof img === 'string' ? '' : (img.caption || img.taggedOrgan || '');
      return { url: fullUrl, caption };
    });

    const rightImages = processedImages.slice(0, 3);
    const bottomImages = processedImages.slice(3, 7);

    // 3. Process Header Logos & Signatures
    const logoSrc = settings?.hospitalLogo ? (getBase64Image(settings.hospitalLogo) || `${serverUrl}/${settings.hospitalLogo}`) : '';
    const sigSrc = reportData.performingDoctor?.signature ? (getBase64Image(reportData.performingDoctor.signature) || `${serverUrl}/${reportData.performingDoctor.signature}`) : '';

    // ──────────────────────────────────────────────────────────
    // GENERATE EXACT REACT-TO-HTML MAPPING
    // ──────────────────────────────────────────────────────────
    let file = {
      content: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; margin: 0; padding: 0; background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              * { box-sizing: border-box; }
            </style>
          </head>
          <body>
            <div style="width: 100%; display: flex; flex-direction: column; min-height: 100vh;">
              
              <!-- HOSPITAL HEADER -->
              <div style="text-align: center; padding-bottom: 8px;">
                <div style="display: flex; align-items: center; justify-content: center; gap: 12px; margin-bottom: 4px;">
                  ${logoSrc ? `<img src="${logoSrc}" style="height: 56px; width: auto; object-fit: contain;" />` : ''}
                  <div>
                    <h1 style="font-size: 25px; font-weight: 900; color: #1e3a8a; text-transform: uppercase; margin: 0; letter-spacing: -0.5px;">
                      ${settings?.hospitalName || 'Hospital Name'}
                    </h1>
                  </div>
                </div>
                <p style="font-size: 10px; color: #4b5563; font-weight: 500; margin: 0; max-width: 85%; margin-left: auto; margin-right: auto;">
                  ${settings?.hospitalAddress || ''}
                </p>
                <p style="font-size: 11px; font-weight: 700; color: #374151; margin: 2px 0 0 0; letter-spacing: 0.5px;">
                  Ph: ${settings?.hospitalPhone || ''} 
                  ${settings?.hospitalEmail ? `<span style="margin-left: 12px;">Email: ${settings.hospitalEmail}</span>` : ''}
                </p>

                <!-- Gradient Lines -->
                <div style="display: flex; align-items: center; gap: 8px; margin: 6px 0 4px 0;">
                  <div style="flex: 1; height: 1px; background: linear-gradient(to right, transparent, #93c5fd, #2563eb);"></div>
                  <div style="flex: 1; height: 1px; background: linear-gradient(to left, transparent, #93c5fd, #2563eb);"></div>
                </div>

                <!-- Badge -->
                <div style="display: inline-block; margin-top: 2px;">
                  <div style="background: linear-gradient(to right, #1e40af, #1e3a8a, #1e40af); color: white; padding: 4px 32px; border-radius: 6px;">
                    <span style="font-size: 14px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.25em;">Endoscopy Unit</span>
                  </div>
                </div>
              </div>

              <!-- PATIENT INFO (60/40 Split) -->
              <div style="margin-top: 8px; margin-bottom: 16px;">
                <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 8px 12px;">
                  <div style="display: flex; width: 100%;">
                    
                    <!-- Left Col (60%) -->
                    <div style="width: 60%; display: flex; flex-direction: column; padding-right: 16px; border-right: 1px solid rgba(229, 231, 235, 0.6);">
                      <div style="border-bottom: 1px solid #e5e7eb; padding-bottom: 2px;">
                        <span style="font-weight: 700; color: #6b7280; font-size: 11px; text-transform: uppercase;">Patient ID: </span>
                        <span style="color: #111827; font-weight: 700; font-size: 12px;">${reportData.opdIpdNumber || '-'}</span>
                      </div>
                      <div style="border-bottom: 1px solid #e5e7eb; padding-bottom: 2px; padding-top: 4px;">
                        <span style="font-weight: 700; color: #6b7280; font-size: 11px; text-transform: uppercase;">Name: </span>
                        <span style="color: #111827; font-weight: 900; font-size: 12px; text-transform: uppercase;">${reportData.patient?.name || '-'}</span>
                      </div>
                      <div style="border-bottom: 1px solid #e5e7eb; padding-bottom: 2px; padding-top: 4px;">
                        <span style="font-weight: 700; color: #6b7280; font-size: 11px; text-transform: uppercase;">Age: </span>
                        <span style="color: #111827; font-weight: 700; font-size: 12px;">${reportData.patient?.age ? `${reportData.patient.age} Y` : '-'}</span>
                      </div>
                      <div style="border-bottom: 1px solid #e5e7eb; padding-bottom: 2px; padding-top: 4px;">
                        <span style="font-weight: 700; color: #6b7280; font-size: 11px; text-transform: uppercase;">Sex: </span>
                        <span style="color: #111827; font-weight: 700; font-size: 12px;">${reportData.patient?.sex || '-'}</span>
                      </div>
                      <div style="padding-bottom: 2px; padding-top: 4px;">
                        <span style="font-weight: 700; color: #6b7280; font-size: 11px; text-transform: uppercase;">Date: </span>
                        <span style="color: #111827; font-weight: 700; font-size: 12px;">${formatDate(reportData.procedureDate)}</span>
                      </div>
                    </div>

                    <!-- Right Col (40%) -->
                    <div style="width: 40%; display: flex; flex-direction: column; padding-left: 32px;">
                      <div style="border-bottom: 1px solid #e5e7eb; padding-bottom: 2px;">
                        <span style="font-weight: 700; color: #6b7280; font-size: 11px; text-transform: uppercase;">Ref By: </span>
                        <span style="color: #111827; font-weight: 700; font-size: 12px;">${reportData.referringDoctor || 'Self'}</span>
                      </div>
                      <div style="border-bottom: 1px solid #e5e7eb; padding-bottom: 2px; padding-top: 4px;">
                        <span style="font-weight: 700; color: #6b7280; font-size: 11px; text-transform: uppercase;">Study: </span>
                        <span style="color: #1e3a8a; font-weight: 900; font-size: 12px; text-transform: uppercase;">${reportData.procedureName || 'Endoscopy'}</span>
                      </div>
                      <div style="border-bottom: 1px solid #e5e7eb; padding-bottom: 2px; padding-top: 4px;">
                        <span style="font-weight: 700; color: #6b7280; font-size: 11px; text-transform: uppercase;">Examined By: </span>
                        <span style="color: #111827; font-weight: 700; font-size: 12px;">
                          ${reportData.performingDoctor?.name || '-'} ${reportData.performingDoctor?.qualification ? `(${reportData.performingDoctor.qualification})` : ''}
                        </span>
                      </div>
                      <div style="border-bottom: 1px solid #e5e7eb; padding-bottom: 2px; padding-top: 4px;">
                        <span style="font-weight: 700; color: #6b7280; font-size: 11px; text-transform: uppercase;">Indication: </span>
                        <span style="color: #111827; font-weight: 700; font-size: 12px;">${reportData.indication || '-'}</span>
                      </div>
                      <div style="padding-bottom: 2px; padding-top: 4px;">
                        <span style="font-weight: 700; color: #6b7280; font-size: 11px; text-transform: uppercase;">Hospital/Bill No: </span>
                        <span style="color: #111827; font-weight: 700; font-size: 12px;">${reportData.billNumber || '-'}</span>
                      </div>
                    </div>

                  </div>
                </div>
              </div>

              <!-- FINDINGS & RIGHT IMAGES -->
              <div style="display: flex; width: 100%;">
                
                <!-- Left Findings Box -->
                <div style="width: 75%; padding-right: 16px; font-size: 14px;">
                  <div style="font-weight: 900; color: #111827; font-size: 16px; text-transform: uppercase; border-bottom: 2px solid #e5e7eb; padding-bottom: 6px; margin-bottom: 8px;">Findings</div>
                  
                  <div style="font-weight: 700; color: #111827; margin-top: 8px;">Oral Cavity Pharynx & Larynx</div>
                  
                  <div style="margin-top: 8px;">
                    <div style="font-weight: 700; color: #1e3a8a; margin-bottom: 6px; font-size: 15px;">Oesophagus</div>
                    <div style="display: table; margin-left: 20px; width: 100%;">
                      <div style="display: table-row;"><div style="display: table-cell; width: 145px; color: #4b5563; font-weight: 500; padding-bottom: 4px;">Upper:</div><div style="display: table-cell;">${renderVal(sf.oesophagus?.upper)}</div></div>
                      <div style="display: table-row;"><div style="display: table-cell; color: #4b5563; font-weight: 500; padding-bottom: 4px;">Middle:</div><div style="display: table-cell;">${renderVal(sf.oesophagus?.middle)}</div></div>
                      <div style="display: table-row;"><div style="display: table-cell; color: #4b5563; font-weight: 500;">Lower G-E Junction:</div><div style="display: table-cell;">${renderVal(sf.oesophagus?.lowerGE)}</div></div>
                    </div>
                  </div>

                  <div style="margin-top: 12px;">
                    <div style="font-weight: 700; color: #1e3a8a; margin-bottom: 6px; font-size: 15px;">Stomach</div>
                    <div style="display: table; margin-left: 20px; width: 100%;">
                      <div style="display: table-row;"><div style="display: table-cell; width: 145px; color: #4b5563; font-weight: 500; padding-bottom: 4px;">Fundus:</div><div style="display: table-cell;">${renderVal(sf.stomach?.fundus)}</div></div>
                      <div style="display: table-row;"><div style="display: table-cell; color: #4b5563; font-weight: 500; padding-bottom: 4px;">Body:</div><div style="display: table-cell;">${renderVal(sf.stomach?.body)}</div></div>
                      <div style="display: table-row;"><div style="display: table-cell; color: #4b5563; font-weight: 500; padding-bottom: 4px;">Antrum:</div><div style="display: table-cell;">${renderVal(sf.stomach?.antrum)}</div></div>
                      <div style="display: table-row;"><div style="display: table-cell; color: #4b5563; font-weight: 500;">P-Ring:</div><div style="display: table-cell;">${renderVal(sf.stomach?.pRing)}</div></div>
                    </div>
                  </div>

                  <div style="margin-top: 12px;">
                    <div style="font-weight: 700; color: #1e3a8a; margin-bottom: 6px; font-size: 15px;">Duodenum</div>
                    <div style="display: table; margin-left: 20px; width: 100%;">
                      <div style="display: table-row;"><div style="display: table-cell; width: 145px; color: #4b5563; font-weight: 500; padding-bottom: 4px;">Bulb:</div><div style="display: table-cell;">${renderVal(sf.duodenum?.bulb)}</div></div>
                      <div style="display: table-row;"><div style="display: table-cell; color: #4b5563; font-weight: 500; padding-bottom: 4px;">D2:</div><div style="display: table-cell;">${renderVal(sf.duodenum?.d2)}</div></div>
                      <div style="display: table-row;"><div style="display: table-cell; color: #4b5563; font-weight: 500;">Papilla:</div><div style="display: table-cell;">${renderVal(sf.duodenum?.papilla)}</div></div>
                    </div>
                  </div>

                  ${sf.comments ? `
                  <div style="border-top: 1px solid #f3f4f6; margin-top: 12px; padding-top: 12px; font-size: 14px;">
                    <span style="font-weight: 700; color: #111827;">Comments: </span>
                    <span style="color: #111827; font-weight: 700; white-space: pre-line;">${sf.comments}</span>
                  </div>
                  ` : ''}
                </div>

                <!-- Right Images -->
                <div style="width: 25%; display: flex; flex-direction: column; gap: 8px; padding-top: 4px;">
                  ${rightImages.map(img => renderImageCard(img.url, img.caption)).join('')}
                </div>

              </div>

              <!-- BOTTOM IMAGES (Grid of 4) -->
              ${bottomImages.length > 0 ? `
              <div style="display: flex; gap: 8px; margin-top: 8px; justify-content: flex-end; width: 100%;">
                ${bottomImages.map(img => `<div style="width: calc(25% - 6px);">${renderImageCard(img.url, img.caption)}</div>`).reverse().join('')}
              </div>
              ` : ''}

              <!-- FOOTER (Signature) -->
              <div style="margin-top: auto; padding-top: 8px; flex-shrink: 0;">
                <div style="border-top: 1px solid #d1d5db; padding-top: 8px; display: flex; justify-content: space-between; align-items: flex-end;">
                  <div></div>
                  <div style="text-align: center; min-width: 150px;">
                    ${sigSrc ? `
                      <img src="${sigSrc}" style="height: 40px; margin: 0 auto; object-fit: contain; mix-blend-mode: multiply;" />
                    ` : `<div style="height: 40px;"></div>`}
                    <div style="border-top: 1px solid #111827; padding-top: 2px; margin-top: 2px;">
                      <p style="font-weight: 900; font-size: 11px; text-transform: uppercase; color: #111827; margin: 0; letter-spacing: -0.5px;">
                        ${reportData.performingDoctor?.name || 'Performing Physician'}
                      </p>
                      ${reportData.performingDoctor?.qualification ? `
                        <p style="font-size: 9px; font-weight: 700; color: #1e3a8a; text-transform: uppercase; margin: 2px 0 0 0;">
                          ${reportData.performingDoctor.qualification}
                        </p>
                      ` : ''}
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </body>
        </html>
      `
    };

    console.log('⏳ Generating PDF buffer...');
    const pdfBuffer = await html_to_pdf.generatePdf(file, pdfOptions);
    console.log('✅ PDF buffer generated successfully.');

    // ──────────────────────────────────────────────────────────
    // SAVE TO PATIENT FOLDER LOGIC
    // ──────────────────────────────────────────────────────────
    if (options.saveToFolder && options.uploadsDir) {
      try {
        const patientName = reportData.patient?.name || 'Unknown';
        const safeName = sanitizeFolderName(patientName);
        const patientDir = path.join(options.uploadsDir, 'endoscopy-images', safeName);
        
        if (!fs.existsSync(patientDir)) {
          fs.mkdirSync(patientDir, { recursive: true });
        }
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
        const pdfFilename = `Report_${safeName}_${timestamp}.pdf`;
        const pdfPath = path.join(patientDir, pdfFilename);
        
        fs.writeFileSync(pdfPath, pdfBuffer);
        console.log('✅ PDF saved to disk:', pdfPath);
        
        return {
          buffer: pdfBuffer,
          savedPath: `uploads/endoscopy-images/${safeName}/${pdfFilename}`,
          filename: pdfFilename,
          folder: safeName
        };
      } catch (saveErr) {
        console.error('⚠️ Could not save PDF to folder:', saveErr.message);
      }
    }

    return pdfBuffer;

  } catch (error) {
    console.error('❌ PDF Generation Error:', error.message);
    throw new Error('Failed to generate PDF locally'); 
  }
};

module.exports = generateReportPDF;