// // // import React, { useState, useEffect, useRef, useCallback } from 'react';
// // // import { useNavigate } from 'react-router-dom';
// // // import api, { getImageURL } from '../../utils/api';
// // // import {
// // //   Search, Plus, User, Phone, Calendar, ArrowRight,
// // //   Edit, Trash2, X, MoreVertical, FilePlus, Image as ImageIcon,
// // //   MapPin, FileText, ExternalLink, Maximize2, Download,
// // //   ChevronLeft, ChevronRight, Filter, SortAsc, SortDesc,
// // //   Clock, Hash, Activity, Eye, ZoomIn, ChevronDown,
// // //   UserPlus, AlertCircle, CheckCircle, Loader2, ArrowUpDown,
// // //   Stethoscope
// // // } from 'lucide-react';
// // // import toast from 'react-hot-toast';
// // // import clsx from 'clsx';

// // // /* ═══════════════════════════════════════════════════════════════════
// // //    LIGHTBOX — full-screen image viewer
// // //    ═══════════════════════════════════════════════════════════════════ */
// // // const Lightbox = ({ image, onClose, images, onNavigate }) => {
// // //   if (!image) return null;
// // //   const imageUrl = getImageURL(image.path);

// // //   const currentIndex = images?.findIndex(i => i.path === image.path) ?? -1;

// // //   useEffect(() => {
// // //     const handler = (e) => {
// // //       if (e.key === 'Escape') onClose();
// // //       if (e.key === 'ArrowLeft' && currentIndex > 0) onNavigate(images[currentIndex - 1]);
// // //       if (e.key === 'ArrowRight' && currentIndex < images.length - 1) onNavigate(images[currentIndex + 1]);
// // //     };
// // //     document.addEventListener('keydown', handler);
// // //     document.body.style.overflow = 'hidden';
// // //     return () => {
// // //       document.removeEventListener('keydown', handler);
// // //       document.body.style.overflow = '';
// // //     };
// // //   }, [currentIndex, images, onClose, onNavigate]);

// // //   return (
// // //     <div
// // //       className="fixed inset-0 z-[100] bg-black/98 backdrop-blur-3xl flex flex-col items-center justify-center animate-in fade-in duration-200"
// // //       onClick={onClose}
// // //     >
// // //       <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-black/80 via-black/40 to-transparent z-10 flex items-center justify-between px-8">
// // //         <div className="text-white/60 text-sm font-medium tracking-wide">
// // //           {currentIndex >= 0 && (
// // //             <span className="bg-white/10 px-3.5 py-1.5 rounded-full backdrop-blur-sm border border-white/10">
// // //               {currentIndex + 1} <span className="text-white/40">of</span> {images.length}
// // //             </span>
// // //           )}
// // //         </div>
// // //         <div className="flex items-center gap-3">
// // //           <a
// // //             href={imageUrl}
// // //             download
// // //             target="_blank"
// // //             rel="noreferrer"
// // //             onClick={e => e.stopPropagation()}
// // //             className="p-3 bg-white/[0.08] hover:bg-white/[0.15] border border-white/[0.08] rounded-2xl text-white/80 hover:text-white transition-all duration-300"
// // //             title="Download"
// // //           >
// // //             <Download size={18} />
// // //           </a>
// // //           <button
// // //             onClick={onClose}
// // //             className="p-3 bg-white/[0.08] hover:bg-white/[0.15] border border-white/[0.08] rounded-2xl text-white/80 hover:text-white transition-all duration-300"
// // //           >
// // //             <X size={18} />
// // //           </button>
// // //         </div>
// // //       </div>

// // //       {currentIndex > 0 && (
// // //         <button
// // //           onClick={e => { e.stopPropagation(); onNavigate(images[currentIndex - 1]); }}
// // //           className="absolute left-6 top-1/2 -translate-y-1/2 z-10 p-4 bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] rounded-2xl text-white/70 hover:text-white transition-all duration-300 backdrop-blur-sm hover:scale-105"
// // //         >
// // //           <ChevronLeft size={22} />
// // //         </button>
// // //       )}
// // //       {currentIndex < images.length - 1 && (
// // //         <button
// // //           onClick={e => { e.stopPropagation(); onNavigate(images[currentIndex + 1]); }}
// // //           className="absolute right-6 top-1/2 -translate-y-1/2 z-10 p-4 bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] rounded-2xl text-white/70 hover:text-white transition-all duration-300 backdrop-blur-sm hover:scale-105"
// // //         >
// // //           <ChevronRight size={22} />
// // //         </button>
// // //       )}

// // //       <div className="relative max-w-[88vw] max-h-[78vh]" onClick={e => e.stopPropagation()}>
// // //         <img
// // //           src={imageUrl}
// // //           alt={image.caption || 'Medical image'}
// // //           className="max-w-full max-h-[78vh] rounded-2xl shadow-2xl shadow-black/50 object-contain select-none ring-1 ring-white/10"
// // //           draggable={false}
// // //         />
// // //       </div>

// // //       <div className="mt-8 text-center text-white px-6" onClick={e => e.stopPropagation()}>
// // //         <p className="font-semibold text-lg tracking-tight">{image.taggedOrgan || 'Untagged'}</p>
// // //         <p className="text-white/40 text-sm mt-1.5 font-medium">
// // //           {image.caption || 'No caption'} &middot;{' '}
// // //           {new Date(image.procedureDate).toLocaleDateString('en-US', {
// // //             year: 'numeric', month: 'short', day: 'numeric'
// // //           })}
// // //         </p>
// // //       </div>
// // //     </div>
// // //   );
// // // };

// // // /* ═══════════════════════════════════════════════════════════════════
// // //    SKELETON LOADERS
// // //    ═══════════════════════════════════════════════════════════════════ */
// // // const GallerySkeleton = () => (
// // //   <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
// // //     {[...Array(10)].map((_, i) => (
// // //       <div key={i} className="aspect-square bg-gradient-to-br from-slate-100 via-slate-50 to-slate-100 rounded-2xl animate-pulse" style={{ animationDelay: `${i * 80}ms` }} />
// // //     ))}
// // //   </div>
// // // );

// // // const TableSkeleton = () => (
// // //   <div className="space-y-0">
// // //     {[...Array(6)].map((_, i) => (
// // //       <div key={i} className="flex items-center gap-4 px-6 py-5 border-b border-slate-50 animate-pulse" style={{ animationDelay: `${i * 100}ms` }}>
// // //         <div className="w-11 h-11 bg-gradient-to-br from-slate-200 to-slate-100 rounded-xl shrink-0" />
// // //         <div className="flex-1 space-y-2.5">
// // //           <div className="h-4 bg-slate-200/80 rounded-lg w-1/3" />
// // //           <div className="h-3 bg-slate-100 rounded-lg w-1/5" />
// // //         </div>
// // //         <div className="h-4 bg-slate-100 rounded-lg w-20 hidden sm:block" />
// // //         <div className="h-4 bg-slate-100 rounded-lg w-24 hidden sm:block" />
// // //         <div className="h-4 bg-slate-100 rounded-lg w-28 hidden sm:block" />
// // //       </div>
// // //     ))}
// // //   </div>
// // // );

// // // /* ═══════════════════════════════════════════════════════════════════
// // //    PATIENT GALLERY MODAL
// // //    ═══════════════════════════════════════════════════════════════════ */
// // // const PatientGalleryModal = ({ patient, onClose }) => {
// // //   const navigate = useNavigate();
// // //   const [reports, setReports] = useState([]);
// // //   const [activeTab, setActiveTab] = useState('gallery');
// // //   const [loading, setLoading] = useState(true);
// // //   const [selectedImage, setSelectedImage] = useState(null);

// // //   useEffect(() => {
// // //     document.body.style.overflow = 'hidden';
// // //     return () => { document.body.style.overflow = ''; };
// // //   }, []);

// // //   useEffect(() => {
// // //     (async () => {
// // //       try {
// // //         const { data } = await api.get(`/reports?patient=${patient._id}&limit=100`);
// // //         setReports(data.reports || []);
// // //       } catch {
// // //         toast.error('Failed to load history');
// // //       } finally {
// // //         setTimeout(() => setLoading(false), 400);
// // //       }
// // //     })();
// // //   }, [patient._id]);

// // //   const galleryImages = React.useMemo(() => {
// // //     const all = [];
// // //     reports.forEach(r => {
// // //       (r.images || []).forEach(img => {
// // //         all.push({ ...img, procedureDate: r.procedureDate, procedureName: r.procedureName, reportId: r._id });
// // //       });
// // //     });
// // //     return all.sort((a, b) => new Date(b.procedureDate) - new Date(a.procedureDate));
// // //   }, [reports]);

// // //   const getInitials = n => n.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();

// // //   return (
// // //     <>
// // //       {selectedImage && (
// // //         <Lightbox
// // //           image={selectedImage}
// // //           images={galleryImages}
// // //           onClose={() => setSelectedImage(null)}
// // //           onNavigate={setSelectedImage}
// // //         />
// // //       )}

// // //       <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-0 sm:p-6">
// // //         <div className="bg-white w-full h-full sm:h-[92vh] sm:max-w-5xl sm:rounded-3xl shadow-2xl shadow-black/20 overflow-hidden flex flex-col animate-in slide-in-from-bottom-4 fade-in duration-300">

// // //           <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-8 py-7 text-white shrink-0 overflow-hidden">
// // //             <div className="absolute inset-0 opacity-30">
// // //               <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
// // //               <div className="absolute bottom-0 left-0 w-64 h-64 bg-violet-500/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />
// // //             </div>
// // //             <div className="relative flex items-center justify-between">
// // //               <div className="flex items-center gap-5">
// // //                 <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 border-2 border-white/20 flex items-center justify-center text-xl font-bold shadow-lg shadow-blue-500/30">
// // //                   {getInitials(patient.name)}
// // //                 </div>
// // //                 <div>
// // //                   <h2 className="text-2xl font-bold tracking-tight">{patient.name}</h2>
// // //                   <div className="flex flex-wrap gap-2.5 mt-2">
// // //                     <span className="inline-flex items-center gap-1.5 text-xs text-white/80 bg-white/[0.08] border border-white/[0.06] px-3 py-1.5 rounded-lg font-medium backdrop-blur-sm">
// // //                       <User size={12} /> {patient.age}Y / {patient.sex}
// // //                     </span>
// // //                     <span className="inline-flex items-center gap-1.5 text-xs text-white/80 bg-white/[0.08] border border-white/[0.06] px-3 py-1.5 rounded-lg font-mono backdrop-blur-sm">
// // //                       <Hash size={12} /> {patient.patientId}
// // //                     </span>
// // //                     {patient.phone && (
// // //                       <span className="inline-flex items-center gap-1.5 text-xs text-white/80 bg-white/[0.08] border border-white/[0.06] px-3 py-1.5 rounded-lg font-medium backdrop-blur-sm">
// // //                         <Phone size={12} /> {patient.phone}
// // //                       </span>
// // //                     )}
// // //                   </div>
// // //                 </div>
// // //               </div>
// // //               <button
// // //                 onClick={onClose}
// // //                 className="p-3 bg-white/[0.08] hover:bg-white/[0.15] border border-white/[0.06] rounded-2xl transition-all duration-300"
// // //               >
// // //                 <X size={18} />
// // //               </button>
// // //             </div>
// // //           </div>

// // //           <div className="px-8 bg-white border-b border-slate-200/80 shrink-0">
// // //             <div className="flex gap-2">
// // //               {[
// // //                 { id: 'gallery', label: 'Gallery', icon: ImageIcon, count: galleryImages.length },
// // //                 { id: 'reports', label: 'Reports', icon: FileText, count: reports.length },
// // //               ].map(tab => (
// // //                 <button
// // //                   key={tab.id}
// // //                   onClick={() => setActiveTab(tab.id)}
// // //                   className={clsx(
// // //                     'relative flex items-center gap-2.5 px-5 py-4 text-sm font-semibold transition-all duration-300',
// // //                     activeTab === tab.id ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'
// // //                   )}
// // //                 >
// // //                   <tab.icon size={16} />
// // //                   {tab.label}
// // //                   <span className={clsx(
// // //                     'text-[11px] min-w-[28px] text-center px-2 py-0.5 rounded-full font-bold tabular-nums transition-colors duration-300',
// // //                     activeTab === tab.id ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'
// // //                   )}>
// // //                     {tab.count}
// // //                   </span>
// // //                   {activeTab === tab.id && (
// // //                     <span className="absolute bottom-0 left-3 right-3 h-[3px] bg-blue-600 rounded-full" />
// // //                   )}
// // //                 </button>
// // //               ))}
// // //             </div>
// // //           </div>

// // //           <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-gradient-to-b from-slate-50/80 to-white">
// // //             {loading ? (
// // //               activeTab === 'gallery' ? <GallerySkeleton /> : <TableSkeleton />
// // //             ) : (
// // //               <>
// // //                 {activeTab === 'gallery' && (
// // //                   galleryImages.length === 0 ? (
// // //                     <div className="h-72 flex flex-col items-center justify-center text-slate-400">
// // //                       <div className="w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-50 rounded-3xl flex items-center justify-center mb-5 shadow-inner">
// // //                         <ImageIcon size={40} strokeWidth={1.5} className="text-slate-300" />
// // //                       </div>
// // //                       <p className="font-bold text-slate-700 text-lg">No images yet</p>
// // //                       <p className="text-sm mt-1.5 text-slate-400">Images from reports will appear here</p>
// // //                     </div>
// // //                   ) : (
// // //                     <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
// // //                       {galleryImages.map((img, idx) => (
// // //                         <div
// // //                           key={idx}
// // //                           onClick={() => setSelectedImage(img)}
// // //                           className="group relative aspect-square rounded-2xl overflow-hidden cursor-pointer bg-slate-100 ring-1 ring-black/[0.06] hover:ring-2 hover:ring-blue-300/60 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10"
// // //                         >
// // //                           <img
// // //                             src={getImageURL(img.path)}
// // //                             className="w-full h-full object-cover transition-all duration-700 ease-out group-hover:scale-110"
// // //                             alt={img.caption}
// // //                             loading="lazy"
// // //                           />
// // //                           <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-0 opacity-100 transition-all duration-400" />
// // //                           <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-3 group-hover:translate-y-0 opacity-0 opacity-100 transition-all duration-400">
// // //                             <p className="text-white text-sm font-bold truncate">{img.taggedOrgan || 'Untagged'}</p>
// // //                             <p className="text-white/50 text-xs mt-1 font-medium">
// // //                               {new Date(img.procedureDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
// // //                             </p>
// // //                           </div>
// // //                           <div className="absolute top-3 right-3 opacity-100 transition-all duration-300 scale-75 group-hover:scale-100">
// // //                             <div className="p-2.5 bg-white/20 backdrop-blur-xl rounded-xl text-white border border-white/10">
// // //                               <ZoomIn size={15} />
// // //                             </div>
// // //                           </div>
// // //                         </div>
// // //                       ))}
// // //                     </div>
// // //                   )
// // //                 )}

// // //                 {activeTab === 'reports' && (
// // //                   reports.length === 0 ? (
// // //                     <div className="h-72 flex flex-col items-center justify-center text-slate-400">
// // //                       <div className="w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-50 rounded-3xl flex items-center justify-center mb-5 shadow-inner">
// // //                         <FileText size={40} strokeWidth={1.5} className="text-slate-300" />
// // //                       </div>
// // //                       <p className="font-bold text-slate-700 text-lg">No reports found</p>
// // //                       <p className="text-sm mt-1.5 text-slate-400">Create a report to get started</p>
// // //                     </div>
// // //                   ) : (
// // //                     <div className="space-y-3">
// // //                       {reports.map(rep => (
// // //                         <div
// // //                           key={rep._id}
// // //                           onClick={() => navigate(`/reports/${rep._id}/print`)}
// // //                           className="group bg-white rounded-2xl border border-slate-200/80 hover:border-blue-200/80 p-5 flex items-center gap-5 cursor-pointer transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/[0.06] hover:-translate-y-0.5"
// // //                         >
// // //                           <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 group-hover:from-blue-50 group-hover:to-blue-100 flex items-center justify-center transition-all duration-300 border border-slate-200/60 group-hover:border-blue-200/60">
// // //                             <FileText size={20} className="text-slate-400 group-hover:text-blue-500 transition-colors duration-300" />
// // //                           </div>
// // //                           <div className="flex-1 min-w-0">
// // //                             <p className="font-bold text-slate-800 truncate text-[15px]">{rep.procedureName}</p>
// // //                             <p className="text-xs text-slate-400 mt-1 flex items-center gap-2 font-medium">
// // //                               <Calendar size={12} />
// // //                               {new Date(rep.procedureDate).toLocaleDateString('en-US', {
// // //                                 year: 'numeric', month: 'short', day: 'numeric'
// // //                               })}
// // //                               {rep.images?.length > 0 && (
// // //                                 <>
// // //                                   <span className="w-1 h-1 rounded-full bg-slate-300" />
// // //                                   <ImageIcon size={12} />
// // //                                   {rep.images.length} image{rep.images.length > 1 ? 's' : ''}
// // //                                 </>
// // //                               )}
// // //                             </p>
// // //                           </div>
// // //                           <span className={clsx(
// // //                             'hidden sm:inline-flex px-3.5 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider border',
// // //                             rep.status === 'finalized'
// // //                               ? 'bg-emerald-50 text-emerald-600 border-emerald-200/60'
// // //                               : 'bg-amber-50 text-amber-600 border-amber-200/60'
// // //                           )}>
// // //                             {rep.status}
// // //                           </span>
// // //                           <div className="w-9 h-9 rounded-xl bg-slate-50 group-hover:bg-blue-50 flex items-center justify-center transition-all duration-300">
// // //                             <ArrowRight size={16} className="text-slate-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all duration-300" />
// // //                           </div>
// // //                         </div>
// // //                       ))}
// // //                     </div>
// // //                   )
// // //                 )}
// // //               </>
// // //             )}
// // //           </div>

// // //           <div className="bg-white border-t border-slate-200/80 px-8 py-5 flex items-center justify-between gap-3 shrink-0">
// // //             <button
// // //               onClick={onClose}
// // //               className="px-6 py-3 text-sm font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all duration-200"
// // //             >
// // //               Close
// // //             </button>
// // //             <button
// // //               onClick={() => navigate(`/reports/new?patient=${patient._id}`)}
// // //               className="inline-flex items-center gap-2.5 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-600/25 transition-all duration-300 hover:shadow-xl hover:shadow-blue-600/35 active:scale-[0.97]"
// // //             >
// // //               <FilePlus size={17} /> New Report
// // //             </button>
// // //           </div>
// // //         </div>
// // //       </div>
// // //     </>
// // //   );
// // // };

// // // /* ═══════════════════════════════════════════════════════════════════
// // //    MOBILE ACTION MENU
// // //    ═══════════════════════════════════════════════════════════════════ */
// // // const MobileActions = ({ onEdit, onDelete, onCreateReport, onViewGallery }) => {
// // //   const [open, setOpen] = useState(false);
// // //   const ref = useRef(null);

// // //   useEffect(() => {
// // //     if (!open) return;
// // //     const close = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
// // //     document.addEventListener('mousedown', close);
// // //     return () => document.removeEventListener('mousedown', close);
// // //   }, [open]);

// // //   return (
// // //     <div className="relative" ref={ref}>
// // //       <button
// // //         onClick={e => { e.stopPropagation(); setOpen(o => !o); }}
// // //         className={clsx(
// // //           'p-2.5 rounded-xl transition-all duration-200',
// // //           open ? 'bg-slate-200 text-slate-700' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
// // //         )}
// // //       >
// // //         <MoreVertical size={18} />
// // //       </button>

// // //       {open && (
// // //         <div className="absolute right-0 top-full mt-2.5 w-56 bg-white rounded-2xl shadow-2xl shadow-slate-300/40 border border-slate-200/80 z-30 py-2 overflow-hidden animate-in slide-in-from-top-2 fade-in duration-200">
// // //           <button onClick={() => { onCreateReport(); setOpen(false); }} className="w-full flex items-center gap-3 px-5 py-3 text-sm font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-all duration-200">
// // //             <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center"><FilePlus size={15} className="text-blue-500" /></div>
// // //             Create Report
// // //           </button>
// // //           <button onClick={() => { onViewGallery(); setOpen(false); }} className="w-full flex items-center gap-3 px-5 py-3 text-sm font-medium text-slate-700 hover:bg-violet-50 hover:text-violet-700 transition-all duration-200">
// // //             <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center"><ImageIcon size={15} className="text-violet-500" /></div>
// // //             View Gallery
// // //           </button>
// // //           <div className="my-2 mx-4 border-t border-slate-100" />
// // //           <button onClick={() => { onEdit(); setOpen(false); }} className="w-full flex items-center gap-3 px-5 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-all duration-200">
// // //             <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center"><Edit size={15} className="text-slate-500" /></div>
// // //             Edit Details
// // //           </button>
// // //           <button onClick={() => { onDelete(); setOpen(false); }} className="w-full flex items-center gap-3 px-5 py-3 text-sm font-medium text-red-600 hover:bg-red-50 transition-all duration-200">
// // //             <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center"><Trash2 size={15} className="text-red-500" /></div>
// // //             Delete Patient
// // //           </button>
// // //         </div>
// // //       )}
// // //     </div>
// // //   );
// // // };

// // // /* ═══════════════════════════════════════════════════════════════════
// // //    MAIN — PatientList
// // //    ═══════════════════════════════════════════════════════════════════ */
// // // const PatientList = () => {
// // //   const navigate = useNavigate();
// // //   const [patients, setPatients] = useState([]);
// // //   const [search, setSearch] = useState('');
// // //   const [loading, setLoading] = useState(true);
// // //   const [showForm, setShowForm] = useState(false);
// // //   const [editingPatient, setEditingPatient] = useState(null);
// // //   const [viewingPatient, setViewingPatient] = useState(null);
// // //   const [sortField, setSortField] = useState('createdAt');
// // //   const [sortDir, setSortDir] = useState('desc');
// // //   const [settings, setSettings] = useState(null);           // ✅ NEW
// // //   const [formData, setFormData] = useState({
// // //     name: '', age: '', sex: 'Male', phone: '', address: '',
// // //     serialNumber: '', idNumber: '', billNumber: '',
// // //     indication: '', referredDoc: '', doneDoc: '', remark: '',
// // //     procedureType: ''                                         // ✅ NEW
// // //   });
// // //   const [submitting, setSubmitting] = useState(false);
// // //   const searchRef = useRef(null);

// // //   // ✅ NEW — Fetch settings once on mount (for procedures list)
// // //   useEffect(() => {
// // //     (async () => {
// // //       try {
// // //         const { data } = await api.get('/settings');
// // //         setSettings(data);
// // //       } catch {
// // //         // silently ignore — dropdown will just be empty
// // //       }
// // //     })();
// // //   }, []);

// // //   useEffect(() => {
// // //     const t = setTimeout(fetchPatients, 300);
// // //     return () => clearTimeout(t);
// // //   }, [search]);

// // //   const fetchPatients = async () => {
// // //     setLoading(true);
// // //     try {
// // //       const { data } = await api.get(`/patients?search=${search}`);
// // //       setPatients(data.patients);
// // //     } catch {
// // //       toast.error('Failed to load patients');
// // //     } finally {
// // //       setLoading(false);
// // //     }
// // //   };

// // //   const sortedPatients = React.useMemo(() => {
// // //     const list = [...patients];
// // //     list.sort((a, b) => {
// // //       let av, bv;
// // //       if (sortField === 'name') { av = a.name.toLowerCase(); bv = b.name.toLowerCase(); }
// // //       else if (sortField === 'age') { av = a.age || 0; bv = b.age || 0; }
// // //       else { av = new Date(a.createdAt); bv = new Date(b.createdAt); }
// // //       if (av < bv) return sortDir === 'asc' ? -1 : 1;
// // //       if (av > bv) return sortDir === 'asc' ? 1 : -1;
// // //       return 0;
// // //     });
// // //     return list;
// // //   }, [patients, sortField, sortDir]);

// // //   const toggleSort = (field) => {
// // //     if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
// // //     else { setSortField(field); setSortDir('asc'); }
// // //   };

// // //   const SortIcon = ({ field }) => {
// // //     if (sortField !== field) return <ArrowUpDown size={13} className="text-slate-300 group-hover/th:text-slate-400 transition-colors" />;
// // //     return sortDir === 'asc' ? <SortAsc size={13} className="text-blue-600" /> : <SortDesc size={13} className="text-blue-600" />;
// // //   };

// // //   const handleSubmit = async (e) => {
// // //     e.preventDefault();
// // //     if (!formData.name.trim()) return toast.error('Name is required');
// // //     if (!formData.age) return toast.error('Age is required');
// // //     setSubmitting(true);
// // //     try {
// // //       const birthYear = new Date().getFullYear() - parseInt(formData.age);
// // //       const payload = { ...formData, dateOfBirth: new Date(birthYear, 0, 1) };
// // //       if (editingPatient) {
// // //         await api.put(`/patients/${editingPatient._id}`, payload);
// // //         toast.success('Patient updated successfully');
// // //       } else {
// // //         await api.post('/patients', payload);
// // //         toast.success('Patient added successfully');
// // //       }
// // //       resetForm();
// // //       fetchPatients();
// // //     } catch {
// // //       toast.error('Operation failed');
// // //     } finally {
// // //       setSubmitting(false);
// // //     }
// // //   };

// // //   const handleDelete = async (id) => {
// // //     if (!window.confirm('Delete this patient and all their data? This cannot be undone.')) return;
// // //     try {
// // //       await api.delete(`/patients/${id}`);
// // //       toast.success('Patient deleted');
// // //       fetchPatients();
// // //     } catch {
// // //       toast.error('Delete failed');
// // //     }
// // //   };

// // //   const handleEdit = (patient) => {
// // //     setEditingPatient(patient);
// // //     const age = patient.dateOfBirth
// // //       ? new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear()
// // //       : patient.age || '';
// // //     setFormData({
// // //       name: patient.name, age, sex: patient.sex,
// // //       phone: patient.phone || '', address: patient.address || '',
// // //       serialNumber: patient.serialNumber || '',
// // //       idNumber: patient.idNumber || '',
// // //       billNumber: patient.billNumber || '',
// // //       indication: patient.indication || '',
// // //       referredDoc: patient.referredDoc || '',
// // //       doneDoc: patient.doneDoc || '',
// // //       remark: patient.remark || '',
// // //       procedureType: patient.procedureType || ''               // ✅ NEW
// // //     });
// // //     setShowForm(true);
// // //   };

// // //   const resetForm = () => {
// // //     setShowForm(false);
// // //     setEditingPatient(null);
// // //     setFormData({
// // //       name: '', age: '', sex: 'Male', phone: '', address: '',
// // //       serialNumber: '', idNumber: '', billNumber: '',
// // //       indication: '', referredDoc: '', doneDoc: '', remark: '',
// // //       procedureType: ''                                         // ✅ NEW
// // //     });
// // //   };

// // //   const getInitials = n => n.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
// // //   const avatarColors = [
// // //     'from-blue-500 to-indigo-600',
// // //     'from-emerald-500 to-teal-600',
// // //     'from-violet-500 to-purple-600',
// // //     'from-amber-500 to-orange-600',
// // //     'from-pink-500 to-rose-600',
// // //     'from-cyan-500 to-blue-600',
// // //     'from-indigo-500 to-violet-600',
// // //   ];

// // //   return (
// // //     <div className="space-y-8 pb-24 sm:pb-0">

// // //       {/* ══════ HEADER ══════ */}
// // //       <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5">
// // //         <div>
// // //           <div className="flex items-center gap-3 mb-1">
// // //             <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
// // //               <User size={20} className="text-white" />
// // //             </div>
// // //             <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
// // //               Patients
// // //             </h1>
// // //           </div>
// // //           <p className="text-sm text-slate-500 ml-[52px]">
// // //             {!loading && (
// // //               <span>
// // //                 <span className="font-bold text-slate-700">{patients.length}</span> patient{patients.length !== 1 ? 's' : ''} registered
// // //               </span>
// // //             )}
// // //           </p>
// // //         </div>
// // //         <button
// // //           onClick={() => { resetForm(); setShowForm(true); }}
// // //           className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-600/25 transition-all duration-300 hover:shadow-xl hover:shadow-blue-600/35 active:scale-[0.97] group"
// // //         >
// // //           <UserPlus size={18} className="group-hover:scale-110 transition-transform duration-200" />
// // //           Add Patient
// // //         </button>
// // //       </div>

// // //       {/* ══════ SEARCH BAR ══════ */}
// // //       <div className="relative group">
// // //         <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
// // //           <Search size={18} className="text-slate-400 group-focus-within:text-blue-500 transition-colors duration-300" />
// // //         </div>
// // //         <input
// // //           ref={searchRef}
// // //           type="text"
// // //           placeholder="Search patients by name, ID, or phone…"
// // //           value={search}
// // //           onChange={e => setSearch(e.target.value)}
// // //           className="w-full pl-12 pr-12 py-4 bg-white border-2 border-slate-200/80 rounded-2xl text-sm text-slate-700 placeholder:text-slate-400 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 transition-all duration-300 shadow-sm hover:border-slate-300 hover:shadow-md"
// // //         />
// // //         {search && (
// // //           <button
// // //             onClick={() => { setSearch(''); searchRef.current?.focus(); }}
// // //             className="absolute inset-y-0 right-0 pr-5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
// // //           >
// // //             <div className="p-1 hover:bg-slate-100 rounded-lg transition-colors">
// // //               <X size={16} />
// // //             </div>
// // //           </button>
// // //         )}
// // //       </div>

// // //       {/* ══════ TABLE / LIST ══════ */}
// // //       {loading ? (
// // //         <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm">
// // //           <TableSkeleton />
// // //         </div>
// // //       ) : patients.length === 0 ? (
// // //         <div className="flex flex-col items-center justify-center py-24 px-6 bg-gradient-to-b from-white to-slate-50/50 rounded-3xl border-2 border-dashed border-slate-200/80">
// // //           <div className="w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-50 rounded-3xl flex items-center justify-center mb-6 shadow-inner">
// // //             <User size={44} strokeWidth={1.5} className="text-slate-300" />
// // //           </div>
// // //           <h3 className="text-xl font-bold text-slate-800">
// // //             {search ? 'No results found' : 'No patients yet'}
// // //           </h3>
// // //           <p className="text-slate-500 text-sm mt-2.5 text-center max-w-sm leading-relaxed">
// // //             {search
// // //               ? `No patients match "${search}". Try a different search term.`
// // //               : 'Get started by adding your first patient record.'}
// // //           </p>
// // //           {!search && (
// // //             <button
// // //               onClick={() => { resetForm(); setShowForm(true); }}
// // //               className="mt-8 inline-flex items-center gap-2.5 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-600/25 transition-all duration-300"
// // //             >
// // //               <UserPlus size={17} /> Add First Patient
// // //             </button>
// // //           )}
// // //         </div>
// // //       ) : (
// // //         <>
// // //           {/* Desktop Table */}
// // //           <div className="hidden md:block bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
// // //             <table className="w-full">
// // //               <thead>
// // //                 <tr className="border-b border-slate-200/80 bg-gradient-to-r from-slate-50/80 to-white">
// // //                   {[
// // //                     { key: 'name', label: 'Patient', align: 'left' },
// // //                     { key: 'id', label: 'ID', align: 'left' },
// // //                     { key: null, label: 'Contact', align: 'left' },
// // //                     { key: 'createdAt', label: 'Registered', align: 'left' },
// // //                     { key: null, label: '', align: 'right' },
// // //                   ].map((col, ci) => (
// // //                     <th
// // //                       key={ci}
// // //                       onClick={col.key ? () => toggleSort(col.key) : undefined}
// // //                       className={clsx(
// // //                         'group/th px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider',
// // //                         col.align === 'right' ? 'text-right' : 'text-left',
// // //                         col.key && 'cursor-pointer hover:text-slate-700 select-none transition-colors duration-200'
// // //                       )}
// // //                     >
// // //                       <span className="inline-flex items-center gap-2">
// // //                         {col.label}
// // //                         {col.key && <SortIcon field={col.key} />}
// // //                       </span>
// // //                     </th>
// // //                   ))}
// // //                 </tr>
// // //               </thead>
// // //               <tbody className="divide-y divide-slate-100/80">
// // //                 {sortedPatients.map((patient, i) => (
// // //                   <tr key={patient._id} className="group hover:bg-blue-50/30 transition-colors duration-200">
// // //                     <td className="px-6 py-4">
// // //                       <div className="flex items-center gap-4">
// // //                         <div className={clsx(
// // //                           'w-11 h-11 rounded-xl bg-gradient-to-br flex-shrink-0 flex items-center justify-center text-white text-sm font-bold shadow-md',
// // //                           avatarColors[i % avatarColors.length]
// // //                         )}>
// // //                           {getInitials(patient.name)}
// // //                         </div>
// // //                         <div>
// // //                           <p className="font-bold text-slate-800 text-[15px]">{patient.name}</p>
// // //                           <p className="text-xs text-slate-400 mt-0.5 font-medium">
// // //                             {patient.age} yrs &middot; {patient.sex}
// // //                             {/* ✅ Show procedure type badge in table */}
// // //                             {patient.procedureType && (
// // //                               <span className="ml-2 inline-flex items-center gap-1 text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded font-semibold border border-blue-100">
// // //                                 <Stethoscope size={9} />
// // //                                 {patient.procedureType.length > 20
// // //                                   ? patient.procedureType.substring(0, 20) + '…'
// // //                                   : patient.procedureType}
// // //                               </span>
// // //                             )}
// // //                           </p>
// // //                         </div>
// // //                       </div>
// // //                     </td>
// // //                     <td className="px-6 py-4">
// // //                       <span className="text-sm text-slate-600 font-mono bg-slate-100/80 px-2.5 py-1 rounded-lg text-xs font-semibold border border-slate-200/60">
// // //                         {patient.patientId}
// // //                       </span>
// // //                     </td>
// // //                     <td className="px-6 py-4">
// // //                       {patient.phone ? (
// // //                         <span className="inline-flex items-center gap-2 text-sm text-slate-600 font-medium">
// // //                           <Phone size={13} className="text-slate-400" /> {patient.phone}
// // //                         </span>
// // //                       ) : (
// // //                         <span className="text-slate-300 text-sm">—</span>
// // //                       )}
// // //                     </td>
// // //                     <td className="px-6 py-4">
// // //                       <span className="text-sm text-slate-500 font-medium">
// // //                         {new Date(patient.createdAt).toLocaleDateString('en-US', {
// // //                           year: 'numeric', month: 'short', day: 'numeric',
// // //                         })}
// // //                       </span>
// // //                     </td>
// // //                     <td className="px-6 py-4">
// // //                       <div className="flex items-center justify-end gap-1 opacity-0 opacity-100 transition-all duration-300">
// // //                         <button
// // //                           onClick={() => navigate(`/reports/new?patient=${patient._id}`)}
// // //                           className="p-2.5 rounded-xl text-blue-600 hover:bg-blue-100 transition-all duration-200 hover:scale-105"
// // //                           title="Create Report"
// // //                         >
// // //                           <FilePlus size={17} />
// // //                         </button>
// // //                         <button
// // //                           onClick={() => navigate(`/patients/${patient._id}`)}
// // //                           className="p-2.5 rounded-xl text-violet-600 hover:bg-violet-100 transition-all duration-200 hover:scale-105"
// // //                           title="View Patient Profile"
// // //                         >
// // //                           <Eye size={17} />
// // //                         </button>
// // //                         <button
// // //                           onClick={() => handleEdit(patient)}
// // //                           className="p-2.5 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-all duration-200 hover:scale-105"
// // //                           title="Edit"
// // //                         >
// // //                           <Edit size={16} />
// // //                         </button>
// // //                         <button
// // //                           onClick={() => handleDelete(patient._id)}
// // //                           className="p-2.5 rounded-xl text-slate-400 hover:bg-red-50 hover:text-red-600 transition-all duration-200 hover:scale-105"
// // //                           title="Delete"
// // //                         >
// // //                           <Trash2 size={16} />
// // //                         </button>
// // //                       </div>
// // //                     </td>
// // //                   </tr>
// // //                 ))}
// // //               </tbody>
// // //             </table>
// // //           </div>

// // //           {/* Mobile Cards */}
// // //           <div className="md:hidden space-y-3">
// // //             {sortedPatients.map((patient, i) => (
// // //               <div
// // //                 key={patient._id}
// // //                 className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden active:scale-[0.995] transition-all duration-200 hover:shadow-md hover:border-slate-300/80"
// // //               >
// // //                 <div className="p-5 flex items-start justify-between">
// // //                   <div className="flex items-center gap-3.5 min-w-0">
// // //                     <div className={clsx(
// // //                       'w-12 h-12 rounded-xl bg-gradient-to-br flex-shrink-0 flex items-center justify-center text-white text-sm font-bold shadow-md',
// // //                       avatarColors[i % avatarColors.length]
// // //                     )}>
// // //                       {getInitials(patient.name)}
// // //                     </div>
// // //                     <div className="min-w-0">
// // //                       <h3 className="font-bold text-slate-800 text-[15px] truncate">{patient.name}</h3>
// // //                       <div className="flex items-center gap-2.5 mt-1 flex-wrap">
// // //                         <span className="text-xs text-slate-400 font-medium">{patient.age}Y &middot; {patient.sex}</span>
// // //                         <span className="text-xs text-slate-500 font-mono bg-slate-100 px-2 py-0.5 rounded-md font-semibold border border-slate-200/60">
// // //                           {patient.patientId}
// // //                         </span>
// // //                         {/* ✅ Show procedure badge on mobile */}
// // //                         {patient.procedureType && (
// // //                           <span className="text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded font-semibold border border-blue-100">
// // //                             {patient.procedureType.length > 15
// // //                               ? patient.procedureType.substring(0, 15) + '…'
// // //                               : patient.procedureType}
// // //                           </span>
// // //                         )}
// // //                       </div>
// // //                     </div>
// // //                   </div>
// // //                   <MobileActions
// // //                     onEdit={() => handleEdit(patient)}
// // //                     onDelete={() => handleDelete(patient._id)}
// // //                     onCreateReport={() => navigate(`/reports/new?patient=${patient._id}`)}
// // //                     onViewGallery={() => navigate(`/patients/${patient._id}`)}
// // //                   />
// // //                 </div>

// // //                 <div className="mx-5 border-t border-slate-100" />

// // //                 <div className="p-5 flex items-center justify-between">
// // //                   <div className="flex items-center gap-4 text-sm text-slate-500">
// // //                     {patient.phone && (
// // //                       <span className="inline-flex items-center gap-2 font-medium">
// // //                         <Phone size={14} className="text-slate-400" /> {patient.phone}
// // //                       </span>
// // //                     )}
// // //                   </div>
// // //                   <button
// // //                     onClick={() => navigate(`/reports/new?patient=${patient._id}`)}
// // //                     className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-50 to-blue-100/80 text-blue-600 rounded-xl text-xs font-bold hover:from-blue-100 hover:to-blue-200/80 transition-all duration-200 border border-blue-200/60"
// // //                   >
// // //                     <FilePlus size={14} /> Report
// // //                   </button>
// // //                 </div>
// // //               </div>
// // //             ))}
// // //           </div>
// // //         </>
// // //       )}

// // //       {/* ══════ PATIENT FORM MODAL ══════ */}
// // //       {showForm && (
// // //         <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
// // //           onClick={resetForm}>
// // //           <div
// // //             className="bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl shadow-xl flex flex-col max-h-[90vh]"
// // //             onClick={e => e.stopPropagation()}
// // //           >
// // //             {/* Header */}
// // //             <div className={clsx(
// // //               'px-6 py-4 flex items-center justify-between rounded-t-2xl',
// // //               editingPatient ? 'bg-amber-500' : 'bg-blue-600'
// // //             )}>
// // //               <div className="flex items-center gap-3">
// // //                 {editingPatient
// // //                   ? <Edit size={20} className="text-white" />
// // //                   : <UserPlus size={20} className="text-white" />
// // //                 }
// // //                 <h2 className="text-lg font-bold text-white">
// // //                   {editingPatient ? 'Edit Patient' : 'Register Patient'}
// // //                 </h2>
// // //               </div>
// // //               <button onClick={resetForm} className="text-white/80 hover:text-white p-1">
// // //                 <X size={20} />
// // //               </button>
// // //             </div>

// // //             {/* Form */}
// // //             <div className="flex-1 overflow-y-auto px-6 py-5">
// // //               <form id="patientForm" onSubmit={handleSubmit} className="space-y-5">

// // //                 {/* ── Basic Info ── */}
// // //                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
// // //                   <User size={12} /> Basic Information
// // //                 </p>

// // //                 <div>
// // //                   <label className="text-xs font-semibold text-slate-600 mb-1 block">
// // //                     Full Name <span className="text-red-400">*</span>
// // //                   </label>
// // //                   <input
// // //                     type="text"
// // //                     value={formData.name}
// // //                     onChange={e => setFormData({ ...formData, name: e.target.value })}
// // //                     placeholder="Patient full name"
// // //                     className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
// // //                     required
// // //                     autoFocus
// // //                   />
// // //                 </div>

// // //                 <div className="grid grid-cols-3 gap-3">
// // //                   <div>
// // //                     <label className="text-xs font-semibold text-slate-600 mb-1 block">
// // //                       Age <span className="text-red-400">*</span>
// // //                     </label>
// // //                     <input
// // //                       type="number"
// // //                       value={formData.age}
// // //                       onChange={e => setFormData({ ...formData, age: e.target.value })}
// // //                       placeholder="Yrs"
// // //                       className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
// // //                       required min="0" max="150"
// // //                     />
// // //                   </div>
// // //                   <div>
// // //                     <label className="text-xs font-semibold text-slate-600 mb-1 block">
// // //                       Sex <span className="text-red-400">*</span>
// // //                     </label>
// // //                     <select
// // //                       value={formData.sex}
// // //                       onChange={e => setFormData({ ...formData, sex: e.target.value })}
// // //                       className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
// // //                     >
// // //                       <option>Male</option>
// // //                       <option>Female</option>
// // //                       <option>Other</option>
// // //                     </select>
// // //                   </div>
// // //                   <div>
// // //                     <label className="text-xs font-semibold text-slate-600 mb-1 block">Serial No.</label>
// // //                     <input
// // //                       type="text"
// // //                       value={formData.serialNumber}
// // //                       onChange={e => setFormData({ ...formData, serialNumber: e.target.value })}
// // //                       placeholder="Auto"
// // //                       className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
// // //                     />
// // //                   </div>
// // //                 </div>

// // //                 <div className="grid grid-cols-2 gap-3">
// // //                   <div>
// // //                     <label className="text-xs font-semibold text-slate-600 mb-1 block">ID Number</label>
// // //                     <input
// // //                       type="text"
// // //                       value={formData.idNumber}
// // //                       onChange={e => setFormData({ ...formData, idNumber: e.target.value })}
// // //                       placeholder="patient / ID"
// // //                       className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
// // //                     />
// // //                   </div>
// // //                   <div>
// // //                     <label className="text-xs font-semibold text-slate-600 mb-1 block">Bill Number</label>
// // //                     <input
// // //                       type="text"
// // //                       value={formData.billNumber}
// // //                       onChange={e => setFormData({ ...formData, billNumber: e.target.value })}
// // //                       placeholder="Bill / Receipt"
// // //                       className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
// // //                     />
// // //                   </div>
// // //                 </div>

// // //                 {/* ── Contact ── */}
// // //                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 pt-2 border-t border-slate-100">
// // //                   <Phone size={12} /> Contact
// // //                 </p>

// // //                 <div className="grid grid-cols-2 gap-3">
// // //                   <div>
// // //                     <label className="text-xs font-semibold text-slate-600 mb-1 block">Phone</label>
// // //                     <input
// // //                       type="tel"
// // //                       value={formData.phone}
// // //                       onChange={e => setFormData({ ...formData, phone: e.target.value })}
// // //                       placeholder="Contact number"
// // //                       className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
// // //                     />
// // //                   </div>
// // //                   <div>
// // //                     <label className="text-xs font-semibold text-slate-600 mb-1 block">Address</label>
// // //                     <input
// // //                       type="text"
// // //                       value={formData.address}
// // //                       onChange={e => setFormData({ ...formData, address: e.target.value })}
// // //                       placeholder="Patient address"
// // //                       className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
// // //                     />
// // //                   </div>
// // //                 </div>

// // //                 {/* ── Clinical ── */}
// // //                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 pt-2 border-t border-slate-100">
// // //                   <Activity size={12} /> Clinical
// // //                 </p>

// // //               {/* ✅ Procedure Type — Manual Text Input */}
// // // <div>
// // //   <label className="text-xs font-semibold text-slate-600 mb-1 block flex items-center gap-1.5">
// // //     <Stethoscope size={12} className="text-blue-500" />
// // //     Procedure Type
// // //   </label>
// // //   <input
// // //     type="text"
// // //     value={formData.procedureType}
// // //     onChange={e => setFormData({ ...formData, procedureType: e.target.value })}
// // //     placeholder="e.g., Video GastroDuodenoscopy, Colonoscopy"
// // //     className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
// // //   />
// // // </div>

// // //                 <div>
// // //                   <label className="text-xs font-semibold text-slate-600 mb-1 block">Indication</label>
// // //                   <input
// // //                     type="text"
// // //                     value={formData.indication}
// // //                     onChange={e => setFormData({ ...formData, indication: e.target.value })}
// // //                     placeholder="e.g., Dyspepsia, Acidity, GERD"
// // //                     className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
// // //                   />
// // //                 </div>

// // //                 <div className="grid grid-cols-2 gap-3">
// // //                   <div>
// // //                     <label className="text-xs font-semibold text-slate-600 mb-1 block">Referred By</label>
// // //                     <input
// // //                       type="text"
// // //                       value={formData.referredDoc}
// // //                       onChange={e => setFormData({ ...formData, referredDoc: e.target.value })}
// // //                       placeholder="Referring doctor"
// // //                       className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
// // //                     />
// // //                   </div>
// // //                   <div>
// // //                     <label className="text-xs font-semibold text-slate-600 mb-1 block">Performed By</label>
// // //                     <input
// // //                       type="text"
// // //                       value={formData.doneDoc}
// // //                       onChange={e => setFormData({ ...formData, doneDoc: e.target.value })}
// // //                       placeholder="Performing doctor"
// // //                       className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
// // //                     />
// // //                   </div>
// // //                 </div>

// // //                 <div>
// // //                   <label className="text-xs font-semibold text-slate-600 mb-1 block">Remarks</label>
// // //                   <textarea
// // //                     value={formData.remark}
// // //                     onChange={e => setFormData({ ...formData, remark: e.target.value })}
// // //                     placeholder="Additional notes..."
// // //                     rows={2}
// // //                     className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
// // //                   />
// // //                 </div>

// // //               </form>
// // //             </div>

// // //             {/* Footer */}
// // //             <div className="px-6 py-4 border-t border-slate-200 flex gap-3 bg-slate-50 rounded-b-2xl">
// // //               <button
// // //                 type="button"
// // //                 onClick={resetForm}
// // //                 className="flex-1 py-2.5 text-sm font-semibold text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
// // //               >
// // //                 Cancel
// // //               </button>
// // //               <button
// // //                 type="submit"
// // //                 form="patientForm"
// // //                 disabled={submitting}
// // //                 className={clsx(
// // //                   'flex-1 py-2.5 text-sm font-bold text-white rounded-lg inline-flex items-center justify-center gap-2 disabled:opacity-50',
// // //                   editingPatient
// // //                     ? 'bg-amber-500 hover:bg-amber-600'
// // //                     : 'bg-blue-600 hover:bg-blue-700'
// // //                 )}
// // //               >
// // //                 {submitting ? (
// // //                   <><Loader2 size={16} className="animate-spin" /> Saving…</>
// // //                 ) : (
// // //                   <><CheckCircle size={16} /> {editingPatient ? 'Update' : 'Register'}</>
// // //                 )}
// // //               </button>
// // //             </div>
// // //           </div>
// // //         </div>
// // //       )}
// // //     </div>
// // //   );
// // // };

// // // export default PatientList;


// //   import React, { useState, useEffect, useRef, useCallback } from 'react';
// //   import { useNavigate } from 'react-router-dom';
// //   import api, { getImageURL } from '../../utils/api';
// //   import {
// //     Search, Plus, User, Phone, Calendar, ArrowRight,
// //     Edit, Trash2, X, MoreVertical, FilePlus, Image as ImageIcon,
// //     MapPin, FileText, ExternalLink, Maximize2, Download,
// //     ChevronLeft, ChevronRight, Filter, SortAsc, SortDesc,
// //     Clock, Hash, Activity, Eye, ZoomIn, ChevronDown,
// //     UserPlus, AlertCircle, CheckCircle, Loader2, ArrowUpDown,
// //     Stethoscope
// //   } from 'lucide-react';
// //   import toast from 'react-hot-toast';
// //   import clsx from 'clsx';

// //   /* ═══════════════════════════════════════════════════════════════════
// //     LIGHTBOX — full-screen image viewer
// //     ═══════════════════════════════════════════════════════════════════ */
// //   const Lightbox = ({ image, onClose, images, onNavigate }) => {
// //     if (!image) return null;
// //     const imageUrl = getImageURL(image.path);

// //     const currentIndex = images?.findIndex(i => i.path === image.path) ?? -1;

// //     useEffect(() => {
// //       const handler = (e) => {
// //         if (e.key === 'Escape') onClose();
// //         if (e.key === 'ArrowLeft' && currentIndex > 0) onNavigate(images[currentIndex - 1]);
// //         if (e.key === 'ArrowRight' && currentIndex < images.length - 1) onNavigate(images[currentIndex + 1]);
// //       };
// //       document.addEventListener('keydown', handler);
// //       document.body.style.overflow = 'hidden';
// //       return () => {
// //         document.removeEventListener('keydown', handler);
// //         document.body.style.overflow = '';
// //       };
// //     }, [currentIndex, images, onClose, onNavigate]);

// //     return (
// //       <div
// //         className="fixed inset-0 z-[100] bg-black/98 backdrop-blur-3xl flex flex-col items-center justify-center animate-in fade-in duration-200"
// //         onClick={onClose}
// //       >
// //         <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-black/80 via-black/40 to-transparent z-10 flex items-center justify-between px-8">
// //           <div className="text-white/60 text-sm font-medium tracking-wide">
// //             {currentIndex >= 0 && (
// //               <span className="bg-white/10 px-3.5 py-1.5 rounded-full backdrop-blur-sm border border-white/10">
// //                 {currentIndex + 1} <span className="text-white/40">of</span> {images.length}
// //               </span>
// //             )}
// //           </div>
// //           <div className="flex items-center gap-3">
// //             <a
// //               href={imageUrl}
// //               download
// //               target="_blank"
// //               rel="noreferrer"
// //               onClick={e => e.stopPropagation()}
// //               className="p-3 bg-white/[0.08] hover:bg-white/[0.15] border border-white/[0.08] rounded-2xl text-white/80 hover:text-white transition-all duration-300"
// //               title="Download"
// //             >
// //               <Download size={18} />
// //             </a>
// //             <button
// //               onClick={onClose}
// //               className="p-3 bg-white/[0.08] hover:bg-white/[0.15] border border-white/[0.08] rounded-2xl text-white/80 hover:text-white transition-all duration-300"
// //             >
// //               <X size={18} />
// //             </button>
// //           </div>
// //         </div>

// //         {currentIndex > 0 && (
// //           <button
// //             onClick={e => { e.stopPropagation(); onNavigate(images[currentIndex - 1]); }}
// //             className="absolute left-6 top-1/2 -translate-y-1/2 z-10 p-4 bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] rounded-2xl text-white/70 hover:text-white transition-all duration-300 backdrop-blur-sm hover:scale-105"
// //           >
// //             <ChevronLeft size={22} />
// //           </button>
// //         )}
// //         {currentIndex < images.length - 1 && (
// //           <button
// //             onClick={e => { e.stopPropagation(); onNavigate(images[currentIndex + 1]); }}
// //             className="absolute right-6 top-1/2 -translate-y-1/2 z-10 p-4 bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] rounded-2xl text-white/70 hover:text-white transition-all duration-300 backdrop-blur-sm hover:scale-105"
// //           >
// //             <ChevronRight size={22} />
// //           </button>
// //         )}

// //         <div className="relative max-w-[88vw] max-h-[78vh]" onClick={e => e.stopPropagation()}>
// //           <img
// //             src={imageUrl}
// //             alt={image.caption || 'Medical image'}
// //             className="max-w-full max-h-[78vh] rounded-2xl shadow-2xl shadow-black/50 object-contain select-none ring-1 ring-white/10"
// //             draggable={false}
// //           />
// //         </div>

// //         <div className="mt-8 text-center text-white px-6" onClick={e => e.stopPropagation()}>
// //           <p className="font-semibold text-lg tracking-tight">{image.taggedOrgan || 'Untagged'}</p>
// //           <p className="text-white/40 text-sm mt-1.5 font-medium">
// //             {image.caption || 'No caption'} &middot;{' '}
// //             {new Date(image.procedureDate).toLocaleDateString('en-US', {
// //               year: 'numeric', month: 'short', day: 'numeric'
// //             })}
// //           </p>
// //         </div>
// //       </div>
// //     );
// //   };

// //   /* ═══════════════════════════════════════════════════════════════════
// //     SKELETON LOADERS
// //     ═══════════════════════════════════════════════════════════════════ */
// //   const GallerySkeleton = () => (
// //     <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
// //       {[...Array(10)].map((_, i) => (
// //         <div key={i} className="aspect-square bg-gradient-to-br from-slate-100 via-slate-50 to-slate-100 rounded-2xl animate-pulse" style={{ animationDelay: `${i * 80}ms` }} />
// //       ))}
// //     </div>
// //   );

// //   const TableSkeleton = () => (
// //     <div className="space-y-0">
// //       {[...Array(6)].map((_, i) => (
// //         <div key={i} className="flex items-center gap-4 px-6 py-5 border-b border-slate-50 animate-pulse" style={{ animationDelay: `${i * 100}ms` }}>
// //           <div className="w-11 h-11 bg-gradient-to-br from-slate-200 to-slate-100 rounded-xl shrink-0" />
// //           <div className="flex-1 space-y-2.5">
// //             <div className="h-4 bg-slate-200/80 rounded-lg w-1/3" />
// //             <div className="h-3 bg-slate-100 rounded-lg w-1/5" />
// //           </div>
// //           <div className="h-4 bg-slate-100 rounded-lg w-20 hidden sm:block" />
// //           <div className="h-4 bg-slate-100 rounded-lg w-24 hidden sm:block" />
// //           <div className="h-4 bg-slate-100 rounded-lg w-28 hidden sm:block" />
// //         </div>
// //       ))}
// //     </div>
// //   );

// //   /* ═══════════════════════════════════════════════════════════════════
// //     PATIENT GALLERY MODAL
// //     ═══════════════════════════════════════════════════════════════════ */
// //   const PatientGalleryModal = ({ patient, onClose }) => {
// //     const navigate = useNavigate();
// //     const [reports, setReports] = useState([]);
// //     const [activeTab, setActiveTab] = useState('gallery');
// //     const [loading, setLoading] = useState(true);
// //     const [selectedImage, setSelectedImage] = useState(null);

// //     useEffect(() => {
// //       document.body.style.overflow = 'hidden';
// //       return () => { document.body.style.overflow = ''; };
// //     }, []);

// //     useEffect(() => {
// //       (async () => {
// //         try {
// //           const { data } = await api.get(`/reports?patient=${patient._id}&limit=100`);
// //           setReports(data.reports || []);
// //         } catch {
// //           toast.error('Failed to load history');
// //         } finally {
// //           setTimeout(() => setLoading(false), 400);
// //         }
// //       })();
// //     }, [patient._id]);

// //     const galleryImages = React.useMemo(() => {
// //       const all = [];
// //       reports.forEach(r => {
// //         (r.images || []).forEach(img => {
// //           all.push({ ...img, procedureDate: r.procedureDate, procedureName: r.procedureName, reportId: r._id });
// //         });
// //       });
// //       return all.sort((a, b) => new Date(b.procedureDate) - new Date(a.procedureDate));
// //     }, [reports]);

// //     const getInitials = n => n.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();

// //     return (
// //       <>
// //         {selectedImage && (
// //           <Lightbox
// //             image={selectedImage}
// //             images={galleryImages}
// //             onClose={() => setSelectedImage(null)}
// //             onNavigate={setSelectedImage}
// //           />
// //         )}

// //         <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-0 sm:p-6">
// //           <div className="bg-white w-full h-full sm:h-[92vh] sm:max-w-5xl sm:rounded-3xl shadow-2xl shadow-black/20 overflow-hidden flex flex-col animate-in slide-in-from-bottom-4 fade-in duration-300">

// //             <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-8 py-7 text-white shrink-0 overflow-hidden">
// //               <div className="absolute inset-0 opacity-30">
// //                 <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
// //                 <div className="absolute bottom-0 left-0 w-64 h-64 bg-violet-500/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />
// //               </div>
// //               <div className="relative flex items-center justify-between">
// //                 <div className="flex items-center gap-5">
// //                   <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 border-2 border-white/20 flex items-center justify-center text-xl font-bold shadow-lg shadow-blue-500/30">
// //                     {getInitials(patient.name)}
// //                   </div>
// //                   <div>
// //                     <h2 className="text-2xl font-bold tracking-tight">{patient.name}</h2>
// //                     <div className="flex flex-wrap gap-2.5 mt-2">
// //                       <span className="inline-flex items-center gap-1.5 text-xs text-white/80 bg-white/[0.08] border border-white/[0.06] px-3 py-1.5 rounded-lg font-medium backdrop-blur-sm">
// //                         <User size={12} /> {patient.age}Y / {patient.sex}
// //                       </span>
// //                       <span className="inline-flex items-center gap-1.5 text-xs text-white/80 bg-white/[0.08] border border-white/[0.06] px-3 py-1.5 rounded-lg font-mono backdrop-blur-sm">
// //                         <Hash size={12} /> {patient.patientId}
// //                       </span>
// //                       {patient.phone && (
// //                         <span className="inline-flex items-center gap-1.5 text-xs text-white/80 bg-white/[0.08] border border-white/[0.06] px-3 py-1.5 rounded-lg font-medium backdrop-blur-sm">
// //                           <Phone size={12} /> {patient.phone}
// //                         </span>
// //                       )}
// //                     </div>
// //                   </div>
// //                 </div>
// //                 <button
// //                   onClick={onClose}
// //                   className="p-3 bg-white/[0.08] hover:bg-white/[0.15] border border-white/[0.06] rounded-2xl transition-all duration-300"
// //                 >
// //                   <X size={18} />
// //                 </button>
// //               </div>
// //             </div>

// //             <div className="px-8 bg-white border-b border-slate-200/80 shrink-0">
// //               <div className="flex gap-2">
// //                 {[
// //                   { id: 'gallery', label: 'Gallery', icon: ImageIcon, count: galleryImages.length },
// //                   { id: 'reports', label: 'Reports', icon: FileText, count: reports.length },
// //                 ].map(tab => (
// //                   <button
// //                     key={tab.id}
// //                     onClick={() => setActiveTab(tab.id)}
// //                     className={clsx(
// //                       'relative flex items-center gap-2.5 px-5 py-4 text-sm font-semibold transition-all duration-300',
// //                       activeTab === tab.id ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'
// //                     )}
// //                   >
// //                     <tab.icon size={16} />
// //                     {tab.label}
// //                     <span className={clsx(
// //                       'text-[11px] min-w-[28px] text-center px-2 py-0.5 rounded-full font-bold tabular-nums transition-colors duration-300',
// //                       activeTab === tab.id ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'
// //                     )}>
// //                       {tab.count}
// //                     </span>
// //                     {activeTab === tab.id && (
// //                       <span className="absolute bottom-0 left-3 right-3 h-[3px] bg-blue-600 rounded-full" />
// //                     )}
// //                   </button>
// //                 ))}
// //               </div>
// //             </div>

// //             <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-gradient-to-b from-slate-50/80 to-white">
// //               {loading ? (
// //                 activeTab === 'gallery' ? <GallerySkeleton /> : <TableSkeleton />
// //               ) : (
// //                 <>
// //                   {activeTab === 'gallery' && (
// //                     galleryImages.length === 0 ? (
// //                       <div className="h-72 flex flex-col items-center justify-center text-slate-400">
// //                         <div className="w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-50 rounded-3xl flex items-center justify-center mb-5 shadow-inner">
// //                           <ImageIcon size={40} strokeWidth={1.5} className="text-slate-300" />
// //                         </div>
// //                         <p className="font-bold text-slate-700 text-lg">No images yet</p>
// //                         <p className="text-sm mt-1.5 text-slate-400">Images from reports will appear here</p>
// //                       </div>
// //                     ) : (
// //                       <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
// //                         {galleryImages.map((img, idx) => (
// //                           <div
// //                             key={idx}
// //                             onClick={() => setSelectedImage(img)}
// //                             className="group relative aspect-square rounded-2xl overflow-hidden cursor-pointer bg-slate-100 ring-1 ring-black/[0.06] hover:ring-2 hover:ring-blue-300/60 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10"
// //                           >
// //                             <img
// //                               src={getImageURL(img.path)}
// //                               className="w-full h-full object-cover transition-all duration-700 ease-out group-hover:scale-110"
// //                               alt={img.caption}
// //                               loading="lazy"
// //                             />
// //                             <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-0 opacity-100 transition-all duration-400" />
// //                             <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-3 group-hover:translate-y-0 opacity-0 opacity-100 transition-all duration-400">
// //                               <p className="text-white text-sm font-bold truncate">{img.taggedOrgan || 'Untagged'}</p>
// //                               <p className="text-white/50 text-xs mt-1 font-medium">
// //                                 {new Date(img.procedureDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
// //                               </p>
// //                             </div>
// //                             <div className="absolute top-3 right-3 opacity-100 transition-all duration-300 scale-75 group-hover:scale-100">
// //                               <div className="p-2.5 bg-white/20 backdrop-blur-xl rounded-xl text-white border border-white/10">
// //                                 <ZoomIn size={15} />
// //                               </div>
// //                             </div>
// //                           </div>
// //                         ))}
// //                       </div>
// //                     )
// //                   )}

// //                   {activeTab === 'reports' && (
// //                     reports.length === 0 ? (
// //                       <div className="h-72 flex flex-col items-center justify-center text-slate-400">
// //                         <div className="w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-50 rounded-3xl flex items-center justify-center mb-5 shadow-inner">
// //                           <FileText size={40} strokeWidth={1.5} className="text-slate-300" />
// //                         </div>
// //                         <p className="font-bold text-slate-700 text-lg">No reports found</p>
// //                         <p className="text-sm mt-1.5 text-slate-400">Create a report to get started</p>
// //                       </div>
// //                     ) : (
// //                       <div className="space-y-3">
// //                         {reports.map(rep => (
// //                           <div
// //                             key={rep._id}
// //                             onClick={() => navigate(`/reports/${rep._id}/print`)}
// //                             className="group bg-white rounded-2xl border border-slate-200/80 hover:border-blue-200/80 p-5 flex items-center gap-5 cursor-pointer transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/[0.06] hover:-translate-y-0.5"
// //                           >
// //                             <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 group-hover:from-blue-50 group-hover:to-blue-100 flex items-center justify-center transition-all duration-300 border border-slate-200/60 group-hover:border-blue-200/60">
// //                               <FileText size={20} className="text-slate-400 group-hover:text-blue-500 transition-colors duration-300" />
// //                             </div>
// //                             <div className="flex-1 min-w-0">
// //                               <p className="font-bold text-slate-800 truncate text-[15px]">{rep.procedureName}</p>
// //                               <p className="text-xs text-slate-400 mt-1 flex items-center gap-2 font-medium">
// //                                 <Calendar size={12} />
// //                                 {new Date(rep.procedureDate).toLocaleDateString('en-US', {
// //                                   year: 'numeric', month: 'short', day: 'numeric'
// //                                 })}
// //                                 {rep.images?.length > 0 && (
// //                                   <>
// //                                     <span className="w-1 h-1 rounded-full bg-slate-300" />
// //                                     <ImageIcon size={12} />
// //                                     {rep.images.length} image{rep.images.length > 1 ? 's' : ''}
// //                                   </>
// //                                 )}
// //                               </p>
// //                             </div>
// //                             <span className={clsx(
// //                               'hidden sm:inline-flex px-3.5 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider border',
// //                               rep.status === 'finalized'
// //                                 ? 'bg-emerald-50 text-emerald-600 border-emerald-200/60'
// //                                 : 'bg-amber-50 text-amber-600 border-amber-200/60'
// //                             )}>
// //                               {rep.status}
// //                             </span>
// //                             <div className="w-9 h-9 rounded-xl bg-slate-50 group-hover:bg-blue-50 flex items-center justify-center transition-all duration-300">
// //                               <ArrowRight size={16} className="text-slate-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all duration-300" />
// //                             </div>
// //                           </div>
// //                         ))}
// //                       </div>
// //                     )
// //                   )}
// //                 </>
// //               )}
// //             </div>

// //             <div className="bg-white border-t border-slate-200/80 px-8 py-5 flex items-center justify-between gap-3 shrink-0">
// //               <button
// //                 onClick={onClose}
// //                 className="px-6 py-3 text-sm font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all duration-200"
// //               >
// //                 Close
// //               </button>
// //               <button
// //                 onClick={() => navigate(`/reports/new?patient=${patient._id}`)}
// //                 className="inline-flex items-center gap-2.5 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-600/25 transition-all duration-300 hover:shadow-xl hover:shadow-blue-600/35 active:scale-[0.97]"
// //               >
// //                 <FilePlus size={17} /> New Report
// //               </button>
// //             </div>
// //           </div>
// //         </div>
// //       </>
// //     );
// //   };

// //   /* ═══════════════════════════════════════════════════════════════════
// //     MOBILE ACTION MENU
// //     ═══════════════════════════════════════════════════════════════════ */
// //   const MobileActions = ({ onEdit, onDelete, onCreateReport, onViewGallery }) => {
// //     const [open, setOpen] = useState(false);
// //     const ref = useRef(null);

// //     useEffect(() => {
// //       if (!open) return;
// //       const close = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
// //       document.addEventListener('mousedown', close);
// //       return () => document.removeEventListener('mousedown', close);
// //     }, [open]);

// //     return (
// //       <div className="relative" ref={ref}>
// //         <button
// //           onClick={e => { e.stopPropagation(); setOpen(o => !o); }}
// //           className={clsx(
// //             'p-2.5 rounded-xl transition-all duration-200',
// //             open ? 'bg-slate-200 text-slate-700' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
// //           )}
// //         >
// //           <MoreVertical size={18} />
// //         </button>

// //         {open && (
// //           <div className="absolute right-0 top-full mt-2.5 w-56 bg-white rounded-2xl shadow-2xl shadow-slate-300/40 border border-slate-200/80 z-30 py-2 overflow-hidden animate-in slide-in-from-top-2 fade-in duration-200">
// //             <button onClick={() => { onCreateReport(); setOpen(false); }} className="w-full flex items-center gap-3 px-5 py-3 text-sm font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-all duration-200">
// //               <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center"><FilePlus size={15} className="text-blue-500" /></div>
// //               Create Report
// //             </button>
// //             <button onClick={() => { onViewGallery(); setOpen(false); }} className="w-full flex items-center gap-3 px-5 py-3 text-sm font-medium text-slate-700 hover:bg-violet-50 hover:text-violet-700 transition-all duration-200">
// //               <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center"><ImageIcon size={15} className="text-violet-500" /></div>
// //               View Gallery
// //             </button>
// //             <div className="my-2 mx-4 border-t border-slate-100" />
// //             <button onClick={() => { onEdit(); setOpen(false); }} className="w-full flex items-center gap-3 px-5 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-all duration-200">
// //               <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center"><Edit size={15} className="text-slate-500" /></div>
// //               Edit Details
// //             </button>
// //             <button onClick={() => { onDelete(); setOpen(false); }} className="w-full flex items-center gap-3 px-5 py-3 text-sm font-medium text-red-600 hover:bg-red-50 transition-all duration-200">
// //               <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center"><Trash2 size={15} className="text-red-500" /></div>
// //               Delete Patient
// //             </button>
// //           </div>
// //         )}
// //       </div>
// //     );
// //   };

// //   /* ═══════════════════════════════════════════════════════════════════
// //     MAIN — PatientList
// //     ═══════════════════════════════════════════════════════════════════ */
// //   const PatientList = () => {
// //     const navigate = useNavigate();
// //     const [patients, setPatients] = useState([]);
// //     const [search, setSearch] = useState('');
// //     const [loading, setLoading] = useState(true);
// //     const [showForm, setShowForm] = useState(false);
// //     const [editingPatient, setEditingPatient] = useState(null);
// //     const [viewingPatient, setViewingPatient] = useState(null);
// //     const [sortField, setSortField] = useState('createdAt');
// //     const [sortDir, setSortDir] = useState('desc');
// //     const [settings, setSettings] = useState(null);
// //     const [formData, setFormData] = useState({
// //       name: '', age: '', sex: 'Male', phone: '', address: '',
// //       idNumber: '', billNumber: '',
// //       indication: '', referredDoc: '', doneDoc: '', remark: '',
// //       procedureType: ''
// //     });
// //     const [submitting, setSubmitting] = useState(false);
// //     const searchRef = useRef(null);

// //     // Fetch settings once on mount (for procedures list)
// //     useEffect(() => {
// //       (async () => {
// //         try {
// //           const { data } = await api.get('/settings');
// //           setSettings(data);
// //         } catch {
// //           // silently ignore
// //         }
// //       })();
// //     }, []);

// //     useEffect(() => {
// //       const t = setTimeout(fetchPatients, 300);
// //       return () => clearTimeout(t);
// //     }, [search]);

// //     const fetchPatients = async () => {
// //       setLoading(true);
// //       try {
// //         const { data } = await api.get(`/patients?search=${search}`);
// //         setPatients(data.patients);
// //       } catch {
// //         toast.error('Failed to load patients');
// //       } finally {
// //         setLoading(false);
// //       }
// //     };

// //     const sortedPatients = React.useMemo(() => {
// //       const list = [...patients];
// //       list.sort((a, b) => {
// //         let av, bv;
// //         if (sortField === 'name') { av = a.name.toLowerCase(); bv = b.name.toLowerCase(); }
// //         else if (sortField === 'age') { av = a.age || 0; bv = b.age || 0; }
// //         else { av = new Date(a.createdAt); bv = new Date(b.createdAt); }
// //         if (av < bv) return sortDir === 'asc' ? -1 : 1;
// //         if (av > bv) return sortDir === 'asc' ? 1 : -1;
// //         return 0;
// //       });
// //       return list;
// //     }, [patients, sortField, sortDir]);

// //     const toggleSort = (field) => {
// //       if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
// //       else { setSortField(field); setSortDir('asc'); }
// //     };

// //     const SortIcon = ({ field }) => {
// //       if (sortField !== field) return <ArrowUpDown size={13} className="text-slate-300 group-hover/th:text-slate-400 transition-colors" />;
// //       return sortDir === 'asc' ? <SortAsc size={13} className="text-blue-600" /> : <SortDesc size={13} className="text-blue-600" />;
// //     };

// //     const handleSubmit = async (e) => {
// //       e.preventDefault();
// //       if (!formData.name.trim()) return toast.error('Name is required');
// //       if (!formData.age) return toast.error('Age is required');
// //       setSubmitting(true);
// //       try {
// //         const birthYear = new Date().getFullYear() - parseInt(formData.age);
// //         const payload = { ...formData, dateOfBirth: new Date(birthYear, 0, 1) };
// //         if (editingPatient) {
// //           await api.put(`/patients/${editingPatient._id}`, payload);
// //           toast.success('Patient updated successfully');
// //         } else {
// //           await api.post('/patients', payload);
// //           toast.success('Patient added successfully');
// //         }
// //         resetForm();
// //         fetchPatients();
// //       } catch {
// //         toast.error('Operation failed');
// //       } finally {
// //         setSubmitting(false);
// //       }
// //     };

// //     const handleDelete = async (id) => {
// //       if (!window.confirm('Delete this patient and all their data? This cannot be undone.')) return;
// //       try {
// //         await api.delete(`/patients/${id}`);
// //         toast.success('Patient deleted');
// //         fetchPatients();
// //       } catch {
// //         toast.error('Delete failed');
// //       }
// //     };

// //     const handleEdit = (patient) => {
// //       setEditingPatient(patient);
// //       const age = patient.dateOfBirth
// //         ? new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear()
// //         : patient.age || '';
// //       setFormData({
// //         name: patient.name, age, sex: patient.sex,
// //         phone: patient.phone || '', address: patient.address || '',
// //         idNumber: patient.idNumber || '',
// //         billNumber: patient.billNumber || '',
// //         indication: patient.indication || '',
// //         referredDoc: patient.referredDoc || '',
// //         doneDoc: patient.doneDoc || '',
// //         remark: patient.remark || '',
// //         procedureType: patient.procedureType || ''
// //       });
// //       setShowForm(true);
// //     };

// //     const resetForm = () => {
// //       setShowForm(false);
// //       setEditingPatient(null);
// //       setFormData({
// //         name: '', age: '', sex: 'Male', phone: '', address: '',
// //         idNumber: '', billNumber: '',
// //         indication: '', referredDoc: '', doneDoc: '', remark: '',
// //         procedureType: ''
// //       });
// //     };

// //     const getInitials = n => n.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
// //     const avatarColors = [
// //       'from-blue-500 to-indigo-600',
// //       'from-emerald-500 to-teal-600',
// //       'from-violet-500 to-purple-600',
// //       'from-amber-500 to-orange-600',
// //       'from-pink-500 to-rose-600',
// //       'from-cyan-500 to-blue-600',
// //       'from-indigo-500 to-violet-600',
// //     ];

// //     return (
// //       <div className="space-y-8 pb-24 sm:pb-0">

// //         {/* ══════ HEADER ══════ */}
// //         <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5">
// //           <div>
// //             <div className="flex items-center gap-3 mb-1">
// //               <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
// //                 <User size={20} className="text-white" />
// //               </div>
// //               <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
// //                 Patients
// //               </h1>
// //             </div>
// //             <p className="text-sm text-slate-500 ml-[52px]">
// //               {!loading && (
// //                 <span>
// //                   <span className="font-bold text-slate-700">{patients.length}</span> patient{patients.length !== 1 ? 's' : ''} registered
// //                 </span>
// //               )}
// //             </p>
// //           </div>
// //           <button
// //             onClick={() => { resetForm(); setShowForm(true); }}
// //             className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-600/25 transition-all duration-300 hover:shadow-xl hover:shadow-blue-600/35 active:scale-[0.97] group"
// //           >
// //             <UserPlus size={18} className="group-hover:scale-110 transition-transform duration-200" />
// //             Add Patient
// //           </button>
// //         </div>

// //         {/* ══════ SEARCH BAR ══════ */}
// //         <div className="relative group">
// //           <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
// //             <Search size={18} className="text-slate-400 group-focus-within:text-blue-500 transition-colors duration-300" />
// //           </div>
// //           <input
// //             ref={searchRef}
// //             type="text"
// //             placeholder="Search patients by name, ID, or phone…"
// //             value={search}
// //             onChange={e => setSearch(e.target.value)}
// //             className="w-full pl-12 pr-12 py-4 bg-white border-2 border-slate-200/80 rounded-2xl text-sm text-slate-700 placeholder:text-slate-400 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 transition-all duration-300 shadow-sm hover:border-slate-300 hover:shadow-md"
// //           />
// //           {search && (
// //             <button
// //               onClick={() => { setSearch(''); searchRef.current?.focus(); }}
// //               className="absolute inset-y-0 right-0 pr-5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
// //             >
// //               <div className="p-1 hover:bg-slate-100 rounded-lg transition-colors">
// //                 <X size={16} />
// //               </div>
// //             </button>
// //           )}
// //         </div>

// //         {/* ══════ TABLE / LIST ══════ */}
// //         {loading ? (
// //           <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm">
// //             <TableSkeleton />
// //           </div>
// //         ) : patients.length === 0 ? (
// //           <div className="flex flex-col items-center justify-center py-24 px-6 bg-gradient-to-b from-white to-slate-50/50 rounded-3xl border-2 border-dashed border-slate-200/80">
// //             <div className="w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-50 rounded-3xl flex items-center justify-center mb-6 shadow-inner">
// //               <User size={44} strokeWidth={1.5} className="text-slate-300" />
// //             </div>
// //             <h3 className="text-xl font-bold text-slate-800">
// //               {search ? 'No results found' : 'No patients yet'}
// //             </h3>
// //             <p className="text-slate-500 text-sm mt-2.5 text-center max-w-sm leading-relaxed">
// //               {search
// //                 ? `No patients match "${search}". Try a different search term.`
// //                 : 'Get started by adding your first patient record.'}
// //             </p>
// //             {!search && (
// //               <button
// //                 onClick={() => { resetForm(); setShowForm(true); }}
// //                 className="mt-8 inline-flex items-center gap-2.5 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-600/25 transition-all duration-300"
// //               >
// //                 <UserPlus size={17} /> Add First Patient
// //               </button>
// //             )}
// //           </div>
// //         ) : (
// //           <>
// //             {/* Desktop Table */}
// //             <div className="hidden md:block bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
// //               <table className="w-full">
// //                 <thead>
// //                   <tr className="border-b border-slate-200/80 bg-gradient-to-r from-slate-50/80 to-white">
// //                     {[
// //                       { key: 'name', label: 'Patient', align: 'left' },
// //                       { key: 'id', label: 'ID', align: 'left' },
// //                       { key: null, label: 'Contact', align: 'left' },
// //                       { key: 'createdAt', label: 'Registered', align: 'left' },
// //                       { key: null, label: '', align: 'right' },
// //                     ].map((col, ci) => (
// //                       <th
// //                         key={ci}
// //                         onClick={col.key ? () => toggleSort(col.key) : undefined}
// //                         className={clsx(
// //                           'group/th px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider',
// //                           col.align === 'right' ? 'text-right' : 'text-left',
// //                           col.key && 'cursor-pointer hover:text-slate-700 select-none transition-colors duration-200'
// //                         )}
// //                       >
// //                         <span className="inline-flex items-center gap-2">
// //                           {col.label}
// //                           {col.key && <SortIcon field={col.key} />}
// //                         </span>
// //                       </th>
// //                     ))}
// //                   </tr>
// //                 </thead>
// //                 <tbody className="divide-y divide-slate-100/80">
// //                   {sortedPatients.map((patient, i) => (
// //                     <tr key={patient._id} className="group hover:bg-blue-50/30 transition-colors duration-200">
// //                       <td className="px-6 py-4">
// //                         <div className="flex items-center gap-4">
// //                           <div className={clsx(
// //                             'w-11 h-11 rounded-xl bg-gradient-to-br flex-shrink-0 flex items-center justify-center text-white text-sm font-bold shadow-md',
// //                             avatarColors[i % avatarColors.length]
// //                           )}>
// //                             {getInitials(patient.name)}
// //                           </div>
// //                           <div>
// //                             <p className="font-bold text-slate-800 text-[15px]">{patient.name}</p>
// //                             <p className="text-xs text-slate-400 mt-0.5 font-medium">
// //                               {patient.age} yrs &middot; {patient.sex}
// //                               {patient.procedureType && (
// //                                 <span className="ml-2 inline-flex items-center gap-1 text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded font-semibold border border-blue-100">
// //                                   <Stethoscope size={9} />
// //                                   {patient.procedureType.length > 20
// //                                     ? patient.procedureType.substring(0, 20) + '…'
// //                                     : patient.procedureType}
// //                                 </span>
// //                               )}
// //                             </p>
// //                           </div>
// //                         </div>
// //                       </td>
// //                       <td className="px-6 py-4">
// //                         <span className="text-sm text-slate-600 font-mono bg-slate-100/80 px-2.5 py-1 rounded-lg text-xs font-semibold border border-slate-200/60">
// //                           {patient.patientId}
// //                         </span>
// //                       </td>
// //                       <td className="px-6 py-4">
// //                         {patient.phone ? (
// //                           <span className="inline-flex items-center gap-2 text-sm text-slate-600 font-medium">
// //                             <Phone size={13} className="text-slate-400" /> {patient.phone}
// //                           </span>
// //                         ) : (
// //                           <span className="text-slate-300 text-sm">—</span>
// //                         )}
// //                       </td>
// //                       <td className="px-6 py-4">
// //                         <span className="text-sm text-slate-500 font-medium">
// //                           {new Date(patient.createdAt).toLocaleDateString('en-US', {
// //                             year: 'numeric', month: 'short', day: 'numeric',
// //                           })}
// //                         </span>
// //                       </td>
// //                       <td className="px-6 py-4">
// //                         <div className="flex items-center justify-end gap-1 opacity-0 opacity-100 transition-all duration-300">
// //                           <button
// //                             onClick={() => navigate(`/reports/new?patient=${patient._id}`)}
// //                             className="p-2.5 rounded-xl text-blue-600 hover:bg-blue-100 transition-all duration-200 hover:scale-105"
// //                             title="Create Report"
// //                           >
// //                             <FilePlus size={17} />
// //                           </button>
// //                           <button
// //                             onClick={() => navigate(`/patients/${patient._id}`)}
// //                             className="p-2.5 rounded-xl text-violet-600 hover:bg-violet-100 transition-all duration-200 hover:scale-105"
// //                             title="View Patient Profile"
// //                           >
// //                             <Eye size={17} />
// //                           </button>
// //                           <button
// //                             onClick={() => handleEdit(patient)}
// //                             className="p-2.5 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-all duration-200 hover:scale-105"
// //                             title="Edit"
// //                           >
// //                             <Edit size={16} />
// //                           </button>
// //                           <button
// //                             onClick={() => handleDelete(patient._id)}
// //                             className="p-2.5 rounded-xl text-slate-400 hover:bg-red-50 hover:text-red-600 transition-all duration-200 hover:scale-105"
// //                             title="Delete"
// //                           >
// //                             <Trash2 size={16} />
// //                           </button>
// //                         </div>
// //                       </td>
// //                     </tr>
// //                   ))}
// //                 </tbody>
// //               </table>
// //             </div>

// //             {/* Mobile Cards */}
// //             <div className="md:hidden space-y-3">
// //               {sortedPatients.map((patient, i) => (
// //                 <div
// //                   key={patient._id}
// //                   className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden active:scale-[0.995] transition-all duration-200 hover:shadow-md hover:border-slate-300/80"
// //                 >
// //                   <div className="p-5 flex items-start justify-between">
// //                     <div className="flex items-center gap-3.5 min-w-0">
// //                       <div className={clsx(
// //                         'w-12 h-12 rounded-xl bg-gradient-to-br flex-shrink-0 flex items-center justify-center text-white text-sm font-bold shadow-md',
// //                         avatarColors[i % avatarColors.length]
// //                       )}>
// //                         {getInitials(patient.name)}
// //                       </div>
// //                       <div className="min-w-0">
// //                         <h3 className="font-bold text-slate-800 text-[15px] truncate">{patient.name}</h3>
// //                         <div className="flex items-center gap-2.5 mt-1 flex-wrap">
// //                           <span className="text-xs text-slate-400 font-medium">{patient.age}Y &middot; {patient.sex}</span>
// //                           <span className="text-xs text-slate-500 font-mono bg-slate-100 px-2 py-0.5 rounded-md font-semibold border border-slate-200/60">
// //                             {patient.patientId}
// //                           </span>
// //                           {patient.procedureType && (
// //                             <span className="text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded font-semibold border border-blue-100">
// //                               {patient.procedureType.length > 15
// //                                 ? patient.procedureType.substring(0, 15) + '…'
// //                                 : patient.procedureType}
// //                             </span>
// //                           )}
// //                         </div>
// //                       </div>
// //                     </div>
// //                     <MobileActions
// //                       onEdit={() => handleEdit(patient)}
// //                       onDelete={() => handleDelete(patient._id)}
// //                       onCreateReport={() => navigate(`/reports/new?patient=${patient._id}`)}
// //                       onViewGallery={() => navigate(`/patients/${patient._id}`)}
// //                     />
// //                   </div>

// //                   <div className="mx-5 border-t border-slate-100" />

// //                   <div className="p-5 flex items-center justify-between">
// //                     <div className="flex items-center gap-4 text-sm text-slate-500">
// //                       {patient.phone && (
// //                         <span className="inline-flex items-center gap-2 font-medium">
// //                           <Phone size={14} className="text-slate-400" /> {patient.phone}
// //                         </span>
// //                       )}
// //                     </div>
// //                     <button
// //                       onClick={() => navigate(`/reports/new?patient=${patient._id}`)}
// //                       className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-50 to-blue-100/80 text-blue-600 rounded-xl text-xs font-bold hover:from-blue-100 hover:to-blue-200/80 transition-all duration-200 border border-blue-200/60"
// //                     >
// //                       <FilePlus size={14} /> Report
// //                     </button>
// //                   </div>
// //                 </div>
// //               ))}
// //             </div>
// //           </>
// //         )}

// //         {/* ══════ PATIENT FORM MODAL ══════ */}
// //         {showForm && (
// //           <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4"
// //             onClick={resetForm}>
// //             <div
// //               className="bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl shadow-xl flex flex-col max-h-[90vh]"
// //               onClick={e => e.stopPropagation()}
// //             >
// //               {/* Header */}
// //               <div className={clsx(
// //                 'px-6 py-4 flex items-center justify-between rounded-t-2xl',
// //                 editingPatient ? 'bg-amber-500' : 'bg-blue-600'
// //               )}>
// //                 <div className="flex items-center gap-3">
// //                   {editingPatient
// //                     ? <Edit size={20} className="text-white" />
// //                     : <UserPlus size={20} className="text-white" />
// //                   }
// //                   <h2 className="text-lg font-bold text-white">
// //                     {editingPatient ? 'Edit Patient' : 'Register Patient'}
// //                   </h2>
// //                 </div>
// //                 <button onClick={resetForm} className="text-white/80 hover:text-white p-1">
// //                   <X size={20} />
// //                 </button>
// //               </div>

// //               {/* Form */}
// //               <div className="flex-1 overflow-y-auto px-6 py-5">
// //                 <form id="patientForm" onSubmit={handleSubmit} className="space-y-5">

// //                   {/* ── Basic Info ── */}
// //                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
// //                     <User size={12} /> Basic Information
// //                   </p>

// //                   <div>
// //                     <label className="text-xs font-semibold text-slate-600 mb-1 block">
// //                       Full Name <span className="text-red-400">*</span>
// //                     </label>
// //                     <input
// //                       type="text"
// //                       value={formData.name}
// //                       onChange={e => setFormData({ ...formData, name: e.target.value })}
// //                       placeholder="Patient full name"
// //                       className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
// //                       required
// //                       autoFocus
// //                     />
// //                   </div>

// //                   {/* ✅ CHANGED: grid-cols-3 → grid-cols-2, removed Serial No. field */}
// //                   <div className="grid grid-cols-2 gap-3">
// //                     <div>
// //                       <label className="text-xs font-semibold text-slate-600 mb-1 block">
// //                         Age <span className="text-red-400">*</span>
// //                       </label>
// //                       <input
// //                         type="number"
// //                         value={formData.age}
// //                         onChange={e => setFormData({ ...formData, age: e.target.value })}
// //                         placeholder="Yrs"
// //                         className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
// //                         required min="0" max="150"
// //                       />
// //                     </div>
// //                     <div>
// //                       <label className="text-xs font-semibold text-slate-600 mb-1 block">
// //                         Sex <span className="text-red-400">*</span>
// //                       </label>
// //                       <select
// //                         value={formData.sex}
// //                         onChange={e => setFormData({ ...formData, sex: e.target.value })}
// //                         className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
// //                       >
// //                         <option>Male</option>
// //                         <option>Female</option>
// //                         <option>Other</option>
// //                       </select>
// //                     </div>
// //                   </div>

// //                   <div className="grid grid-cols-2 gap-3">
// //                     <div>
// //                       <label className="text-xs font-semibold text-slate-600 mb-1 block">Patient ID</label>
// //                       <input
// //                         type="text"
// //                         value={formData.idNumber}
// //                         onChange={e => setFormData({ ...formData, idNumber: e.target.value })}
// //                         placeholder=" ID"
// //                         className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
// //                       />
// //                     </div>
// //                     <div>
// //                       <label className="text-xs font-semibold text-slate-600 mb-1 block">Bill Number</label>
// //                       <input
// //                         type="text"
// //                         value={formData.billNumber}
// //                         onChange={e => setFormData({ ...formData, billNumber: e.target.value })}
// //                         placeholder="Bill / Receipt"
// //                         className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
// //                       />
// //                     </div>
// //                   </div>

// //                   {/* ── Contact ── */}
// //                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 pt-2 border-t border-slate-100">
// //                     <Phone size={12} /> Contact
// //                   </p>

// //                   <div className="grid grid-cols-2 gap-3">
// //                     <div>
// //                       <label className="text-xs font-semibold text-slate-600 mb-1 block">Phone</label>
// //                       <input
// //                         type="tel"
// //                         value={formData.phone}
// //                         onChange={e => setFormData({ ...formData, phone: e.target.value })}
// //                         placeholder="Contact number"
// //                         className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
// //                       />
// //                     </div>
// //                     <div>
// //                       <label className="text-xs font-semibold text-slate-600 mb-1 block">Address</label>
// //                       <input
// //                         type="text"
// //                         value={formData.address}
// //                         onChange={e => setFormData({ ...formData, address: e.target.value })}
// //                         placeholder="Patient address"
// //                         className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
// //                       />
// //                     </div>
// //                   </div>

// //                   {/* ── Clinical ── */}
// //                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 pt-2 border-t border-slate-100">
// //                     <Activity size={12} /> Clinical
// //                   </p>

// //                   {/* Procedure Type */}
// //                   <div>
// //                     <label className="text-xs font-semibold text-slate-600 mb-1 block flex items-center gap-1.5">
// //                       <Stethoscope size={12} className="text-blue-500" />
// //                       Procedure Type
// //                     </label>
// //                     <input
// //                       type="text"
// //                       value={formData.procedureType}
// //                       onChange={e => setFormData({ ...formData, procedureType: e.target.value })}
// //                       placeholder="e.g., Video GastroDuodenoscopy, Colonoscopy"
// //                       className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
// //                     />
// //                   </div>

// //                   <div>
// //                     <label className="text-xs font-semibold text-slate-600 mb-1 block">Indication</label>
// //                     <input
// //                       type="text"
// //                       value={formData.indication}
// //                       onChange={e => setFormData({ ...formData, indication: e.target.value })}
// //                       placeholder="e.g., Dyspepsia, Acidity, GERD"
// //                       className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
// //                     />
// //                   </div>

// //                   <div className="grid grid-cols-2 gap-3">
// //                     <div>
// //                       <label className="text-xs font-semibold text-slate-600 mb-1 block">Referred By</label>
// //                       <input
// //                         type="text"
// //                         value={formData.referredDoc}
// //                         onChange={e => setFormData({ ...formData, referredDoc: e.target.value })}
// //                         placeholder="Referring doctor"
// //                         className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
// //                       />
// //                     </div>
// //                     <div>
// //                       <label className="text-xs font-semibold text-slate-600 mb-1 block">Performed By</label>
// //                       <input
// //                         type="text"
// //                         value={formData.doneDoc}
// //                         onChange={e => setFormData({ ...formData, doneDoc: e.target.value })}
// //                         placeholder="Performing doctor"
// //                         className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
// //                       />
// //                     </div>
// //                   </div>

// //                   <div>
// //                     <label className="text-xs font-semibold text-slate-600 mb-1 block">Remarks</label>
// //                     <textarea
// //                       value={formData.remark}
// //                       onChange={e => setFormData({ ...formData, remark: e.target.value })}
// //                       placeholder="Additional notes..."
// //                       rows={2}
// //                       className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
// //                     />
// //                   </div>

// //                 </form>
// //               </div>

// //               {/* Footer */}
// //               <div className="px-6 py-4 border-t border-slate-200 flex gap-3 bg-slate-50 rounded-b-2xl">
// //                 <button
// //                   type="button"
// //                   onClick={resetForm}
// //                   className="flex-1 py-2.5 text-sm font-semibold text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
// //                 >
// //                   Cancel
// //                 </button>
// //                 <button
// //                   type="submit"
// //                   form="patientForm"
// //                   disabled={submitting}
// //                   className={clsx(
// //                     'flex-1 py-2.5 text-sm font-bold text-white rounded-lg inline-flex items-center justify-center gap-2 disabled:opacity-50',
// //                     editingPatient
// //                       ? 'bg-amber-500 hover:bg-amber-600'
// //                       : 'bg-blue-600 hover:bg-blue-700'
// //                   )}
// //                 >
// //                   {submitting ? (
// //                     <><Loader2 size={16} className="animate-spin" /> Saving…</>
// //                   ) : (
// //                     <><CheckCircle size={16} /> {editingPatient ? 'Update' : 'Register'}</>
// //                   )}
// //                 </button>
// //               </div>
// //             </div>
// //           </div>
// //         )}
// //       </div>
// //     );
// //   };

// //   export default PatientList;


// import React, { useState, useEffect, useRef, useCallback } from 'react';
// import { useNavigate } from 'react-router-dom';
// import api, { getImageURL } from '../../utils/api';
// import {
//   Search, Plus, User, Phone, Calendar, ArrowRight,
//   Edit, Trash2, X, MoreVertical, FilePlus, Image as ImageIcon,
//   MapPin, FileText, ExternalLink, Maximize2, Download,
//   ChevronLeft, ChevronRight, Filter, SortAsc, SortDesc,
//   Clock, Hash, Activity, Eye, ZoomIn, ChevronDown,
//   UserPlus, AlertCircle, CheckCircle, Loader2, ArrowUpDown,
//   Stethoscope, Users, CalendarDays
// } from 'lucide-react';
// import toast from 'react-hot-toast';
// import clsx from 'clsx';

// /* ═══════════════════════════════════════════════════════════════════
//    LIGHTBOX — full-screen image viewer
//    ═══════════════════════════════════════════════════════════════════ */
// const Lightbox = ({ image, onClose, images, onNavigate }) => {
//   if (!image) return null;
//   const imageUrl = getImageURL(image.path);
//   const currentIndex = images?.findIndex(i => i.path === image.path) ?? -1;

//   useEffect(() => {
//     const handler = (e) => {
//       if (e.key === 'Escape') onClose();
//       if (e.key === 'ArrowLeft' && currentIndex > 0) onNavigate(images[currentIndex - 1]);
//       if (e.key === 'ArrowRight' && currentIndex < images.length - 1) onNavigate(images[currentIndex + 1]);
//     };
//     document.addEventListener('keydown', handler);
//     document.body.style.overflow = 'hidden';
//     return () => {
//       document.removeEventListener('keydown', handler);
//       document.body.style.overflow = '';
//     };
//   }, [currentIndex, images, onClose, onNavigate]);

//   return (
//     <div className="fixed inset-0 z-[100] bg-black/98 backdrop-blur-3xl flex flex-col items-center justify-center animate-in fade-in duration-200" onClick={onClose}>
//       <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-black/80 via-black/40 to-transparent z-10 flex items-center justify-between px-8">
//         <div className="text-white/60 text-sm font-medium tracking-wide">
//           {currentIndex >= 0 && (
//             <span className="bg-white/10 px-3.5 py-1.5 rounded-full backdrop-blur-sm border border-white/10">
//               {currentIndex + 1} <span className="text-white/40">of</span> {images.length}
//             </span>
//           )}
//         </div>
//         <div className="flex items-center gap-3">
//           <a href={imageUrl} download target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} className="p-3 bg-white/[0.08] hover:bg-white/[0.15] border border-white/[0.08] rounded-2xl text-white/80 hover:text-white transition-all duration-300" title="Download">
//             <Download size={18} />
//           </a>
//           <button onClick={onClose} className="p-3 bg-white/[0.08] hover:bg-white/[0.15] border border-white/[0.08] rounded-2xl text-white/80 hover:text-white transition-all duration-300">
//             <X size={18} />
//           </button>
//         </div>
//       </div>
//       {currentIndex > 0 && (
//         <button onClick={e => { e.stopPropagation(); onNavigate(images[currentIndex - 1]); }} className="absolute left-6 top-1/2 -translate-y-1/2 z-10 p-4 bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] rounded-2xl text-white/70 hover:text-white transition-all duration-300 backdrop-blur-sm hover:scale-105">
//           <ChevronLeft size={22} />
//         </button>
//       )}
//       {currentIndex < images.length - 1 && (
//         <button onClick={e => { e.stopPropagation(); onNavigate(images[currentIndex + 1]); }} className="absolute right-6 top-1/2 -translate-y-1/2 z-10 p-4 bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] rounded-2xl text-white/70 hover:text-white transition-all duration-300 backdrop-blur-sm hover:scale-105">
//           <ChevronRight size={22} />
//         </button>
//       )}
//       <div className="relative max-w-[88vw] max-h-[78vh]" onClick={e => e.stopPropagation()}>
//         <img src={imageUrl} alt={image.caption || 'Medical image'} className="max-w-full max-h-[78vh] rounded-2xl shadow-2xl shadow-black/50 object-contain select-none ring-1 ring-white/10" draggable={false} />
//       </div>
//       <div className="mt-8 text-center text-white px-6" onClick={e => e.stopPropagation()}>
//         <p className="font-semibold text-lg tracking-tight">{image.taggedOrgan || 'Untagged'}</p>
//         <p className="text-white/40 text-sm mt-1.5 font-medium">
//           {image.caption || 'No caption'} &middot;{' '}
//           {new Date(image.procedureDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
//         </p>
//       </div>
//     </div>
//   );
// };

// /* ═══════════════════════════════════════════════════════════════════
//    SKELETON LOADERS
//    ═══════════════════════════════════════════════════════════════════ */
// const GallerySkeleton = () => (
//   <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
//     {[...Array(10)].map((_, i) => (
//       <div key={i} className="aspect-square bg-gradient-to-br from-slate-100 via-slate-50 to-slate-100 rounded-2xl animate-pulse" style={{ animationDelay: `${i * 80}ms` }} />
//     ))}
//   </div>
// );

// const TableSkeleton = () => (
//   <div className="space-y-0">
//     {[...Array(6)].map((_, i) => (
//       <div key={i} className="flex items-center gap-4 px-6 py-5 border-b border-slate-50 animate-pulse" style={{ animationDelay: `${i * 100}ms` }}>
//         <div className="w-8 h-8 bg-slate-200 rounded-lg shrink-0" />
//         <div className="w-11 h-11 bg-gradient-to-br from-slate-200 to-slate-100 rounded-xl shrink-0" />
//         <div className="flex-1 space-y-2.5">
//           <div className="h-4 bg-slate-200/80 rounded-lg w-1/3" />
//           <div className="h-3 bg-slate-100 rounded-lg w-1/5" />
//         </div>
//         <div className="h-4 bg-slate-100 rounded-lg w-20 hidden sm:block" />
//         <div className="h-4 bg-slate-100 rounded-lg w-24 hidden sm:block" />
//       </div>
//     ))}
//   </div>
// );

// /* ═══════════════════════════════════════════════════════════════════
//    PATIENT GALLERY MODAL
//    ═══════════════════════════════════════════════════════════════════ */
// const PatientGalleryModal = ({ patient, onClose }) => {
//   const navigate = useNavigate();
//   const [reports, setReports] = useState([]);
//   const [activeTab, setActiveTab] = useState('gallery');
//   const [loading, setLoading] = useState(true);
//   const [selectedImage, setSelectedImage] = useState(null);

//   useEffect(() => { document.body.style.overflow = 'hidden'; return () => { document.body.style.overflow = ''; }; }, []);

//   useEffect(() => {
//     (async () => {
//       try { const { data } = await api.get(`/reports?patient=${patient._id}&limit=100`); setReports(data.reports || []); }
//       catch { toast.error('Failed to load history'); }
//       finally { setTimeout(() => setLoading(false), 400); }
//     })();
//   }, [patient._id]);

//   const galleryImages = React.useMemo(() => {
//     const all = [];
//     reports.forEach(r => { (r.images || []).forEach(img => { all.push({ ...img, procedureDate: r.procedureDate, procedureName: r.procedureName, reportId: r._id }); }); });
//     return all.sort((a, b) => new Date(b.procedureDate) - new Date(a.procedureDate));
//   }, [reports]);

//   const getInitials = n => n.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();

//   return (
//     <>
//       {selectedImage && <Lightbox image={selectedImage} images={galleryImages} onClose={() => setSelectedImage(null)} onNavigate={setSelectedImage} />}
//       <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-0 sm:p-6">
//         <div className="bg-white w-full h-full sm:h-[92vh] sm:max-w-5xl sm:rounded-3xl shadow-2xl shadow-black/20 overflow-hidden flex flex-col animate-in slide-in-from-bottom-4 fade-in duration-300">
//           <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-8 py-7 text-white shrink-0 overflow-hidden">
//             <div className="absolute inset-0 opacity-30"><div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" /><div className="absolute bottom-0 left-0 w-64 h-64 bg-violet-500/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" /></div>
//             <div className="relative flex items-center justify-between">
//               <div className="flex items-center gap-5">
//                 <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 border-2 border-white/20 flex items-center justify-center text-xl font-bold shadow-lg shadow-blue-500/30">{getInitials(patient.name)}</div>
//                 <div>
//                   <h2 className="text-2xl font-bold tracking-tight">{patient.name}</h2>
//                   <div className="flex flex-wrap gap-2.5 mt-2">
//                     <span className="inline-flex items-center gap-1.5 text-xs text-white/80 bg-white/[0.08] border border-white/[0.06] px-3 py-1.5 rounded-lg font-medium backdrop-blur-sm"><User size={12} /> {patient.age}Y / {patient.sex}</span>
//                     <span className="inline-flex items-center gap-1.5 text-xs text-white/80 bg-white/[0.08] border border-white/[0.06] px-3 py-1.5 rounded-lg font-mono backdrop-blur-sm"><Hash size={12} /> {patient.patientId}</span>
//                     {patient.phone && <span className="inline-flex items-center gap-1.5 text-xs text-white/80 bg-white/[0.08] border border-white/[0.06] px-3 py-1.5 rounded-lg font-medium backdrop-blur-sm"><Phone size={12} /> {patient.phone}</span>}
//                   </div>
//                 </div>
//               </div>
//               <button onClick={onClose} className="p-3 bg-white/[0.08] hover:bg-white/[0.15] border border-white/[0.06] rounded-2xl transition-all duration-300"><X size={18} /></button>
//             </div>
//           </div>
//           <div className="px-8 bg-white border-b border-slate-200/80 shrink-0">
//             <div className="flex gap-2">
//               {[{ id: 'gallery', label: 'Gallery', icon: ImageIcon, count: galleryImages.length }, { id: 'reports', label: 'Reports', icon: FileText, count: reports.length }].map(tab => (
//                 <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={clsx('relative flex items-center gap-2.5 px-5 py-4 text-sm font-semibold transition-all duration-300', activeTab === tab.id ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600')}>
//                   <tab.icon size={16} />{tab.label}
//                   <span className={clsx('text-[11px] min-w-[28px] text-center px-2 py-0.5 rounded-full font-bold tabular-nums', activeTab === tab.id ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500')}>{tab.count}</span>
//                   {activeTab === tab.id && <span className="absolute bottom-0 left-3 right-3 h-[3px] bg-blue-600 rounded-full" />}
//                 </button>
//               ))}
//             </div>
//           </div>
//           <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-gradient-to-b from-slate-50/80 to-white">
//             {loading ? (activeTab === 'gallery' ? <GallerySkeleton /> : <TableSkeleton />) : (
//               <>
//                 {activeTab === 'gallery' && (galleryImages.length === 0 ? (
//                   <div className="h-72 flex flex-col items-center justify-center text-slate-400"><div className="w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-50 rounded-3xl flex items-center justify-center mb-5 shadow-inner"><ImageIcon size={40} strokeWidth={1.5} className="text-slate-300" /></div><p className="font-bold text-slate-700 text-lg">No images yet</p><p className="text-sm mt-1.5 text-slate-400">Images from reports will appear here</p></div>
//                 ) : (
//                   <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
//                     {galleryImages.map((img, idx) => (
//                       <div key={idx} onClick={() => setSelectedImage(img)} className="group relative aspect-square rounded-2xl overflow-hidden cursor-pointer bg-slate-100 ring-1 ring-black/[0.06] hover:ring-2 hover:ring-blue-300/60 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10">
//                         <img src={getImageURL(img.path)} className="w-full h-full object-cover transition-all duration-700 ease-out group-hover:scale-110" alt={img.caption} loading="lazy" />
//                         <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-400" />
//                         <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-3 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-400">
//                           <p className="text-white text-sm font-bold truncate">{img.taggedOrgan || 'Untagged'}</p>
//                           <p className="text-white/50 text-xs mt-1 font-medium">{new Date(img.procedureDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
//                         </div>
//                         <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 scale-75 group-hover:scale-100"><div className="p-2.5 bg-white/20 backdrop-blur-xl rounded-xl text-white border border-white/10"><ZoomIn size={15} /></div></div>
//                       </div>
//                     ))}
//                   </div>
//                 ))}
//                 {activeTab === 'reports' && (reports.length === 0 ? (
//                   <div className="h-72 flex flex-col items-center justify-center text-slate-400"><div className="w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-50 rounded-3xl flex items-center justify-center mb-5 shadow-inner"><FileText size={40} strokeWidth={1.5} className="text-slate-300" /></div><p className="font-bold text-slate-700 text-lg">No reports found</p><p className="text-sm mt-1.5 text-slate-400">Create a report to get started</p></div>
//                 ) : (
//                   <div className="space-y-3">
//                     {reports.map(rep => (
//                       <div key={rep._id} onClick={() => navigate(`/reports/${rep._id}/print`)} className="group bg-white rounded-2xl border border-slate-200/80 hover:border-blue-200/80 p-5 flex items-center gap-5 cursor-pointer transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/[0.06] hover:-translate-y-0.5">
//                         <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 group-hover:from-blue-50 group-hover:to-blue-100 flex items-center justify-center transition-all duration-300 border border-slate-200/60 group-hover:border-blue-200/60"><FileText size={20} className="text-slate-400 group-hover:text-blue-500 transition-colors duration-300" /></div>
//                         <div className="flex-1 min-w-0">
//                           <p className="font-bold text-slate-800 truncate text-[15px]">{rep.procedureName}</p>
//                           <p className="text-xs text-slate-400 mt-1 flex items-center gap-2 font-medium"><Calendar size={12} />{new Date(rep.procedureDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}{rep.images?.length > 0 && (<><span className="w-1 h-1 rounded-full bg-slate-300" /><ImageIcon size={12} />{rep.images.length} image{rep.images.length > 1 ? 's' : ''}</>)}</p>
//                         </div>
//                         <span className={clsx('hidden sm:inline-flex px-3.5 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider border', rep.status === 'finalized' ? 'bg-emerald-50 text-emerald-600 border-emerald-200/60' : 'bg-amber-50 text-amber-600 border-amber-200/60')}>{rep.status}</span>
//                         <div className="w-9 h-9 rounded-xl bg-slate-50 group-hover:bg-blue-50 flex items-center justify-center transition-all duration-300"><ArrowRight size={16} className="text-slate-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all duration-300" /></div>
//                       </div>
//                     ))}
//                   </div>
//                 ))}
//               </>
//             )}
//           </div>
//           <div className="bg-white border-t border-slate-200/80 px-8 py-5 flex items-center justify-between gap-3 shrink-0">
//             <button onClick={onClose} className="px-6 py-3 text-sm font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all duration-200">Close</button>
//             <button onClick={() => navigate(`/reports/new?patient=${patient._id}`)} className="inline-flex items-center gap-2.5 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-600/25 transition-all duration-300 hover:shadow-xl hover:shadow-blue-600/35 active:scale-[0.97]"><FilePlus size={17} /> New Report</button>
//           </div>
//         </div>
//       </div>
//     </>
//   );
// };

// /* ═══════════════════════════════════════════════════════════════════
//    MOBILE ACTION MENU
//    ═══════════════════════════════════════════════════════════════════ */
// const MobileActions = ({ onEdit, onDelete, onCreateReport, onViewGallery }) => {
//   const [open, setOpen] = useState(false);
//   const ref = useRef(null);

//   useEffect(() => {
//     if (!open) return;
//     const close = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
//     document.addEventListener('mousedown', close);
//     return () => document.removeEventListener('mousedown', close);
//   }, [open]);

//   return (
//     <div className="relative" ref={ref}>
//       <button onClick={e => { e.stopPropagation(); setOpen(o => !o); }} className={clsx('p-2.5 rounded-xl transition-all duration-200', open ? 'bg-slate-200 text-slate-700' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100')}>
//         <MoreVertical size={18} />
//       </button>
//       {open && (
//         <div className="absolute right-0 top-full mt-2.5 w-56 bg-white rounded-2xl shadow-2xl shadow-slate-300/40 border border-slate-200/80 z-30 py-2 overflow-hidden animate-in slide-in-from-top-2 fade-in duration-200">
//           <button onClick={() => { onCreateReport(); setOpen(false); }} className="w-full flex items-center gap-3 px-5 py-3 text-sm font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-all duration-200"><div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center"><FilePlus size={15} className="text-blue-500" /></div>Create Report</button>
//           <button onClick={() => { onViewGallery(); setOpen(false); }} className="w-full flex items-center gap-3 px-5 py-3 text-sm font-medium text-slate-700 hover:bg-violet-50 hover:text-violet-700 transition-all duration-200"><div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center"><ImageIcon size={15} className="text-violet-500" /></div>View Gallery</button>
//           <div className="my-2 mx-4 border-t border-slate-100" />
//           <button onClick={() => { onEdit(); setOpen(false); }} className="w-full flex items-center gap-3 px-5 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-all duration-200"><div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center"><Edit size={15} className="text-slate-500" /></div>Edit Details</button>
//           <button onClick={() => { onDelete(); setOpen(false); }} className="w-full flex items-center gap-3 px-5 py-3 text-sm font-medium text-red-600 hover:bg-red-50 transition-all duration-200"><div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center"><Trash2 size={15} className="text-red-500" /></div>Delete Patient</button>
//         </div>
//       )}
//     </div>
//   );
// };

// /* ═══════════════════════════════════════════════════════════════════
//    MAIN — PatientList
//    ═══════════════════════════════════════════════════════════════════ */
// const PatientList = () => {
//   const navigate = useNavigate();
//   const [patients, setPatients] = useState([]);
//   const [search, setSearch] = useState('');
//   const [loading, setLoading] = useState(true);
//   const [showForm, setShowForm] = useState(false);
//   const [editingPatient, setEditingPatient] = useState(null);
//   const [sortField, setSortField] = useState('createdAt');
//   const [sortDir, setSortDir] = useState('desc');
//   const [settings, setSettings] = useState(null);
//   const [formData, setFormData] = useState({
//     name: '', age: '', sex: 'Male', phone: '', address: '',
//     idNumber: '', billNumber: '',
//     indication: '', referredDoc: '', doneDoc: '', remark: '',
//     procedureType: ''
//   });
//   const [submitting, setSubmitting] = useState(false);
//   const searchRef = useRef(null);

//   useEffect(() => {
//     (async () => {
//       try { const { data } = await api.get('/settings'); setSettings(data); } catch { }
//     })();
//   }, []);

//   useEffect(() => {
//     const t = setTimeout(fetchPatients, 300);
//     return () => clearTimeout(t);
//   }, [search]);

//   const fetchPatients = async () => {
//     setLoading(true);
//     try {
//       const { data } = await api.get(`/patients?search=${search}`);
//       setPatients(data.patients);
//     } catch { toast.error('Failed to load patients'); }
//     finally { setLoading(false); }
//   };

//   /* ── Date helpers ── */
//   const getDateLabel = (dateStr) => {
//     const d = new Date(dateStr);
//     const today = new Date();
//     const yesterday = new Date(today);
//     yesterday.setDate(yesterday.getDate() - 1);

//     if (d.toDateString() === today.toDateString()) return 'Today';
//     if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
//     return d.toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' });
//   };

//   const isToday = (dateStr) => new Date(dateStr).toDateString() === new Date().toDateString();

//   /* ── Stats ── */
//   const todayCount = React.useMemo(() =>
//     patients.filter(p => new Date(p.createdAt).toDateString() === new Date().toDateString()).length,
//     [patients]
//   );

//   /* ── Group patients by date ── */
//   const groupedByDate = React.useMemo(() => {
//     const groups = {};

//     patients.forEach(patient => {
//       const dateKey = new Date(patient.createdAt).toDateString();
//       if (!groups[dateKey]) groups[dateKey] = [];
//       groups[dateKey].push(patient);
//     });

//     // Sort within each group by selected field
//     Object.values(groups).forEach(group => {
//       group.sort((a, b) => {
//         let av, bv;
//         if (sortField === 'name') { av = a.name.toLowerCase(); bv = b.name.toLowerCase(); }
//         else if (sortField === 'age') { av = a.age || 0; bv = b.age || 0; }
//         else { av = new Date(a.createdAt); bv = new Date(b.createdAt); }
//         if (av < bv) return sortDir === 'asc' ? -1 : 1;
//         if (av > bv) return sortDir === 'asc' ? 1 : -1;
//         return 0;
//       });
//     });

//     // Sort groups by date, newest first
//     return Object.entries(groups)
//       .map(([dateStr, pts]) => ({ dateStr, date: new Date(dateStr), patients: pts }))
//       .sort((a, b) => b.date - a.date);
//   }, [patients, sortField, sortDir]);

//   const toggleSort = (field) => {
//     if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
//     else { setSortField(field); setSortDir('asc'); }
//   };

//   const SortIcon = ({ field }) => {
//     if (sortField !== field) return <ArrowUpDown size={13} className="text-slate-300 group-hover/th:text-slate-400 transition-colors" />;
//     return sortDir === 'asc' ? <SortAsc size={13} className="text-blue-600" /> : <SortDesc size={13} className="text-blue-600" />;
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     if (!formData.name.trim()) return toast.error('Name is required');
//     if (!formData.age) return toast.error('Age is required');
//     setSubmitting(true);
//     try {
//       const birthYear = new Date().getFullYear() - parseInt(formData.age);
//       const payload = { ...formData, dateOfBirth: new Date(birthYear, 0, 1) };
//       if (editingPatient) {
//         await api.put(`/patients/${editingPatient._id}`, payload);
//         toast.success('Patient updated successfully');
//       } else {
//         await api.post('/patients', payload);
//         toast.success('Patient added successfully');
//       }
//       resetForm();
//       fetchPatients();
//     } catch { toast.error('Operation failed'); }
//     finally { setSubmitting(false); }
//   };

//   const handleDelete = async (id) => {
//     if (!window.confirm('Delete this patient and all their data? This cannot be undone.')) return;
//     try { await api.delete(`/patients/${id}`); toast.success('Patient deleted'); fetchPatients(); }
//     catch { toast.error('Delete failed'); }
//   };

//   const handleEdit = (patient) => {
//     setEditingPatient(patient);
//     const age = patient.dateOfBirth ? new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear() : patient.age || '';
//     setFormData({
//       name: patient.name, age, sex: patient.sex,
//       phone: patient.phone || '', address: patient.address || '',
//       idNumber: patient.idNumber || '', billNumber: patient.billNumber || '',
//       indication: patient.indication || '', referredDoc: patient.referredDoc || '',
//       doneDoc: patient.doneDoc || '', remark: patient.remark || '',
//       procedureType: patient.procedureType || ''
//     });
//     setShowForm(true);
//   };

//   const resetForm = () => {
//     setShowForm(false);
//     setEditingPatient(null);
//     setFormData({
//       name: '', age: '', sex: 'Male', phone: '', address: '',
//       idNumber: '', billNumber: '',
//       indication: '', referredDoc: '', doneDoc: '', remark: '',
//       procedureType: ''
//     });
//   };

//   const getInitials = n => n.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();

//   const getColorIndex = (name) => {
//     let hash = 0;
//     for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
//     return Math.abs(hash) % avatarColors.length;
//   };

//   const avatarColors = [
//     'from-blue-500 to-indigo-600', 'from-emerald-500 to-teal-600',
//     'from-violet-500 to-purple-600', 'from-amber-500 to-orange-600',
//     'from-pink-500 to-rose-600', 'from-cyan-500 to-blue-600',
//     'from-indigo-500 to-violet-600',
//   ];

//   return (
//     <div className="space-y-6 pb-24 sm:pb-0">

//       {/* ══════ HEADER ══════ */}
//       <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5">
//         <div>
//           <div className="flex items-center gap-3 mb-1">
//             <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
//               <User size={20} className="text-white" />
//             </div>
//             <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Patients</h1>
//           </div>
//           {/* ✅ Stat badges */}
//           {!loading && patients.length > 0 && (
//             <div className="flex items-center gap-2.5 ml-[52px] mt-1.5">
//               <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-slate-100 text-slate-600 px-3 py-1.5 rounded-full border border-slate-200/60">
//                 <Users size={13} className="text-slate-400" />
//                 {patients.length} <span className="text-slate-400 font-medium">total</span>
//               </span>
//               <span className={clsx(
//                 'inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border',
//                 todayCount > 0
//                   ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60'
//                   : 'bg-slate-50 text-slate-400 border-slate-200/60'
//               )}>
//                 <CalendarDays size={13} className={todayCount > 0 ? 'text-emerald-500' : 'text-slate-300'} />
//                 {todayCount} <span className={todayCount > 0 ? 'text-emerald-500 font-medium' : 'text-slate-400 font-medium'}>today</span>
//               </span>
//             </div>
//           )}
//         </div>
//         <button
//           onClick={() => { resetForm(); setShowForm(true); }}
//           className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-600/25 transition-all duration-300 hover:shadow-xl hover:shadow-blue-600/35 active:scale-[0.97] group"
//         >
//           <UserPlus size={18} className="group-hover:scale-110 transition-transform duration-200" />
//           Add Patient
//         </button>
//       </div>

//       {/* ══════ SEARCH BAR ══════ */}
//       <div className="relative group">
//         <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
//           <Search size={18} className="text-slate-400 group-focus-within:text-blue-500 transition-colors duration-300" />
//         </div>
//         <input
//           ref={searchRef} type="text" placeholder="Search patients by name, ID, or phone…"
//           value={search} onChange={e => setSearch(e.target.value)}
//           className="w-full pl-12 pr-12 py-4 bg-white border-2 border-slate-200/80 rounded-2xl text-sm text-slate-700 placeholder:text-slate-400 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 transition-all duration-300 shadow-sm hover:border-slate-300 hover:shadow-md"
//         />
//         {search && (
//           <button onClick={() => { setSearch(''); searchRef.current?.focus(); }} className="absolute inset-y-0 right-0 pr-5 flex items-center text-slate-400 hover:text-slate-600 transition-colors">
//             <div className="p-1 hover:bg-slate-100 rounded-lg transition-colors"><X size={16} /></div>
//           </button>
//         )}
//       </div>

//       {/* ══════ TABLE / LIST ══════ */}
//       {loading ? (
//         <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm"><TableSkeleton /></div>
//       ) : patients.length === 0 ? (
//         <div className="flex flex-col items-center justify-center py-24 px-6 bg-gradient-to-b from-white to-slate-50/50 rounded-3xl border-2 border-dashed border-slate-200/80">
//           <div className="w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-50 rounded-3xl flex items-center justify-center mb-6 shadow-inner">
//             <User size={44} strokeWidth={1.5} className="text-slate-300" />
//           </div>
//           <h3 className="text-xl font-bold text-slate-800">{search ? 'No results found' : 'No patients yet'}</h3>
//           <p className="text-slate-500 text-sm mt-2.5 text-center max-w-sm leading-relaxed">
//             {search ? `No patients match "${search}". Try a different search term.` : 'Get started by adding your first patient record.'}
//           </p>
//           {!search && (
//             <button onClick={() => { resetForm(); setShowForm(true); }} className="mt-8 inline-flex items-center gap-2.5 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-600/25 transition-all duration-300">
//               <UserPlus size={17} /> Add First Patient
//             </button>
//           )}
//         </div>
//       ) : (
//         <>
//           {/* ══════ Desktop Table — Grouped by Date ══════ */}
//           <div className="hidden md:block bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
//             <table className="w-full">
//               <thead>
//                 <tr className="border-b border-slate-200/80 bg-gradient-to-r from-slate-50/80 to-white">
//                   {[
//                     { key: null, label: '#', align: 'center', width: 'w-14' },
//                     { key: 'name', label: 'Patient', align: 'left' },
//                     { key: null, label: 'ID', align: 'left' },
//                     { key: null, label: 'Contact', align: 'left' },
//                     { key: null, label: 'Time', align: 'left' },
//                     { key: null, label: '', align: 'right' },
//                   ].map((col, ci) => (
//                     <th key={ci} onClick={col.key ? () => toggleSort(col.key) : undefined}
//                       className={clsx(
//                         'group/th px-4 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider',
//                         col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left',
//                         col.width,
//                         col.key && 'cursor-pointer hover:text-slate-700 select-none transition-colors duration-200'
//                       )}>
//                       <span className="inline-flex items-center gap-2">
//                         {col.label}
//                         {col.key && <SortIcon field={col.key} />}
//                       </span>
//                     </th>
//                   ))}
//                 </tr>
//               </thead>
//               <tbody>
//                 {groupedByDate.map((group) => (
//                   <React.Fragment key={group.dateStr}>
//                     {/* ── Date Header Row ── */}
//                     <tr className="bg-gradient-to-r from-slate-50 via-blue-50/30 to-slate-50 border-t border-b border-slate-200/60">
//                       <td colSpan={6} className="px-5 py-3">
//                         <div className="flex items-center gap-3">
//                           <div className={clsx(
//                             'w-8 h-8 rounded-lg flex items-center justify-center',
//                             isToday(group.dateStr) ? 'bg-emerald-100' : 'bg-blue-100'
//                           )}>
//                             <Calendar size={14} className={isToday(group.dateStr) ? 'text-emerald-600' : 'text-blue-600'} />
//                           </div>
//                           <span className="font-bold text-slate-700 text-sm">{getDateLabel(group.dateStr)}</span>
//                           {isToday(group.dateStr) && (
//                             <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200/60 uppercase tracking-wider">
//                               Live
//                             </span>
//                           )}
//                           <span className="text-[11px] text-slate-400 bg-white px-2.5 py-0.5 rounded-full font-bold border border-slate-200/60 tabular-nums">
//                             {group.patients.length} patient{group.patients.length !== 1 ? 's' : ''}
//                           </span>
//                           <div className="flex-1 h-px bg-slate-200/60" />
//                           <span className="text-[10px] text-slate-400 font-medium">
//                             {group.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
//                           </span>
//                         </div>
//                       </td>
//                     </tr>

//                     {/* ── Patient Rows ── */}
//                     {group.patients.map((patient, i) => (
//                       <tr key={patient._id} className="group hover:bg-blue-50/30 transition-colors duration-200 border-b border-slate-100/80">
//                         {/* Serial Number */}
//                         <td className="px-4 py-4 text-center">
//                           <span className="w-7 h-7 rounded-lg bg-slate-100 text-slate-500 text-xs font-bold inline-flex items-center justify-center tabular-nums group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
//                             {i + 1}
//                           </span>
//                         </td>
//                         {/* Patient */}
//                         <td className="px-4 py-4">
//                           <div className="flex items-center gap-3.5">
//                             <div className={clsx(
//                               'w-10 h-10 rounded-xl bg-gradient-to-br flex-shrink-0 flex items-center justify-center text-white text-xs font-bold shadow-md',
//                               avatarColors[getColorIndex(patient.name)]
//                             )}>
//                               {getInitials(patient.name)}
//                             </div>
//                             <div>
//                               <p className="font-bold text-slate-800 text-[14px]">{patient.name}</p>
//                               <p className="text-xs text-slate-400 mt-0.5 font-medium">
//                                 {patient.age} yrs &middot; {patient.sex}
//                                 {patient.procedureType && (
//                                   <span className="ml-2 inline-flex items-center gap-1 text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded font-semibold border border-blue-100">
//                                     <Stethoscope size={9} />
//                                     {patient.procedureType.length > 20 ? patient.procedureType.substring(0, 20) + '…' : patient.procedureType}
//                                   </span>
//                                 )}
//                               </p>
//                             </div>
//                           </div>
//                         </td>
//                         {/* ID */}
//                         <td className="px-4 py-4">
//                           <span className="text-sm text-slate-600 font-mono bg-slate-100/80 px-2.5 py-1 rounded-lg text-xs font-semibold border border-slate-200/60">
//                             {patient.patientId}
//                           </span>
//                         </td>
//                         {/* Contact */}
//                         <td className="px-4 py-4">
//                           {patient.phone ? (
//                             <span className="inline-flex items-center gap-2 text-sm text-slate-600 font-medium">
//                               <Phone size={13} className="text-slate-400" /> {patient.phone}
//                             </span>
//                           ) : <span className="text-slate-300 text-sm">—</span>}
//                         </td>
//                         {/* Time */}
//                         <td className="px-4 py-4">
//                           <span className="inline-flex items-center gap-1.5 text-sm text-slate-500 font-medium">
//                             <Clock size={12} className="text-slate-400" />
//                             {new Date(patient.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
//                           </span>
//                         </td>
//                         {/* Actions */}
//                         <td className="px-4 py-4">
//                           <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300">
//                             <button onClick={() => navigate(`/reports/new?patient=${patient._id}`)} className="p-2 rounded-xl text-blue-600 hover:bg-blue-100 transition-all duration-200 hover:scale-105" title="Create Report"><FilePlus size={16} /></button>
//                             <button onClick={() => navigate(`/patients/${patient._id}`)} className="p-2 rounded-xl text-violet-600 hover:bg-violet-100 transition-all duration-200 hover:scale-105" title="View Profile"><Eye size={16} /></button>
//                             <button onClick={() => handleEdit(patient)} className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-all duration-200 hover:scale-105" title="Edit"><Edit size={15} /></button>
//                             <button onClick={() => handleDelete(patient._id)} className="p-2 rounded-xl text-slate-400 hover:bg-red-50 hover:text-red-600 transition-all duration-200 hover:scale-105" title="Delete"><Trash2 size={15} /></button>
//                           </div>
//                         </td>
//                       </tr>
//                     ))}
//                   </React.Fragment>
//                 ))}
//               </tbody>
//             </table>
//           </div>

//           {/* ══════ Mobile Cards — Grouped by Date ══════ */}
//           <div className="md:hidden space-y-6">
//             {groupedByDate.map((group) => (
//               <div key={group.dateStr}>
//                 {/* ── Date Header ── */}
//                 <div className="flex items-center gap-2.5 mb-3 px-1">
//                   <div className={clsx(
//                     'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
//                     isToday(group.dateStr) ? 'bg-emerald-100' : 'bg-blue-100'
//                   )}>
//                     <Calendar size={14} className={isToday(group.dateStr) ? 'text-emerald-600' : 'text-blue-600'} />
//                   </div>
//                   <div className="flex-1 min-w-0">
//                     <div className="flex items-center gap-2">
//                       <span className="font-bold text-slate-700 text-sm">{getDateLabel(group.dateStr)}</span>
//                       {isToday(group.dateStr) && (
//                         <span className="text-[9px] font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full uppercase tracking-wider">Live</span>
//                       )}
//                     </div>
//                     <p className="text-[11px] text-slate-400 font-medium">
//                       {group.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} &middot; {group.patients.length} patient{group.patients.length !== 1 ? 's' : ''}
//                     </p>
//                   </div>
//                 </div>

//                 {/* ── Patient Cards ── */}
//                 <div className="space-y-3">
//                   {group.patients.map((patient, i) => (
//                     <div key={patient._id} className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden active:scale-[0.995] transition-all duration-200 hover:shadow-md hover:border-slate-300/80">
//                       <div className="p-4 flex items-start justify-between">
//                         <div className="flex items-center gap-3 min-w-0">
//                           {/* Serial Number */}
//                           <span className="w-7 h-7 rounded-lg bg-slate-100 text-slate-500 text-xs font-bold inline-flex items-center justify-center flex-shrink-0 tabular-nums">
//                             {i + 1}
//                           </span>
//                           {/* Avatar */}
//                           <div className={clsx(
//                             'w-11 h-11 rounded-xl bg-gradient-to-br flex-shrink-0 flex items-center justify-center text-white text-sm font-bold shadow-md',
//                             avatarColors[getColorIndex(patient.name)]
//                           )}>
//                             {getInitials(patient.name)}
//                           </div>
//                           <div className="min-w-0">
//                             <h3 className="font-bold text-slate-800 text-[14px] truncate">{patient.name}</h3>
//                             <div className="flex items-center gap-2 mt-1 flex-wrap">
//                               <span className="text-xs text-slate-400 font-medium">{patient.age}Y &middot; {patient.sex}</span>
//                               <span className="text-xs text-slate-500 font-mono bg-slate-100 px-2 py-0.5 rounded-md font-semibold border border-slate-200/60">{patient.patientId}</span>
//                               {patient.procedureType && (
//                                 <span className="text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded font-semibold border border-blue-100">
//                                   {patient.procedureType.length > 15 ? patient.procedureType.substring(0, 15) + '…' : patient.procedureType}
//                                 </span>
//                               )}
//                             </div>
//                           </div>
//                         </div>
//                         <MobileActions
//                           onEdit={() => handleEdit(patient)}
//                           onDelete={() => handleDelete(patient._id)}
//                           onCreateReport={() => navigate(`/reports/new?patient=${patient._id}`)}
//                           onViewGallery={() => navigate(`/patients/${patient._id}`)}
//                         />
//                       </div>
//                       <div className="mx-4 border-t border-slate-100" />
//                       <div className="px-4 py-3 flex items-center justify-between">
//                         <div className="flex items-center gap-4 text-sm text-slate-500">
//                           {patient.phone && (
//                             <span className="inline-flex items-center gap-1.5 font-medium text-xs">
//                               <Phone size={13} className="text-slate-400" /> {patient.phone}
//                             </span>
//                           )}
//                           <span className="inline-flex items-center gap-1.5 text-xs text-slate-400 font-medium">
//                             <Clock size={12} />
//                             {new Date(patient.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
//                           </span>
//                         </div>
//                         <button
//                           onClick={() => navigate(`/reports/new?patient=${patient._id}`)}
//                           className="inline-flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-blue-50 to-blue-100/80 text-blue-600 rounded-xl text-xs font-bold hover:from-blue-100 hover:to-blue-200/80 transition-all duration-200 border border-blue-200/60"
//                         >
//                           <FilePlus size={13} /> Report
//                         </button>
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             ))}
//           </div>
//         </>
//       )}

//       {/* ══════ PATIENT FORM MODAL ══════ */}
//       {showForm && (
//         <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4" onClick={resetForm}>
//           <div className="bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl shadow-xl flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
//             <div className={clsx('px-6 py-4 flex items-center justify-between rounded-t-2xl', editingPatient ? 'bg-amber-500' : 'bg-blue-600')}>
//               <div className="flex items-center gap-3">
//                 {editingPatient ? <Edit size={20} className="text-white" /> : <UserPlus size={20} className="text-white" />}
//                 <h2 className="text-lg font-bold text-white">{editingPatient ? 'Edit Patient' : 'Register Patient'}</h2>
//               </div>
//               <button onClick={resetForm} className="text-white/80 hover:text-white p-1"><X size={20} /></button>
//             </div>

//             <div className="flex-1 overflow-y-auto px-6 py-5">
//               <form id="patientForm" onSubmit={handleSubmit} className="space-y-5">
//                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2"><User size={12} /> Basic Information</p>

//                 <div>
//                   <label className="text-xs font-semibold text-slate-600 mb-1 block">Full Name <span className="text-red-400">*</span></label>
//                   <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Patient full name" className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" required autoFocus />
//                 </div>

//                 <div className="grid grid-cols-2 gap-3">
//                   <div>
//                     <label className="text-xs font-semibold text-slate-600 mb-1 block">Age <span className="text-red-400">*</span></label>
//                     <input type="number" value={formData.age} onChange={e => setFormData({ ...formData, age: e.target.value })} placeholder="Yrs" className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" required min="0" max="150" />
//                   </div>
//                   <div>
//                     <label className="text-xs font-semibold text-slate-600 mb-1 block">Sex <span className="text-red-400">*</span></label>
//                     <select value={formData.sex} onChange={e => setFormData({ ...formData, sex: e.target.value })} className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white">
//                       <option>Male</option><option>Female</option><option>Other</option>
//                     </select>
//                   </div>
//                 </div>

//                 <div className="grid grid-cols-2 gap-3">
//                   <div>
//                     <label className="text-xs font-semibold text-slate-600 mb-1 block">Patient ID</label>
//                     <input type="text" value={formData.idNumber} onChange={e => setFormData({ ...formData, idNumber: e.target.value })} placeholder="ID" className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
//                   </div>
//                   <div>
//                     <label className="text-xs font-semibold text-slate-600 mb-1 block">Hospital/Bill Number</label>
//                     <input type="text" value={formData.billNumber} onChange={e => setFormData({ ...formData, billNumber: e.target.value })} placeholder="Bill / Receipt" className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
//                   </div>
//                 </div>

//                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 pt-2 border-t border-slate-100"><Phone size={12} /> Contact</p>

//                 <div className="grid grid-cols-2 gap-3">
//                   <div>
//                     <label className="text-xs font-semibold text-slate-600 mb-1 block">Phone</label>
//                     <input type="tel" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="Contact number" className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
//                   </div>
//                   <div>
//                     <label className="text-xs font-semibold text-slate-600 mb-1 block">Address</label>
//                     <input type="text" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} placeholder="Patient address" className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
//                   </div>
//                 </div>

//                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 pt-2 border-t border-slate-100"><Activity size={12} /> Clinical</p>

//                 <div>
//                   <label className="text-xs font-semibold text-slate-600 mb-1 block flex items-center gap-1.5"><Stethoscope size={12} className="text-blue-500" /> Procedure Type</label>
//                   <input type="text" value={formData.procedureType} onChange={e => setFormData({ ...formData, procedureType: e.target.value })} placeholder="e.g., Video GastroDuodenoscopy, Colonoscopy" className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
//                 </div>

//                 <div>
//                   <label className="text-xs font-semibold text-slate-600 mb-1 block">Indication</label>
//                   <input type="text" value={formData.indication} onChange={e => setFormData({ ...formData, indication: e.target.value })} placeholder="e.g., Dyspepsia, Acidity, GERD" className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
//                 </div>

//                 <div className="grid grid-cols-2 gap-3">
//                   <div>
//                     <label className="text-xs font-semibold text-slate-600 mb-1 block">Referred By</label>
//                     <input type="text" value={formData.referredDoc} onChange={e => setFormData({ ...formData, referredDoc: e.target.value })} placeholder="Referring doctor" className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
//                   </div>
//                   <div>
//                     <label className="text-xs font-semibold text-slate-600 mb-1 block">Performed By</label>
//                     <input type="text" value={formData.doneDoc} onChange={e => setFormData({ ...formData, doneDoc: e.target.value })} placeholder="Performing doctor" className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
//                   </div>
//                 </div>

//                 <div>
//                   <label className="text-xs font-semibold text-slate-600 mb-1 block">Remarks</label>
//                   <textarea value={formData.remark} onChange={e => setFormData({ ...formData, remark: e.target.value })} placeholder="Additional notes..." rows={2} className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none" />
//                 </div>
//               </form>
//             </div>

//             <div className="px-6 py-4 border-t border-slate-200 flex gap-3 bg-slate-50 rounded-b-2xl">
//               <button type="button" onClick={resetForm} className="flex-1 py-2.5 text-sm font-semibold text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50">Cancel</button>
//               <button type="submit" form="patientForm" disabled={submitting} className={clsx('flex-1 py-2.5 text-sm font-bold text-white rounded-lg inline-flex items-center justify-center gap-2 disabled:opacity-50', editingPatient ? 'bg-amber-500 hover:bg-amber-600' : 'bg-blue-600 hover:bg-blue-700')}>
//                 {submitting ? <><Loader2 size={16} className="animate-spin" /> Saving…</> : <><CheckCircle size={16} /> {editingPatient ? 'Update' : 'Register'}</>}
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default PatientList;


import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { getImageURL } from '../../utils/api';
import {
  Search, Plus, User, Phone, Calendar, ArrowRight,
  Edit, Trash2, X, MoreVertical, FilePlus, Image as ImageIcon,
  MapPin, FileText, ExternalLink, Maximize2, Download,
  ChevronLeft, ChevronRight, Filter, SortAsc, SortDesc,
  Clock, Hash, Activity, Eye, ZoomIn, ChevronDown,
  UserPlus, AlertCircle, CheckCircle, Loader2, ArrowUpDown,
  Stethoscope, Users, CalendarDays
} from 'lucide-react';
import toast from 'react-hot-toast';
import clsx from 'clsx';

/* ═══════════════════════════════════════════════════════════════════
   ✅ NEW: AUTOCOMPLETE INPUT — Saves & suggests past entries
   ═══════════════════════════════════════════════════════════════════ */
const AutocompleteInput = ({ value, onChange, storageKey, placeholder, className }) => {
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const ref = useRef(null);

  // Load suggestions from localStorage
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(`endo_${storageKey}`) || '[]');
      setSuggestions(Array.isArray(saved) ? saved : []);
    } catch { setSuggestions([]); }
  }, [storageKey]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const filtered = suggestions.filter(s =>
    s.toLowerCase().includes((value || '').toLowerCase()) && s.toLowerCase() !== (value || '').toLowerCase()
  );

  const handleSelect = (val) => {
    onChange(val);
    setOpen(false);
  };

  const handleDelete = (e, val) => {
    e.stopPropagation();
    const updated = suggestions.filter(s => s !== val);
    setSuggestions(updated);
    localStorage.setItem(`endo_${storageKey}`, JSON.stringify(updated));
    toast.success(`Removed "${val}"`, { duration: 1500 });
  };

  // Static method to save a new value
  AutocompleteInput.save = (key, val) => {
    if (!val || !val.trim()) return;
    const trimmed = val.trim();
    try {
      const existing = JSON.parse(localStorage.getItem(`endo_${key}`) || '[]');
      if (!existing.includes(trimmed)) {
        const updated = [trimmed, ...existing].slice(0, 50); // max 50
        localStorage.setItem(`endo_${key}`, JSON.stringify(updated));
      }
    } catch { }
  };

  return (
    <div className="relative" ref={ref}>
      <input
        type="text"
        value={value}
        onChange={e => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        className={className || "w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"}
      />

      {open && (filtered.length > 0 || (suggestions.length > 0 && !value)) && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl shadow-slate-200/50 max-h-48 overflow-y-auto">
          {/* Show all suggestions when empty, filtered when typing */}
          {(value ? filtered : suggestions).slice(0, 15).map((s, i) => (
            <div
              key={i}
              className="flex items-center justify-between px-3 py-2.5 hover:bg-blue-50 cursor-pointer group border-b border-slate-50 last:border-0"
            >
              <span
                onClick={() => handleSelect(s)}
                className="flex-1 text-sm text-slate-700 font-medium truncate"
              >
                {s}
              </span>
              <button
                onClick={(e) => handleDelete(e, s)}
                className="p-1 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0 ml-2"
                title="Remove suggestion"
              >
                <X size={12} />
              </button>
            </div>
          ))}
          {value && filtered.length === 0 && suggestions.length > 0 && (
            <div className="px-3 py-2.5 text-xs text-slate-400 text-center">No matches — will be saved as new</div>
          )}
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   LIGHTBOX — full-screen image viewer (UNCHANGED)
   ═══════════════════════════════════════════════════════════════════ */
const Lightbox = ({ image, onClose, images, onNavigate }) => {
  if (!image) return null;
  const imageUrl = getImageURL(image.path);
  const currentIndex = images?.findIndex(i => i.path === image.path) ?? -1;

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && currentIndex > 0) onNavigate(images[currentIndex - 1]);
      if (e.key === 'ArrowRight' && currentIndex < images.length - 1) onNavigate(images[currentIndex + 1]);
    };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [currentIndex, images, onClose, onNavigate]);

  return (
    <div className="fixed inset-0 z-[100] bg-black/98 backdrop-blur-3xl flex flex-col items-center justify-center animate-in fade-in duration-200" onClick={onClose}>
      <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-black/80 via-black/40 to-transparent z-10 flex items-center justify-between px-8">
        <div className="text-white/60 text-sm font-medium tracking-wide">
          {currentIndex >= 0 && (
            <span className="bg-white/10 px-3.5 py-1.5 rounded-full backdrop-blur-sm border border-white/10">
              {currentIndex + 1} <span className="text-white/40">of</span> {images.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <a href={imageUrl} download target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} className="p-3 bg-white/[0.08] hover:bg-white/[0.15] border border-white/[0.08] rounded-2xl text-white/80 hover:text-white transition-all duration-300" title="Download"><Download size={18} /></a>
          <button onClick={onClose} className="p-3 bg-white/[0.08] hover:bg-white/[0.15] border border-white/[0.08] rounded-2xl text-white/80 hover:text-white transition-all duration-300"><X size={18} /></button>
        </div>
      </div>
      {currentIndex > 0 && (<button onClick={e => { e.stopPropagation(); onNavigate(images[currentIndex - 1]); }} className="absolute left-6 top-1/2 -translate-y-1/2 z-10 p-4 bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] rounded-2xl text-white/70 hover:text-white transition-all duration-300 backdrop-blur-sm hover:scale-105"><ChevronLeft size={22} /></button>)}
      {currentIndex < images.length - 1 && (<button onClick={e => { e.stopPropagation(); onNavigate(images[currentIndex + 1]); }} className="absolute right-6 top-1/2 -translate-y-1/2 z-10 p-4 bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] rounded-2xl text-white/70 hover:text-white transition-all duration-300 backdrop-blur-sm hover:scale-105"><ChevronRight size={22} /></button>)}
      <div className="relative max-w-[88vw] max-h-[78vh]" onClick={e => e.stopPropagation()}>
        <img src={imageUrl} alt={image.caption || 'Medical image'} className="max-w-full max-h-[78vh] rounded-2xl shadow-2xl shadow-black/50 object-contain select-none ring-1 ring-white/10" draggable={false} />
      </div>
      <div className="mt-8 text-center text-white px-6" onClick={e => e.stopPropagation()}>
        <p className="font-semibold text-lg tracking-tight">{image.taggedOrgan || 'Untagged'}</p>
        <p className="text-white/40 text-sm mt-1.5 font-medium">{image.caption || 'No caption'} &middot; {new Date(image.procedureDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   SKELETON LOADERS (UNCHANGED)
   ═══════════════════════════════════════════════════════════════════ */
const GallerySkeleton = () => (
  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
    {[...Array(10)].map((_, i) => (<div key={i} className="aspect-square bg-gradient-to-br from-slate-100 via-slate-50 to-slate-100 rounded-2xl animate-pulse" style={{ animationDelay: `${i * 80}ms` }} />))}
  </div>
);

const TableSkeleton = () => (
  <div className="space-y-0">
    {[...Array(6)].map((_, i) => (
      <div key={i} className="flex items-center gap-4 px-6 py-5 border-b border-slate-50 animate-pulse" style={{ animationDelay: `${i * 100}ms` }}>
        <div className="w-8 h-8 bg-slate-200 rounded-lg shrink-0" />
        <div className="w-11 h-11 bg-gradient-to-br from-slate-200 to-slate-100 rounded-xl shrink-0" />
        <div className="flex-1 space-y-2.5"><div className="h-4 bg-slate-200/80 rounded-lg w-1/3" /><div className="h-3 bg-slate-100 rounded-lg w-1/5" /></div>
        <div className="h-4 bg-slate-100 rounded-lg w-20 hidden sm:block" />
        <div className="h-4 bg-slate-100 rounded-lg w-24 hidden sm:block" />
      </div>
    ))}
  </div>
);

/* ═══════════════════════════════════════════════════════════════════
   PATIENT GALLERY MODAL (UNCHANGED)
   ═══════════════════════════════════════════════════════════════════ */
const PatientGalleryModal = ({ patient, onClose }) => {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [activeTab, setActiveTab] = useState('gallery');
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => { document.body.style.overflow = 'hidden'; return () => { document.body.style.overflow = ''; }; }, []);
  useEffect(() => {
    (async () => {
      try { const { data } = await api.get(`/reports?patient=${patient._id}&limit=100`); setReports(data.reports || []); }
      catch { toast.error('Failed to load history'); }
      finally { setTimeout(() => setLoading(false), 400); }
    })();
  }, [patient._id]);

  const galleryImages = React.useMemo(() => {
    const all = [];
    reports.forEach(r => { (r.images || []).forEach(img => { all.push({ ...img, procedureDate: r.procedureDate, procedureName: r.procedureName, reportId: r._id }); }); });
    return all.sort((a, b) => new Date(b.procedureDate) - new Date(a.procedureDate));
  }, [reports]);

  const getInitials = n => n.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();

  return (
    <>
      {selectedImage && <Lightbox image={selectedImage} images={galleryImages} onClose={() => setSelectedImage(null)} onNavigate={setSelectedImage} />}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-0 sm:p-6">
        <div className="bg-white w-full h-full sm:h-[92vh] sm:max-w-5xl sm:rounded-3xl shadow-2xl shadow-black/20 overflow-hidden flex flex-col animate-in slide-in-from-bottom-4 fade-in duration-300">
          <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-8 py-7 text-white shrink-0 overflow-hidden">
            <div className="absolute inset-0 opacity-30"><div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" /><div className="absolute bottom-0 left-0 w-64 h-64 bg-violet-500/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" /></div>
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 border-2 border-white/20 flex items-center justify-center text-xl font-bold shadow-lg shadow-blue-500/30">{getInitials(patient.name)}</div>
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">{patient.name}</h2>
                  <div className="flex flex-wrap gap-2.5 mt-2">
                    <span className="inline-flex items-center gap-1.5 text-xs text-white/80 bg-white/[0.08] border border-white/[0.06] px-3 py-1.5 rounded-lg font-medium backdrop-blur-sm"><User size={12} /> {patient.age}Y / {patient.sex}</span>
                    <span className="inline-flex items-center gap-1.5 text-xs text-white/80 bg-white/[0.08] border border-white/[0.06] px-3 py-1.5 rounded-lg font-mono backdrop-blur-sm"><Hash size={12} /> {patient.patientId}</span>
                    {patient.phone && <span className="inline-flex items-center gap-1.5 text-xs text-white/80 bg-white/[0.08] border border-white/[0.06] px-3 py-1.5 rounded-lg font-medium backdrop-blur-sm"><Phone size={12} /> {patient.phone}</span>}
                  </div>
                </div>
              </div>
              <button onClick={onClose} className="p-3 bg-white/[0.08] hover:bg-white/[0.15] border border-white/[0.06] rounded-2xl transition-all duration-300"><X size={18} /></button>
            </div>
          </div>
          <div className="px-8 bg-white border-b border-slate-200/80 shrink-0">
            <div className="flex gap-2">
              {[{ id: 'gallery', label: 'Gallery', icon: ImageIcon, count: galleryImages.length }, { id: 'reports', label: 'Reports', icon: FileText, count: reports.length }].map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={clsx('relative flex items-center gap-2.5 px-5 py-4 text-sm font-semibold transition-all duration-300', activeTab === tab.id ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600')}>
                  <tab.icon size={16} />{tab.label}
                  <span className={clsx('text-[11px] min-w-[28px] text-center px-2 py-0.5 rounded-full font-bold tabular-nums', activeTab === tab.id ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500')}>{tab.count}</span>
                  {activeTab === tab.id && <span className="absolute bottom-0 left-3 right-3 h-[3px] bg-blue-600 rounded-full" />}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-gradient-to-b from-slate-50/80 to-white">
            {loading ? (activeTab === 'gallery' ? <GallerySkeleton /> : <TableSkeleton />) : (
              <>
                {activeTab === 'gallery' && (galleryImages.length === 0 ? (
                  <div className="h-72 flex flex-col items-center justify-center text-slate-400"><div className="w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-50 rounded-3xl flex items-center justify-center mb-5 shadow-inner"><ImageIcon size={40} strokeWidth={1.5} className="text-slate-300" /></div><p className="font-bold text-slate-700 text-lg">No images yet</p><p className="text-sm mt-1.5 text-slate-400">Images from reports will appear here</p></div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {galleryImages.map((img, idx) => (
                      <div key={idx} onClick={() => setSelectedImage(img)} className="group relative aspect-square rounded-2xl overflow-hidden cursor-pointer bg-slate-100 ring-1 ring-black/[0.06] hover:ring-2 hover:ring-blue-300/60 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10">
                        <img src={getImageURL(img.path)} className="w-full h-full object-cover transition-all duration-700 ease-out group-hover:scale-110" alt={img.caption} loading="lazy" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-400" />
                        <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-3 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-400"><p className="text-white text-sm font-bold truncate">{img.taggedOrgan || 'Untagged'}</p><p className="text-white/50 text-xs mt-1 font-medium">{new Date(img.procedureDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p></div>
                        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 scale-75 group-hover:scale-100"><div className="p-2.5 bg-white/20 backdrop-blur-xl rounded-xl text-white border border-white/10"><ZoomIn size={15} /></div></div>
                      </div>
                    ))}
                  </div>
                ))}
                {activeTab === 'reports' && (reports.length === 0 ? (
                  <div className="h-72 flex flex-col items-center justify-center text-slate-400"><div className="w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-50 rounded-3xl flex items-center justify-center mb-5 shadow-inner"><FileText size={40} strokeWidth={1.5} className="text-slate-300" /></div><p className="font-bold text-slate-700 text-lg">No reports found</p><p className="text-sm mt-1.5 text-slate-400">Create a report to get started</p></div>
                ) : (
                  <div className="space-y-3">
                    {reports.map(rep => (
                      <div key={rep._id} onClick={() => navigate(`/reports/${rep._id}/print`)} className="group bg-white rounded-2xl border border-slate-200/80 hover:border-blue-200/80 p-5 flex items-center gap-5 cursor-pointer transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/[0.06] hover:-translate-y-0.5">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 group-hover:from-blue-50 group-hover:to-blue-100 flex items-center justify-center transition-all duration-300 border border-slate-200/60 group-hover:border-blue-200/60"><FileText size={20} className="text-slate-400 group-hover:text-blue-500 transition-colors duration-300" /></div>
                        <div className="flex-1 min-w-0"><p className="font-bold text-slate-800 truncate text-[15px]">{rep.procedureName}</p><p className="text-xs text-slate-400 mt-1 flex items-center gap-2 font-medium"><Calendar size={12} />{new Date(rep.procedureDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}{rep.images?.length > 0 && (<><span className="w-1 h-1 rounded-full bg-slate-300" /><ImageIcon size={12} />{rep.images.length} image{rep.images.length > 1 ? 's' : ''}</>)}</p></div>
                        <span className={clsx('hidden sm:inline-flex px-3.5 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider border', rep.status === 'finalized' ? 'bg-emerald-50 text-emerald-600 border-emerald-200/60' : 'bg-amber-50 text-amber-600 border-amber-200/60')}>{rep.status}</span>
                        <div className="w-9 h-9 rounded-xl bg-slate-50 group-hover:bg-blue-50 flex items-center justify-center transition-all duration-300"><ArrowRight size={16} className="text-slate-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all duration-300" /></div>
                      </div>
                    ))}
                  </div>
                ))}
              </>
            )}
          </div>
          <div className="bg-white border-t border-slate-200/80 px-8 py-5 flex items-center justify-between gap-3 shrink-0">
            <button onClick={onClose} className="px-6 py-3 text-sm font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all duration-200">Close</button>
            <button onClick={() => navigate(`/reports/new?patient=${patient._id}`)} className="inline-flex items-center gap-2.5 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-600/25 transition-all duration-300 hover:shadow-xl hover:shadow-blue-600/35 active:scale-[0.97]"><FilePlus size={17} /> New Report</button>
          </div>
        </div>
      </div>
    </>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   MOBILE ACTION MENU (UNCHANGED)
   ═══════════════════════════════════════════════════════════════════ */
const MobileActions = ({ onEdit, onDelete, onCreateReport, onViewGallery }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const close = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button onClick={e => { e.stopPropagation(); setOpen(o => !o); }} className={clsx('p-2.5 rounded-xl transition-all duration-200', open ? 'bg-slate-200 text-slate-700' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100')}><MoreVertical size={18} /></button>
      {open && (
        <div className="absolute right-0 top-full mt-2.5 w-56 bg-white rounded-2xl shadow-2xl shadow-slate-300/40 border border-slate-200/80 z-30 py-2 overflow-hidden animate-in slide-in-from-top-2 fade-in duration-200">
          <button onClick={() => { onCreateReport(); setOpen(false); }} className="w-full flex items-center gap-3 px-5 py-3 text-sm font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-all duration-200"><div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center"><FilePlus size={15} className="text-blue-500" /></div>Create Report</button>
          <button onClick={() => { onViewGallery(); setOpen(false); }} className="w-full flex items-center gap-3 px-5 py-3 text-sm font-medium text-slate-700 hover:bg-violet-50 hover:text-violet-700 transition-all duration-200"><div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center"><ImageIcon size={15} className="text-violet-500" /></div>View Gallery</button>
          <div className="my-2 mx-4 border-t border-slate-100" />
          <button onClick={() => { onEdit(); setOpen(false); }} className="w-full flex items-center gap-3 px-5 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-all duration-200"><div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center"><Edit size={15} className="text-slate-500" /></div>Edit Details</button>
          <button onClick={() => { onDelete(); setOpen(false); }} className="w-full flex items-center gap-3 px-5 py-3 text-sm font-medium text-red-600 hover:bg-red-50 transition-all duration-200"><div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center"><Trash2 size={15} className="text-red-500" /></div>Delete Patient</button>
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   MAIN — PatientList
   ═══════════════════════════════════════════════════════════════════ */
const PatientList = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);
  const [sortField, setSortField] = useState('createdAt');
  const [sortDir, setSortDir] = useState('desc');
  const [settings, setSettings] = useState(null);
  const [formData, setFormData] = useState({
    name: '', age: '', sex: 'Male', phone: '', address: '',
    idNumber: '', billNumber: '',
    indication: '', referredDoc: '', doneDoc: '', remark: '',
    procedureType: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    (async () => {
      try { const { data } = await api.get('/settings'); setSettings(data); } catch { }
    })();
  }, []);

  useEffect(() => {
    const t = setTimeout(fetchPatients, 300);
    return () => clearTimeout(t);
  }, [search]);

  const fetchPatients = async () => {
    setLoading(true);
    try { const { data } = await api.get(`/patients?search=${search}`); setPatients(data.patients); }
    catch { toast.error('Failed to load patients'); }
    finally { setLoading(false); }
  };

  const getDateLabel = (dateStr) => {
    const d = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' });
  };

  const isToday = (dateStr) => new Date(dateStr).toDateString() === new Date().toDateString();

  const todayCount = React.useMemo(() =>
    patients.filter(p => new Date(p.createdAt).toDateString() === new Date().toDateString()).length,
    [patients]
  );

  const groupedByDate = React.useMemo(() => {
    const groups = {};
    patients.forEach(patient => {
      const dateKey = new Date(patient.createdAt).toDateString();
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(patient);
    });
    Object.values(groups).forEach(group => {
      group.sort((a, b) => {
        let av, bv;
        if (sortField === 'name') { av = a.name.toLowerCase(); bv = b.name.toLowerCase(); }
        else if (sortField === 'age') { av = a.age || 0; bv = b.age || 0; }
        else { av = new Date(a.createdAt); bv = new Date(b.createdAt); }
        if (av < bv) return sortDir === 'asc' ? -1 : 1;
        if (av > bv) return sortDir === 'asc' ? 1 : -1;
        return 0;
      });
    });
    return Object.entries(groups)
      .map(([dateStr, pts]) => ({ dateStr, date: new Date(dateStr), patients: pts }))
      .sort((a, b) => b.date - a.date);
  }, [patients, sortField, sortDir]);

  const toggleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <ArrowUpDown size={13} className="text-slate-300 group-hover/th:text-slate-400 transition-colors" />;
    return sortDir === 'asc' ? <SortAsc size={13} className="text-blue-600" /> : <SortDesc size={13} className="text-blue-600" />;
  };

  /* ✅ CHANGED: handleSubmit now saves autocomplete suggestions */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return toast.error('Name is required');
    if (!formData.age) return toast.error('Age is required');
    setSubmitting(true);
    try {
      const birthYear = new Date().getFullYear() - parseInt(formData.age);
      const payload = { ...formData, dateOfBirth: new Date(birthYear, 0, 1) };
      if (editingPatient) {
        await api.put(`/patients/${editingPatient._id}`, payload);
        toast.success('Patient updated successfully');
      } else {
        await api.post('/patients', payload);
        toast.success('Patient added successfully');
      }

      // ✅ NEW: Save values to autocomplete suggestions
      AutocompleteInput.save('procedureType', formData.procedureType);
      AutocompleteInput.save('indication', formData.indication);
      AutocompleteInput.save('referredDoc', formData.referredDoc);
      AutocompleteInput.save('doneDoc', formData.doneDoc);

      resetForm();
      fetchPatients();
    } catch { toast.error('Operation failed'); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this patient and all their data? This cannot be undone.')) return;
    try { await api.delete(`/patients/${id}`); toast.success('Patient deleted'); fetchPatients(); }
    catch { toast.error('Delete failed'); }
  };

  const handleEdit = (patient) => {
    setEditingPatient(patient);
    const age = patient.dateOfBirth ? new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear() : patient.age || '';
    setFormData({
      name: patient.name, age, sex: patient.sex,
      phone: patient.phone || '', address: patient.address || '',
      idNumber: patient.idNumber || '', billNumber: patient.billNumber || '',
      indication: patient.indication || '', referredDoc: patient.referredDoc || '',
      doneDoc: patient.doneDoc || '', remark: patient.remark || '',
      procedureType: patient.procedureType || ''
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingPatient(null);
    setFormData({
      name: '', age: '', sex: 'Male', phone: '', address: '',
      idNumber: '', billNumber: '',
      indication: '', referredDoc: '', doneDoc: '', remark: '',
      procedureType: ''
    });
  };

  const getInitials = n => n.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
  const getColorIndex = (name) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return Math.abs(hash) % avatarColors.length;
  };
  const avatarColors = [
    'from-blue-500 to-indigo-600', 'from-emerald-500 to-teal-600',
    'from-violet-500 to-purple-600', 'from-amber-500 to-orange-600',
    'from-pink-500 to-rose-600', 'from-cyan-500 to-blue-600',
    'from-indigo-500 to-violet-600',
  ];

  return (
    <div className="space-y-6 pb-24 sm:pb-0">

      {/* ══════ HEADER ══════ */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20"><User size={20} className="text-white" /></div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Patients</h1>
          </div>
          {!loading && patients.length > 0 && (
            <div className="flex items-center gap-2.5 ml-[52px] mt-1.5">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-slate-100 text-slate-600 px-3 py-1.5 rounded-full border border-slate-200/60"><Users size={13} className="text-slate-400" />{patients.length} <span className="text-slate-400 font-medium">total</span></span>
              <span className={clsx('inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border', todayCount > 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60' : 'bg-slate-50 text-slate-400 border-slate-200/60')}>
                <CalendarDays size={13} className={todayCount > 0 ? 'text-emerald-500' : 'text-slate-300'} />{todayCount} <span className={todayCount > 0 ? 'text-emerald-500 font-medium' : 'text-slate-400 font-medium'}>today</span>
              </span>
            </div>
          )}
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-600/25 transition-all duration-300 hover:shadow-xl hover:shadow-blue-600/35 active:scale-[0.97] group">
          <UserPlus size={18} className="group-hover:scale-110 transition-transform duration-200" />Add Patient
        </button>
      </div>

      {/* ══════ SEARCH BAR ══════ */}
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none"><Search size={18} className="text-slate-400 group-focus-within:text-blue-500 transition-colors duration-300" /></div>
        <input ref={searchRef} type="text" placeholder="Search patients by name, ID, or phone…" value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-12 pr-12 py-4 bg-white border-2 border-slate-200/80 rounded-2xl text-sm text-slate-700 placeholder:text-slate-400 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 transition-all duration-300 shadow-sm hover:border-slate-300 hover:shadow-md" />
        {search && (
          <button onClick={() => { setSearch(''); searchRef.current?.focus(); }} className="absolute inset-y-0 right-0 pr-5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"><div className="p-1 hover:bg-slate-100 rounded-lg transition-colors"><X size={16} /></div></button>
        )}
      </div>

      {/* ══════ TABLE / LIST ══════ */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm"><TableSkeleton /></div>
      ) : patients.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 px-6 bg-gradient-to-b from-white to-slate-50/50 rounded-3xl border-2 border-dashed border-slate-200/80">
          <div className="w-24 h-24 bg-gradient-to-br from-slate-100 to-slate-50 rounded-3xl flex items-center justify-center mb-6 shadow-inner"><User size={44} strokeWidth={1.5} className="text-slate-300" /></div>
          <h3 className="text-xl font-bold text-slate-800">{search ? 'No results found' : 'No patients yet'}</h3>
          <p className="text-slate-500 text-sm mt-2.5 text-center max-w-sm leading-relaxed">{search ? `No patients match "${search}".` : 'Get started by adding your first patient record.'}</p>
          {!search && (<button onClick={() => { resetForm(); setShowForm(true); }} className="mt-8 inline-flex items-center gap-2.5 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-600/25 transition-all duration-300"><UserPlus size={17} /> Add First Patient</button>)}
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200/80 bg-gradient-to-r from-slate-50/80 to-white">
                  {[{ key: null, label: '#', align: 'center', width: 'w-14' }, { key: 'name', label: 'Patient', align: 'left' }, { key: null, label: 'ID', align: 'left' }, { key: null, label: 'Contact', align: 'left' }, { key: null, label: 'Time', align: 'left' }, { key: null, label: '', align: 'right' }].map((col, ci) => (
                    <th key={ci} onClick={col.key ? () => toggleSort(col.key) : undefined} className={clsx('group/th px-4 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider', col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left', col.width, col.key && 'cursor-pointer hover:text-slate-700 select-none transition-colors duration-200')}>
                      <span className="inline-flex items-center gap-2">{col.label}{col.key && <SortIcon field={col.key} />}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {groupedByDate.map((group) => (
                  <React.Fragment key={group.dateStr}>
                    <tr className="bg-gradient-to-r from-slate-50 via-blue-50/30 to-slate-50 border-t border-b border-slate-200/60">
                      <td colSpan={6} className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className={clsx('w-8 h-8 rounded-lg flex items-center justify-center', isToday(group.dateStr) ? 'bg-emerald-100' : 'bg-blue-100')}><Calendar size={14} className={isToday(group.dateStr) ? 'text-emerald-600' : 'text-blue-600'} /></div>
                          <span className="font-bold text-slate-700 text-sm">{getDateLabel(group.dateStr)}</span>
                          {isToday(group.dateStr) && <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200/60 uppercase tracking-wider">Live</span>}
                          <span className="text-[11px] text-slate-400 bg-white px-2.5 py-0.5 rounded-full font-bold border border-slate-200/60 tabular-nums">{group.patients.length} patient{group.patients.length !== 1 ? 's' : ''}</span>
                          <div className="flex-1 h-px bg-slate-200/60" />
                          <span className="text-[10px] text-slate-400 font-medium">{group.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </div>
                      </td>
                    </tr>
                    {group.patients.map((patient, i) => (
                      <tr key={patient._id} className="group hover:bg-blue-50/30 transition-colors duration-200 border-b border-slate-100/80">
                        <td className="px-4 py-4 text-center"><span className="w-7 h-7 rounded-lg bg-slate-100 text-slate-500 text-xs font-bold inline-flex items-center justify-center tabular-nums group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">{i + 1}</span></td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3.5">
                            <div className={clsx('w-10 h-10 rounded-xl bg-gradient-to-br flex-shrink-0 flex items-center justify-center text-white text-xs font-bold shadow-md', avatarColors[getColorIndex(patient.name)])}>{getInitials(patient.name)}</div>
                            <div>
                              <p className="font-bold text-slate-800 text-[14px]">{patient.name}</p>
                              <p className="text-xs text-slate-400 mt-0.5 font-medium">{patient.age} yrs &middot; {patient.sex}
                                {patient.procedureType && (<span className="ml-2 inline-flex items-center gap-1 text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded font-semibold border border-blue-100"><Stethoscope size={9} />{patient.procedureType.length > 20 ? patient.procedureType.substring(0, 20) + '…' : patient.procedureType}</span>)}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4"><span className="text-sm text-slate-600 font-mono bg-slate-100/80 px-2.5 py-1 rounded-lg text-xs font-semibold border border-slate-200/60">{patient.patientId}</span></td>
                        <td className="px-4 py-4">{patient.phone ? (<span className="inline-flex items-center gap-2 text-sm text-slate-600 font-medium"><Phone size={13} className="text-slate-400" /> {patient.phone}</span>) : <span className="text-slate-300 text-sm">—</span>}</td>
                        <td className="px-4 py-4"><span className="inline-flex items-center gap-1.5 text-sm text-slate-500 font-medium"><Clock size={12} className="text-slate-400" />{new Date(patient.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}</span></td>
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300">
                            <button onClick={() => navigate(`/reports/new?patient=${patient._id}`)} className="p-2 rounded-xl text-blue-600 hover:bg-blue-100 transition-all duration-200 hover:scale-105" title="Create Report"><FilePlus size={16} /></button>
                            <button onClick={() => navigate(`/patients/${patient._id}`)} className="p-2 rounded-xl text-violet-600 hover:bg-violet-100 transition-all duration-200 hover:scale-105" title="View Profile"><Eye size={16} /></button>
                            <button onClick={() => handleEdit(patient)} className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-all duration-200 hover:scale-105" title="Edit"><Edit size={15} /></button>
                            <button onClick={() => handleDelete(patient._id)} className="p-2 rounded-xl text-slate-400 hover:bg-red-50 hover:text-red-600 transition-all duration-200 hover:scale-105" title="Delete"><Trash2 size={15} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-6">
            {groupedByDate.map((group) => (
              <div key={group.dateStr}>
                <div className="flex items-center gap-2.5 mb-3 px-1">
                  <div className={clsx('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', isToday(group.dateStr) ? 'bg-emerald-100' : 'bg-blue-100')}><Calendar size={14} className={isToday(group.dateStr) ? 'text-emerald-600' : 'text-blue-600'} /></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2"><span className="font-bold text-slate-700 text-sm">{getDateLabel(group.dateStr)}</span>{isToday(group.dateStr) && <span className="text-[9px] font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full uppercase tracking-wider">Live</span>}</div>
                    <p className="text-[11px] text-slate-400 font-medium">{group.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} &middot; {group.patients.length} patient{group.patients.length !== 1 ? 's' : ''}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {group.patients.map((patient, i) => (
                    <div key={patient._id} className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden active:scale-[0.995] transition-all duration-200 hover:shadow-md hover:border-slate-300/80">
                      <div className="p-4 flex items-start justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="w-7 h-7 rounded-lg bg-slate-100 text-slate-500 text-xs font-bold inline-flex items-center justify-center flex-shrink-0 tabular-nums">{i + 1}</span>
                          <div className={clsx('w-11 h-11 rounded-xl bg-gradient-to-br flex-shrink-0 flex items-center justify-center text-white text-sm font-bold shadow-md', avatarColors[getColorIndex(patient.name)])}>{getInitials(patient.name)}</div>
                          <div className="min-w-0">
                            <h3 className="font-bold text-slate-800 text-[14px] truncate">{patient.name}</h3>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <span className="text-xs text-slate-400 font-medium">{patient.age}Y &middot; {patient.sex}</span>
                              <span className="text-xs text-slate-500 font-mono bg-slate-100 px-2 py-0.5 rounded-md font-semibold border border-slate-200/60">{patient.patientId}</span>
                              {patient.procedureType && (<span className="text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded font-semibold border border-blue-100">{patient.procedureType.length > 15 ? patient.procedureType.substring(0, 15) + '…' : patient.procedureType}</span>)}
                            </div>
                          </div>
                        </div>
                        <MobileActions onEdit={() => handleEdit(patient)} onDelete={() => handleDelete(patient._id)} onCreateReport={() => navigate(`/reports/new?patient=${patient._id}`)} onViewGallery={() => navigate(`/patients/${patient._id}`)} />
                      </div>
                      <div className="mx-4 border-t border-slate-100" />
                      <div className="px-4 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm text-slate-500">
                          {patient.phone && (<span className="inline-flex items-center gap-1.5 font-medium text-xs"><Phone size={13} className="text-slate-400" /> {patient.phone}</span>)}
                          <span className="inline-flex items-center gap-1.5 text-xs text-slate-400 font-medium"><Clock size={12} />{new Date(patient.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
                        </div>
                        <button onClick={() => navigate(`/reports/new?patient=${patient._id}`)} className="inline-flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-blue-50 to-blue-100/80 text-blue-600 rounded-xl text-xs font-bold hover:from-blue-100 hover:to-blue-200/80 transition-all duration-200 border border-blue-200/60"><FilePlus size={13} /> Report</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ══════ PATIENT FORM MODAL ══════ */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4" onClick={resetForm}>
          <div className="bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl shadow-xl flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <div className={clsx('px-6 py-4 flex items-center justify-between rounded-t-2xl', editingPatient ? 'bg-amber-500' : 'bg-blue-600')}>
              <div className="flex items-center gap-3">
                {editingPatient ? <Edit size={20} className="text-white" /> : <UserPlus size={20} className="text-white" />}
                <h2 className="text-lg font-bold text-white">{editingPatient ? 'Edit Patient' : 'Register Patient'}</h2>
              </div>
              <button onClick={resetForm} className="text-white/80 hover:text-white p-1"><X size={20} /></button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5">
              <form id="patientForm" onSubmit={handleSubmit} className="space-y-5">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2"><User size={12} /> Basic Information</p>

                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">Full Name <span className="text-red-400">*</span></label>
                  <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Patient full name" className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" required autoFocus />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1 block">Age <span className="text-red-400">*</span></label>
                    <input type="number" value={formData.age} onChange={e => setFormData({ ...formData, age: e.target.value })} placeholder="Yrs" className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" required min="0" max="150" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1 block">Sex <span className="text-red-400">*</span></label>
                    <select value={formData.sex} onChange={e => setFormData({ ...formData, sex: e.target.value })} className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white">
                      <option>Male</option><option>Female</option><option>Other</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1 block">Patient ID</label>
                    <input type="text" value={formData.idNumber} onChange={e => setFormData({ ...formData, idNumber: e.target.value })} placeholder="ID" className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1 block">Hospital/Bill Number</label>
                    <input type="text" value={formData.billNumber} onChange={e => setFormData({ ...formData, billNumber: e.target.value })} placeholder="Bill / Receipt" className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                  </div>
                </div>

                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 pt-2 border-t border-slate-100"><Phone size={12} /> Contact</p>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1 block">Phone</label>
                    <input type="tel" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="Contact number" className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1 block">Address</label>
                    <input type="text" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} placeholder="Patient address" className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                  </div>
                </div>

                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 pt-2 border-t border-slate-100"><Activity size={12} /> Clinical</p>

                {/* ✅ CHANGED: 4 fields now use AutocompleteInput */}
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block flex items-center gap-1.5"><Stethoscope size={12} className="text-blue-500" /> Procedure Type</label>
                  <AutocompleteInput
                    value={formData.procedureType}
                    onChange={(val) => setFormData({ ...formData, procedureType: val })}
                    storageKey="procedureType"
                    placeholder="e.g., Video GastroDuodenoscopy, Colonoscopy"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">Indication</label>
                  <AutocompleteInput
                    value={formData.indication}
                    onChange={(val) => setFormData({ ...formData, indication: val })}
                    storageKey="indication"
                    placeholder="e.g., Dyspepsia, Acidity, GERD"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1 block">Referred By</label>
                    <AutocompleteInput
                      value={formData.referredDoc}
                      onChange={(val) => setFormData({ ...formData, referredDoc: val })}
                      storageKey="referredDoc"
                      placeholder="Referring doctor"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1 block">Performed By</label>
                    <AutocompleteInput
                      value={formData.doneDoc}
                      onChange={(val) => setFormData({ ...formData, doneDoc: val })}
                      storageKey="doneDoc"
                      placeholder="Performing doctor"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">Remarks</label>
                  <textarea value={formData.remark} onChange={e => setFormData({ ...formData, remark: e.target.value })} placeholder="Additional notes..." rows={2} className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none" />
                </div>
              </form>
            </div>

            <div className="px-6 py-4 border-t border-slate-200 flex gap-3 bg-slate-50 rounded-b-2xl">
              <button type="button" onClick={resetForm} className="flex-1 py-2.5 text-sm font-semibold text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50">Cancel</button>
              <button type="submit" form="patientForm" disabled={submitting} className={clsx('flex-1 py-2.5 text-sm font-bold text-white rounded-lg inline-flex items-center justify-center gap-2 disabled:opacity-50', editingPatient ? 'bg-amber-500 hover:bg-amber-600' : 'bg-blue-600 hover:bg-blue-700')}>
                {submitting ? <><Loader2 size={16} className="animate-spin" /> Saving…</> : <><CheckCircle size={16} /> {editingPatient ? 'Update' : 'Register'}</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientList;