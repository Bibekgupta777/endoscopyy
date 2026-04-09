// import React, { useState, useEffect } from 'react';
// import { useParams, useNavigate, useLocation } from 'react-router-dom';
// import api from '../../utils/api';
// import {
//   ArrowLeft, Printer, Download, CheckCircle,
//   Trash2, Edit, MoreHorizontal, X,
// } from 'lucide-react';
// import jsPDF from 'jspdf';
// import html2canvas from 'html2canvas';
// import toast from 'react-hot-toast';

// const useSafeParams = () => {
//   try { return useParams(); } 
//   catch (e) { return { id: null }; }
// };

// const useSafeNavigate = () => {
//   try { return useNavigate(); } 
//   catch (e) { return (path) => { window.location.hash = `#${path}`; }; }
// };

// const getImageURL = (imagePath) => {
//   try {
//     if (!imagePath || typeof imagePath !== 'string') return '';
//     if (imagePath.startsWith('http') || imagePath.startsWith('data:')) return imagePath;
    
//     let cleaned = imagePath.replace(/\\/g, '/').replace(/^\//, '');
//     if (!cleaned.startsWith('uploads/')) {
//       if (!cleaned.includes('/')) cleaned = `uploads/endoscopy-images/${cleaned}`;
//       else cleaned = `uploads/${cleaned}`;
//     }
    
//     const isDev = window.location.port === '5173' || window.location.port === '3000';
//     const backendPort = isDev ? '5000' : window.location.port;
//     const portString = backendPort ? `:${backendPort}` : '';
//     const baseURL = `${window.location.protocol}//${window.location.hostname}${portString}`;
//     return `${baseURL}/${cleaned}`;
//   } catch (e) {
//     return '';
//   }
// };

// const toBase64 = (url) =>
//   new Promise((resolve) => {
//     try {
//       fetch(url, { mode: 'cors', cache: 'no-cache' })
//         .then((res) => {
//           if (!res.ok) throw new Error('Fetch failed');
//           return res.blob();
//         })
//         .then((blob) => {
//           const reader = new FileReader();
//           reader.onloadend = () => resolve(reader.result);
//           reader.onerror = () => resolve(null);
//           reader.readAsDataURL(blob);
//         })
//         .catch(() => {
//           try {
//             const img = new Image();
//             img.crossOrigin = 'anonymous';
//             img.onload = () => {
//               try {
//                 // ✅ FIX: Prevent 0x0 canvas errors!
//                 if (!img.naturalWidth || !img.naturalHeight) {
//                   return resolve(null);
//                 }
//                 const canvas = document.createElement('canvas');
//                 canvas.width = img.naturalWidth;
//                 canvas.height = img.naturalHeight;
//                 canvas.getContext('2d').drawImage(img, 0, 0);
//                 resolve(canvas.toDataURL('image/png'));
//               } catch (canvasError) {
//                 resolve(null);
//               }
//             };
//             img.onerror = () => resolve(null);
//             img.src = url;
//           } catch (imgError) {
//             resolve(null);
//           }
//         });
//     } catch (e) {
//       resolve(null);
//     }
//   });

// const ImageCard = ({ src, caption, onError }) => (
//   <div className="border-2 border-gray-800 bg-white w-full flex flex-col overflow-hidden break-inside-avoid shadow-sm rounded-[2px]">
//     <div className="aspect-[4/3] w-full bg-black flex-shrink-0">
//       <img
//         src={src}
//         className="w-full h-full object-cover"
//         alt="Endoscopy"
//         crossOrigin="anonymous"
//         onError={onError}
//       />
//     </div>
//     <div className="h-[18px] print:h-[20px] text-[9px] print:text-[10px] text-gray-900 w-full text-center font-bold flex items-center justify-center px-1 border-t-2 border-gray-800 bg-gray-50 flex-shrink-0 overflow-hidden">
//       <span className="truncate">{caption || '\u00A0'}</span>
//     </div>
//   </div>
// );

// const PrintReport = () => {
//   const { id } = useSafeParams();
//   const navigate = useSafeNavigate();
//   const location = useLocation();

//   const [report, setReport] = useState(null);
//   const [settings, setSettings] = useState(null);
//   const [mobileMenu, setMobileMenu] = useState(false);
//   const [generating, setGenerating] = useState(false);
//   const [isPrinting, setIsPrinting] = useState(false);
//   const [base64Images, setBase64Images] = useState({});
//   const [imagesReady, setImagesReady] = useState(false);
//   const [imageErrors, setImageErrors] = useState({});
//   const [hasAutoSaved, setHasAutoSaved] = useState(false);

//   const handleImageError = (key) => {
//     try { setImageErrors((prev) => ({ ...prev, [key]: true })); } catch (e) {}
//   };

//   useEffect(() => {
//     if (!id) {
//       toast.error('No report ID provided');
//       try { navigate('/reports'); } catch (e) { window.location.hash = '#/reports'; }
//       return;
//     }

//     const init = async () => {
//       try {
//         const [r, s] = await Promise.all([
//           api.get(`/reports/${id}`).catch(e => ({ data: null })),
//           api.get('/settings').catch(e => ({ data: {} }))
//         ]);

//         if (!r.data) {
//           toast.error('Report not found');
//           navigate('/reports');
//           return;
//         }

//         let reportData = r.data;
//         if (typeof reportData.customImpression === 'string' && reportData.customImpression.startsWith('{')) {
//           try {
//             reportData.structuredFindings = JSON.parse(reportData.customImpression);
//           } catch (e) {
//             reportData.structuredFindings = {
//               oralCavity: '', oesophagus: { upper: '', middle: '', lowerGE: '' },
//               stomach: { fundus: '', body: '', antrum: '', pRing: '' },
//               duodenum: { bulb: '', d2: '', papilla: '' }, comments: ''
//             };
//           }
//         }

//         setReport(reportData);
//         setSettings(s.data || {});
//       } catch (error) {
//         toast.error('Error loading report');
//       }
//     };
//     init();
//   }, [id, navigate]);

//   useEffect(() => {
//     if (!report) return;
    
//     const convertAll = async () => {
//       const map = {};
//       const errors = {};
      
//       try {
//         if (settings?.hospitalLogo) {
//           try {
//             const result = await toBase64(getImageURL(settings.hospitalLogo));
//             if (result) map.hospitalLogo = result; else errors.hospitalLogo = true;
//           } catch (e) { errors.hospitalLogo = true; }
//         }

//         if (report.performingDoctor?.signature) {
//           try {
//             const result = await toBase64(getImageURL(report.performingDoctor.signature));
//             if (result) map.signature = result; else errors.signature = true;
//           } catch (e) { errors.signature = true; }
//         }

//         if (Array.isArray(report.images) && report.images.length) {
//           const selected = report.images.filter((img) => img && img.isSelected !== false).slice(0, 7);
          
//           await Promise.all(
//             selected.map(async (img, i) => {
//               try {
//                 if (!img || !img.path) { errors[`clinical_${i}`] = true; return; }
//                 const result = await toBase64(getImageURL(img.path));
//                 if (result) map[`clinical_${i}`] = result; else errors[`clinical_${i}`] = true;
//               } catch (e) { errors[`clinical_${i}`] = true; }
//             })
//           );
//         }

//         setBase64Images(map);
//         setImageErrors(errors);
//       } catch (e) {} finally { setImagesReady(true); }
//     };
    
//     convertAll();
//   }, [report, settings]);

//   const autoUploadPDFToBackend = async () => {
//     // ✅ FIX: Removed try/catch so errors bubble up and aren't ignored
//     const element = document.getElementById('printable-area');
//     if (!element) throw new Error('Printable area not found');
    
//     const canvas = await html2canvas(element, {
//       scale: 2, useCORS: true, allowTaint: true, logging: false, 
//       backgroundColor: '#ffffff', scrollY: -window.scrollY,
//     });
    
//     const imgData = canvas.toDataURL('image/png');
//     const pdf = new jsPDF('p', 'mm', 'a4');
//     const ratio = canvas.height / canvas.width;
//     let w = 210, h = 210 * ratio;
//     if (h > 297) { h = 297; w = 297 / ratio; }
    
//     pdf.addImage(imgData, 'PNG', (210 - w) / 2, 0, w, h);
//     const pdfBlob = pdf.output('blob');
    
//     const formData = new FormData();
//     const safeName = report.patient?.name?.replace(/[^a-zA-Z0-9]/g, '_') || 'Patient';
//     formData.append('pdf', pdfBlob, `Report_${safeName}_${Date.now()}.pdf`);
    
//     await api.post(`/reports/${id}/upload-pdf`, formData, {
//       headers: { 'Content-Type': 'multipart/form-data' }
//     });
    
//     return true;
//   };

//   // 🚀 ELECTRON NATIVE AUTOSAVE
//   useEffect(() => {
//     if (location.state?.autoSave && imagesReady && !hasAutoSaved && !generating) {
//       setHasAutoSaved(true);
      
//       const runAutoSave = async () => {
//         setGenerating(true);
//         const toastId = toast.loading('Silently saving PDF to patient folder...', { duration: 8000 });
        
//         try {
//           // If we are in Electron, use the backend route to get the folder, then trigger Electron Native PDF
//           if (window.electronAPI?.downloadPdf) {
//             const pdfResponse = await api.post(`/reports/${id}/save-pdf`);
//             const { folderPath, fileName } = pdfResponse.data;
//             const currentUrl = window.location.href;
            
//             await window.electronAPI.downloadPdf({
//               url: currentUrl,
//               folderPath: folderPath,
//               fileName: fileName
//             });
//             toast.success('PDF safely stored in patient folder!', { id: toastId });
//           } else {
//             // Web browser fallback
//             await autoUploadPDFToBackend();
//             toast.success('PDF safely stored in patient folder!', { id: toastId });
//           }
//         } catch (e) {
//           console.error("Auto-save failed", e);
//           toast.error('Failed to auto-save PDF.', { id: toastId });
//         } finally {
//           setGenerating(false);
//           window.history.replaceState({}, document.title);
//         }
//       };

//       setTimeout(runAutoSave, 1500); 
//     }
//   }, [location.state, imagesReady, hasAutoSaved, generating, id]);

//   const handlePrint = () => {
//     if (isPrinting) return; 
//     setIsPrinting(true);

//     try {
//       if (!imagesReady) {
//         toast.loading('Preparing images for print...', { duration: 2000 });
//         setTimeout(() => {
//           if (window.electronAPI && window.electronAPI.print) window.electronAPI.print();
//           else window.print();
//           setIsPrinting(false); 
//         }, 2500);
//         return;
//       }
      
//       if (window.electronAPI && window.electronAPI.print) window.electronAPI.print();
//       else window.print();
      
//       setTimeout(() => setIsPrinting(false), 2000); 
//     } catch (e) {
//       toast.error('Print feature unavailable');
//       setIsPrinting(false);
//     }
//   };

//   const handlePDF = async () => {
//     if (generating || isPrinting) return; 
//     if (!imagesReady) { toast.error('Images still loading...'); return; }
    
//     setGenerating(true);
//     const loadingToast = toast.loading('Generating High-Quality PDF (Please wait)...');
    
//     try {
//       // ✅ NATIVE ELECTRON PDF DOWNLOAD BUTTON
//       if (window.electronAPI?.selectFolder && window.electronAPI?.downloadPdf) {
//         const folder = await window.electronAPI.selectFolder();
//         if (!folder) {
//           toast.dismiss(loadingToast);
//           return;
//         }

//         const patientName = report.patient?.name?.replace(/[^a-zA-Z0-9]/g, '_') || 'Report';
//         const fileName = `${patientName}_${report.reportId || Date.now()}.pdf`;
//         const currentUrl = window.location.href;
        
//         await window.electronAPI.downloadPdf({
//           url: currentUrl,
//           folderPath: folder,
//           fileName: fileName
//         });

//         toast.dismiss(loadingToast);
//         toast.success(`PDF saved to ${folder}`);
//       } else {
//         // Fallback for browsers
//         window.scrollTo(0, 0);
//         await new Promise((r) => setTimeout(r, 500));
        
//         const element = document.getElementById('printable-area');
//         if (!element) throw new Error('Printable area not found');
        
//         const canvas = await html2canvas(element, {
//           scale: 2, useCORS: true, allowTaint: true, logging: false, 
//           backgroundColor: '#ffffff', scrollY: -window.scrollY,
//         });
        
//         const imgData = canvas.toDataURL('image/png');
//         const pdf = new jsPDF('p', 'mm', 'a4');
//         const ratio = canvas.height / canvas.width;
//         let w = 210, h = 210 * ratio;
        
//         if (h > 297) { h = 297; w = 297 / ratio; }
        
//         pdf.addImage(imgData, 'PNG', (210 - w) / 2, 0, w, h);
        
//         const filename = `${report.patient?.name || 'Report'}_${report.reportId || 'export'}.pdf`;
//         pdf.save(filename);
        
//         toast.dismiss(loadingToast);
//         toast.success('PDF Downloaded successfully!');
//       }
//     } catch (error) {
//       toast.dismiss(loadingToast);
//       toast.error('PDF generation failed. Try standard print.');
//     } finally {
//       setGenerating(false);
//     }
//   };

//   const handleFinalize = async () => {
//     if (!window.confirm('Finalize this report? This will automatically save the PDF to the patient folder.')) return;
    
//     const loadingToast = toast.loading('Saving PDF and finalizing...');
//     try {
//       if (window.electronAPI?.downloadPdf) {
//         const pdfResponse = await api.post(`/reports/${id}/save-pdf`);
//         const { folderPath, fileName } = pdfResponse.data;
//         const currentUrl = window.location.href;
        
//         await window.electronAPI.downloadPdf({
//           url: currentUrl,
//           folderPath: folderPath,
//           fileName: fileName
//         });
//       } else if (imagesReady) {
//         await autoUploadPDFToBackend();
//       }

//       await api.post(`/reports/${id}/finalize`);
//       toast.dismiss(loadingToast);
//       toast.success('Report finalized and PDF saved!');
      
//       const { data } = await api.get(`/reports/${id}`);
//       setReport(data);
//     } catch (error) { 
//       toast.dismiss(loadingToast);
//       toast.error(error.response?.data?.message || 'Failed to finalize'); 
//     }
//   };

//   const handleDelete = async () => {
//     if (!window.confirm('Delete this report permanently?')) return;
//     try {
//       await api.delete(`/reports/${id}`);
//       toast.success('Deleted');
//       try { navigate('/reports'); } catch (e) { window.location.hash = '#/reports'; }
//     } catch (error) { toast.error(error.response?.data?.message || 'Failed to delete'); }
//   };

//   const formatDate = (dateStr) => {
//     try {
//       if (!dateStr) return '';
//       return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-');
//     } catch (e) { return 'Invalid date'; }
//   };

//   const safeNavigate = (path) => {
//     try { navigate(path); } catch (e) { window.location.hash = `#${path}`; }
//   };

//   if (!report) return (
//     <div className="h-[100dvh] flex items-center justify-center">
//       <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
//     </div>
//   );

//   const selectedImages = (Array.isArray(report.images) ? report.images.filter((img) => img && img.isSelected !== false) : []).slice(0, 7);
//   const rightImages = selectedImages.slice(0, 3);
//   const bottomImages = selectedImages.slice(3, 7);

//   const sf = report.structuredFindings || {
//     oralCavity: '', oesophagus: { upper: '', middle: '', lowerGE: '' },
//     stomach: { fundus: '', body: '', antrum: '', pRing: '' },
//     duodenum: { bulb: '', d2: '', papilla: '' }, comments: ''
//   };

//   const renderVal = (val) => {
//     try {
//       if (!val || typeof val !== 'string') return '';
//       return <span className="text-gray-900 font-bold">{val}</span>;
//     } catch (e) { return ''; }
//   };

//   return (
//     <>
//       <style>{`
//         @media print {
//           * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
//           @page { margin: 0; size: A4 portrait; }
//           body { background: white !important; margin: 0; padding: 0; }
//           .print\\:hidden, .no-print { display: none !important; }
//           img { display: inline-block !important; visibility: visible !important; max-width: 100% !important; break-inside: avoid !important; }
//           #printable-area {
//             position: absolute !important; top: 0 !important; left: 0 !important;
//             margin: 0 !important; padding: 5mm 15mm 9mm 15mm !important;
//             box-shadow: none !important; border: none !important;
//             width: 210mm !important; height: 297mm !important; max-height: 297mm !important;
//             overflow: hidden !important; box-sizing: border-box !important;
//             display: flex !important; flex-direction: column !important;
//           }
//         }
//       `}</style>

//       <div className="min-h-[100dvh] bg-gray-100 pb-24 sm:pb-20 print:bg-white print:pb-0">

//         {/* TOOLBAR */}
//         <div className="bg-white shadow-sm border-b print:hidden sticky top-0 z-50">
//           <div className="max-w-[210mm] mx-auto px-3 sm:px-4 py-2.5 sm:py-3 flex justify-between items-center gap-2">
//             <button 
//               onClick={() => safeNavigate('/reports')} 
//               className="flex items-center gap-1.5 text-gray-600 hover:text-gray-900 font-medium text-sm"
//             >
//               <ArrowLeft size={18} />
//               <span className="hidden sm:inline">Back</span>
//             </button>
            
//             <div className="flex-1 text-center px-2 min-w-0">
//               <h1 className="text-sm sm:text-base font-bold text-blue-900 uppercase truncate">
//                 {report.procedureName || 'Endoscopy Report'}
//               </h1>
//               <p className="text-[10px] sm:text-xs text-gray-500 truncate">
//                 {report.patient?.name} • {formatDate(report.procedureDate)}
//               </p>
//             </div>
            
//             <div className="hidden sm:flex items-center gap-2">
//               {report.status === 'draft' && (
//                 <>
//                   <button onClick={() => safeNavigate(`/reports/${id}`)} className="bg-blue-50 text-blue-600 border border-blue-200 px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5 hover:bg-blue-100 font-medium">
//                     <Edit size={14} /> Edit
//                   </button>
//                   <button onClick={handleFinalize} className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5 hover:bg-green-700 shadow-md font-medium">
//                     <CheckCircle size={14} /> Finalize
//                   </button>
//                 </>
//               )}
//               <button onClick={handleDelete} className="bg-red-50 text-red-600 border border-red-200 px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5 hover:bg-red-100 font-medium">
//                 <Trash2 size={14} /> Delete
//               </button>
//               <div className="w-px h-6 bg-gray-200" />
              
//               <button 
//                 onClick={handlePDF} 
//                 disabled={generating || isPrinting} 
//                 className="bg-white border px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5 hover:bg-gray-50 shadow-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
//               >
//                 <Download size={14} /> {generating ? 'Processing...' : 'PDF'}
//               </button>
//               <button 
//                 onClick={handlePrint} 
//                 disabled={generating || isPrinting}
//                 className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5 hover:bg-blue-700 shadow-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
//               >
//                 <Printer size={14} /> {isPrinting ? 'Printing...' : 'Print'}
//               </button>
//             </div>
            
//             <div className="sm:hidden relative">
//               <button onClick={() => setMobileMenu(o => !o)} className="p-2 rounded-lg text-gray-600 hover:bg-gray-100">
//                 {mobileMenu ? <X size={20} /> : <MoreHorizontal size={20} />}
//               </button>
//               {mobileMenu && (
//                 <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-xl shadow-2xl border z-50 py-1">
//                   <button onClick={() => { handlePrint(); setMobileMenu(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50"><Printer size={16} /> Print</button>
//                   <button onClick={() => { handlePDF(); setMobileMenu(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50"><Download size={16} /> PDF</button>
//                   {report.status === 'draft' && (
//                     <>
//                       <div className="border-t my-1" />
//                       <button onClick={() => { safeNavigate(`/reports/${id}`); setMobileMenu(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-blue-600 hover:bg-gray-50"><Edit size={16} /> Edit</button>
//                       <button onClick={() => { handleFinalize(); setMobileMenu(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-green-600 hover:bg-gray-50"><CheckCircle size={16} /> Finalize</button>
//                     </>
//                   )}
//                   <div className="border-t my-1" />
//                   <button onClick={() => { handleDelete(); setMobileMenu(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-gray-50"><Trash2 size={16} /> Delete</button>
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>

//         {/* A4 PRINTABLE AREA */}
//         <div id="printable-area" className="max-w-[210mm] mx-auto bg-white my-4 min-h-[297mm] shadow-xl p-5 md:p-6 relative box-border flex flex-col">

//           <div className="print-top-spacer h-[2mm] flex-shrink-0"></div>

//           <div className="flex-shrink-0">

//             {/* HOSPITAL HEADER */}
//             <div className="text-center pb-2 mb-0 flex-shrink-0">
//               <div className="flex items-center justify-center gap-3 mb-1">
//                 {(base64Images.hospitalLogo || settings?.hospitalLogo) && !imageErrors.hospitalLogo && (
//                   <div className="h-12 print:h-14 flex-shrink-0 flex items-center">
//                     <img
//                       src={base64Images.hospitalLogo || getImageURL(settings.hospitalLogo)}
//                       className="h-full w-auto object-contain"
//                       alt="Logo"
//                       crossOrigin="anonymous"
//                       onError={() => handleImageError('hospitalLogo')}
//                     />
//                   </div>
//                 )}
//                 <div>
//                   <h1 className="text-[22px] print:text-[25px] font-black text-blue-900 uppercase leading-none tracking-tight">
//                     {settings?.hospitalName || 'Hospital Name'}
//                   </h1>
//                 </div>
//               </div>
//               <p className="text-[9px] print:text-[10px] text-gray-600 font-medium leading-tight whitespace-pre-line max-w-[85%] mx-auto">
//                 {settings?.hospitalAddress}
//               </p>
//               <p className="text-[10px] print:text-[11px] font-bold text-gray-700 mt-0.5 tracking-wide">
//                 Ph: {settings?.hospitalPhone}
//                 {settings?.hospitalEmail && <span className="ml-3">Email: {settings.hospitalEmail}</span>}
//               </p>

//               <div className="flex items-center gap-2 mt-1.5 mb-1">
//                 <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent via-blue-300 to-blue-600"></div>
//                 <div className="flex-1 h-[1px] bg-gradient-to-l from-transparent via-blue-300 to-blue-600"></div>
//               </div>

//               <div className="inline-block mt-0.5">
//                 <div className="bg-gradient-to-r from-blue-800 via-blue-900 to-blue-800 text-white px-8 py-1 rounded-md shadow-sm">
//                   <span className="text-[13px] print:text-[14px] font-black uppercase tracking-[0.25em] leading-none">
//                     Endoscopy Unit
//                   </span>
//                 </div>
//               </div>
//             </div>

//             {/* PATIENT INFO */}
//             <div className="mb-3 print:mb-4 mt-2 flex-shrink-0">
//               <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 px-3 shadow-sm">
//                 <div className="grid grid-cols-[60%_40%]">
//                   <div className="flex flex-col pr-4 border-r border-gray-200/60">
//                     <div className="border-b border-gray-200 pb-0.5 truncate">
//                       <span className="font-bold text-gray-500 text-[10px] print:text-[11px] uppercase tracking-wide">Patient ID: </span>
//                       <span className="text-gray-900 font-bold text-[11px] print:text-[12px]">{report.opdIpdNumber || '-'}</span>
//                     </div>
//                     <div className="border-b border-gray-200 pb-0.5 pt-1 truncate">
//                       <span className="font-bold text-gray-500 text-[10px] print:text-[11px] uppercase tracking-wide">Name: </span>
//                       <span className="text-gray-900 font-black uppercase text-[11px] print:text-[12px]">{report.patient?.name || '-'}</span>
//                     </div>
//                     <div className="border-b border-gray-200 pb-0.5 pt-1 truncate">
//                       <span className="font-bold text-gray-500 text-[10px] print:text-[11px] uppercase tracking-wide">Age: </span>
//                       <span className="text-gray-900 font-bold text-[11px] print:text-[12px]">{report.patient?.age ? `${report.patient.age} Y` : '-'}</span>
//                     </div>
//                     <div className="border-b border-gray-200 pb-0.5 pt-1 truncate">
//                       <span className="font-bold text-gray-500 text-[10px] print:text-[11px] uppercase tracking-wide">Sex: </span>
//                       <span className="text-gray-900 font-bold text-[11px] print:text-[12px]">{report.patient?.sex || '-'}</span>
//                     </div>
//                     <div className="pb-0.5 pt-1 truncate">
//                       <span className="font-bold text-gray-500 text-[10px] print:text-[11px] uppercase tracking-wide">Date: </span>
//                       <span className="text-gray-900 font-bold text-[11px] print:text-[12px]">{formatDate(report.procedureDate)}</span>
//                     </div>
//                   </div>

//                   <div className="flex flex-col pl-8 sm:pl-12 print:pl-16">
//                     <div className="border-b border-gray-200 pb-0.5 truncate">
//                       <span className="font-bold text-gray-500 text-[10px] print:text-[11px] uppercase tracking-wide">Ref By: </span>
//                       <span className="text-gray-900 font-bold text-[11px] print:text-[12px]">{report.referringDoctor || 'Self'}</span>
//                     </div>
//                     <div className="border-b border-gray-200 pb-0.5 pt-1 truncate">
//                       <span className="font-bold text-gray-500 text-[10px] print:text-[11px] uppercase tracking-wide">Study: </span>
//                       <span className="text-blue-900 font-black uppercase text-[11px] print:text-[12px]">{report.procedureName || 'Endoscopy'}</span>
//                     </div>
//                     <div className="border-b border-gray-200 pb-0.5 pt-1 truncate">
//                       <span className="font-bold text-gray-500 text-[10px] print:text-[11px] uppercase tracking-wide">Examined By: </span>
//                       <span className="text-gray-900 font-bold text-[11px] print:text-[12px]">
//                         {report.performingDoctor?.name || '-'} {report.performingDoctor?.qualification ? `(${report.performingDoctor.qualification})` : ''}
//                       </span>
//                     </div>
//                     <div className="border-b border-gray-200 pb-0.5 pt-1 truncate">
//                       <span className="font-bold text-gray-500 text-[10px] print:text-[11px] uppercase tracking-wide">Indication: </span>
//                       <span className="text-gray-900 font-bold text-[11px] print:text-[12px]">{report.indication || '-'}</span>
//                     </div>
//                     <div className="pb-0.5 pt-1 truncate">
//                       <span className="font-bold text-gray-500 text-[10px] print:text-[11px] uppercase tracking-wide">Hospital/Bill No: </span>
//                       <span className="text-gray-900 font-bold text-[11px] print:text-[12px]">{report.billNumber || '-'}</span>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </div>

//             {/* FINDINGS + RIGHT IMAGES */}
//             <div>
//               <div className="grid grid-cols-4 gap-2">
//                 <div className="col-span-3 text-[13px] print:text-[14px] space-y-3 pt-1 pr-4">
//                   <div>
//                     <div className="font-black text-gray-900 text-[15px] print:text-[16px] uppercase tracking-wider border-b-2 border-gray-200 pb-1.5 mb-2">Findings</div>
//                     <div className="font-bold text-gray-900 mt-2">Oral Cavity Pharynx & Larynx</div>
//                   </div>
//                   <div>
//                     <div className="font-bold text-blue-900 mb-1.5 text-[14px] print:text-[15px]">Oesophagus</div>
//                     <div className="grid grid-cols-[145px_1fr] ml-5 gap-y-1">
//                       <span className="text-gray-600 font-medium">Upper:</span> {renderVal(sf.oesophagus?.upper)}
//                       <span className="text-gray-600 font-medium">Middle:</span> {renderVal(sf.oesophagus?.middle)}
//                       <span className="text-gray-600 font-medium">Lower G-E Junction:</span> {renderVal(sf.oesophagus?.lowerGE)}
//                     </div>
//                   </div>
//                   <div>
//                     <div className="font-bold text-blue-900 mb-1.5 mt-2 text-[14px] print:text-[15px]">Stomach</div>
//                     <div className="grid grid-cols-[145px_1fr] ml-5 gap-y-1">
//                       <span className="text-gray-600 font-medium">Fundus:</span> {renderVal(sf.stomach?.fundus)}
//                       <span className="text-gray-600 font-medium">Body:</span> {renderVal(sf.stomach?.body)}
//                       <span className="text-gray-600 font-medium">Antrum:</span> {renderVal(sf.stomach?.antrum)}
//                       <span className="text-gray-600 font-medium">P-Ring:</span> {renderVal(sf.stomach?.pRing)}
//                     </div>
//                   </div>
//                   <div>
//                     <div className="font-bold text-blue-900 mb-1.5 mt-2 text-[14px] print:text-[15px]">Duodenum</div>
//                     <div className="grid grid-cols-[145px_1fr] ml-5 gap-y-1">
//                       <span className="text-gray-600 font-medium">Bulb:</span> {renderVal(sf.duodenum?.bulb)}
//                       <span className="text-gray-600 font-medium">D2:</span> {renderVal(sf.duodenum?.d2)}
//                       <span className="text-gray-600 font-medium">Papilla:</span> {renderVal(sf.duodenum?.papilla)}
//                     </div>
//                   </div>
//                   {sf.comments && (
//                     <div className="pt-3 border-t border-gray-100 mt-2 text-[13px] print:text-[14px]">
//                       <span className="font-bold text-gray-900">Comments: </span>
//                       <span className="text-gray-900 font-bold whitespace-pre-line">{sf.comments}</span>
//                     </div>
//                   )}
//                 </div>

//                 <div className="col-span-1 flex flex-col gap-2 pt-1">
//                   {rightImages.map((img, i) => (
//                     <ImageCard key={i} src={base64Images[`clinical_${i}`] || getImageURL(img.path)} caption={img.caption || img.taggedOrgan} onError={() => handleImageError(`clinical_${i}`)} />
//                   ))}
//                 </div>
//               </div>

//               {bottomImages.length > 0 && (
//                 <div className="grid grid-cols-4 gap-2 mt-2 break-inside-avoid" dir="rtl">
//                   {bottomImages.map((img, i) => (
//                     <div key={i} dir="ltr">
//                       <ImageCard src={base64Images[`clinical_${i + 3}`] || getImageURL(img.path)} caption={img.caption || img.taggedOrgan} onError={() => handleImageError(`clinical_${i + 3}`)} />
//                     </div>
//                   ))}
//                 </div>
//               )}
//             </div>
//           </div>

//           {/* FOOTER */}
//           <div className="mt-auto pt-1 shrink-0">
//             <div className="flex justify-between items-end border-t border-gray-300 pt-2">
//               <div className="text-[6px] print:text-[7px] text-gray-400 font-mono pb-1"></div>
//               <div className="text-center min-w-[150px]">
//                 {(base64Images.signature || report.performingDoctor?.signature) && !imageErrors.signature ? (
//                   <img 
//                     src={base64Images.signature || getImageURL(report.performingDoctor.signature)} 
//                     className="h-8 print:h-10 mx-auto object-contain mix-blend-multiply" 
//                     crossOrigin="anonymous"
//                     alt="Signature" 
//                     onError={() => handleImageError('signature')} 
//                   />
//                 ) : (
//                   <div className="h-8 print:h-10 flex items-center justify-center text-gray-300 text-[9px] italic"></div>
//                 )}
//                 <div className="border-t border-gray-900 pt-0.5 mt-0.5">
//                   <p className="font-black text-[10px] print:text-[11px] uppercase text-gray-900 tracking-tight leading-none">
//                     {report.performingDoctor?.name || 'Performing Physician'}
//                   </p>
//                   {report.performingDoctor?.qualification && (
//                     <p className="text-[8px] print:text-[9px] font-bold text-blue-900 uppercase mt-0.5 leading-none">
//                       {report.performingDoctor.qualification}
//                     </p>
//                   )}
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </>
//   );
// };

// export default PrintReport;





import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import api from '../../utils/api';
import {
  ArrowLeft, Printer, Download, CheckCircle,
  Trash2, Edit, MoreHorizontal, X,
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import toast from 'react-hot-toast';

const useSafeParams = () => {
  try { return useParams(); }
  catch (e) { return { id: null }; }
};

const useSafeNavigate = () => {
  try { return useNavigate(); }
  catch (e) { return (path) => { window.location.hash = `#${path}`; }; }
};

const getImageURL = (imagePath) => {
  try {
    if (!imagePath || typeof imagePath !== 'string') return '';
    if (imagePath.startsWith('http') || imagePath.startsWith('data:')) return imagePath;

    let cleaned = imagePath.replace(/\\/g, '/').replace(/^\//, '');
    if (!cleaned.startsWith('uploads/')) {
      if (!cleaned.includes('/')) cleaned = `uploads/endoscopy-images/${cleaned}`;
      else cleaned = `uploads/${cleaned}`;
    }

    const isDev = window.location.port === '5173' || window.location.port === '3000';
    const backendPort = isDev ? '5000' : window.location.port;
    const portString = backendPort ? `:${backendPort}` : '';
    const baseURL = `${window.location.protocol}//${window.location.hostname}${portString}`;
    return `${baseURL}/${cleaned}`;
  } catch (e) {
    return '';
  }
};

const toBase64 = (url) =>
  new Promise((resolve) => {
    if (!url) return resolve(null);
    
    try {
      // First try fetch
      fetch(url, { mode: 'cors', cache: 'no-cache' })
        .then((res) => {
          if (!res.ok) throw new Error('Fetch failed');
          return res.blob();
        })
        .then((blob) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = () => resolve(null);
          reader.readAsDataURL(blob);
        })
        .catch(() => {
          // Fallback: use Image element
          try {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
              try {
                // ✅ CRITICAL: Check for 0 dimensions
                if (!img.naturalWidth || !img.naturalHeight || img.naturalWidth === 0 || img.naturalHeight === 0) {
                  console.warn('toBase64: Image has 0 dimensions, skipping:', url);
                  return resolve(null);
                }
                const canvas = document.createElement('canvas');
                canvas.width = img.naturalWidth;
                canvas.height = img.naturalHeight;
                const ctx = canvas.getContext('2d');
                if (!ctx) return resolve(null);
                ctx.drawImage(img, 0, 0);
                resolve(canvas.toDataURL('image/png'));
              } catch (canvasError) {
                console.warn('toBase64 canvas error:', canvasError);
                resolve(null);
              }
            };
            img.onerror = () => {
              console.warn('toBase64: Image failed to load:', url);
              resolve(null);
            };
            img.src = url;
          } catch (imgError) {
            resolve(null);
          }
        });
    } catch (e) {
      resolve(null);
    }
  });

const ImageCard = ({ src, caption, onError }) => {
  const [imgSrc, setImgSrc] = useState(src);
  const [failed, setFailed] = useState(false);

  const handleError = () => {
    setFailed(true);
    if (onError) onError();
  };

  if (failed || !imgSrc) {
    // ✅ Return a placeholder instead of broken image
    return (
      <div className="border-2 border-gray-300 bg-gray-100 w-full flex flex-col overflow-hidden break-inside-avoid shadow-sm rounded-[2px]">
        <div className="aspect-[4/3] w-full bg-gray-200 flex items-center justify-center text-gray-400 text-xs">
          No Image
        </div>
        <div className="h-[18px] print:h-[20px] text-[9px] print:text-[10px] text-gray-500 w-full text-center font-bold flex items-center justify-center px-1 border-t border-gray-300 bg-gray-50 flex-shrink-0 overflow-hidden">
          <span className="truncate">{caption || '\u00A0'}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="border-2 border-gray-800 bg-white w-full flex flex-col overflow-hidden break-inside-avoid shadow-sm rounded-[2px]">
      <div className="aspect-[4/3] w-full bg-black flex-shrink-0">
        <img
          src={imgSrc}
          className="w-full h-full object-cover"
          alt="Endoscopy"
          crossOrigin="anonymous"
          onError={handleError}
        />
      </div>
      <div className="h-[18px] print:h-[20px] text-[9px] print:text-[10px] text-gray-900 w-full text-center font-bold flex items-center justify-center px-1 border-t-2 border-gray-800 bg-gray-50 flex-shrink-0 overflow-hidden">
        <span className="truncate">{caption || '\u00A0'}</span>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// ✅ HELPER: Wait for all images inside an element to fully load
// ═══════════════════════════════════════════════════════════════
const waitForImagesToLoad = (element, timeoutMs = 8000) => {
  return new Promise((resolve) => {
    try {
      const images = element.querySelectorAll('img');
      if (!images.length) return resolve(true);

      let loadedCount = 0;
      const total = images.length;
      let resolved = false;

      const done = () => {
        if (resolved) return;
        resolved = true;
        resolve(true);
      };

      const timer = setTimeout(() => {
        console.warn(`waitForImagesToLoad: Timeout after ${timeoutMs}ms, ${loadedCount}/${total} loaded`);
        done();
      }, timeoutMs);

      const checkImage = (img) => {
        loadedCount++;
        if (loadedCount >= total) {
          clearTimeout(timer);
          done();
        }
      };

      images.forEach((img) => {
        if (img.complete && img.naturalWidth > 0 && img.naturalHeight > 0) {
          checkImage(img);
        } else {
          img.addEventListener('load', () => checkImage(img), { once: true });
          img.addEventListener('error', () => checkImage(img), { once: true });
        }
      });
    } catch (e) {
      resolve(true);
    }
  });
};

// ═══════════════════════════════════════════════════════════════
// ✅ SAFE html2canvas wrapper — the key fix for the 0-dimension error
// ═══════════════════════════════════════════════════════════════
const safeHtml2Canvas = async (element) => {
  if (!element) {
    throw new Error('safeHtml2Canvas: Element is null');
  }

  // ✅ Check element has dimensions
  const rect = element.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) {
    throw new Error(`safeHtml2Canvas: Element has 0 dimensions (${rect.width}x${rect.height})`);
  }

  // ✅ Wait for images to load
  await waitForImagesToLoad(element, 8000);

  // ✅ Force a browser repaint
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

  // ✅ Run html2canvas with all protective options
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    logging: false,
    backgroundColor: '#ffffff',
    scrollX: 0,
    scrollY: 0,
    windowWidth: element.scrollWidth,
    windowHeight: element.scrollHeight,
    
    // ✅ CRITICAL FIX: Clone handler to fix 0-dimension elements
    onclone: (clonedDoc, clonedElement) => {
      try {
        // Fix all images in the cloned document
        const images = clonedDoc.querySelectorAll('img');
        images.forEach((img) => {
          // If image didn't load properly, replace with placeholder
          if (!img.complete || !img.naturalWidth || !img.naturalHeight) {
            // Replace with a 1x1 transparent pixel
            img.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
            img.style.width = img.style.width || '100px';
            img.style.height = img.style.height || '75px';
            img.style.backgroundColor = '#f0f0f0';
          }
        });

        // Fix all canvas elements
        const canvases = clonedDoc.querySelectorAll('canvas');
        canvases.forEach((cvs) => {
          if (cvs.width === 0 || cvs.height === 0) {
            cvs.width = 1;
            cvs.height = 1;
          }
        });

        // ✅ FIX: Remove CSS gradient backgrounds that might cause issues
        // (html2canvas struggles with complex gradients on some browsers)
        const allElements = clonedDoc.querySelectorAll('*');
        allElements.forEach((el) => {
          try {
            const computedStyle = window.getComputedStyle(el);
            const bgImage = computedStyle.backgroundImage;
            
            // If there's a gradient, convert to solid color fallback
            if (bgImage && bgImage.includes('gradient')) {
              const bgColor = computedStyle.backgroundColor;
              if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)') {
                el.style.backgroundImage = 'none';
                el.style.backgroundColor = bgColor;
              }
            }
            
            // If there's a background-image URL that might be broken
            if (bgImage && bgImage.includes('url(') && !bgImage.includes('data:')) {
              // Remove potentially problematic background images
              el.style.backgroundImage = 'none';
            }
          } catch (styleErr) {
            // Ignore style errors
          }
        });

      } catch (cloneErr) {
        console.warn('safeHtml2Canvas onclone error:', cloneErr);
      }
    },
    
    // ✅ Skip broken images entirely
    ignoreElements: (el) => {
      try {
        if (el.tagName === 'IMG') {
          if (!el.complete) return true;
          if (!el.naturalWidth || !el.naturalHeight) return true;
          if (el.naturalWidth === 0 || el.naturalHeight === 0) return true;
        }
        // Skip empty canvas elements
        if (el.tagName === 'CANVAS') {
          if (el.width === 0 || el.height === 0) return true;
        }
        return false;
      } catch (e) {
        return false;
      }
    },
  });

  // ✅ Verify the output canvas is valid
  if (!canvas || canvas.width === 0 || canvas.height === 0) {
    throw new Error('safeHtml2Canvas: Generated canvas has 0 dimensions');
  }

  return canvas;
};

// ═══════════════════════════════════════════════════════════════

const PrintReport = () => {
  const { id } = useSafeParams();
  const navigate = useSafeNavigate();
  const location = useLocation();

  const [report, setReport] = useState(null);
  const [settings, setSettings] = useState(null);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [base64Images, setBase64Images] = useState({});
  const [imagesReady, setImagesReady] = useState(false);
  const [imageErrors, setImageErrors] = useState({});
  const [hasAutoSaved, setHasAutoSaved] = useState(false);
  const [autoSaveAttempts, setAutoSaveAttempts] = useState(0);

  const handleImageError = useCallback((key) => {
    setImageErrors((prev) => ({ ...prev, [key]: true }));
  }, []);

  useEffect(() => {
    if (!id) {
      toast.error('No report ID provided');
      try { navigate('/reports'); } catch (e) { window.location.hash = '#/reports'; }
      return;
    }

    const init = async () => {
      try {
        const [r, s] = await Promise.all([
          api.get(`/reports/${id}`).catch(e => ({ data: null })),
          api.get('/settings').catch(e => ({ data: {} }))
        ]);

        if (!r.data) {
          toast.error('Report not found');
          navigate('/reports');
          return;
        }

        let reportData = r.data;
        if (typeof reportData.customImpression === 'string' && reportData.customImpression.startsWith('{')) {
          try {
            reportData.structuredFindings = JSON.parse(reportData.customImpression);
          } catch (e) {
            reportData.structuredFindings = {
              oralCavity: '', oesophagus: { upper: '', middle: '', lowerGE: '' },
              stomach: { fundus: '', body: '', antrum: '', pRing: '' },
              duodenum: { bulb: '', d2: '', papilla: '' }, comments: ''
            };
          }
        }

        setReport(reportData);
        setSettings(s.data || {});
      } catch (error) {
        toast.error('Error loading report');
      }
    };
    init();
  }, [id, navigate]);

  // Convert images to base64
  useEffect(() => {
    if (!report) return;

    const convertAll = async () => {
      const map = {};
      const errors = {};

      try {
        // Hospital logo
        if (settings?.hospitalLogo) {
          const logoUrl = getImageURL(settings.hospitalLogo);
          if (logoUrl) {
            const result = await toBase64(logoUrl);
            if (result) map.hospitalLogo = result;
            else errors.hospitalLogo = true;
          }
        }

        // Doctor signature
        if (report.performingDoctor?.signature) {
          const sigUrl = getImageURL(report.performingDoctor.signature);
          if (sigUrl) {
            const result = await toBase64(sigUrl);
            if (result) map.signature = result;
            else errors.signature = true;
          }
        }

        // Clinical images
        if (Array.isArray(report.images) && report.images.length) {
          const selected = report.images.filter((img) => img && img.isSelected !== false).slice(0, 7);

          await Promise.all(
            selected.map(async (img, i) => {
              try {
                if (!img?.path) {
                  errors[`clinical_${i}`] = true;
                  return;
                }
                const imgUrl = getImageURL(img.path);
                if (imgUrl) {
                  const result = await toBase64(imgUrl);
                  if (result) map[`clinical_${i}`] = result;
                  else errors[`clinical_${i}`] = true;
                } else {
                  errors[`clinical_${i}`] = true;
                }
              } catch (e) {
                errors[`clinical_${i}`] = true;
              }
            })
          );
        }

        setBase64Images(map);
        setImageErrors(errors);
      } catch (e) {
        console.error('Image conversion error:', e);
      } finally {
        setImagesReady(true);
      }
    };

    convertAll();
  }, [report, settings]);

  // ═══════════════════════════════════════════════════════════════
  // ✅ Generate PDF Blob — extracted for reuse
  // ═══════════════════════════════════════════════════════════════
  const generatePDFBlob = useCallback(async () => {
    const element = document.getElementById('printable-area');
    if (!element) throw new Error('Printable area not found');

    const canvas = await safeHtml2Canvas(element);

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const ratio = canvas.height / canvas.width;
    let w = 210;
    let h = 210 * ratio;
    if (h > 297) {
      h = 297;
      w = 297 / ratio;
    }

    pdf.addImage(imgData, 'PNG', (210 - w) / 2, 0, w, h);
    return pdf.output('blob');
  }, []);

  // ═══════════════════════════════════════════════════════════════
  // ✅ Auto Upload PDF to Backend
  // ═══════════════════════════════════════════════════════════════
  const autoUploadPDFToBackend = useCallback(async () => {
    const pdfBlob = await generatePDFBlob();

    const formData = new FormData();
    const safeName = report?.patient?.name?.replace(/[^a-zA-Z0-9]/g, '_') || 'Patient';
    formData.append('pdf', pdfBlob, `Report_${safeName}_${Date.now()}.pdf`);

    await api.post(`/reports/${id}/upload-pdf`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });

    return true;
  }, [generatePDFBlob, report, id]);

  // ═══════════════════════════════════════════════════════════════
  // ✅ AUTO-SAVE EFFECT — with retry logic
  // ═══════════════════════════════════════════════════════════════
  useEffect(() => {
    // Check all conditions
    if (!location.state?.autoSave) return;
    if (!imagesReady) return;
    if (hasAutoSaved) return;
    if (generating) return;
    if (autoSaveAttempts >= 3) {
      console.warn('Auto-save: Max attempts reached, giving up');
      return;
    }

    const runAutoSave = async () => {
      // ✅ Pre-flight check: Is the element ready?
      const element = document.getElementById('printable-area');
      if (!element) {
        console.warn('Auto-save: printable-area not found, will retry');
        setAutoSaveAttempts((a) => a + 1);
        return;
      }

      const rect = element.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) {
        console.warn('Auto-save: Element has 0 dimensions, will retry');
        setAutoSaveAttempts((a) => a + 1);
        return;
      }

      // ✅ Check for unloaded images
      const images = element.querySelectorAll('img');
      const brokenImages = Array.from(images).filter(
        (img) => !img.complete || img.naturalWidth === 0 || img.naturalHeight === 0
      );
      
      if (brokenImages.length > 0) {
        console.warn(`Auto-save: ${brokenImages.length} images not ready, waiting...`);
        await waitForImagesToLoad(element, 5000);
      }

      // ✅ All checks passed — run auto-save
      setHasAutoSaved(true);
      setGenerating(true);
      
      const toastId = toast.loading('Auto-saving PDF...', { duration: 15000 });

      try {
        // Electron path
        if (window.electronAPI?.downloadPdf) {
          const pdfResponse = await api.post(`/reports/${id}/save-pdf`);
          const { folderPath, fileName } = pdfResponse.data;

          await window.electronAPI.downloadPdf({
            url: window.location.href,
            folderPath: folderPath,
            fileName: fileName
          });
          
          toast.success('PDF saved to patient folder!', { id: toastId });
        } else {
          // Browser fallback
          await autoUploadPDFToBackend();
          toast.success('PDF saved successfully!', { id: toastId });
        }
      } catch (error) {
        console.error('Auto-save failed:', error);
        
        // ✅ Friendly error message
        const errorMsg = error?.message || 'Unknown error';
        if (errorMsg.includes('0 dimension') || errorMsg.includes('createPattern')) {
          toast.error('Auto-save skipped — images not fully loaded. Use Print/PDF button.', { id: toastId });
        } else {
          toast.error('Auto-save failed. You can manually save using Print/PDF.', { id: toastId });
        }
      } finally {
        setGenerating(false);
        // Clear the autoSave state from history
        window.history.replaceState({}, document.title);
      }
    };

    // ✅ INCREASED DELAY: Wait 3 seconds for everything to paint
    const timer = setTimeout(runAutoSave, 3000);
    return () => clearTimeout(timer);
    
  }, [location.state, imagesReady, hasAutoSaved, generating, autoSaveAttempts, id, autoUploadPDFToBackend]);

  // ═══════════════════════════════════════════════════════════════
  // PRINT HANDLER
  // ═══════════════════════════════════════════════════════════════
  const handlePrint = () => {
    if (isPrinting) return;
    setIsPrinting(true);

    try {
      if (!imagesReady) {
        toast.loading('Preparing images...', { duration: 2000 });
        setTimeout(() => {
          if (window.electronAPI?.print) window.electronAPI.print();
          else window.print();
          setIsPrinting(false);
        }, 2500);
        return;
      }

      if (window.electronAPI?.print) window.electronAPI.print();
      else window.print();

      setTimeout(() => setIsPrinting(false), 2000);
    } catch (e) {
      toast.error('Print unavailable');
      setIsPrinting(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // PDF DOWNLOAD HANDLER
  // ═══════════════════════════════════════════════════════════════
  const handlePDF = async () => {
    if (generating || isPrinting) return;
    if (!imagesReady) {
      toast.error('Images still loading...');
      return;
    }

    setGenerating(true);
    const loadingToast = toast.loading('Generating PDF...');

    try {
      // Electron path
      if (window.electronAPI?.selectFolder && window.electronAPI?.downloadPdf) {
        const folder = await window.electronAPI.selectFolder();
        if (!folder) {
          toast.dismiss(loadingToast);
          setGenerating(false);
          return;
        }

        const patientName = report?.patient?.name?.replace(/[^a-zA-Z0-9]/g, '_') || 'Report';
        const fileName = `${patientName}_${report?.reportId || Date.now()}.pdf`;

        await window.electronAPI.downloadPdf({
          url: window.location.href,
          folderPath: folder,
          fileName: fileName
        });

        toast.dismiss(loadingToast);
        toast.success(`PDF saved to ${folder}`);
      } else {
        // Browser fallback
        window.scrollTo(0, 0);
        await new Promise((r) => setTimeout(r, 300));

        const pdfBlob = await generatePDFBlob();

        // Download the blob
        const url = URL.createObjectURL(pdfBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${report?.patient?.name || 'Report'}_${report?.reportId || 'export'}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast.dismiss(loadingToast);
        toast.success('PDF downloaded!');
      }
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.dismiss(loadingToast);
      toast.error('PDF generation failed. Try Print instead.');
    } finally {
      setGenerating(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // FINALIZE HANDLER
  // ═══════════════════════════════════════════════════════════════
  const handleFinalize = async () => {
    if (!window.confirm('Finalize this report? This will save the PDF.')) return;

    const loadingToast = toast.loading('Finalizing...');
    
    try {
      // Try to save PDF first (non-blocking)
      try {
        if (window.electronAPI?.downloadPdf) {
          const pdfResponse = await api.post(`/reports/${id}/save-pdf`);
          const { folderPath, fileName } = pdfResponse.data;

          await window.electronAPI.downloadPdf({
            url: window.location.href,
            folderPath: folderPath,
            fileName: fileName
          });
        } else if (imagesReady) {
          await autoUploadPDFToBackend();
        }
      } catch (pdfErr) {
        console.warn('PDF save during finalize failed:', pdfErr.message);
        // Continue with finalization anyway
      }

      // Finalize the report
      await api.post(`/reports/${id}/finalize`);
      toast.dismiss(loadingToast);
      toast.success('Report finalized!');

      // Refresh report data
      const { data } = await api.get(`/reports/${id}`);
      setReport(data);
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error(error?.response?.data?.message || 'Finalization failed');
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // DELETE HANDLER
  // ═══════════════════════════════════════════════════════════════
  const handleDelete = async () => {
    if (!window.confirm('Delete this report permanently?')) return;
    
    try {
      await api.delete(`/reports/${id}`);
      toast.success('Deleted');
      try { navigate('/reports'); } catch (e) { window.location.hash = '#/reports'; }
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Delete failed');
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // UTILITIES
  // ═══════════════════════════════════════════════════════════════
  const formatDate = (dateStr) => {
    try {
      if (!dateStr) return '';
      return new Date(dateStr).toLocaleDateString('en-GB', { 
        day: '2-digit', month: 'short', year: 'numeric' 
      }).replace(/ /g, '-');
    } catch (e) { 
      return 'Invalid date'; 
    }
  };

  const safeNavigate = (path) => {
    try { navigate(path); } catch (e) { window.location.hash = `#${path}`; }
  };

  // ═══════════════════════════════════════════════════════════════
  // LOADING STATE
  // ═══════════════════════════════════════════════════════════════
  if (!report) {
    return (
      <div className="h-[100dvh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // DERIVED DATA
  // ═══════════════════════════════════════════════════════════════
  const selectedImages = (
    Array.isArray(report.images) 
      ? report.images.filter((img) => img && img.isSelected !== false) 
      : []
  ).slice(0, 7);
  
  const rightImages = selectedImages.slice(0, 3);
  const bottomImages = selectedImages.slice(3, 7);

  const sf = report.structuredFindings || {
    oralCavity: '',
    oesophagus: { upper: '', middle: '', lowerGE: '' },
    stomach: { fundus: '', body: '', antrum: '', pRing: '' },
    duodenum: { bulb: '', d2: '', papilla: '' },
    comments: ''
  };

  const renderVal = (val) => {
    if (!val || typeof val !== 'string') return '';
    return <span className="text-gray-900 font-bold">{val}</span>;
  };

  // ═══════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════
  return (
    <>
      {/* ✅ PRINT STYLES */}
      <style>{`
        @media print {
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          @page { margin: 0; size: A4 portrait; }
          body { background: white !important; margin: 0; padding: 0; }
          .print\\:hidden, .no-print { display: none !important; }
          img { display: inline-block !important; visibility: visible !important; max-width: 100% !important; break-inside: avoid !important; }
          #printable-area {
            position: absolute !important; top: 0 !important; left: 0 !important;
            margin: 0 !important; padding: 5mm 15mm 9mm 15mm !important;
            box-shadow: none !important; border: none !important;
            width: 210mm !important; height: 297mm !important; max-height: 297mm !important;
            overflow: hidden !important; box-sizing: border-box !important;
            display: flex !important; flex-direction: column !important;
          }
        }
      `}</style>

      <div className="min-h-[100dvh] bg-gray-100 pb-24 sm:pb-20 print:bg-white print:pb-0">

        {/* ═══════════════════════════════════════════════════════════
            TOOLBAR
        ═══════════════════════════════════════════════════════════ */}
        <div className="bg-white shadow-sm border-b print:hidden sticky top-0 z-50">
          <div className="max-w-[210mm] mx-auto px-3 sm:px-4 py-2.5 sm:py-3 flex justify-between items-center gap-2">
            <button
              onClick={() => safeNavigate('/reports')}
              className="flex items-center gap-1.5 text-gray-600 hover:text-gray-900 font-medium text-sm"
            >
              <ArrowLeft size={18} />
              <span className="hidden sm:inline">Back</span>
            </button>

            <div className="flex-1 text-center px-2 min-w-0">
              <h1 className="text-sm sm:text-base font-bold text-blue-900 uppercase truncate">
                {report.procedureName || 'Endoscopy Report'}
              </h1>
              <p className="text-[10px] sm:text-xs text-gray-500 truncate">
                {report.patient?.name} • {formatDate(report.procedureDate)}
              </p>
            </div>

            {/* Desktop buttons */}
            <div className="hidden sm:flex items-center gap-2">
              {report.status === 'draft' && (
                <>
                  <button 
                    onClick={() => safeNavigate(`/reports/${id}`)} 
                    className="bg-blue-50 text-blue-600 border border-blue-200 px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5 hover:bg-blue-100 font-medium"
                  >
                    <Edit size={14} /> Edit
                  </button>
                  <button 
                    onClick={handleFinalize} 
                    className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5 hover:bg-green-700 shadow-md font-medium"
                  >
                    <CheckCircle size={14} /> Finalize
                  </button>
                </>
              )}
              <button 
                onClick={handleDelete} 
                className="bg-red-50 text-red-600 border border-red-200 px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5 hover:bg-red-100 font-medium"
              >
                <Trash2 size={14} /> Delete
              </button>
              <div className="w-px h-6 bg-gray-200" />
              <button
                onClick={handlePDF}
                disabled={generating || isPrinting}
                className="bg-white border px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5 hover:bg-gray-50 shadow-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download size={14} /> {generating ? 'Processing...' : 'PDF'}
              </button>
              <button
                onClick={handlePrint}
                disabled={generating || isPrinting}
                className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5 hover:bg-blue-700 shadow-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Printer size={14} /> {isPrinting ? 'Printing...' : 'Print'}
              </button>
            </div>

            {/* Mobile menu */}
            <div className="sm:hidden relative">
              <button 
                onClick={() => setMobileMenu((o) => !o)} 
                className="p-2 rounded-lg text-gray-600 hover:bg-gray-100"
              >
                {mobileMenu ? <X size={20} /> : <MoreHorizontal size={20} />}
              </button>
              {mobileMenu && (
                <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-xl shadow-2xl border z-50 py-1">
                  <button onClick={() => { handlePrint(); setMobileMenu(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50">
                    <Printer size={16} /> Print
                  </button>
                  <button onClick={() => { handlePDF(); setMobileMenu(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50">
                    <Download size={16} /> PDF
                  </button>
                  {report.status === 'draft' && (
                    <>
                      <div className="border-t my-1" />
                      <button onClick={() => { safeNavigate(`/reports/${id}`); setMobileMenu(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-blue-600 hover:bg-gray-50">
                        <Edit size={16} /> Edit
                      </button>
                      <button onClick={() => { handleFinalize(); setMobileMenu(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-green-600 hover:bg-gray-50">
                        <CheckCircle size={16} /> Finalize
                      </button>
                    </>
                  )}
                  <div className="border-t my-1" />
                  <button onClick={() => { handleDelete(); setMobileMenu(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-gray-50">
                    <Trash2 size={16} /> Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════
            A4 PRINTABLE AREA
        ═══════════════════════════════════════════════════════════ */}
        <div 
          id="printable-area" 
          className="max-w-[210mm] mx-auto bg-white my-4 min-h-[297mm] shadow-xl p-5 md:p-6 relative box-border flex flex-col"
        >
          <div className="print-top-spacer h-[2mm] flex-shrink-0"></div>

          <div className="flex-shrink-0">

            {/* HOSPITAL HEADER */}
            <div className="text-center pb-2 mb-0 flex-shrink-0">
              <div className="flex items-center justify-center gap-3 mb-1">
                {(base64Images.hospitalLogo || settings?.hospitalLogo) && !imageErrors.hospitalLogo && (
                  <div className="h-12 print:h-14 flex-shrink-0 flex items-center">
                    <img
                      src={base64Images.hospitalLogo || getImageURL(settings.hospitalLogo)}
                      className="h-full w-auto object-contain"
                      alt="Logo"
                      crossOrigin="anonymous"
                      onError={() => handleImageError('hospitalLogo')}
                    />
                  </div>
                )}
                <div>
                  <h1 className="text-[22px] print:text-[25px] font-black text-blue-900 uppercase leading-none tracking-tight">
                    {settings?.hospitalName || 'Hospital Name'}
                  </h1>
                </div>
              </div>
              <p className="text-[9px] print:text-[10px] text-gray-600 font-medium leading-tight whitespace-pre-line max-w-[85%] mx-auto">
                {settings?.hospitalAddress}
              </p>
              <p className="text-[10px] print:text-[11px] font-bold text-gray-700 mt-0.5 tracking-wide">
                Ph: {settings?.hospitalPhone}
                {settings?.hospitalEmail && <span className="ml-3">Email: {settings.hospitalEmail}</span>}
              </p>

              {/* ✅ FIXED: Simplified divider - no gradients that cause issues */}
              <div className="flex items-center gap-2 mt-1.5 mb-1">
                <div className="flex-1 h-[1px] bg-blue-400"></div>
                <div className="flex-1 h-[1px] bg-blue-400"></div>
              </div>

              <div className="inline-block mt-0.5">
                {/* ✅ FIXED: Solid color instead of gradient for html2canvas compatibility */}
                <div className="bg-blue-900 text-white px-8 py-1 rounded-md shadow-sm">
                  <span className="text-[13px] print:text-[14px] font-black uppercase tracking-[0.25em] leading-none">
                    Endoscopy Unit
                  </span>
                </div>
              </div>
            </div>

            {/* PATIENT INFO */}
            <div className="mb-3 print:mb-4 mt-2 flex-shrink-0">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 px-3 shadow-sm">
                <div className="grid grid-cols-[60%_40%]">
                  <div className="flex flex-col pr-4 border-r border-gray-200/60">
                    <div className="border-b border-gray-200 pb-0.5 truncate">
                      <span className="font-bold text-gray-500 text-[10px] print:text-[11px] uppercase tracking-wide">Patient ID: </span>
                      <span className="text-gray-900 font-bold text-[11px] print:text-[12px]">{report.opdIpdNumber || '-'}</span>
                    </div>
                    <div className="border-b border-gray-200 pb-0.5 pt-1 truncate">
                      <span className="font-bold text-gray-500 text-[10px] print:text-[11px] uppercase tracking-wide">Name: </span>
                      <span className="text-gray-900 font-black uppercase text-[11px] print:text-[12px]">{report.patient?.name || '-'}</span>
                    </div>
                    <div className="border-b border-gray-200 pb-0.5 pt-1 truncate">
                      <span className="font-bold text-gray-500 text-[10px] print:text-[11px] uppercase tracking-wide">Age: </span>
                      <span className="text-gray-900 font-bold text-[11px] print:text-[12px]">{report.patient?.age ? `${report.patient.age} Y` : '-'}</span>
                    </div>
                    <div className="border-b border-gray-200 pb-0.5 pt-1 truncate">
                      <span className="font-bold text-gray-500 text-[10px] print:text-[11px] uppercase tracking-wide">Sex: </span>
                      <span className="text-gray-900 font-bold text-[11px] print:text-[12px]">{report.patient?.sex || '-'}</span>
                    </div>
                    <div className="pb-0.5 pt-1 truncate">
                      <span className="font-bold text-gray-500 text-[10px] print:text-[11px] uppercase tracking-wide">Date: </span>
                      <span className="text-gray-900 font-bold text-[11px] print:text-[12px]">{formatDate(report.procedureDate)}</span>
                    </div>
                  </div>

                  <div className="flex flex-col pl-8 sm:pl-12 print:pl-16">
                    <div className="border-b border-gray-200 pb-0.5 truncate">
                      <span className="font-bold text-gray-500 text-[10px] print:text-[11px] uppercase tracking-wide">Ref By: </span>
                      <span className="text-gray-900 font-bold text-[11px] print:text-[12px]">{report.referringDoctor || 'Self'}</span>
                    </div>
                    <div className="border-b border-gray-200 pb-0.5 pt-1 truncate">
                      <span className="font-bold text-gray-500 text-[10px] print:text-[11px] uppercase tracking-wide">Study: </span>
                      <span className="text-blue-900 font-black uppercase text-[11px] print:text-[12px]">{report.procedureName || 'Endoscopy'}</span>
                    </div>
                    <div className="border-b border-gray-200 pb-0.5 pt-1 truncate">
                      <span className="font-bold text-gray-500 text-[10px] print:text-[11px] uppercase tracking-wide">Examined By: </span>
                      <span className="text-gray-900 font-bold text-[11px] print:text-[12px]">
                        {report.performingDoctor?.name || '-'} 
                        {report.performingDoctor?.qualification ? ` (${report.performingDoctor.qualification})` : ''}
                      </span>
                    </div>
                    <div className="border-b border-gray-200 pb-0.5 pt-1 truncate">
                      <span className="font-bold text-gray-500 text-[10px] print:text-[11px] uppercase tracking-wide">Indication: </span>
                      <span className="text-gray-900 font-bold text-[11px] print:text-[12px]">{report.indication || '-'}</span>
                    </div>
                    <div className="pb-0.5 pt-1 truncate">
                      <span className="font-bold text-gray-500 text-[10px] print:text-[11px] uppercase tracking-wide">Hospital/Bill No: </span>
                      <span className="text-gray-900 font-bold text-[11px] print:text-[12px]">{report.billNumber || '-'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* FINDINGS + RIGHT IMAGES */}
            <div>
              <div className="grid grid-cols-4 gap-2">
                <div className="col-span-3 text-[13px] print:text-[14px] space-y-3 pt-1 pr-4">
                  <div>
                    <div className="font-black text-gray-900 text-[15px] print:text-[16px] uppercase tracking-wider border-b-2 border-gray-200 pb-1.5 mb-2">
                      Findings
                    </div>
                    <div className="font-bold text-gray-900 mt-2">Oral Cavity Pharynx & Larynx</div>
                  </div>
                  <div>
                    <div className="font-bold text-blue-900 mb-1.5 text-[14px] print:text-[15px]">Oesophagus</div>
                    <div className="grid grid-cols-[145px_1fr] ml-5 gap-y-1">
                      <span className="text-gray-600 font-medium">Upper:</span> {renderVal(sf.oesophagus?.upper)}
                      <span className="text-gray-600 font-medium">Middle:</span> {renderVal(sf.oesophagus?.middle)}
                      <span className="text-gray-600 font-medium">Lower G-E Junction:</span> {renderVal(sf.oesophagus?.lowerGE)}
                    </div>
                  </div>
                  <div>
                    <div className="font-bold text-blue-900 mb-1.5 mt-2 text-[14px] print:text-[15px]">Stomach</div>
                    <div className="grid grid-cols-[145px_1fr] ml-5 gap-y-1">
                      <span className="text-gray-600 font-medium">Fundus:</span> {renderVal(sf.stomach?.fundus)}
                      <span className="text-gray-600 font-medium">Body:</span> {renderVal(sf.stomach?.body)}
                      <span className="text-gray-600 font-medium">Antrum:</span> {renderVal(sf.stomach?.antrum)}
                      <span className="text-gray-600 font-medium">P-Ring:</span> {renderVal(sf.stomach?.pRing)}
                    </div>
                  </div>
                  <div>
                    <div className="font-bold text-blue-900 mb-1.5 mt-2 text-[14px] print:text-[15px]">Duodenum</div>
                    <div className="grid grid-cols-[145px_1fr] ml-5 gap-y-1">
                      <span className="text-gray-600 font-medium">Bulb:</span> {renderVal(sf.duodenum?.bulb)}
                      <span className="text-gray-600 font-medium">D2:</span> {renderVal(sf.duodenum?.d2)}
                      <span className="text-gray-600 font-medium">Papilla:</span> {renderVal(sf.duodenum?.papilla)}
                    </div>
                  </div>
                  {sf.comments && (
                    <div className="pt-3 border-t border-gray-100 mt-2 text-[13px] print:text-[14px]">
                      <span className="font-bold text-gray-900">Comments: </span>
                      <span className="text-gray-900 font-bold whitespace-pre-line">{sf.comments}</span>
                    </div>
                  )}
                </div>

                {/* Right column images */}
                <div className="col-span-1 flex flex-col gap-2 pt-1">
                  {rightImages.map((img, i) => (
                    <ImageCard
                      key={`right-${i}`}
                      src={base64Images[`clinical_${i}`] || getImageURL(img.path)}
                      caption={img.caption || img.taggedOrgan}
                      onError={() => handleImageError(`clinical_${i}`)}
                    />
                  ))}
                </div>
              </div>

              {/* Bottom row images */}
              {bottomImages.length > 0 && (
                <div className="grid grid-cols-4 gap-2 mt-2 break-inside-avoid" dir="rtl">
                  {bottomImages.map((img, i) => (
                    <div key={`bottom-${i}`} dir="ltr">
                      <ImageCard
                        src={base64Images[`clinical_${i + 3}`] || getImageURL(img.path)}
                        caption={img.caption || img.taggedOrgan}
                        onError={() => handleImageError(`clinical_${i + 3}`)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* FOOTER / SIGNATURE */}
          <div className="mt-auto pt-1 shrink-0">
            <div className="flex justify-between items-end border-t border-gray-300 pt-2">
              <div className="text-[6px] print:text-[7px] text-gray-400 font-mono pb-1"></div>
              <div className="text-center min-w-[150px]">
                {(base64Images.signature || report.performingDoctor?.signature) && !imageErrors.signature ? (
                  <img
                    src={base64Images.signature || getImageURL(report.performingDoctor.signature)}
                    className="h-8 print:h-10 mx-auto object-contain"
                    crossOrigin="anonymous"
                    alt="Signature"
                    onError={() => handleImageError('signature')}
                    style={{ mixBlendMode: 'multiply' }}
                  />
                ) : (
                  <div className="h-8 print:h-10 flex items-center justify-center text-gray-300 text-[9px] italic"></div>
                )}
                <div className="border-t border-gray-900 pt-0.5 mt-0.5">
                  <p className="font-black text-[10px] print:text-[11px] uppercase text-gray-900 tracking-tight leading-none">
                    {report.performingDoctor?.name || 'Performing Physician'}
                  </p>
                  {report.performingDoctor?.qualification && (
                    <p className="text-[8px] print:text-[9px] font-bold text-blue-900 uppercase mt-0.5 leading-none">
                      {report.performingDoctor.qualification}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PrintReport;