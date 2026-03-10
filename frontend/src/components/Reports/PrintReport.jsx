// import React, { useState, useEffect } from 'react';
// import { useParams, useNavigate } from 'react-router-dom';
// import api from '../../utils/api';
// import {
//   ArrowLeft, Printer, Download, CheckCircle, Trash2,
//   Edit, AlertTriangle, MoreHorizontal, X, Share2,
// } from 'lucide-react';
// import jsPDF from 'jspdf';
// import html2canvas from 'html2canvas';
// import toast from 'react-hot-toast';
// import clsx from 'clsx';

// /* ──────────────────────────────────────────
//    Helper: Build image URL from stored path
//    ────────────────────────────────────────── */
// const getImageURL = (imagePath) => {
//   if (!imagePath) return '';
//   if (imagePath.startsWith('http') || imagePath.startsWith('data:')) {
//     return imagePath;
//   }

//   let cleaned = imagePath.replace(/\\/g, '/').replace(/^\//, '');
//   let baseURL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api')
//     .replace(/\/api\/?$/, '')
//     .replace(/\/$/, '');

//   if (!cleaned.startsWith('uploads/')) {
//     cleaned = `uploads/${cleaned}`;
//   }

//   return `${baseURL}/${cleaned}`;
// };

// /* ──────────────────────────────────────────
//    Helper: Convert image URL → base64
//    with multiple fallback strategies
//    ────────────────────────────────────────── */
// const toBase64 = (url) =>
//   new Promise((resolve) => {
//     // Strategy 1: Use fetch + blob (better CORS handling)
//     fetch(url, { mode: 'cors' })
//       .then((res) => {
//         if (!res.ok) throw new Error(`HTTP ${res.status}`);
//         return res.blob();
//       })
//       .then((blob) => {
//         const reader = new FileReader();
//         reader.onloadend = () => resolve(reader.result);
//         reader.onerror = () => resolve(url); // fallback
//         reader.readAsDataURL(blob);
//       })
//       .catch(() => {
//         // Strategy 2: Canvas approach
//         const img = new Image();
//         img.crossOrigin = 'anonymous';
//         img.onload = () => {
//           try {
//             const canvas = document.createElement('canvas');
//             canvas.width = img.naturalWidth;
//             canvas.height = img.naturalHeight;
//             canvas.getContext('2d').drawImage(img, 0, 0);
//             resolve(canvas.toDataURL('image/png'));
//           } catch {
//             console.warn('Canvas tainted for:', url);
//             resolve(url);
//           }
//         };
//         img.onerror = () => {
//           console.error('Image failed to load:', url);
//           resolve(''); // empty = will show placeholder
//         };
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
//   const [imageErrors, setImageErrors] = useState({}); // Track which images failed

//   useEffect(() => {
//     const init = async () => {
//       try {
//         const [r, s] = await Promise.all([
//           api.get(`/reports/${id}`),
//           api.get('/settings'),
//         ]);
//         setReport(r.data);
//         setSettings(s.data);
//       } catch {
//         toast.error('Error loading report');
//       }
//     };
//     init();
//   }, [id]);

//   /* ──────────────────────────────────────────
//      Convert all images to base64 on load
//      ────────────────────────────────────────── */
//   useEffect(() => {
//     if (!report) return;

//     const convertAll = async () => {
//       const map = {};
//       const errors = {};

//       // Hospital logo
//       if (settings?.hospitalLogo) {
//         const logoURL = getImageURL(settings.hospitalLogo);
//         console.log('🏥 Logo URL:', logoURL);
//         const result = await toBase64(logoURL);
//         if (result) {
//           map.hospitalLogo = result;
//         } else {
//           errors.hospitalLogo = true;
//         }
//       }

//       // Doctor signature
//       if (report.performingDoctor?.signature) {
//         const sigURL = getImageURL(report.performingDoctor.signature);
//         console.log('✍️ Signature URL:', sigURL);
//         const result = await toBase64(sigURL);
//         if (result) {
//           map.signature = result;
//         } else {
//           errors.signature = true;
//         }
//       }

//       // Clinical images
//       if (report.images?.length) {
//         const selected = report.images.filter(
//           (img) => img.isSelected !== false
//         );

//         await Promise.all(
//           selected.map(async (img, i) => {
//             const url = getImageURL(img.path);
//             console.log(`🖼️ Image ${i} URL:`, url);
//             console.log(`🖼️ Image ${i} raw path:`, img.path);
//             const result = await toBase64(url);
//             if (result) {
//               map[`clinical_${i}`] = result;
//             } else {
//               errors[`clinical_${i}`] = true;
//               console.error(`❌ Image ${i} FAILED:`, url);
//             }
//           })
//         );
//       }

//       console.log('✅ Base64 conversion complete:', {
//         total: Object.keys(map).length,
//         errors: Object.keys(errors).length,
//         errorKeys: Object.keys(errors),
//       });

//       setBase64Images(map);
//       setImageErrors(errors);
//       setImagesReady(true);
//     };

//     convertAll();
//   }, [report, settings]);

//   // ... (keep all your handler functions the same: handlePrint, handlePDF, etc.)

//   const handlePrint = () => {
//     if (!imagesReady) {
//       toast.loading('Preparing images...', { duration: 2000 });
//       setTimeout(() => window.print(), 2200);
//       return;
//     }
//     window.print();
//   };

//   const handlePDF = async () => {
//     if (!imagesReady) {
//       toast.error('Images still loading, please wait...');
//       return;
//     }

//     setGenerating(true);
//     const loadingToast = toast.loading('Generating PDF...');
//     const input = document.getElementById('printable-area');

//     try {
//       window.scrollTo(0, 0);
//       await new Promise((r) => setTimeout(r, 500));

//       const canvas = await html2canvas(input, {
//         scale: 2,
//         useCORS: true,
//         allowTaint: true,
//         logging: true,  // ← Enable logging to see errors
//         backgroundColor: '#ffffff',
//         scrollY: -window.scrollY,
//         // Proxy images through server if needed
//         proxy: import.meta.env.VITE_API_URL?.replace('/api', ''),
//       });

//       const imgData = canvas.toDataURL('image/png');
//       const pdf = new jsPDF('p', 'mm', 'a4');
//       const imgWidth = 210;
//       const imgHeight = (canvas.height * imgWidth) / canvas.width;
//       let heightLeft = imgHeight;
//       let position = 0;
//       const pageHeight = 297;

//       pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
//       heightLeft -= pageHeight;
//       while (heightLeft > 0) {
//         position = heightLeft - imgHeight;
//         pdf.addPage();
//         pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
//         heightLeft -= pageHeight;
//       }
//       pdf.save(
//         `${report.patient?.name || 'Report'}_${report.reportId}.pdf`
//       );
//       toast.dismiss(loadingToast);
//       toast.success('PDF Downloaded');
//     } catch (e) {
//       console.error('PDF generation error:', e);
//       toast.dismiss(loadingToast);
//       toast.error('Failed to generate PDF');
//     } finally {
//       setGenerating(false);
//     }
//   };

//   const handleFinalize = async () => {
//     if (!window.confirm('Finalize this report? It cannot be edited after.'))
//       return;
//     try {
//       await api.post(`/reports/${id}/finalize`);
//       toast.success('Report finalized!');
//       const { data } = await api.get(`/reports/${id}`);
//       setReport(data);
//     } catch {
//       toast.error('Failed to finalize');
//     }
//   };

//   const handleDelete = async () => {
//     if (!window.confirm('Delete this report permanently?')) return;
//     try {
//       await api.delete(`/reports/${id}`);
//       toast.success('Deleted');
//       navigate('/reports');
//     } catch {
//       toast.error('Failed to delete');
//     }
//   };

//   const handleShare = async () => {
//     if (navigator.share) {
//       try {
//         await navigator.share({
//           title: `Report - ${report.patient?.name}`,
//           text: `Endoscopy Report ${report.reportId}`,
//           url: window.location.href,
//         });
//       } catch { /* user cancelled */ }
//     } else {
//       navigator.clipboard.writeText(window.location.href);
//       toast.success('Link copied to clipboard');
//     }
//   };

//   if (!report)
//     return (
//       <div className="h-[100dvh] flex items-center justify-center">
//         <div className="flex flex-col items-center gap-3">
//           <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 
//                           rounded-full animate-spin" />
//           <span className="text-sm font-bold text-gray-400 animate-pulse">
//             Loading report...
//           </span>
//         </div>
//       </div>
//     );

//   const groupedFindings =
//     report.findings?.reduce((acc, curr) => {
//       const organ = curr.organ || 'General';
//       if (!acc[organ]) acc[organ] = [];
//       acc[organ].push(curr);
//       return acc;
//     }, {}) || {};

//   const getOrganStatusBadge = (status) => {
//     if (status === 'normal')
//       return <span className="text-green-700 font-bold">Normal</span>;
//     if (status === 'abnormal')
//       return <span className="text-red-600 font-bold">Abnormal</span>;
//     return <span className="text-gray-500">Not Examined</span>;
//   };

//   const formatOrganName = (key) => {
//     const names = {
//       esophagus: 'Esophagus',
//       geJunction: 'GE Junction',
//       stomach: 'Stomach',
//       duodenum: 'Duodenum',
//       rectum: 'Rectum',
//       sigmoid: 'Sigmoid Colon',
//       descendingColon: 'Descending Colon',
//       transverseColon: 'Transverse Colon',
//       ascendingColon: 'Ascending Colon',
//       cecum: 'Cecum',
//       ileum: 'Terminal Ileum',
//     };
//     return names[key] || key;
//   };

//   const selectedImages =
//     report.images?.filter((img) => img.isSelected !== false) || [];

//   return (
//     <>
//       {/* ═══════ PRINT STYLES ═══════ */}
//       <style>{`
//         @media print {
//           * {
//             -webkit-print-color-adjust: exact !important;
//             print-color-adjust: exact !important;
//             color-adjust: exact !important;
//           }
//           @page {
//             margin: 8mm;
//             size: A4;
//           }
//           body {
//             background: white !important;
//             -webkit-print-color-adjust: exact !important;
//           }
//           .print\\:hidden,
//           .no-print {
//             display: none !important;
//           }
//           img {
//             display: inline-block !important;
//             visibility: visible !important;
//             max-width: 100% !important;
//             break-inside: avoid !important;
//             -webkit-print-color-adjust: exact !important;
//           }
//           .print-img-container {
//             background-color: #f9fafb !important;
//             border: 1px solid #e5e7eb !important;
//             overflow: visible !important;
//           }
//           #printable-area {
//             margin: 0 !important;
//             padding: 6mm !important;
//             box-shadow: none !important;
//             width: 100% !important;
//             max-width: 100% !important;
//           }
//           .shadow-lg, .shadow-xl, .shadow-md, .shadow-sm,
//           .shadow-inner {
//             box-shadow: none !important;
//           }
//         }
//       `}</style>

//       <div className="min-h-[100dvh] bg-gray-100 pb-24 sm:pb-20">
//         {/* ═══════ TOOLBAR (same as before) ═══════ */}
//         <div className="bg-white shadow-sm border-b print:hidden sticky top-0 z-50">
//           <div className="max-w-[210mm] mx-auto px-3 sm:px-4 py-2.5 sm:py-3 
//                           flex justify-between items-center gap-2">
//             <button
//               onClick={() => navigate('/reports')}
//               className="flex items-center gap-1.5 text-gray-600 hover:text-gray-900 
//                          font-medium transition-colors text-sm flex-shrink-0"
//             >
//               <ArrowLeft size={18} />
//               <span className="hidden sm:inline">Back</span>
//             </button>

//             <div className="sm:hidden flex-1 text-center min-w-0 px-2">
//               <p className="text-xs font-bold text-gray-800 truncate">
//                 {report.patient?.name}
//               </p>
//               <p className="text-[10px] text-gray-400 font-mono">
//                 {report.reportId}
//               </p>
//             </div>

//             <div className="hidden sm:flex items-center gap-2">
//               {report.status === 'draft' && (
//                 <>
//                   <button onClick={() => navigate(`/reports/${id}`)}
//                     className="bg-blue-50 text-blue-600 border border-blue-200 
//                                px-3 py-1.5 rounded-lg text-sm flex items-center 
//                                gap-1.5 hover:bg-blue-100 transition-all font-medium">
//                     <Edit size={14} /> Edit
//                   </button>
//                   <button onClick={handleFinalize}
//                     className="bg-green-600 text-white px-3 py-1.5 rounded-lg 
//                                text-sm flex items-center gap-1.5 hover:bg-green-700 
//                                shadow-md shadow-green-200 transition-all font-medium">
//                     <CheckCircle size={14} /> Finalize
//                   </button>
//                 </>
//               )}
//               <button onClick={handleDelete}
//                 className="bg-red-50 text-red-600 border border-red-200 px-3 
//                            py-1.5 rounded-lg text-sm flex items-center gap-1.5 
//                            hover:bg-red-100 transition-all font-medium">
//                 <Trash2 size={14} />
//                 <span className="hidden lg:inline">Delete</span>
//               </button>
//               <div className="w-px h-6 bg-gray-200" />
//               <button onClick={handlePDF} disabled={generating}
//                 className="bg-white border px-3 py-1.5 rounded-lg text-sm 
//                            flex items-center gap-1.5 hover:bg-gray-50 
//                            transition-all shadow-sm font-medium
//                            disabled:opacity-50 disabled:cursor-not-allowed">
//                 <Download size={14} />
//                 <span className="hidden md:inline">
//                   {generating ? 'Generating...' : 'PDF'}
//                 </span>
//               </button>
//               <button onClick={handlePrint}
//                 className="bg-blue-600 text-white px-3 py-1.5 rounded-lg 
//                            text-sm flex items-center gap-1.5 hover:bg-blue-700 
//                            shadow-md shadow-blue-200 transition-all font-medium">
//                 <Printer size={14} />
//                 <span className="hidden md:inline">Print</span>
//               </button>
//             </div>

//             <div className="sm:hidden relative" onClick={(e) => e.stopPropagation()}>
//               <button onClick={() => setMobileMenu((o) => !o)}
//                 className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors">
//                 {mobileMenu ? <X size={20} /> : <MoreHorizontal size={20} />}
//               </button>
//               {mobileMenu && (
//                 <div className="absolute right-0 top-full mt-1 w-56 bg-white 
//                                rounded-xl shadow-2xl border z-50 py-1 overflow-hidden">
//                   {report.status === 'draft' && (
//                     <>
//                       <button onClick={() => { navigate(`/reports/${id}`); setMobileMenu(false); }}
//                         className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-blue-50">
//                         <Edit size={16} /> Edit Report
//                       </button>
//                       <button onClick={() => { handleFinalize(); setMobileMenu(false); }}
//                         className="w-full flex items-center gap-3 px-4 py-3 text-sm text-green-700 hover:bg-green-50">
//                         <CheckCircle size={16} /> Finalize
//                       </button>
//                       <div className="border-t border-gray-100" />
//                     </>
//                   )}
//                   <button onClick={() => { handlePDF(); setMobileMenu(false); }} disabled={generating}
//                     className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50">
//                     <Download size={16} /> {generating ? 'Generating...' : 'Download PDF'}
//                   </button>
//                   <button onClick={() => { handlePrint(); setMobileMenu(false); }}
//                     className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50">
//                     <Printer size={16} /> Print Report
//                   </button>
//                   <button onClick={() => { handleShare(); setMobileMenu(false); }}
//                     className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50">
//                     <Share2 size={16} /> Share Link
//                   </button>
//                   <div className="border-t border-gray-100" />
//                   <button onClick={() => { handleDelete(); setMobileMenu(false); }}
//                     className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50">
//                     <Trash2 size={16} /> Delete Report
//                   </button>
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>

//         {/* ═══════ A4 PRINTABLE AREA ═══════ */}
//         <div
//           id="printable-area"
//           className="max-w-[210mm] mx-auto bg-white 
//                      my-4 sm:my-8 min-h-[297mm] 
//                      shadow-lg sm:shadow-xl 
//                      p-4 sm:p-6 md:p-8 flex flex-col 
//                      print:shadow-none print:m-0 print:w-full print:p-6 print:my-0"
//         >
//           {/* ═══════ HEADER ═══════ */}
//           <div className="flex flex-col sm:flex-row justify-between items-start 
//                           border-b-4 border-blue-900 pb-4 mb-4 gap-3 sm:gap-0
//                           print:flex-row print:gap-0">
//             <div className="flex items-center gap-3 sm:gap-4">
//               {(base64Images.hospitalLogo || settings?.hospitalLogo) && (
//                 <img
//                   src={base64Images.hospitalLogo || getImageURL(settings.hospitalLogo)}
//                   className="h-14 sm:h-20 w-auto object-contain flex-shrink-0 print:h-20"
//                   alt="Logo"
//                   onError={(e) => {
//                     console.error('Logo failed to load');
//                     e.target.style.display = 'none';
//                   }}
//                 />
//               )}
//               <div className="min-w-0">
//                 <h1 className="text-lg sm:text-2xl font-black text-blue-900 
//                                uppercase leading-none truncate print:text-2xl">
//                   {settings?.hospitalName || 'Hospital Name'}
//                 </h1>
//                 <p className="text-[9px] sm:text-[10px] font-medium text-gray-600 
//                               mt-1 whitespace-pre-line leading-tight print:text-[10px]">
//                   {settings?.hospitalAddress}
//                 </p>
//                 <p className="text-[10px] sm:text-xs font-bold text-gray-800 
//                               mt-0.5 tracking-tight print:text-xs">
//                   Ph: {settings?.hospitalPhone}{' '}
//                   {settings?.hospitalEmail && `| ${settings.hospitalEmail}`}
//                 </p>
//               </div>
//             </div>

//             <div className="text-left sm:text-right flex-shrink-0 print:text-right">
//               <div className="bg-blue-900 text-white px-3 py-1 font-bold 
//                               uppercase text-[9px] sm:text-[10px] tracking-widest 
//                               inline-block rounded print:text-[10px]">
//                 Endoscopy Report
//               </div>
//               <div className="text-[10px] text-gray-400 mt-1 font-mono">
//                 RID: {report.reportId}
//               </div>
//               <div className={clsx(
//                 'mt-1 text-[9px] px-2 py-0.5 rounded inline-block font-bold',
//                 report.status === 'finalized'
//                   ? 'bg-green-100 text-green-700'
//                   : 'bg-yellow-100 text-yellow-700'
//               )}>
//                 {report.status?.toUpperCase() || 'DRAFT'}
//               </div>
//             </div>
//           </div>

//           {/* ═══════ PATIENT INFO ═══════ */}
//           <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
//             <h3 className="text-[9px] font-black text-gray-400 uppercase 
//                            tracking-widest mb-2 border-b pb-1">
//               Patient Information
//             </h3>
//             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 
//                             gap-x-6 gap-y-1 text-[11px] print:grid-cols-3">
//               {[
//                 { label: 'Patient Name', value: report.patient?.name, bold: true },
//                 { label: 'Patient ID', value: report.patient?.patientId },
//                 { label: 'Age / Sex', value: `${report.patient?.age} Y / ${report.patient?.sex}` },
//                 { label: 'Bill No', value: report.billNumber || '-' },
//                 { label: 'OPD/IPD No', value: report.opdIpdNumber || '-' },
//                 report.patient?.phone && { label: 'Contact', value: report.patient.phone },
//                 report.patient?.address && { label: 'Address', value: report.patient.address, span: true },
//               ].filter(Boolean).map((item, i) => (
//                 <div key={i} className={clsx(
//                   'flex justify-between border-b border-dashed border-gray-200 pb-0.5',
//                   item.span && 'sm:col-span-2 print:col-span-2'
//                 )}>
//                   <span className="font-bold text-gray-500">{item.label}</span>
//                   <span className={clsx(
//                     'text-gray-900 truncate max-w-[200px] ml-2',
//                     item.bold ? 'font-black uppercase' : 'font-bold'
//                   )}>{item.value}</span>
//                 </div>
//               ))}
//             </div>
//           </div>

//           {/* ═══════ PROCEDURE DETAILS ═══════ */}
//           <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-4">
//             <h3 className="text-[9px] font-black text-blue-600 uppercase 
//                            tracking-widest mb-2 border-b border-blue-200 pb-1">
//               Procedure Details
//             </h3>
//             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 
//                             gap-x-6 gap-y-1 text-[11px] print:grid-cols-3">
//               {[
//                 { label: 'Procedure', value: report.procedureName, bold: true },
//                 { label: 'Date', value: new Date(report.procedureDate).toLocaleDateString('en-IN') },
//                 { label: 'Time', value: report.procedureTime || 'N/A' },
//                 { label: 'Study Type', value: report.studyType },
//                 { label: 'Indication', value: report.indication || 'Not specified' },
//                 { label: 'Referring Dr', value: report.referringDoctor || 'Self' },
//               ].map((item, i) => (
//                 <div key={i} className="flex justify-between border-b border-dashed border-blue-200 pb-0.5">
//                   <span className="font-bold text-gray-500">{item.label}</span>
//                   <span className={clsx(
//                     'text-gray-900 ml-2',
//                     item.bold ? 'font-black text-blue-900 uppercase' : 'font-bold'
//                   )}>{item.value}</span>
//                 </div>
//               ))}
//             </div>
//           </div>

//           {/* ═══════ CLINICAL METADATA ═══════ */}
//           <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 text-[10px] print:grid-cols-3">
//             <div className="border rounded-lg p-2 bg-purple-50 border-purple-200">
//               <h4 className="font-black text-purple-800 uppercase text-[9px] tracking-widest mb-1">Sedation</h4>
//               {report.sedation?.used ? (
//                 <div className="space-y-0.5">
//                   <div className="font-bold text-gray-800">
//                     {report.sedation.drugName || 'Not specified'}
//                     {report.sedation.dose && ` (${report.sedation.dose})`}
//                   </div>
//                   <div className="text-gray-600">Type: {report.sedation.type}</div>
//                 </div>
//               ) : (
//                 <div className="text-gray-500 italic">No Sedation Used</div>
//               )}
//             </div>

//             <div className={clsx('border rounded-lg p-2',
//               report.consentObtained ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
//             )}>
//               <h4 className={clsx('font-black uppercase text-[9px] tracking-widest mb-1',
//                 report.consentObtained ? 'text-green-800' : 'text-red-800'
//               )}>Consent Status</h4>
//               <div className={clsx('font-bold',
//                 report.consentObtained ? 'text-green-700' : 'text-red-600'
//               )}>
//                 {report.consentObtained ? '✓ Informed Consent Obtained' : '✗ Consent Not Documented'}
//               </div>
//             </div>

//             <div className="border rounded-lg p-2 bg-gray-50">
//               <h4 className="font-black text-gray-600 uppercase text-[9px] tracking-widest mb-1">Procedure Team</h4>
//               <div className="space-y-0.5">
//                 <div className="font-bold text-gray-800">Dr. {report.performingDoctor?.name || 'N/A'}</div>
//                 {report.assistant && <div className="text-gray-600">Assistant: {report.assistant}</div>}
//                 {report.nurse && <div className="text-gray-600">Nurse: {report.nurse}</div>}
//               </div>
//             </div>
//           </div>

//           {/* ═══════ ORGAN STATUS ═══════ */}
//           {report.organStatus && Object.keys(report.organStatus).length > 0 && (
//             <div className="mb-4 border rounded-lg overflow-hidden">
//               <div className="bg-gray-100 px-3 py-1 border-b">
//                 <h3 className="font-black uppercase text-gray-700 text-[10px] tracking-widest">
//                   Organ Status Overview
//                 </h3>
//               </div>
//               <div className="grid grid-cols-2 sm:grid-cols-4 gap-0 text-[10px] print:grid-cols-4">
//                 {Object.entries(report.organStatus).map(([organ, status]) => (
//                   <div key={organ} className={clsx(
//                     'p-2 border-r border-b last:border-r-0 text-center',
//                     status === 'normal' ? 'bg-green-50' : status === 'abnormal' ? 'bg-red-50' : 'bg-gray-50'
//                   )}>
//                     <div className="font-bold text-gray-700 uppercase text-[9px]">{formatOrganName(organ)}</div>
//                     {getOrganStatusBadge(status)}
//                   </div>
//                 ))}
//               </div>
//             </div>
//           )}

//           {/* ═══════ DETAILED FINDINGS ═══════ */}
//           <div className="mb-4 flex-1">
//             <div className="bg-gray-100 px-3 py-1 mb-2 border-l-4 border-blue-900 flex justify-between items-center">
//               <h3 className="font-black uppercase text-blue-900 text-[10px] tracking-[0.15em] sm:tracking-[0.2em]">
//                 Detailed Examination Findings
//               </h3>
//             </div>

//             <div className="text-[11px] leading-relaxed text-gray-800">
//               {report.organStatus?.geJunction === 'abnormal' && report.geJunctionDetails && (
//                 <div className="mb-4 bg-orange-50 border border-orange-200 rounded-lg p-3">
//                   <h4 className="font-black text-orange-800 uppercase border-b border-orange-200 mb-2 pb-1 text-[10px] tracking-widest">
//                     GE Junction - Detailed Assessment
//                   </h4>
//                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] print:grid-cols-2">
//                     {report.geJunctionDetails.distanceFromIncisors && (
//                       <div className="flex items-center gap-2">
//                         <span className="w-2 h-2 rounded-full bg-orange-400 flex-shrink-0" />
//                         <span>Z-line Distance: <b>{report.geJunctionDetails.distanceFromIncisors} cm</b> from incisors</span>
//                       </div>
//                     )}
//                     {report.geJunctionDetails.hiatusHernia && (
//                       <div className="flex items-center gap-2">
//                         <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
//                         <span className="text-red-700 font-bold">
//                           Hiatus Hernia Present {report.geJunctionDetails.herniaSize && `(${report.geJunctionDetails.herniaSize})`}
//                         </span>
//                       </div>
//                     )}
//                     {report.geJunctionDetails.incompetentLES && (
//                       <div className="flex items-center gap-2">
//                         <span className="w-2 h-2 rounded-full bg-orange-500 flex-shrink-0" />
//                         <span className="font-bold">Incompetent LES</span>
//                       </div>
//                     )}
//                     {report.geJunctionDetails.irregularZLine && (
//                       <div className="flex items-center gap-2">
//                         <span className="w-2 h-2 rounded-full bg-orange-500 flex-shrink-0" />
//                         <span className="font-bold">Irregular Z-Line</span>
//                       </div>
//                     )}
//                     {report.geJunctionDetails.barrettsEsophagus && (
//                       <div className="flex items-center gap-2 sm:col-span-2 print:col-span-2">
//                         <span className="w-2 h-2 rounded-full bg-red-600 flex-shrink-0" />
//                         <span className="text-red-600 font-black uppercase">⚠ Barrett's Esophagus - Suspected</span>
//                       </div>
//                     )}
//                   </div>
//                 </div>
//               )}

//               {Object.keys(groupedFindings).length > 0 ? (
//                 <div className="space-y-3">
//                   {Object.entries(groupedFindings).map(([organName, items]) => (
//                     <div key={organName} className="border-l-2 border-blue-400 pl-3">
//                       <h4 className="font-black text-blue-900 uppercase border-b border-gray-100 mb-2 text-[11px] tracking-tight flex items-center gap-2 flex-wrap">
//                         <span className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0" />
//                         {organName}
//                         <span className="text-[9px] font-normal text-gray-400">
//                           ({items.length} finding{items.length > 1 ? 's' : ''})
//                         </span>
//                       </h4>
//                       <div className="space-y-2 ml-2 sm:ml-4">
//                         {items.map((item, idx) => (
//                           <div key={idx} className="bg-gray-50 p-2 rounded border-l-2 border-gray-300">
//                             <div className="flex items-start gap-2">
//                               <span className="text-blue-600 font-black flex-shrink-0">{idx + 1}.</span>
//                               <div className="flex-1 min-w-0">
//                                 <span className="text-gray-900 font-black uppercase">{item.finding}</span>
//                                 <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-1">
//                                   {item.severity && (
//                                     <span className={clsx(
//                                       'px-1.5 py-0.5 rounded text-[9px] font-bold uppercase',
//                                       item.severity.toLowerCase().includes('severe') ? 'bg-red-100 text-red-700'
//                                         : item.severity.toLowerCase().includes('moderate') ? 'bg-orange-100 text-orange-700'
//                                         : 'bg-yellow-100 text-yellow-700'
//                                     )}>{item.severity}</span>
//                                   )}
//                                   {item.size && <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-100 text-blue-700">Size: {item.size}</span>}
//                                   {item.location && <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-100 text-purple-700">Loc: {item.location}</span>}
//                                   {item.count && <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-green-100 text-green-700">Count: {item.count}</span>}
//                                 </div>
//                                 {item.description && (
//                                   <p className="text-gray-600 mt-1 text-[10px] italic border-l-2 border-gray-200 pl-2">
//                                     {item.description}
//                                   </p>
//                                 )}
//                               </div>
//                             </div>
//                           </div>
//                         ))}
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               ) : (
//                 <div className="text-center py-6 sm:py-8 border-2 border-dashed border-gray-200 rounded-xl bg-green-50">
//                   <CheckCircle className="mx-auto mb-2 text-green-500" size={28} />
//                   <p className="text-green-700 font-bold uppercase tracking-widest text-xs sm:text-sm">Normal Endoscopy Study</p>
//                   <p className="text-gray-500 text-[10px] sm:text-xs mt-1">No abnormal findings documented</p>
//                 </div>
//               )}
//             </div>
//           </div>

//           {/* ═══════ BIOPSY / THERAPEUTIC / COMPLICATIONS ═══════ */}
//           <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4 text-[10px] break-inside-avoid print:grid-cols-3">
//             <div className="border rounded-lg overflow-hidden bg-blue-50">
//               <div className="bg-blue-100 px-2 py-1 border-b border-blue-200">
//                 <h4 className="font-black text-blue-900 uppercase text-[9px] tracking-widest">Biopsy / Samples</h4>
//               </div>
//               <div className="p-2">
//                 {report.biopsy?.taken ? (
//                   <div className="space-y-1">
//                     <div className="flex justify-between">
//                       <span className="text-gray-600">Sites:</span>
//                       <span className="font-bold text-gray-900">{report.biopsy.sites?.join(', ') || 'N/A'}</span>
//                     </div>
//                     <div className="flex justify-between">
//                       <span className="text-gray-600">Samples:</span>
//                       <span className="font-bold text-gray-900">{report.biopsy.numberOfSamples || 0}</span>
//                     </div>
//                     <div className="border-t border-blue-200 pt-1 mt-1 space-y-0.5">
//                       {report.biopsy.rut && (
//                         <div className="text-orange-700 font-bold flex items-center gap-1">
//                           <span className="w-1.5 h-1.5 rounded-full bg-orange-500" /> RUT - Done
//                         </div>
//                       )}
//                       {report.biopsy.histopathology && (
//                         <div className="text-green-700 font-bold flex items-center gap-1">
//                           <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Sent for Histopathology
//                         </div>
//                       )}
//                     </div>
//                   </div>
//                 ) : (
//                   <div className="text-gray-500 italic text-center py-2">No Biopsy Taken</div>
//                 )}
//               </div>
//             </div>

//             <div className="border rounded-lg overflow-hidden bg-green-50">
//               <div className="bg-green-100 px-2 py-1 border-b border-green-200">
//                 <h4 className="font-black text-green-900 uppercase text-[9px] tracking-widest">Therapeutic Interventions</h4>
//               </div>
//               <div className="p-2">
//                 {report.therapeutic?.performed && report.therapeutic.procedures?.length > 0 ? (
//                   <div className="space-y-2">
//                     {report.therapeutic.procedures.map((proc, i) => (
//                       <div key={i} className="border-b border-green-200 last:border-0 pb-1 last:pb-0">
//                         <div className="font-bold text-green-800">{proc.type}</div>
//                         {proc.site && <div className="text-[9px] text-gray-600">Site: {proc.site}</div>}
//                         {proc.details && <div className="text-[9px] text-gray-500 italic">{proc.details}</div>}
//                       </div>
//                     ))}
//                   </div>
//                 ) : (
//                   <div className="text-gray-500 italic text-center py-2">No Therapeutic Procedures</div>
//                 )}
//               </div>
//             </div>

//             <div className={clsx('border rounded-lg overflow-hidden',
//               report.complications?.occurred ? 'bg-red-50 border-red-200' : 'bg-gray-50'
//             )}>
//               <div className={clsx('px-2 py-1 border-b',
//                 report.complications?.occurred ? 'bg-red-100 border-red-200' : 'bg-gray-100 border-gray-200'
//               )}>
//                 <h4 className={clsx('font-black uppercase text-[9px] tracking-widest',
//                   report.complications?.occurred ? 'text-red-900' : 'text-gray-600'
//                 )}>Complications</h4>
//               </div>
//               <div className="p-2">
//                 {report.complications?.occurred ? (
//                   <div>
//                     <div className="flex items-center gap-1 text-red-600 font-bold mb-1">
//                       <AlertTriangle size={12} /> COMPLICATIONS NOTED
//                     </div>
//                     <div className="text-red-700 font-bold">{report.complications.types?.join(', ')}</div>
//                     {report.complications.management && (
//                       <div className="mt-1 pt-1 border-t border-red-200">
//                         <span className="text-[9px] font-bold text-gray-600 uppercase">Management:</span>
//                         <p className="text-gray-700 text-[10px]">{report.complications.management}</p>
//                       </div>
//                     )}
//                   </div>
//                 ) : (
//                   <div className="text-green-600 font-bold text-center py-2 flex items-center justify-center gap-1">
//                     <CheckCircle size={14} /> Uneventful Procedure
//                   </div>
//                 )}
//               </div>
//             </div>
//           </div>

//           {/* ═══════ CLINICAL IMAGES — FULLY FIXED ═══════ */}
//           {selectedImages.length > 0 && (
//             <div className="mb-4 break-inside-avoid">
//               <div className="bg-gray-100 px-3 py-1 mb-2 border-l-4 border-blue-900 
//                               flex justify-between items-center">
//                 <h3 className="font-black uppercase text-blue-900 text-[10px] 
//                                tracking-[0.15em] sm:tracking-[0.2em]">
//                   Clinical Evidence
//                 </h3>
//                 <span className="text-[9px] font-bold text-gray-400 italic">
//                   {selectedImages.length} image(s)
//                   {!imagesReady && ' — loading...'}
//                 </span>
//               </div>

//               <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 
//                               gap-2 sm:gap-3 px-1 mt-3 print:grid-cols-4">
//                 {selectedImages.map((img, i) => {
//                   // Use base64 if available, otherwise build URL
//                   const imgSrc = base64Images[`clinical_${i}`] || getImageURL(img.path);
//                   const hasError = imageErrors[`clinical_${i}`];

//                   return (
//                     <div key={i} className="flex flex-col items-center">
//                       {/* ✅ White background, no bg-black */}
//                       <div
//                         className="w-full aspect-square border-2 border-gray-200 
//                                     p-0.5 rounded shadow-sm overflow-hidden 
//                                     bg-gray-50 print-img-container"
//                       >
//                         {hasError && !base64Images[`clinical_${i}`] ? (
//                           // Show placeholder if image completely failed
//                           <div className="h-full w-full flex items-center 
//                                           justify-center bg-gray-100 text-gray-400">
//                             <div className="text-center">
//                               <AlertTriangle size={24} className="mx-auto mb-1" />
//                               <p className="text-[8px]">Image unavailable</p>
//                             </div>
//                           </div>
//                         ) : (
//                           <img
//                             src={imgSrc}
//                             className="h-full w-full object-contain"
//                             alt={`Snapshot ${i + 1}`}
//                             loading="eager"
//                             onError={(e) => {
//                               console.error(`Image ${i} display error:`, imgSrc);
//                               // Try the direct URL as last resort
//                               const directURL = getImageURL(img.path);
//                               if (e.target.src !== directURL) {
//                                 e.target.src = directURL;
//                               } else {
//                                 // Show broken placeholder
//                                 e.target.style.display = 'none';
//                                 e.target.parentElement.innerHTML = `
//                                   <div class="h-full w-full flex items-center 
//                                               justify-center bg-gray-100 
//                                               text-gray-400 text-center p-2">
//                                     <div>
//                                       <p style="font-size:10px;font-weight:bold;">
//                                         ⚠ Image Error
//                                       </p>
//                                       <p style="font-size:8px;word-break:break-all;">
//                                         ${img.path}
//                                       </p>
//                                     </div>
//                                   </div>
//                                 `;
//                               }
//                             }}
//                           />
//                         )}
//                       </div>
//                       <p className="text-[8px] sm:text-[9px] font-black text-gray-600 
//                                     mt-1 uppercase truncate w-full text-center tracking-tighter">
//                         {img.taggedOrgan ? `[${img.taggedOrgan}] ` : ''}
//                         {img.caption || `IMG-${i + 1}`}
//                       </p>
//                     </div>
//                   );
//                 })}
//               </div>
//             </div>
//           )}

//           {/* ═══════ CONCLUSION ═══════ */}
//           <div className="mt-auto break-inside-avoid">
//             <div className="border-t-4 border-blue-900 pt-4">
//               <div className="mb-4">
//                 <h3 className="font-black uppercase text-[10px] tracking-widest text-blue-900 mb-2 flex items-center gap-2">
//                   <span className="w-3 h-3 bg-blue-900 rounded-full flex-shrink-0" />
//                   Final Impression / Diagnosis
//                 </h3>
//                 <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-3 sm:p-4 rounded-xl border-l-4 border-blue-900 shadow-inner">
//                   <p className="font-black text-xs sm:text-[13px] text-blue-950 uppercase leading-relaxed whitespace-pre-line print:text-[13px]">
//                     {report.customImpression || 'Normal endoscopy study. No significant pathology identified.'}
//                   </p>
//                 </div>
//               </div>

//               {(report.recommendations || report.followUp || report.comments) && (
//                 <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 print:grid-cols-3">
//                   {report.recommendations && (
//                     <div className="border-l-2 border-green-500 pl-3">
//                       <h4 className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Recommendations</h4>
//                       <p className="text-[10px] font-bold text-gray-700 leading-tight whitespace-pre-line">{report.recommendations}</p>
//                     </div>
//                   )}
//                   {report.followUp && (
//                     <div className="border-l-2 border-orange-500 pl-3">
//                       <h4 className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Follow Up</h4>
//                       <p className="text-[10px] font-bold text-gray-700 leading-tight">{report.followUp}</p>
//                     </div>
//                   )}
//                   {report.comments && (
//                     <div className="border-l-2 border-gray-400 pl-3">
//                       <h4 className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Additional Comments</h4>
//                       <p className="text-[10px] text-gray-600 italic leading-tight">{report.comments}</p>
//                     </div>
//                   )}
//                 </div>
//               )}

//               {/* ═══════ SIGNATURE ═══════ */}
//               <div className="flex flex-col-reverse sm:flex-row justify-between 
//                               items-start sm:items-end mt-6 border-t border-gray-200 
//                               pt-4 gap-6 sm:gap-4 print:flex-row print:items-end print:gap-4">
//                 <div className="text-[8px] text-gray-400 font-mono max-w-[200px]">
//                   <p className="font-bold text-gray-500 mb-1">Report Information:</p>
//                   <p>Generated: {new Date().toLocaleString()}</p>
//                   <p>Report ID: {report.reportId}</p>
//                   <p>Status: {report.status?.toUpperCase()}</p>
//                   {report.status === 'finalized' && report.finalizedAt && (
//                     <p>Finalized: {new Date(report.finalizedAt).toLocaleString()}</p>
//                   )}
//                   <p className="mt-2 uppercase text-[7px]">
//                     This is a computer-generated document.
//                     {report.status === 'finalized' && ' This report has been verified and finalized.'}
//                   </p>
//                 </div>

//                 <div className="text-center min-w-[180px] sm:min-w-[220px] print:min-w-[220px]">
//                   {(base64Images.signature || report.performingDoctor?.signature) ? (
//                     <img
//                       src={base64Images.signature || getImageURL(report.performingDoctor.signature)}
//                       className="h-14 sm:h-16 mx-auto object-contain mix-blend-multiply print:h-16"
//                       alt="Doctor Signature"
//                       onError={(e) => {
//                         e.target.style.display = 'none';
//                       }}
//                     />
//                   ) : (
//                     <div className="h-14 sm:h-16 flex items-center justify-center text-gray-300 text-xs italic">
//                       [Digital Signature]
//                     </div>
//                   )}
//                   <div className="border-t-2 border-gray-900 pt-2 mt-1">
//                     <p className="font-black text-xs sm:text-sm uppercase text-gray-900 tracking-tight leading-none print:text-sm">
//                       {report.performingDoctor?.name || 'Performing Physician'}
//                     </p>
//                     {report.performingDoctor?.qualification && (
//                       <p className="text-[9px] sm:text-[10px] font-bold text-blue-900 uppercase mt-1 leading-none print:text-[10px]">
//                         {report.performingDoctor.qualification}
//                       </p>
//                     )}
//                     {report.performingDoctor?.specialization && (
//                       <p className="text-[8px] sm:text-[9px] text-gray-500 uppercase leading-none mt-0.5 print:text-[9px]">
//                         {report.performingDoctor.specialization}
//                       </p>
//                     )}
//                     {report.performingDoctor?.registrationNumber && (
//                       <p className="text-[8px] text-gray-400 mt-1">
//                         Reg. No: {report.performingDoctor.registrationNumber}
//                       </p>
//                     )}
//                   </div>
//                 </div>
//               </div>

//               <div className="mt-4 pt-2 border-t border-dashed border-gray-200 text-center">
//                 <p className="text-[7px] sm:text-[8px] text-gray-400 print:text-[8px]">
//                   {settings?.hospitalName} | {settings?.hospitalAddress?.split('\n')[0]} | Tel: {settings?.hospitalPhone}
//                 </p>
//                 <p className="text-[6px] sm:text-[7px] text-gray-300 mt-0.5 print:text-[7px]">— End of Report —</p>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* ═══════ MOBILE BOTTOM BAR ═══════ */}
//         <div className="sm:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md 
//                         border-t border-gray-200 z-40 print:hidden"
//           style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
//           <div className="flex items-center divide-x divide-gray-200">
//             <button onClick={handlePDF} disabled={generating}
//               className="flex-1 flex flex-col items-center justify-center py-2.5 text-gray-600 hover:text-blue-600 active:bg-blue-50 transition-colors disabled:opacity-50">
//               <Download size={18} />
//               <span className="text-[10px] font-medium mt-0.5">{generating ? 'Wait...' : 'PDF'}</span>
//             </button>
//             <button onClick={handlePrint}
//               className="flex-1 flex flex-col items-center justify-center py-2.5 text-gray-600 hover:text-blue-600 active:bg-blue-50 transition-colors">
//               <Printer size={18} />
//               <span className="text-[10px] font-medium mt-0.5">Print</span>
//             </button>
//             <button onClick={handleShare}
//               className="flex-1 flex flex-col items-center justify-center py-2.5 text-gray-600 hover:text-blue-600 active:bg-blue-50 transition-colors">
//               <Share2 size={18} />
//               <span className="text-[10px] font-medium mt-0.5">Share</span>
//             </button>
//             {report.status === 'draft' && (
//               <button onClick={handleFinalize}
//                 className="flex-1 flex flex-col items-center justify-center py-2.5 text-green-600 hover:text-green-700 active:bg-green-50 transition-colors">
//                 <CheckCircle size={18} />
//                 <span className="text-[10px] font-medium mt-0.5">Finalize</span>
//               </button>
//             )}
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
  ArrowLeft, Printer, Download, CheckCircle, Trash2,
  Edit, AlertTriangle, MoreHorizontal, X, Share2,
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import toast from 'react-hot-toast';
import clsx from 'clsx';

/* ──────────────────────────────────────────
   Helper: Build image URL from stored path
   ────────────────────────────────────────── */
const getImageURL = (imagePath) => {
  if (!imagePath) return '';
  if (imagePath.startsWith('http') || imagePath.startsWith('data:')) {
    return imagePath;
  }

  let cleaned = imagePath.replace(/\\/g, '/').replace(/^\//, '');
  let baseURL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api')
    .replace(/\/api\/?$/, '')
    .replace(/\/$/, '');

  if (!cleaned.startsWith('uploads/')) {
    cleaned = `uploads/${cleaned}`;
  }

  return `${baseURL}/${cleaned}`;
};

/* ──────────────────────────────────────────
   Helper: Convert image URL → base64
   ✅ FIX: Always resolve null on failure (never resolve raw URL)
   ────────────────────────────────────────── */
const toBase64 = (url) =>
  new Promise((resolve) => {
    fetch(url, { mode: 'cors', cache: 'no-cache' })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.blob();
      })
      .then((blob) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = () => resolve(null); // ✅ FIX: null instead of url
        reader.readAsDataURL(blob);
      })
      .catch(() => {
        // Strategy 2: Canvas approach
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            canvas.getContext('2d').drawImage(img, 0, 0);
            resolve(canvas.toDataURL('image/png'));
          } catch {
            console.warn('Canvas tainted for:', url);
            resolve(null); // ✅ FIX: null instead of url
          }
        };
        img.onerror = () => {
          console.error('Image failed to load:', url);
          resolve(null); // ✅ FIX: null instead of ''
        };
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

  // ✅ FIX: Safe state-based error handler (replaces all DOM manipulation)
  const handleImageError = (key) => {
    setImageErrors((prev) => ({ ...prev, [key]: true }));
  };

  useEffect(() => {
    const init = async () => {
      try {
        const [r, s] = await Promise.all([
          api.get(`/reports/${id}`),
          api.get('/settings'),
        ]);
        setReport(r.data);
        setSettings(s.data);
      } catch {
        toast.error('Error loading report');
      }
    };
    init();
  }, [id]);

  /* ──────────────────────────────────────────
     Convert all images to base64 on load
     ────────────────────────────────────────── */
  useEffect(() => {
    if (!report) return;

    const convertAll = async () => {
      const map = {};
      const errors = {};

      // Hospital logo
      if (settings?.hospitalLogo) {
        const logoURL = getImageURL(settings.hospitalLogo);
        const result = await toBase64(logoURL);
        if (result) {
          map.hospitalLogo = result;
        } else {
          errors.hospitalLogo = true;
        }
      }

      // Doctor signature
      if (report.performingDoctor?.signature) {
        const sigURL = getImageURL(report.performingDoctor.signature);
        const result = await toBase64(sigURL);
        if (result) {
          map.signature = result;
        } else {
          errors.signature = true;
        }
      }

      // Clinical images
      if (report.images?.length) {
        const selected = report.images.filter(
          (img) => img.isSelected !== false
        );

        await Promise.all(
          selected.map(async (img, i) => {
            const url = getImageURL(img.path);
            const result = await toBase64(url);
            if (result) {
              map[`clinical_${i}`] = result;
            } else {
              errors[`clinical_${i}`] = true;
              console.error(`❌ Image ${i} FAILED:`, url);
            }
          })
        );
      }

      console.log('✅ Base64 conversion complete:', {
        total: Object.keys(map).length,
        errors: Object.keys(errors).length,
      });

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
    if (!imagesReady) {
      toast.error('Images still loading, please wait...');
      return;
    }

    setGenerating(true);
    const loadingToast = toast.loading('Generating PDF...');
    const input = document.getElementById('printable-area');

    try {
      window.scrollTo(0, 0);
      await new Promise((r) => setTimeout(r, 500));

      const canvas = await html2canvas(input, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff',
        scrollY: -window.scrollY,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;
      const pageHeight = 297;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      pdf.save(
        `${report.patient?.name || 'Report'}_${report.reportId}.pdf`
      );
      toast.dismiss(loadingToast);
      toast.success('PDF Downloaded');
    } catch (e) {
      console.error('PDF generation error:', e);
      toast.dismiss(loadingToast);
      toast.error('Failed to generate PDF');
    } finally {
      setGenerating(false);
    }
  };

  const handleFinalize = async () => {
    if (!window.confirm('Finalize this report? It cannot be edited after.'))
      return;
    try {
      await api.post(`/reports/${id}/finalize`);
      toast.success('Report finalized!');
      const { data } = await api.get(`/reports/${id}`);
      setReport(data);
    } catch {
      toast.error('Failed to finalize');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this report permanently?')) return;
    try {
      await api.delete(`/reports/${id}`);
      toast.success('Deleted');
      navigate('/reports');
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Report - ${report.patient?.name}`,
          text: `Endoscopy Report ${report.reportId}`,
          url: window.location.href,
        });
      } catch { /* user cancelled */ }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard');
    }
  };

  if (!report)
    return (
      <div className="h-[100dvh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 
                          rounded-full animate-spin" />
          <span className="text-sm font-bold text-gray-400 animate-pulse">
            Loading report...
          </span>
        </div>
      </div>
    );

  const groupedFindings =
    report.findings?.reduce((acc, curr) => {
      const organ = curr.organ || 'General';
      if (!acc[organ]) acc[organ] = [];
      acc[organ].push(curr);
      return acc;
    }, {}) || {};

  const getOrganStatusBadge = (status) => {
    if (status === 'normal')
      return <span className="text-green-700 font-bold">Normal</span>;
    if (status === 'abnormal')
      return <span className="text-red-600 font-bold">Abnormal</span>;
    return <span className="text-gray-500">Not Examined</span>;
  };

  const formatOrganName = (key) => {
    const names = {
      esophagus: 'Esophagus',
      geJunction: 'GE Junction',
      stomach: 'Stomach',
      duodenum: 'Duodenum',
      rectum: 'Rectum',
      sigmoid: 'Sigmoid Colon',
      descendingColon: 'Descending Colon',
      transverseColon: 'Transverse Colon',
      ascendingColon: 'Ascending Colon',
      cecum: 'Cecum',
      ileum: 'Terminal Ileum',
    };
    return names[key] || key;
  };

  const selectedImages =
    report.images?.filter((img) => img.isSelected !== false) || [];

  return (
    <>
      {/* ═══════ PRINT STYLES ═══════ */}
      <style>{`
        @media print {
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          @page {
            margin: 8mm;
            size: A4;
          }
          body {
            background: white !important;
            -webkit-print-color-adjust: exact !important;
          }
          .print\\:hidden,
          .no-print {
            display: none !important;
          }
          img {
            display: inline-block !important;
            visibility: visible !important;
            max-width: 100% !important;
            break-inside: avoid !important;
            -webkit-print-color-adjust: exact !important;
          }
          .print-img-container {
            background-color: #f9fafb !important;
            border: 1px solid #e5e7eb !important;
            overflow: visible !important;
          }
          #printable-area {
            margin: 0 !important;
            padding: 6mm !important;
            box-shadow: none !important;
            width: 100% !important;
            max-width: 100% !important;
          }
          .shadow-lg, .shadow-xl, .shadow-md, .shadow-sm,
          .shadow-inner {
            box-shadow: none !important;
          }
        }
      `}</style>

      <div className="min-h-[100dvh] bg-gray-100 pb-24 sm:pb-20">
        {/* ═══════ TOOLBAR ═══════ */}
        <div className="bg-white shadow-sm border-b print:hidden sticky top-0 z-50">
          <div className="max-w-[210mm] mx-auto px-3 sm:px-4 py-2.5 sm:py-3 
                          flex justify-between items-center gap-2">
            <button
              onClick={() => navigate('/reports')}
              className="flex items-center gap-1.5 text-gray-600 hover:text-gray-900 
                         font-medium transition-colors text-sm flex-shrink-0"
            >
              <ArrowLeft size={18} />
              <span className="hidden sm:inline">Back</span>
            </button>

            <div className="sm:hidden flex-1 text-center min-w-0 px-2">
              <p className="text-xs font-bold text-gray-800 truncate">
                {report.patient?.name}
              </p>
              <p className="text-[10px] text-gray-400 font-mono">
                {report.reportId}
              </p>
            </div>

            <div className="hidden sm:flex items-center gap-2">
              {report.status === 'draft' && (
                <>
                  <button onClick={() => navigate(`/reports/${id}`)}
                    className="bg-blue-50 text-blue-600 border border-blue-200 
                               px-3 py-1.5 rounded-lg text-sm flex items-center 
                               gap-1.5 hover:bg-blue-100 transition-all font-medium">
                    <Edit size={14} /> Edit
                  </button>
                  <button onClick={handleFinalize}
                    className="bg-green-600 text-white px-3 py-1.5 rounded-lg 
                               text-sm flex items-center gap-1.5 hover:bg-green-700 
                               shadow-md shadow-green-200 transition-all font-medium">
                    <CheckCircle size={14} /> Finalize
                  </button>
                </>
              )}
              <button onClick={handleDelete}
                className="bg-red-50 text-red-600 border border-red-200 px-3 
                           py-1.5 rounded-lg text-sm flex items-center gap-1.5 
                           hover:bg-red-100 transition-all font-medium">
                <Trash2 size={14} />
                <span className="hidden lg:inline">Delete</span>
              </button>
              <div className="w-px h-6 bg-gray-200" />
              <button onClick={handlePDF} disabled={generating}
                className="bg-white border px-3 py-1.5 rounded-lg text-sm 
                           flex items-center gap-1.5 hover:bg-gray-50 
                           transition-all shadow-sm font-medium
                           disabled:opacity-50 disabled:cursor-not-allowed">
                <Download size={14} />
                <span className="hidden md:inline">
                  {generating ? 'Generating...' : 'PDF'}
                </span>
              </button>
              <button onClick={handlePrint}
                className="bg-blue-600 text-white px-3 py-1.5 rounded-lg 
                           text-sm flex items-center gap-1.5 hover:bg-blue-700 
                           shadow-md shadow-blue-200 transition-all font-medium">
                <Printer size={14} />
                <span className="hidden md:inline">Print</span>
              </button>
            </div>

            <div className="sm:hidden relative" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => setMobileMenu((o) => !o)}
                className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors">
                {mobileMenu ? <X size={20} /> : <MoreHorizontal size={20} />}
              </button>
              {mobileMenu && (
                <div className="absolute right-0 top-full mt-1 w-56 bg-white 
                               rounded-xl shadow-2xl border z-50 py-1 overflow-hidden">
                  {report.status === 'draft' && (
                    <>
                      <button onClick={() => { navigate(`/reports/${id}`); setMobileMenu(false); }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-blue-50">
                        <Edit size={16} /> Edit Report
                      </button>
                      <button onClick={() => { handleFinalize(); setMobileMenu(false); }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-green-700 hover:bg-green-50">
                        <CheckCircle size={16} /> Finalize
                      </button>
                      <div className="border-t border-gray-100" />
                    </>
                  )}
                  <button onClick={() => { handlePDF(); setMobileMenu(false); }} disabled={generating}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50">
                    <Download size={16} /> {generating ? 'Generating...' : 'Download PDF'}
                  </button>
                  <button onClick={() => { handlePrint(); setMobileMenu(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50">
                    <Printer size={16} /> Print Report
                  </button>
                  <button onClick={() => { handleShare(); setMobileMenu(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50">
                    <Share2 size={16} /> Share Link
                  </button>
                  <div className="border-t border-gray-100" />
                  <button onClick={() => { handleDelete(); setMobileMenu(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50">
                    <Trash2 size={16} /> Delete Report
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ═══════ A4 PRINTABLE AREA ═══════ */}
        <div
          id="printable-area"
          className="max-w-[210mm] mx-auto bg-white 
                     my-4 sm:my-8 min-h-[297mm] 
                     shadow-lg sm:shadow-xl 
                     p-4 sm:p-6 md:p-8 flex flex-col 
                     print:shadow-none print:m-0 print:w-full print:p-6 print:my-0"
        >
          {/* ═══════ HEADER ═══════ */}
          <div className="flex flex-col sm:flex-row justify-between items-start 
                          border-b-4 border-blue-900 pb-4 mb-4 gap-3 sm:gap-0
                          print:flex-row print:gap-0">
            <div className="flex items-center gap-3 sm:gap-4">
              {/* ✅ FIX: Logo uses state-based error tracking */}
              {(base64Images.hospitalLogo || settings?.hospitalLogo) && !imageErrors.hospitalLogo && (
                <img
                  src={base64Images.hospitalLogo || getImageURL(settings.hospitalLogo)}
                  className="h-14 sm:h-20 w-auto object-contain flex-shrink-0 print:h-20"
                  alt="Logo"
                  onError={() => handleImageError('hospitalLogo')}
                />
              )}
              <div className="min-w-0">
                <h1 className="text-lg sm:text-2xl font-black text-blue-900 
                               uppercase leading-none truncate print:text-2xl">
                  {settings?.hospitalName || 'Hospital Name'}
                </h1>
                <p className="text-[9px] sm:text-[10px] font-medium text-gray-600 
                              mt-1 whitespace-pre-line leading-tight print:text-[10px]">
                  {settings?.hospitalAddress}
                </p>
                <p className="text-[10px] sm:text-xs font-bold text-gray-800 
                              mt-0.5 tracking-tight print:text-xs">
                  Ph: {settings?.hospitalPhone}{' '}
                  {settings?.hospitalEmail && `| ${settings.hospitalEmail}`}
                </p>
              </div>
            </div>

            <div className="text-left sm:text-right flex-shrink-0 print:text-right">
              <div className="bg-blue-900 text-white px-3 py-1 font-bold 
                              uppercase text-[9px] sm:text-[10px] tracking-widest 
                              inline-block rounded print:text-[10px]">
                Endoscopy Report
              </div>
              <div className="text-[10px] text-gray-400 mt-1 font-mono">
                RID: {report.reportId}
              </div>
              <div className={clsx(
                'mt-1 text-[9px] px-2 py-0.5 rounded inline-block font-bold',
                report.status === 'finalized'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-yellow-100 text-yellow-700'
              )}>
                {report.status?.toUpperCase() || 'DRAFT'}
              </div>
            </div>
          </div>

          {/* ═══════ PATIENT INFO ═══════ */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
            <h3 className="text-[9px] font-black text-gray-400 uppercase 
                           tracking-widest mb-2 border-b pb-1">
              Patient Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 
                            gap-x-6 gap-y-1 text-[11px] print:grid-cols-3">
              {[
                { label: 'Patient Name', value: report.patient?.name, bold: true },
                { label: 'Patient ID', value: report.patient?.patientId },
                { label: 'Age / Sex', value: `${report.patient?.age} Y / ${report.patient?.sex}` },
                { label: 'Bill No', value: report.billNumber || '-' },
                { label: 'OPD/IPD No', value: report.opdIpdNumber || '-' },
                report.patient?.phone && { label: 'Contact', value: report.patient.phone },
                report.patient?.address && { label: 'Address', value: report.patient.address, span: true },
              ].filter(Boolean).map((item, i) => (
                <div key={i} className={clsx(
                  'flex justify-between border-b border-dashed border-gray-200 pb-0.5',
                  item.span && 'sm:col-span-2 print:col-span-2'
                )}>
                  <span className="font-bold text-gray-500">{item.label}</span>
                  <span className={clsx(
                    'text-gray-900 truncate max-w-[200px] ml-2',
                    item.bold ? 'font-black uppercase' : 'font-bold'
                  )}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ═══════ PROCEDURE DETAILS ═══════ */}
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-4">
            <h3 className="text-[9px] font-black text-blue-600 uppercase 
                           tracking-widest mb-2 border-b border-blue-200 pb-1">
              Procedure Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 
                            gap-x-6 gap-y-1 text-[11px] print:grid-cols-3">
              {[
                { label: 'Procedure', value: report.procedureName, bold: true },
                { label: 'Date', value: new Date(report.procedureDate).toLocaleDateString('en-IN') },
                { label: 'Time', value: report.procedureTime || 'N/A' },
                { label: 'Study Type', value: report.studyType },
                { label: 'Indication', value: report.indication || 'Not specified' },
                { label: 'Referring Dr', value: report.referringDoctor || 'Self' },
              ].map((item, i) => (
                <div key={i} className="flex justify-between border-b border-dashed border-blue-200 pb-0.5">
                  <span className="font-bold text-gray-500">{item.label}</span>
                  <span className={clsx(
                    'text-gray-900 ml-2',
                    item.bold ? 'font-black text-blue-900 uppercase' : 'font-bold'
                  )}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ═══════ CLINICAL METADATA ═══════ */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 text-[10px] print:grid-cols-3">
            <div className="border rounded-lg p-2 bg-purple-50 border-purple-200">
              <h4 className="font-black text-purple-800 uppercase text-[9px] tracking-widest mb-1">Sedation</h4>
              {report.sedation?.used ? (
                <div className="space-y-0.5">
                  <div className="font-bold text-gray-800">
                    {report.sedation.drugName || 'Not specified'}
                    {report.sedation.dose && ` (${report.sedation.dose})`}
                  </div>
                  <div className="text-gray-600">Type: {report.sedation.type}</div>
                </div>
              ) : (
                <div className="text-gray-500 italic">No Sedation Used</div>
              )}
            </div>

            <div className={clsx('border rounded-lg p-2',
              report.consentObtained ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
            )}>
              <h4 className={clsx('font-black uppercase text-[9px] tracking-widest mb-1',
                report.consentObtained ? 'text-green-800' : 'text-red-800'
              )}>Consent Status</h4>
              <div className={clsx('font-bold',
                report.consentObtained ? 'text-green-700' : 'text-red-600'
              )}>
                {report.consentObtained ? '✓ Informed Consent Obtained' : '✗ Consent Not Documented'}
              </div>
            </div>

            <div className="border rounded-lg p-2 bg-gray-50">
              <h4 className="font-black text-gray-600 uppercase text-[9px] tracking-widest mb-1">Procedure Team</h4>
              <div className="space-y-0.5">
                <div className="font-bold text-gray-800">Dr. {report.performingDoctor?.name || 'N/A'}</div>
                {report.assistant && <div className="text-gray-600">Assistant: {report.assistant}</div>}
                {report.nurse && <div className="text-gray-600">Nurse: {report.nurse}</div>}
              </div>
            </div>
          </div>

          {/* ═══════ ORGAN STATUS ═══════ */}
          {report.organStatus && Object.keys(report.organStatus).length > 0 && (
            <div className="mb-4 border rounded-lg overflow-hidden">
              <div className="bg-gray-100 px-3 py-1 border-b">
                <h3 className="font-black uppercase text-gray-700 text-[10px] tracking-widest">
                  Organ Status Overview
                </h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-0 text-[10px] print:grid-cols-4">
                {Object.entries(report.organStatus).map(([organ, status]) => (
                  <div key={organ} className={clsx(
                    'p-2 border-r border-b last:border-r-0 text-center',
                    status === 'normal' ? 'bg-green-50' : status === 'abnormal' ? 'bg-red-50' : 'bg-gray-50'
                  )}>
                    <div className="font-bold text-gray-700 uppercase text-[9px]">{formatOrganName(organ)}</div>
                    {getOrganStatusBadge(status)}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ═══════ DETAILED FINDINGS ═══════ */}
          <div className="mb-4 flex-1">
            <div className="bg-gray-100 px-3 py-1 mb-2 border-l-4 border-blue-900 flex justify-between items-center">
              <h3 className="font-black uppercase text-blue-900 text-[10px] tracking-[0.15em] sm:tracking-[0.2em]">
                Detailed Examination Findings
              </h3>
            </div>

            <div className="text-[11px] leading-relaxed text-gray-800">
              {report.organStatus?.geJunction === 'abnormal' && report.geJunctionDetails && (
                <div className="mb-4 bg-orange-50 border border-orange-200 rounded-lg p-3">
                  <h4 className="font-black text-orange-800 uppercase border-b border-orange-200 mb-2 pb-1 text-[10px] tracking-widest">
                    GE Junction - Detailed Assessment
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] print:grid-cols-2">
                    {report.geJunctionDetails.distanceFromIncisors && (
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-orange-400 flex-shrink-0" />
                        <span>Z-line Distance: <b>{report.geJunctionDetails.distanceFromIncisors} cm</b> from incisors</span>
                      </div>
                    )}
                    {report.geJunctionDetails.hiatusHernia && (
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
                        <span className="text-red-700 font-bold">
                          Hiatus Hernia Present {report.geJunctionDetails.herniaSize && `(${report.geJunctionDetails.herniaSize})`}
                        </span>
                      </div>
                    )}
                    {report.geJunctionDetails.incompetentLES && (
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-orange-500 flex-shrink-0" />
                        <span className="font-bold">Incompetent LES</span>
                      </div>
                    )}
                    {report.geJunctionDetails.irregularZLine && (
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-orange-500 flex-shrink-0" />
                        <span className="font-bold">Irregular Z-Line</span>
                      </div>
                    )}
                    {report.geJunctionDetails.barrettsEsophagus && (
                      <div className="flex items-center gap-2 sm:col-span-2 print:col-span-2">
                        <span className="w-2 h-2 rounded-full bg-red-600 flex-shrink-0" />
                        <span className="text-red-600 font-black uppercase">⚠ Barrett's Esophagus - Suspected</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {Object.keys(groupedFindings).length > 0 ? (
                <div className="space-y-3">
                  {Object.entries(groupedFindings).map(([organName, items]) => (
                    <div key={organName} className="border-l-2 border-blue-400 pl-3">
                      <h4 className="font-black text-blue-900 uppercase border-b border-gray-100 mb-2 text-[11px] tracking-tight flex items-center gap-2 flex-wrap">
                        <span className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0" />
                        {organName}
                        <span className="text-[9px] font-normal text-gray-400">
                          ({items.length} finding{items.length > 1 ? 's' : ''})
                        </span>
                      </h4>
                      <div className="space-y-2 ml-2 sm:ml-4">
                        {items.map((item, idx) => (
                          <div key={idx} className="bg-gray-50 p-2 rounded border-l-2 border-gray-300">
                            <div className="flex items-start gap-2">
                              <span className="text-blue-600 font-black flex-shrink-0">{idx + 1}.</span>
                              <div className="flex-1 min-w-0">
                                <span className="text-gray-900 font-black uppercase">{item.finding}</span>
                                <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-1">
                                  {item.severity && (
                                    <span className={clsx(
                                      'px-1.5 py-0.5 rounded text-[9px] font-bold uppercase',
                                      item.severity.toLowerCase().includes('severe') ? 'bg-red-100 text-red-700'
                                        : item.severity.toLowerCase().includes('moderate') ? 'bg-orange-100 text-orange-700'
                                        : 'bg-yellow-100 text-yellow-700'
                                    )}>{item.severity}</span>
                                  )}
                                  {item.size && <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-100 text-blue-700">Size: {item.size}</span>}
                                  {item.location && <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-100 text-purple-700">Loc: {item.location}</span>}
                                  {item.count && <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-green-100 text-green-700">Count: {item.count}</span>}
                                </div>
                                {item.description && (
                                  <p className="text-gray-600 mt-1 text-[10px] italic border-l-2 border-gray-200 pl-2">
                                    {item.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 sm:py-8 border-2 border-dashed border-gray-200 rounded-xl bg-green-50">
                  <CheckCircle className="mx-auto mb-2 text-green-500" size={28} />
                  <p className="text-green-700 font-bold uppercase tracking-widest text-xs sm:text-sm">Normal Endoscopy Study</p>
                  <p className="text-gray-500 text-[10px] sm:text-xs mt-1">No abnormal findings documented</p>
                </div>
              )}
            </div>
          </div>

          {/* ═══════ BIOPSY / THERAPEUTIC / COMPLICATIONS ═══════ */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4 text-[10px] break-inside-avoid print:grid-cols-3">
            <div className="border rounded-lg overflow-hidden bg-blue-50">
              <div className="bg-blue-100 px-2 py-1 border-b border-blue-200">
                <h4 className="font-black text-blue-900 uppercase text-[9px] tracking-widest">Biopsy / Samples</h4>
              </div>
              <div className="p-2">
                {report.biopsy?.taken ? (
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Sites:</span>
                      <span className="font-bold text-gray-900">{report.biopsy.sites?.join(', ') || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Samples:</span>
                      <span className="font-bold text-gray-900">{report.biopsy.numberOfSamples || 0}</span>
                    </div>
                    <div className="border-t border-blue-200 pt-1 mt-1 space-y-0.5">
                      {report.biopsy.rut && (
                        <div className="text-orange-700 font-bold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-orange-500" /> RUT - Done
                        </div>
                      )}
                      {report.biopsy.histopathology && (
                        <div className="text-green-700 font-bold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Sent for Histopathology
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-500 italic text-center py-2">No Biopsy Taken</div>
                )}
              </div>
            </div>

            <div className="border rounded-lg overflow-hidden bg-green-50">
              <div className="bg-green-100 px-2 py-1 border-b border-green-200">
                <h4 className="font-black text-green-900 uppercase text-[9px] tracking-widest">Therapeutic Interventions</h4>
              </div>
              <div className="p-2">
                {report.therapeutic?.performed && report.therapeutic.procedures?.length > 0 ? (
                  <div className="space-y-2">
                    {report.therapeutic.procedures.map((proc, i) => (
                      <div key={i} className="border-b border-green-200 last:border-0 pb-1 last:pb-0">
                        <div className="font-bold text-green-800">{proc.type}</div>
                        {proc.site && <div className="text-[9px] text-gray-600">Site: {proc.site}</div>}
                        {proc.details && <div className="text-[9px] text-gray-500 italic">{proc.details}</div>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-500 italic text-center py-2">No Therapeutic Procedures</div>
                )}
              </div>
            </div>

            <div className={clsx('border rounded-lg overflow-hidden',
              report.complications?.occurred ? 'bg-red-50 border-red-200' : 'bg-gray-50'
            )}>
              <div className={clsx('px-2 py-1 border-b',
                report.complications?.occurred ? 'bg-red-100 border-red-200' : 'bg-gray-100 border-gray-200'
              )}>
                <h4 className={clsx('font-black uppercase text-[9px] tracking-widest',
                  report.complications?.occurred ? 'text-red-900' : 'text-gray-600'
                )}>Complications</h4>
              </div>
              <div className="p-2">
                {report.complications?.occurred ? (
                  <div>
                    <div className="flex items-center gap-1 text-red-600 font-bold mb-1">
                      <AlertTriangle size={12} /> COMPLICATIONS NOTED
                    </div>
                    <div className="text-red-700 font-bold">{report.complications.types?.join(', ')}</div>
                    {report.complications.management && (
                      <div className="mt-1 pt-1 border-t border-red-200">
                        <span className="text-[9px] font-bold text-gray-600 uppercase">Management:</span>
                        <p className="text-gray-700 text-[10px]">{report.complications.management}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-green-600 font-bold text-center py-2 flex items-center justify-center gap-1">
                    <CheckCircle size={14} /> Uneventful Procedure
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ═══════ CLINICAL IMAGES — ✅ FULLY FIXED ═══════ */}
          {selectedImages.length > 0 && (
            <div className="mb-4 break-inside-avoid">
              <div className="bg-gray-100 px-3 py-1 mb-2 border-l-4 border-blue-900 
                              flex justify-between items-center">
                <h3 className="font-black uppercase text-blue-900 text-[10px] 
                               tracking-[0.15em] sm:tracking-[0.2em]">
                  Clinical Evidence
                </h3>
                <span className="text-[9px] font-bold text-gray-400 italic">
                  {selectedImages.length} image(s)
                  {!imagesReady && ' — loading...'}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 
                              gap-2 sm:gap-3 px-1 mt-3 print:grid-cols-4">
                {selectedImages.map((img, i) => {
                  const imgKey = `clinical_${i}`;
                  // ✅ FIX: Use base64 if available, otherwise build URL
                  const imgSrc = base64Images[imgKey] || getImageURL(img.path);
                  // ✅ FIX: Check error state from React state (not DOM)
                  const hasError = imageErrors[imgKey];

                  return (
                    <div key={i} className="flex flex-col items-center">
                      <div
                        className="w-full aspect-square border-2 border-gray-200 
                                    p-0.5 rounded shadow-sm overflow-hidden 
                                    bg-gray-50 print-img-container"
                      >
                        {/* ✅ FIX: Conditional render based on state, no DOM manipulation */}
                        {hasError ? (
                          <div className="h-full w-full flex items-center 
                                          justify-center bg-gray-100 text-gray-400">
                            <div className="text-center">
                              <AlertTriangle size={24} className="mx-auto mb-1" />
                              <p className="text-[8px]">Image unavailable</p>
                            </div>
                          </div>
                        ) : (
                          <img
                            src={imgSrc}
                            className="h-full w-full object-contain"
                            alt={`Snapshot ${i + 1}`}
                            loading="eager"
                            onError={() => handleImageError(imgKey)}
                          />
                        )}
                      </div>
                      <p className="text-[8px] sm:text-[9px] font-black text-gray-600 
                                    mt-1 uppercase truncate w-full text-center tracking-tighter">
                        {img.taggedOrgan ? `[${img.taggedOrgan}] ` : ''}
                        {img.caption || `IMG-${i + 1}`}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ═══════ CONCLUSION ═══════ */}
          <div className="mt-auto break-inside-avoid">
            <div className="border-t-4 border-blue-900 pt-4">
              <div className="mb-4">
                <h3 className="font-black uppercase text-[10px] tracking-widest text-blue-900 mb-2 flex items-center gap-2">
                  <span className="w-3 h-3 bg-blue-900 rounded-full flex-shrink-0" />
                  Final Impression / Diagnosis
                </h3>
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-3 sm:p-4 rounded-xl border-l-4 border-blue-900 shadow-inner">
                  <p className="font-black text-xs sm:text-[13px] text-blue-950 uppercase leading-relaxed whitespace-pre-line print:text-[13px]">
                    {report.customImpression || 'Normal endoscopy study. No significant pathology identified.'}
                  </p>
                </div>
              </div>

              {(report.recommendations || report.followUp || report.comments) && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 print:grid-cols-3">
                  {report.recommendations && (
                    <div className="border-l-2 border-green-500 pl-3">
                      <h4 className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Recommendations</h4>
                      <p className="text-[10px] font-bold text-gray-700 leading-tight whitespace-pre-line">{report.recommendations}</p>
                    </div>
                  )}
                  {report.followUp && (
                    <div className="border-l-2 border-orange-500 pl-3">
                      <h4 className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Follow Up</h4>
                      <p className="text-[10px] font-bold text-gray-700 leading-tight">{report.followUp}</p>
                    </div>
                  )}
                  {report.comments && (
                    <div className="border-l-2 border-gray-400 pl-3">
                      <h4 className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Additional Comments</h4>
                      <p className="text-[10px] text-gray-600 italic leading-tight">{report.comments}</p>
                    </div>
                  )}
                </div>
              )}

              {/* ═══════ SIGNATURE — ✅ FIXED ═══════ */}
              <div className="flex flex-col-reverse sm:flex-row justify-between 
                              items-start sm:items-end mt-6 border-t border-gray-200 
                              pt-4 gap-6 sm:gap-4 print:flex-row print:items-end print:gap-4">
                <div className="text-[8px] text-gray-400 font-mono max-w-[200px]">
                  <p className="font-bold text-gray-500 mb-1">Report Information:</p>
                  <p>Generated: {new Date().toLocaleString()}</p>
                  <p>Report ID: {report.reportId}</p>
                  <p>Status: {report.status?.toUpperCase()}</p>
                  {report.status === 'finalized' && report.finalizedAt && (
                    <p>Finalized: {new Date(report.finalizedAt).toLocaleString()}</p>
                  )}
                  <p className="mt-2 uppercase text-[7px]">
                    This is a computer-generated document.
                    {report.status === 'finalized' && ' This report has been verified and finalized.'}
                  </p>
                </div>

                <div className="text-center min-w-[180px] sm:min-w-[220px] print:min-w-[220px]">
                  {/* ✅ FIX: Signature uses state-based error, no DOM manipulation */}
                  {(base64Images.signature || report.performingDoctor?.signature) && !imageErrors.signature ? (
                    <img
                      src={base64Images.signature || getImageURL(report.performingDoctor.signature)}
                      className="h-14 sm:h-16 mx-auto object-contain mix-blend-multiply print:h-16"
                      alt="Doctor Signature"
                      onError={() => handleImageError('signature')}
                    />
                  ) : (
                    <div className="h-14 sm:h-16 flex items-center justify-center text-gray-300 text-xs italic">
                      [Digital Signature]
                    </div>
                  )}
                  <div className="border-t-2 border-gray-900 pt-2 mt-1">
                    <p className="font-black text-xs sm:text-sm uppercase text-gray-900 tracking-tight leading-none print:text-sm">
                      {report.performingDoctor?.name || 'Performing Physician'}
                    </p>
                    {report.performingDoctor?.qualification && (
                      <p className="text-[9px] sm:text-[10px] font-bold text-blue-900 uppercase mt-1 leading-none print:text-[10px]">
                        {report.performingDoctor.qualification}
                      </p>
                    )}
                    {report.performingDoctor?.specialization && (
                      <p className="text-[8px] sm:text-[9px] text-gray-500 uppercase leading-none mt-0.5 print:text-[9px]">
                        {report.performingDoctor.specialization}
                      </p>
                    )}
                    {report.performingDoctor?.registrationNumber && (
                      <p className="text-[8px] text-gray-400 mt-1">
                        Reg. No: {report.performingDoctor.registrationNumber}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-2 border-t border-dashed border-gray-200 text-center">
                <p className="text-[7px] sm:text-[8px] text-gray-400 print:text-[8px]">
                  {settings?.hospitalName} | {settings?.hospitalAddress?.split('\n')[0]} | Tel: {settings?.hospitalPhone}
                </p>
                <p className="text-[6px] sm:text-[7px] text-gray-300 mt-0.5 print:text-[7px]">— End of Report —</p>
              </div>
            </div>
          </div>
        </div>

        {/* ═══════ MOBILE BOTTOM BAR ═══════ */}
        <div className="sm:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md 
                        border-t border-gray-200 z-40 print:hidden"
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
          <div className="flex items-center divide-x divide-gray-200">
            <button onClick={handlePDF} disabled={generating}
              className="flex-1 flex flex-col items-center justify-center py-2.5 text-gray-600 hover:text-blue-600 active:bg-blue-50 transition-colors disabled:opacity-50">
              <Download size={18} />
              <span className="text-[10px] font-medium mt-0.5">{generating ? 'Wait...' : 'PDF'}</span>
            </button>
            <button onClick={handlePrint}
              className="flex-1 flex flex-col items-center justify-center py-2.5 text-gray-600 hover:text-blue-600 active:bg-blue-50 transition-colors">
              <Printer size={18} />
              <span className="text-[10px] font-medium mt-0.5">Print</span>
            </button>
            <button onClick={handleShare}
              className="flex-1 flex flex-col items-center justify-center py-2.5 text-gray-600 hover:text-blue-600 active:bg-blue-50 transition-colors">
              <Share2 size={18} />
              <span className="text-[10px] font-medium mt-0.5">Share</span>
            </button>
            {report.status === 'draft' && (
              <button onClick={handleFinalize}
                className="flex-1 flex flex-col items-center justify-center py-2.5 text-green-600 hover:text-green-700 active:bg-green-50 transition-colors">
                <CheckCircle size={18} />
                <span className="text-[10px] font-medium mt-0.5">Finalize</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default PrintReport;