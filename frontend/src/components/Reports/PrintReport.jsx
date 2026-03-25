// import React, { useState, useEffect } from 'react';
// import { useParams, useNavigate } from 'react-router-dom';
// import api from '../../utils/api';
// import {
//   ArrowLeft, Printer, Download, CheckCircle,
//   Trash2, Edit, MoreHorizontal, X,
// } from 'lucide-react';
// import jsPDF from 'jspdf';
// import html2canvas from 'html2canvas';
// import toast from 'react-hot-toast';

// const getImageURL = (imagePath) => {
//   if (!imagePath || typeof imagePath !== 'string') return '';
//   if (imagePath.startsWith('http') || imagePath.startsWith('data:')) return imagePath;
//   let cleaned = imagePath.replace(/\\/g, '/').replace(/^\//, '');
//   if (!cleaned.startsWith('uploads/')) {
//     if (!cleaned.includes('/')) cleaned = `uploads/endoscopy-images/${cleaned}`;
//     else cleaned = `uploads/${cleaned}`;
//   }
//   const isDev = window.location.port === '5173' || window.location.port === '3000';
//   const backendPort = isDev ? '5000' : window.location.port;
//   const portString = backendPort ? `:${backendPort}` : '';
//   const baseURL = `${window.location.protocol}//${window.location.hostname}${portString}`;
//   return `${baseURL}/${cleaned}`;
// };

// const toBase64 = (url) =>
//   new Promise((resolve) => {
//     fetch(url, { mode: 'cors', cache: 'no-cache' })
//       .then((res) => res.blob())
//       .then((blob) => {
//         const reader = new FileReader();
//         reader.onloadend = () => resolve(reader.result);
//         reader.readAsDataURL(blob);
//       })
//       .catch(() => {
//         const img = new Image();
//         img.crossOrigin = 'anonymous';
//         img.onload = () => {
//           try {
//             const canvas = document.createElement('canvas');
//             canvas.width = img.naturalWidth;
//             canvas.height = img.naturalHeight;
//             canvas.getContext('2d').drawImage(img, 0, 0);
//             resolve(canvas.toDataURL('image/png'));
//           } catch { resolve(null); }
//         };
//         img.onerror = () => resolve(null);
//         img.src = url;
//       });
//   });

// const PrintReport = () => {
//   const { id } = useParams();
//   const navigate = useNavigate();

//   const [report, setReport] = useState(null);
//   const [settings, setSettings] = useState(null);
//   const [mobileMenu, setMobileMenu] = useState(false);
//   const [generating, setGenerating] = useState(false);
//   const [base64Images, setBase64Images] = useState({});
//   const [imagesReady, setImagesReady] = useState(false);
//   const [imageErrors, setImageErrors] = useState({});

//   const handleImageError = (key) => setImageErrors((prev) => ({ ...prev, [key]: true }));

//   useEffect(() => {
//     const init = async () => {
//       try {
//         const [r, s] = await Promise.all([api.get(`/reports/${id}`), api.get('/settings')]);
//         let reportData = r.data;
//         if (typeof reportData.customImpression === 'string' && reportData.customImpression.startsWith('{')) {
//           try { reportData.structuredFindings = JSON.parse(reportData.customImpression); } catch (e) {}
//         }
//         setReport(reportData);
//         setSettings(s.data);
//       } catch { toast.error('Error loading report'); }
//     };
//     init();
//   }, [id]);

//   useEffect(() => {
//     if (!report) return;
//     const convertAll = async () => {
//       const map = {};
//       const errors = {};
//       if (settings?.hospitalLogo) {
//         const result = await toBase64(getImageURL(settings.hospitalLogo));
//         if (result) map.hospitalLogo = result; else errors.hospitalLogo = true;
//       }
//       if (report.performingDoctor?.signature) {
//         const result = await toBase64(getImageURL(report.performingDoctor.signature));
//         if (result) map.signature = result; else errors.signature = true;
//       }
//       if (report.images?.length) {
//         const selected = report.images.filter((img) => img.isSelected !== false).slice(0, 7);
//         await Promise.all(
//           selected.map(async (img, i) => {
//             const result = await toBase64(getImageURL(img.path));
//             if (result) map[`clinical_${i}`] = result; else errors[`clinical_${i}`] = true;
//           })
//         );
//       }
//       setBase64Images(map);
//       setImageErrors(errors);
//       setImagesReady(true);
//     };
//     convertAll();
//   }, [report, settings]);

//   const handlePrint = () => {
//     if (!imagesReady) {
//       toast.loading('Preparing images...', { duration: 2000 });
//       setTimeout(() => window.print(), 2200);
//       return;
//     }
//     window.print();
//   };

//   const handlePDF = async () => {
//     if (!imagesReady) return toast.error('Images still loading...');
//     setGenerating(true);
//     const loadingToast = toast.loading('Generating PDF...');
//     try {
//       window.scrollTo(0, 0);
//       await new Promise((r) => setTimeout(r, 500));
//       const canvas = await html2canvas(document.getElementById('printable-area'), {
//         scale: 2, useCORS: true, allowTaint: true, logging: false, backgroundColor: '#ffffff', scrollY: -window.scrollY,
//       });
//       const imgData = canvas.toDataURL('image/png');
//       const pdf = new jsPDF('p', 'mm', 'a4');
//       const ratio = canvas.height / canvas.width;
//       let w = 210, h = 210 * ratio;
//       if (h > 297) { h = 297; w = 297 / ratio; }
//       pdf.addImage(imgData, 'PNG', (210 - w) / 2, 0, w, h);
//       pdf.save(`${report.patient?.name || 'Report'}_${report.reportId}.pdf`);
//       toast.dismiss(loadingToast);
//       toast.success('PDF Downloaded');
//     } catch { toast.dismiss(loadingToast); toast.error('PDF failed'); }
//     finally { setGenerating(false); }
//   };

//   const handleFinalize = async () => {
//     if (!window.confirm('Finalize this report?')) return;
//     try {
//       await api.post(`/reports/${id}/finalize`);
//       toast.success('Report finalized!');
//       const { data } = await api.get(`/reports/${id}`);
//       setReport(data);
//     } catch { toast.error('Failed to finalize'); }
//   };

//   const handleDelete = async () => {
//     if (!window.confirm('Delete this report permanently?')) return;
//     try { await api.delete(`/reports/${id}`); toast.success('Deleted'); navigate('/reports'); }
//     catch { toast.error('Failed'); }
//   };

//   if (!report) return (
//     <div className="h-[100dvh] flex items-center justify-center">
//       <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
//     </div>
//   );

//   const selectedImages = (report.images?.filter((img) => img.isSelected !== false) || []).slice(0, 7);
//   const rightImages = selectedImages.slice(0, 3);
//   const bottomImages = selectedImages.slice(3, 7);

//   const sf = report.structuredFindings || {
//     oralCavity: '', oesophagus: { upper: '', middle: '', lowerGE: '' },
//     stomach: { fundus: '', body: '', antrum: '', pRing: '' },
//     duodenum: { bulb: '', d2: '', papilla: '' }, comments: ''
//   };

//   const renderVal = (val) => {
//     if (!val) return '';
//     const isAbnormal = val.toLowerCase().trim() !== 'normal';
//     return <span className={isAbnormal ? 'text-red-600 font-bold' : 'text-gray-900 font-bold'}>{val}</span>;
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
//             margin: 0 !important; padding: 6mm 10mm 6mm 10mm !important;
//             box-shadow: none !important; border: none !important;
//             width: 210mm !important; height: 297mm !important; max-height: 297mm !important;
//             overflow: hidden !important; box-sizing: border-box !important;
//             display: flex !important; flex-direction: column !important;
//           }
//           .print-top-spacer { height: 2mm !important; min-height: 2mm !important; flex-shrink: 0 !important; }
//         }
//       `}</style>

//       <div className="min-h-[100dvh] bg-gray-100 pb-24 sm:pb-20 print:bg-white print:pb-0">

//         {/* ═══════ TOOLBAR ═══════ */}
//         <div className="bg-white shadow-sm border-b print:hidden sticky top-0 z-50">
//           <div className="max-w-[210mm] mx-auto px-3 sm:px-4 py-2.5 sm:py-3 flex justify-between items-center gap-2">
//             <button onClick={() => navigate('/reports')} className="flex items-center gap-1.5 text-gray-600 hover:text-gray-900 font-medium text-sm">
//               <ArrowLeft size={18} /><span className="hidden sm:inline">Back</span>
//             </button>
//             <div className="flex-1 text-center px-2 min-w-0">
//               <h1 className="text-sm sm:text-base font-bold text-blue-900 uppercase truncate">{report.procedureName || 'Endoscopy Report'}</h1>
//               <p className="text-[10px] sm:text-xs text-gray-500 truncate">{report.patient?.name} • {new Date(report.procedureDate).toLocaleDateString('en-IN')}</p>
//             </div>
//             <div className="hidden sm:flex items-center gap-2">
//               {report.status === 'draft' && (
//                 <>
//                   <button onClick={() => navigate(`/reports/${id}`)} className="bg-blue-50 text-blue-600 border border-blue-200 px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5 hover:bg-blue-100 font-medium"><Edit size={14} /> Edit</button>
//                   <button onClick={handleFinalize} className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5 hover:bg-green-700 shadow-md font-medium"><CheckCircle size={14} /> Finalize</button>
//                 </>
//               )}
//               <button onClick={handleDelete} className="bg-red-50 text-red-600 border border-red-200 px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5 hover:bg-red-100 font-medium"><Trash2 size={14} /> Delete</button>
//               <div className="w-px h-6 bg-gray-200" />
//               <button onClick={handlePDF} disabled={generating} className="bg-white border px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5 hover:bg-gray-50 shadow-sm font-medium disabled:opacity-50"><Download size={14} /> {generating ? 'Wait...' : 'PDF'}</button>
//               <button onClick={handlePrint} className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5 hover:bg-blue-700 shadow-md font-medium"><Printer size={14} /> Print</button>
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
//                       <button onClick={() => { navigate(`/reports/${id}`); setMobileMenu(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-blue-600 hover:bg-gray-50"><Edit size={16} /> Edit</button>
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

//         {/* ═══════════════════════════════════════════════════════════════
//             A4 PRINTABLE AREA
//             ═══════════════════════════════════════════════════════════════ */}
//         <div id="printable-area" className="max-w-[210mm] mx-auto bg-white my-4 min-h-[297mm] shadow-xl p-5 md:p-6 relative box-border flex flex-col">

//           <div className="print-top-spacer h-4 flex-shrink-0"></div>

//           <div className="flex-shrink-0">

//             {/* ═══════════════════════════════════════════════════
//                 🏥 HERO — Centered Hospital Header
//                 ═══════════════════════════════════════════════════ */}
//             <div className="text-center pb-1.5 mb-0">
//               <div className="flex items-center justify-center gap-3 mb-1">
//                 {(base64Images.hospitalLogo || settings?.hospitalLogo) && !imageErrors.hospitalLogo && (
//                   <img
//                     src={base64Images.hospitalLogo || getImageURL(settings.hospitalLogo)}
//                     className="h-11 print:h-12 w-auto object-contain flex-shrink-0"
//                     alt="Logo"
//                     onError={() => handleImageError('hospitalLogo')}
//                   />
//                 )}
//                 <div>
//                   <h1 className="text-[22px] print:text-[24px] font-black text-blue-900 uppercase leading-none tracking-tight">
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

//               {/* Decorative line */}
//               <div className="flex items-center gap-2 mt-1.5 mb-1">
//                 <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent via-blue-300 to-blue-600"></div>
//                 <div className="flex-1 h-[1px] bg-gradient-to-l from-transparent via-blue-300 to-blue-600"></div>
//               </div>

//               {/* Endoscopy Unit Banner */}
//               <div className="inline-block">
//                 <div className="bg-gradient-to-r from-blue-800 via-blue-900 to-blue-800 text-white px-8 py-1 rounded-md shadow-sm">
//                   <span className="text-[13px] print:text-[14px] font-black uppercase tracking-[0.25em] leading-none">
//                     Endoscopy Unit
//                   </span>
//                 </div>
//               </div>

//               <div className="mt-1 text-[8px] print:text-[9px] text-gray-400 font-mono">
//                 RID: {report.reportId}
//               </div>
//             </div>

//             {/* ═══════════════════════════════════════════════════
//                 📋 PATIENT INFO 
//                 ═══════════════════════════════════════════════════ */}
//             {/* Reduced mb-6 print:mb-8 to mb-3 print:mb-4 (pulls Findings UP by ~0.5 inch) */}
//             <div className="bg-gray-50 border border-gray-200 rounded-lg p-1.5 mb-3 print:mb-4">
//               <div className="grid grid-cols-3 gap-x-3 gap-y-0.5">
//                 {/* Row 1: Name, ID, Age */}
//                 <div className="flex justify-between items-end border-b border-gray-200 pb-0.5">
//                   <span className="font-bold text-gray-500 text-[10px] print:text-[11px]">Patient Name</span>
//                   <span className="text-gray-900 font-black uppercase text-[11px] print:text-[12px]">{report.patient?.name}</span>
//                 </div>
//                 <div className="flex justify-between items-end border-b border-gray-200 pb-0.5">
//                   <span className="font-bold text-gray-500 text-[10px] print:text-[11px]">Patient ID</span>
//                   <span className="text-gray-900 font-bold text-[11px] print:text-[12px]">{report.patient?.patientId}</span>
//                 </div>
//                 <div className="flex justify-between items-end border-b border-gray-200 pb-0.5">
//                   <span className="font-bold text-gray-500 text-[10px] print:text-[11px]">Age / Sex</span>
//                   <span className="text-gray-900 font-bold text-[11px] print:text-[12px]">{report.patient?.age} Y / {report.patient?.sex}</span>
//                 </div>

//                 {/* Row 2: Indication, Date, Ref By */}
//                 <div className="flex justify-between items-end border-b border-gray-200 pb-0.5">
//                   <span className="font-bold text-gray-500 text-[10px] print:text-[11px]">Indication</span>
//                   <span className="text-gray-900 font-bold text-[11px] print:text-[12px] truncate max-w-[130px] text-right">{report.indication || '-'}</span>
//                 </div>
//                 <div className="flex justify-between items-end border-b border-gray-200 pb-0.5">
//                   <span className="font-bold text-gray-500 text-[10px] print:text-[11px]">Date</span>
//                   <span className="text-gray-900 font-bold text-[11px] print:text-[12px]">{new Date(report.procedureDate).toLocaleDateString('en-IN')}</span>
//                 </div>
//                 <div className="flex justify-between items-end border-b border-gray-200 pb-0.5">
//                   <span className="font-bold text-gray-500 text-[10px] print:text-[11px]">Ref By</span>
//                   <span className="text-gray-900 font-bold text-[11px] print:text-[12px] truncate max-w-[120px] text-right">{report.referringDoctor || 'Self'}</span>
//                 </div>

//                 {/* Row 3: Procedure (full width) */}
//                 <div className="flex justify-between items-end border-b border-gray-200 pb-0.5 col-span-3">
//                   <span className="font-bold text-gray-500 text-[10px] print:text-[11px]">Procedure</span>
//                   <span className="text-blue-900 font-black uppercase text-[11px] print:text-[12px] truncate max-w-[400px] text-right">{report.procedureName}</span>
//                 </div>

//                 {/* Row 4: OPD/IPD, Bill, Time */}
//                 <div className="flex justify-between items-end border-b border-gray-200 pb-0.5">
//                   <span className="font-bold text-gray-500 text-[10px] print:text-[11px]">OPD/IPD No</span>
//                   <span className="text-gray-900 font-bold text-[11px] print:text-[12px]">{report.opdIpdNumber || '-'}</span>
//                 </div>
//                 <div className="flex justify-between items-end border-b border-gray-200 pb-0.5">
//                   <span className="font-bold text-gray-500 text-[10px] print:text-[11px]">Bill No</span>
//                   <span className="text-gray-900 font-bold text-[11px] print:text-[12px]">{report.billNumber || '-'}</span>
//                 </div>
//                 <div className="flex justify-between items-end border-b border-gray-200 pb-0.5">
//                   <span className="font-bold text-gray-500 text-[10px] print:text-[11px]">Time</span>
//                   <span className="text-gray-900 font-bold text-[11px] print:text-[12px]">{report.procedureTime || '-'}</span>
//                 </div>
//               </div>
//             </div>

//             {/* ═══════════════════════════════════════════════════
//                 🔍 SPACIOUS FINDINGS + RIGHT IMAGES 
//                 ═══════════════════════════════════════════════════ */}
//             <div>
//               <div className="flex flex-row justify-between gap-4">
                
//                 {/* 🔴 LEFT: SPACIOUS FINDINGS SECTION (Adjusted vertical spacing) */}
//                 <div className="w-[72%] text-[13px] print:text-[14px] space-y-3 pt-1">
                  
//                   {/* Section Title */}
//                   <div>
//                     <div className="font-black text-gray-900 text-[15px] print:text-[16px] uppercase tracking-wider border-b-2 border-gray-200 pb-1.5 mb-2">
//                       Findings
//                     </div>
//                     <div className="font-bold text-gray-900 mt-2">Oral Cavity Pharynx & Larynx</div>
//                   </div>

//                   {/* Oesophagus */}
//                   <div>
//                     <div className="font-bold text-blue-900 mb-1.5 text-[14px] print:text-[15px]">Oesophagus</div>
//                     <div className="grid grid-cols-[145px_1fr] ml-5 gap-y-1">
//                       <span className="text-gray-600 font-medium">Upper:</span> {renderVal(sf.oesophagus?.upper)}
//                       <span className="text-gray-600 font-medium">Middle:</span> {renderVal(sf.oesophagus?.middle)}
//                       <span className="text-gray-600 font-medium">Lower G-E Junction:</span> {renderVal(sf.oesophagus?.lowerGE)}
//                     </div>
//                   </div>

//                   {/* Stomach */}
//                   <div>
//                     <div className="font-bold text-blue-900 mb-1.5 mt-2 text-[14px] print:text-[15px]">Stomach</div>
//                     <div className="grid grid-cols-[145px_1fr] ml-5 gap-y-1">
//                       <span className="text-gray-600 font-medium">Fundus:</span> {renderVal(sf.stomach?.fundus)}
//                       <span className="text-gray-600 font-medium">Body:</span> {renderVal(sf.stomach?.body)}
//                       <span className="text-gray-600 font-medium">Antrum:</span> {renderVal(sf.stomach?.antrum)}
//                       <span className="text-gray-600 font-medium">P-Ring:</span> {renderVal(sf.stomach?.pRing)}
//                     </div>
//                   </div>

//                   {/* Duodenum */}
//                   <div>
//                     <div className="font-bold text-blue-900 mb-1.5 mt-2 text-[14px] print:text-[15px]">Duodenum</div>
//                     <div className="grid grid-cols-[145px_1fr] ml-5 gap-y-1">
//                       <span className="text-gray-600 font-medium">Bulb:</span> {renderVal(sf.duodenum?.bulb)}
//                       <span className="text-gray-600 font-medium">D2:</span> {renderVal(sf.duodenum?.d2)}
//                       <span className="text-gray-600 font-medium">Papilla:</span> {renderVal(sf.duodenum?.papilla)}
//                     </div>
//                   </div>

//                   {/* Comments (Only renders if it has content) */}
//                   {sf.comments && (
//                     <div className="pt-3 border-t border-gray-100 mt-2">
//                       <div className="font-bold text-gray-900 mb-1.5 text-[14px] print:text-[15px]">Comments / Impression:</div>
//                       <div className="ml-5 whitespace-pre-line text-gray-900 font-bold leading-relaxed">
//                         {sf.comments}
//                       </div>
//                     </div>
//                   )}
//                 </div>

//                 {/* RIGHT: 3 Images */}
//                 <div className="w-[26%] flex flex-col gap-2 pt-1">
//                   {rightImages.map((img, i) => {
//                     const imgKey = `clinical_${i}`;
//                     const imgSrc = base64Images[imgKey] || getImageURL(img.path);
//                     const captionText = img.caption || img.taggedOrgan;
//                     return (
//                       <div key={i} className="border-2 border-gray-800 bg-white w-full flex flex-col overflow-hidden break-inside-avoid shadow-sm rounded-[2px]">
//                         <div className="aspect-[4/3] w-full bg-black">
//                           <img src={imgSrc} className="w-full h-full object-cover" alt="Endoscopy" />
//                         </div>
//                         {captionText && (
//                           <div className="text-[9px] print:text-[10px] text-gray-900 w-full text-center font-bold py-1 px-1 border-t-2 border-gray-800 truncate bg-gray-50">
//                             {captionText}
//                           </div>
//                         )}
//                       </div>
//                     );
//                   })}
//                 </div>
//               </div>

//               {/* BOTTOM ROW: Up to 4 more images */}
//               {/* Reduced mt-6 print:mt-8 to mt-3 print:mt-4 (pulls bottom images UP by ~0.5 inch) */}
//               {bottomImages.length > 0 && (
//                 <div className="grid grid-cols-4 gap-2 mt-3 print:mt-4 break-inside-avoid" dir="rtl">
//                   {bottomImages.map((img, i) => {
//                     const imgKey = `clinical_${i + 3}`;
//                     const imgSrc = base64Images[imgKey] || getImageURL(img.path);
//                     const captionText = img.caption || img.taggedOrgan;
//                     return (
//                       <div key={i} className="border-2 border-gray-800 bg-white w-full flex flex-col overflow-hidden break-inside-avoid shadow-sm rounded-[2px]" dir="ltr">
//                         <div className="aspect-[4/3] w-full bg-black">
//                           <img src={imgSrc} className="w-full h-full object-cover" alt="Endoscopy" />
//                         </div>
//                         {captionText && (
//                           <div className="text-[9px] print:text-[10px] text-gray-900 w-full text-center font-bold py-1 px-1 border-t-2 border-gray-800 truncate bg-gray-50">
//                             {captionText}
//                           </div>
//                         )}
//                       </div>
//                     );
//                   })}
//                 </div>
//               )}
//             </div>
//           </div>

//           {/* ═══════════════════════════════════════════════════
//               ✍️ FOOTER
//               ═══════════════════════════════════════════════════ */}
//           <div className="mt-auto pt-1 shrink-0">
//             <div className="flex justify-between items-end border-t border-gray-300 pt-2">
//               <div className="text-[6px] print:text-[7px] text-gray-400 font-mono pb-1">
//                 <p className="font-bold text-gray-500 mb-0.5">Report Info:</p>
//                 <p>Gen: {new Date().toLocaleString()}</p>
//                 <p>ID: {report.reportId}</p>
//               </div>
//               <div className="text-center min-w-[150px]">
//                 {(base64Images.signature || report.performingDoctor?.signature) && !imageErrors.signature ? (
//                   <img
//                     src={base64Images.signature || getImageURL(report.performingDoctor.signature)}
//                     className="h-8 print:h-10 mx-auto object-contain mix-blend-multiply"
//                     alt="Signature"
//                     onError={() => handleImageError('signature')}
//                   />
//                 ) : (
//                   <div className="h-8 print:h-10 flex items-center justify-center text-gray-300 text-[9px] italic">[Signature]</div>
//                 )}
//                 <div className="border-t border-gray-900 pt-0.5 mt-0.5">
//                   <p className="font-black text-[10px] print:text-[11px] uppercase text-gray-900 tracking-tight leading-none">
//                     Dr. {report.performingDoctor?.name || 'Performing Physician'}
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


import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import {
  ArrowLeft, Printer, Download, CheckCircle,
  Trash2, Edit, MoreHorizontal, X,
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import toast from 'react-hot-toast';

const getImageURL = (imagePath) => {
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
};

const toBase64 = (url) =>
  new Promise((resolve) => {
    fetch(url, { mode: 'cors', cache: 'no-cache' })
      .then((res) => res.blob())
      .then((blob) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      })
      .catch(() => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            canvas.getContext('2d').drawImage(img, 0, 0);
            resolve(canvas.toDataURL('image/png'));
          } catch { resolve(null); }
        };
        img.onerror = () => resolve(null);
        img.src = url;
      });
  });

const PrintReport = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [report, setReport] = useState(null);
  const [settings, setSettings] = useState(null);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [base64Images, setBase64Images] = useState({});
  const [imagesReady, setImagesReady] = useState(false);
  const [imageErrors, setImageErrors] = useState({});

  const handleImageError = (key) => setImageErrors((prev) => ({ ...prev, [key]: true }));

  useEffect(() => {
    const init = async () => {
      try {
        const [r, s] = await Promise.all([api.get(`/reports/${id}`), api.get('/settings')]);
        let reportData = r.data;
        if (typeof reportData.customImpression === 'string' && reportData.customImpression.startsWith('{')) {
          try { reportData.structuredFindings = JSON.parse(reportData.customImpression); } catch (e) {}
        }
        setReport(reportData);
        setSettings(s.data);
      } catch { toast.error('Error loading report'); }
    };
    init();
  }, [id]);

  useEffect(() => {
    if (!report) return;
    const convertAll = async () => {
      const map = {};
      const errors = {};
      if (settings?.hospitalLogo) {
        const result = await toBase64(getImageURL(settings.hospitalLogo));
        if (result) map.hospitalLogo = result; else errors.hospitalLogo = true;
      }
      if (report.performingDoctor?.signature) {
        const result = await toBase64(getImageURL(report.performingDoctor.signature));
        if (result) map.signature = result; else errors.signature = true;
      }
      if (report.images?.length) {
        const selected = report.images.filter((img) => img.isSelected !== false).slice(0, 7);
        await Promise.all(
          selected.map(async (img, i) => {
            const result = await toBase64(getImageURL(img.path));
            if (result) map[`clinical_${i}`] = result; else errors[`clinical_${i}`] = true;
          })
        );
      }
      setBase64Images(map);
      setImageErrors(errors);
      setImagesReady(true);
    };
    convertAll();
  }, [report, settings]);

  const handlePrint = () => {
    if (!imagesReady) {
      toast.loading('Preparing images...', { duration: 2000 });
      setTimeout(() => window.print(), 2200);
      return;
    }
    window.print();
  };

  const handlePDF = async () => {
    if (!imagesReady) return toast.error('Images still loading...');
    setGenerating(true);
    const loadingToast = toast.loading('Generating PDF...');
    try {
      window.scrollTo(0, 0);
      await new Promise((r) => setTimeout(r, 500));
      const canvas = await html2canvas(document.getElementById('printable-area'), {
        scale: 2, useCORS: true, allowTaint: true, logging: false, backgroundColor: '#ffffff', scrollY: -window.scrollY,
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const ratio = canvas.height / canvas.width;
      let w = 210, h = 210 * ratio;
      if (h > 297) { h = 297; w = 297 / ratio; }
      pdf.addImage(imgData, 'PNG', (210 - w) / 2, 0, w, h);
      pdf.save(`${report.patient?.name || 'Report'}_${report.reportId}.pdf`);
      toast.dismiss(loadingToast);
      toast.success('PDF Downloaded');
    } catch { toast.dismiss(loadingToast); toast.error('PDF failed'); }
    finally { setGenerating(false); }
  };

  const handleFinalize = async () => {
    if (!window.confirm('Finalize this report?')) return;
    try {
      await api.post(`/reports/${id}/finalize`);
      toast.success('Report finalized!');
      const { data } = await api.get(`/reports/${id}`);
      setReport(data);
    } catch { toast.error('Failed to finalize'); }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this report permanently?')) return;
    try { await api.delete(`/reports/${id}`); toast.success('Deleted'); navigate('/reports'); }
    catch { toast.error('Failed'); }
  };

  // Helper for formatting date to "04-Nov-2025"
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-GB', { 
      day: '2-digit', month: 'short', year: 'numeric' 
    }).replace(/ /g, '-');
  };

  if (!report) return (
    <div className="h-[100dvh] flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
    </div>
  );

  const selectedImages = (report.images?.filter((img) => img.isSelected !== false) || []).slice(0, 7);
  const rightImages = selectedImages.slice(0, 3);
  const bottomImages = selectedImages.slice(3, 7);

  const sf = report.structuredFindings || {
    oralCavity: '', oesophagus: { upper: '', middle: '', lowerGE: '' },
    stomach: { fundus: '', body: '', antrum: '', pRing: '' },
    duodenum: { bulb: '', d2: '', papilla: '' }, comments: ''
  };

  const renderVal = (val) => {
    if (!val) return '';
    const isAbnormal = val.toLowerCase().trim() !== 'normal';
    return <span className={isAbnormal ? 'text-red-600 font-bold' : 'text-gray-900 font-bold'}>{val}</span>;
  };

  return (
    <>
      <style>{`
        @media print {
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          @page { margin: 0; size: A4 portrait; }
          body { background: white !important; margin: 0; padding: 0; }
          .print\\:hidden, .no-print { display: none !important; }
          img { display: inline-block !important; visibility: visible !important; max-width: 100% !important; break-inside: avoid !important; }
          #printable-area {
            position: absolute !important; top: 0 !important; left: 0 !important;
            margin: 0 !important; padding: 6mm 10mm 6mm 10mm !important;
            box-shadow: none !important; border: none !important;
            width: 210mm !important; height: 297mm !important; max-height: 297mm !important;
            overflow: hidden !important; box-sizing: border-box !important;
            display: flex !important; flex-direction: column !important;
          }
          .print-top-spacer { height: 2mm !important; min-height: 2mm !important; flex-shrink: 0 !important; }
        }
      `}</style>

      <div className="min-h-[100dvh] bg-gray-100 pb-24 sm:pb-20 print:bg-white print:pb-0">

        {/* ═══════ TOOLBAR ═══════ */}
        <div className="bg-white shadow-sm border-b print:hidden sticky top-0 z-50">
          <div className="max-w-[210mm] mx-auto px-3 sm:px-4 py-2.5 sm:py-3 flex justify-between items-center gap-2">
            <button onClick={() => navigate('/reports')} className="flex items-center gap-1.5 text-gray-600 hover:text-gray-900 font-medium text-sm">
              <ArrowLeft size={18} /><span className="hidden sm:inline">Back</span>
            </button>
            <div className="flex-1 text-center px-2 min-w-0">
              <h1 className="text-sm sm:text-base font-bold text-blue-900 uppercase truncate">{report.procedureName || 'Endoscopy Report'}</h1>
              <p className="text-[10px] sm:text-xs text-gray-500 truncate">{report.patient?.name} • {formatDate(report.procedureDate)}</p>
            </div>
            <div className="hidden sm:flex items-center gap-2">
              {report.status === 'draft' && (
                <>
                  <button onClick={() => navigate(`/reports/${id}`)} className="bg-blue-50 text-blue-600 border border-blue-200 px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5 hover:bg-blue-100 font-medium"><Edit size={14} /> Edit</button>
                  <button onClick={handleFinalize} className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5 hover:bg-green-700 shadow-md font-medium"><CheckCircle size={14} /> Finalize</button>
                </>
              )}
              <button onClick={handleDelete} className="bg-red-50 text-red-600 border border-red-200 px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5 hover:bg-red-100 font-medium"><Trash2 size={14} /> Delete</button>
              <div className="w-px h-6 bg-gray-200" />
              <button onClick={handlePDF} disabled={generating} className="bg-white border px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5 hover:bg-gray-50 shadow-sm font-medium disabled:opacity-50"><Download size={14} /> {generating ? 'Wait...' : 'PDF'}</button>
              <button onClick={handlePrint} className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5 hover:bg-blue-700 shadow-md font-medium"><Printer size={14} /> Print</button>
            </div>
            <div className="sm:hidden relative">
              <button onClick={() => setMobileMenu(o => !o)} className="p-2 rounded-lg text-gray-600 hover:bg-gray-100">
                {mobileMenu ? <X size={20} /> : <MoreHorizontal size={20} />}
              </button>
              {mobileMenu && (
                <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-xl shadow-2xl border z-50 py-1">
                  <button onClick={() => { handlePrint(); setMobileMenu(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50"><Printer size={16} /> Print</button>
                  <button onClick={() => { handlePDF(); setMobileMenu(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50"><Download size={16} /> PDF</button>
                  {report.status === 'draft' && (
                    <>
                      <div className="border-t my-1" />
                      <button onClick={() => { navigate(`/reports/${id}`); setMobileMenu(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-blue-600 hover:bg-gray-50"><Edit size={16} /> Edit</button>
                      <button onClick={() => { handleFinalize(); setMobileMenu(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-green-600 hover:bg-gray-50"><CheckCircle size={16} /> Finalize</button>
                    </>
                  )}
                  <div className="border-t my-1" />
                  <button onClick={() => { handleDelete(); setMobileMenu(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-gray-50"><Trash2 size={16} /> Delete</button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            A4 PRINTABLE AREA
            ═══════════════════════════════════════════════════════════════ */}
        <div id="printable-area" className="max-w-[210mm] mx-auto bg-white my-4 min-h-[297mm] shadow-xl p-5 md:p-6 relative box-border flex flex-col">

          <div className="print-top-spacer h-4 flex-shrink-0"></div>

          <div className="flex-shrink-0">

            {/* ═══════════════════════════════════════════════════
                🏥 HERO — Centered Hospital Header
                ═══════════════════════════════════════════════════ */}
            <div className="text-center pb-2 mb-0 flex-shrink-0">
              <div className="flex items-center justify-center gap-3 mb-1">
                {(base64Images.hospitalLogo || settings?.hospitalLogo) && !imageErrors.hospitalLogo && (
                  <img
                    src={base64Images.hospitalLogo || getImageURL(settings.hospitalLogo)}
                    className="h-12 print:h-14 w-auto object-contain flex-shrink-0"
                    alt="Logo"
                    onError={() => handleImageError('hospitalLogo')}
                  />
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

              {/* Decorative line */}
              <div className="flex items-center gap-2 mt-1.5 mb-1">
                <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent via-blue-300 to-blue-600"></div>
                <div className="flex-1 h-[1px] bg-gradient-to-l from-transparent via-blue-300 to-blue-600"></div>
              </div>

              {/* Endoscopy Unit Banner */}
              <div className="inline-block mt-0.5">
                <div className="bg-gradient-to-r from-blue-800 via-blue-900 to-blue-800 text-white px-8 py-1 rounded-md shadow-sm">
                  <span className="text-[13px] print:text-[14px] font-black uppercase tracking-[0.25em] leading-none">
                    Endoscopy Unit
                  </span>
                </div>
              </div>

              {/* <div className="mt-1 text-[8px] print:text-[9px] text-gray-400 font-mono">
                RID: {report.reportId}
              </div> */}
            </div>

            {/* ═══════════════════════════════════════════════════
                📋 PATIENT INFO — 2-Column inside Old Gray Box Style
                ═══════════════════════════════════════════════════ */}
            <div className="mb-3 print:mb-4 mt-2 flex-shrink-0">

              {/* Old Gray Box Style */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 px-3 shadow-sm">
                <div className="grid grid-cols-2 gap-x-8 gap-y-[3px]">
                  
                  {/* Row 1 */}
                  <div className="border-b border-gray-200 pb-0.5 truncate">
                    <span className="font-bold text-gray-500 text-[10px] print:text-[11px] uppercase tracking-wide">Patient ID: </span>
                    <span className="text-gray-900 font-bold text-[11px] print:text-[12px]">{report.patient?.patientId || '-'}</span>
                  </div>
                  <div className="border-b border-gray-200 pb-0.5 truncate">
                    <span className="font-bold text-gray-500 text-[10px] print:text-[11px] uppercase tracking-wide">Ref By: </span>
                    <span className="text-gray-900 font-bold text-[11px] print:text-[12px]">{report.referringDoctor || 'Self'}</span>
                  </div>

                  {/* Row 2 */}
                  <div className="border-b border-gray-200 pb-0.5 truncate">
                    <span className="font-bold text-gray-500 text-[10px] print:text-[11px] uppercase tracking-wide">Name: </span>
                    <span className="text-gray-900 font-black uppercase text-[11px] print:text-[12px]">{report.patient?.name || '-'}</span>
                  </div>
                  <div className="border-b border-gray-200 pb-0.5 truncate">
                    <span className="font-bold text-gray-500 text-[10px] print:text-[11px] uppercase tracking-wide">Study: </span>
                    <span className="text-blue-900 font-black uppercase text-[11px] print:text-[12px]">{report.procedureName || 'Endoscopy'}</span>
                  </div>

                  {/* Row 3 */}
                  <div className="border-b border-gray-200 pb-0.5 truncate">
                    <span className="font-bold text-gray-500 text-[10px] print:text-[11px] uppercase tracking-wide">Age / Sex: </span>
                    <span className="text-gray-900 font-bold text-[11px] print:text-[12px]">
                      {report.patient?.age ? `${report.patient.age} Y` : '-'} / {report.patient?.sex?.charAt(0) || 'M'}
                    </span>
                  </div>
                  <div className="border-b border-gray-200 pb-0.5 truncate">
                    <span className="font-bold text-gray-500 text-[10px] print:text-[11px] uppercase tracking-wide">Examined By: </span>
                    <span className="text-gray-900 font-bold text-[11px] print:text-[12px]">
                      Dr. {report.performingDoctor?.name || '-'} {report.performingDoctor?.qualification ? `(${report.performingDoctor.qualification})` : ''}
                    </span>
                  </div>

                  {/* Row 4 */}
                  <div className="border-b border-gray-200 pb-0.5 truncate">
                    <span className="font-bold text-gray-500 text-[10px] print:text-[11px] uppercase tracking-wide">Date: </span>
                    <span className="text-gray-900 font-bold text-[11px] print:text-[12px]">{formatDate(report.procedureDate)}</span>
                  </div>
                  <div className="border-b border-gray-200 pb-0.5 truncate">
                    <span className="font-bold text-gray-500 text-[10px] print:text-[11px] uppercase tracking-wide">Indication: </span>
                    <span className="text-gray-900 font-bold text-[11px] print:text-[12px]">{report.indication || '-'}</span>
                  </div>

                  {/* Row 5 */}
                  <div className="border-b-0 pb-0.5 pt-0.5 truncate">
                    <span className="font-bold text-gray-500 text-[10px] print:text-[11px] uppercase tracking-wide">Hospital ID: </span>
                    <span className="text-gray-900 font-bold text-[11px] print:text-[12px]">{report.opdIpdNumber || '-'}</span>
                  </div>
                  <div className="border-b-0 pb-0.5 pt-0.5 truncate">
                    <span className="font-bold text-gray-500 text-[10px] print:text-[11px] uppercase tracking-wide">Bill No: </span>
                    <span className="text-gray-900 font-bold text-[11px] print:text-[12px]">{report.billNumber || '-'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ═══════════════════════════════════════════════════
                🔍 SPACIOUS FINDINGS + RIGHT IMAGES 
                ═══════════════════════════════════════════════════ */}
            <div>
              <div className="flex flex-row justify-between gap-4">
                
                {/* 🔴 LEFT: SPACIOUS FINDINGS SECTION */}
                <div className="w-[72%] text-[13px] print:text-[14px] space-y-3 pt-1">
                  
                  {/* Section Title */}
                  <div>
                    <div className="font-black text-gray-900 text-[15px] print:text-[16px] uppercase tracking-wider border-b-2 border-gray-200 pb-1.5 mb-2">
                      Findings
                    </div>
                    <div className="font-bold text-gray-900 mt-2">Oral Cavity Pharynx & Larynx</div>
                  </div>

                  {/* Oesophagus */}
                  <div>
                    <div className="font-bold text-blue-900 mb-1.5 text-[14px] print:text-[15px]">Oesophagus</div>
                    <div className="grid grid-cols-[145px_1fr] ml-5 gap-y-1">
                      <span className="text-gray-600 font-medium">Upper:</span> {renderVal(sf.oesophagus?.upper)}
                      <span className="text-gray-600 font-medium">Middle:</span> {renderVal(sf.oesophagus?.middle)}
                      <span className="text-gray-600 font-medium">Lower G-E Junction:</span> {renderVal(sf.oesophagus?.lowerGE)}
                    </div>
                  </div>

                  {/* Stomach */}
                  <div>
                    <div className="font-bold text-blue-900 mb-1.5 mt-2 text-[14px] print:text-[15px]">Stomach</div>
                    <div className="grid grid-cols-[145px_1fr] ml-5 gap-y-1">
                      <span className="text-gray-600 font-medium">Fundus:</span> {renderVal(sf.stomach?.fundus)}
                      <span className="text-gray-600 font-medium">Body:</span> {renderVal(sf.stomach?.body)}
                      <span className="text-gray-600 font-medium">Antrum:</span> {renderVal(sf.stomach?.antrum)}
                      <span className="text-gray-600 font-medium">P-Ring:</span> {renderVal(sf.stomach?.pRing)}
                    </div>
                  </div>

                  {/* Duodenum */}
                  <div>
                    <div className="font-bold text-blue-900 mb-1.5 mt-2 text-[14px] print:text-[15px]">Duodenum</div>
                    <div className="grid grid-cols-[145px_1fr] ml-5 gap-y-1">
                      <span className="text-gray-600 font-medium">Bulb:</span> {renderVal(sf.duodenum?.bulb)}
                      <span className="text-gray-600 font-medium">D2:</span> {renderVal(sf.duodenum?.d2)}
                      <span className="text-gray-600 font-medium">Papilla:</span> {renderVal(sf.duodenum?.papilla)}
                    </div>
                  </div>

                  {/* Comments */}
                  {sf.comments && (
                    <div className="pt-3 border-t border-gray-100 mt-2">
                      <div className="font-bold text-gray-900 mb-1.5 text-[14px] print:text-[15px]">Comments / Impression:</div>
                      <div className="ml-5 whitespace-pre-line text-gray-900 font-bold leading-relaxed">
                        {sf.comments}
                      </div>
                    </div>
                  )}
                </div>

                {/* RIGHT: 3 Images */}
                <div className="w-[26%] flex flex-col gap-2 pt-1">
                  {rightImages.map((img, i) => {
                    const imgKey = `clinical_${i}`;
                    const imgSrc = base64Images[imgKey] || getImageURL(img.path);
                    const captionText = img.caption || img.taggedOrgan;
                    return (
                      <div key={i} className="border-2 border-gray-800 bg-white w-full flex flex-col overflow-hidden break-inside-avoid shadow-sm rounded-[2px]">
                        <div className="aspect-[4/3] w-full bg-black">
                          <img src={imgSrc} className="w-full h-full object-cover" alt="Endoscopy" />
                        </div>
                        {captionText && (
                          <div className="text-[9px] print:text-[10px] text-gray-900 w-full text-center font-bold py-1 px-1 border-t-2 border-gray-800 truncate bg-gray-50">
                            {captionText}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* BOTTOM ROW: Up to 4 more images */}
              {bottomImages.length > 0 && (
                <div className="grid grid-cols-4 gap-2 mt-3 print:mt-4 break-inside-avoid" dir="rtl">
                  {bottomImages.map((img, i) => {
                    const imgKey = `clinical_${i + 3}`;
                    const imgSrc = base64Images[imgKey] || getImageURL(img.path);
                    const captionText = img.caption || img.taggedOrgan;
                    return (
                      <div key={i} className="border-2 border-gray-800 bg-white w-full flex flex-col overflow-hidden break-inside-avoid shadow-sm rounded-[2px]" dir="ltr">
                        <div className="aspect-[4/3] w-full bg-black">
                          <img src={imgSrc} className="w-full h-full object-cover" alt="Endoscopy" />
                        </div>
                        {captionText && (
                          <div className="text-[9px] print:text-[10px] text-gray-900 w-full text-center font-bold py-1 px-1 border-t-2 border-gray-800 truncate bg-gray-50">
                            {captionText}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════
              ✍️ FOOTER
              ═══════════════════════════════════════════════════ */}
          <div className="mt-auto pt-1 shrink-0">
            <div className="flex justify-between items-end border-t border-gray-300 pt-2">
              <div className="text-[6px] print:text-[7px] text-gray-400 font-mono pb-1">
                {/* <p className="font-bold text-gray-500 mb-0.5">Report Info:</p> */}
                {/* <p>Gen: {new Date().toLocaleString()}</p>
                <p>ID: {report.reportId}</p> */}
              </div>
              <div className="text-center min-w-[150px]">
                {(base64Images.signature || report.performingDoctor?.signature) && !imageErrors.signature ? (
                  <img
                    src={base64Images.signature || getImageURL(report.performingDoctor.signature)}
                    className="h-8 print:h-10 mx-auto object-contain mix-blend-multiply"
                    alt="Signature"
                    onError={() => handleImageError('signature')}
                  />
                ) : (
                  <div className="h-8 print:h-10 flex items-center justify-center text-gray-300 text-[9px] italic"></div>
                )}
                <div className="border-t border-gray-900 pt-0.5 mt-0.5">
                  <p className="font-black text-[10px] print:text-[11px] uppercase text-gray-900 tracking-tight leading-none">
                    Dr. {report.performingDoctor?.name || 'Performing Physician'}
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