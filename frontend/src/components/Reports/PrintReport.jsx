import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { ArrowLeft, Printer, Download, CheckCircle, Trash2, Edit } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import toast from 'react-hot-toast';

const PrintReport = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    const init = async () => {
      try {
        const [r, s] = await Promise.all([api.get(`/reports/${id}`), api.get('/settings')]);
        setReport(r.data);
        setSettings(s.data);
      } catch (e) { toast.error('Error loading report'); }
    };
    init();
  }, [id]);

  const handlePrint = () => window.print();
  
  const handlePDF = async () => {
    const loadingToast = toast.loading('Generating Medical PDF...');
    const input = document.getElementById('printable-area');
    
    try {
      const images = Array.from(document.images);
      await Promise.all(images.map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise(resolve => { img.onload = resolve; img.onerror = resolve; });
      }));

      window.scrollTo(0, 0);
      
      const canvas = await html2canvas(input, { 
        scale: 2, 
        useCORS: true, 
        allowTaint: true, 
        logging: false, 
        backgroundColor: '#ffffff',
        scrollY: -window.scrollY 
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
      pdf.save(`${report.patient?.name || 'Report'}_${report.reportId}.pdf`);
      toast.dismiss(loadingToast);
      toast.success('PDF Downloaded');
    } catch (e) {
      console.error(e);
      toast.dismiss(loadingToast);
      toast.error('Failed to generate PDF');
    }
  };

  const handleFinalize = async () => {
    if (!window.confirm('Finalize this report?')) return;
    try { 
      await api.post(`/reports/${id}/finalize`); 
      toast.success('Report finalized!'); 
      const { data } = await api.get(`/reports/${id}`); 
      setReport(data); 
    } catch (e) { toast.error('Failed to finalize'); }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this report?')) return;
    try { 
      await api.delete(`/reports/${id}`); 
      toast.success('Deleted'); 
      navigate('/reports'); 
    } catch (e) { toast.error('Failed to delete'); }
  };

  if (!report) return <div className="h-screen flex items-center justify-center font-bold text-gray-400 animate-pulse">GENERATING REPORT DATA...</div>;

  const groupedFindings = report.findings?.reduce((acc, curr) => {
    const organ = curr.organ || 'General';
    if (!acc[organ]) acc[organ] = [];
    acc[organ].push(curr);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gray-100 pb-20">
      {/* Toolbar */}
      <div className="bg-white shadow-sm border-b p-3 print:hidden sticky top-0 z-50">
        <div className="max-w-[210mm] mx-auto flex justify-between items-center">
          <button onClick={() => navigate('/reports')} className="text-gray-600 flex gap-2 items-center hover:text-gray-900 font-medium transition-colors"><ArrowLeft size={18}/> Back</button>
          <div className="flex gap-2 items-center">
            {report.status === 'draft' && (
              <>
                <button onClick={() => navigate(`/reports/${id}`)} className="bg-blue-50 text-blue-600 border border-blue-200 px-3 py-1 rounded text-sm flex gap-1 items-center hover:bg-blue-100 transition-all"><Edit size={14}/> Edit</button>
                <button onClick={handleFinalize} className="bg-green-600 text-white px-3 py-1 rounded text-sm flex gap-1 items-center hover:bg-green-700 shadow-md shadow-green-200 transition-all"><CheckCircle size={14}/> Finalize</button>
              </>
            )}
            <button onClick={handleDelete} className="bg-red-50 text-red-600 border border-red-200 px-3 py-1 rounded text-sm flex gap-1 items-center hover:bg-red-100 transition-all"><Trash2 size={14}/> Delete</button>
            <button onClick={handlePDF} className="bg-white border px-3 py-1 rounded text-sm flex gap-1 items-center hover:bg-gray-50 transition-all shadow-sm"><Download size={14}/> PDF</button>
            <button onClick={handlePrint} className="bg-blue-600 text-white px-3 py-1 rounded text-sm flex gap-1 items-center hover:bg-blue-700 shadow-md shadow-blue-200 transition-all"><Printer size={14}/> Print</button>
          </div>
        </div>
      </div>

      {/* A4 Printable Area */}
      <div 
        id="printable-area" 
        className="max-w-[210mm] mx-auto bg-white my-8 min-h-[297mm] shadow-xl p-10 flex flex-col print:shadow-none print:m-0 print:w-full print:p-8"
      >
         
         {/* HEADER */}
         <div className="flex justify-between items-start border-b-4 border-blue-900 pb-4 mb-4">
            <div className="flex items-center gap-4">
               {settings?.hospitalLogo && <img src={settings.hospitalLogo} className="h-20 w-auto object-contain" alt="Logo" />}
               <div>
                  <h1 className="text-2xl font-black text-blue-900 uppercase leading-none">{settings?.hospitalName || 'Hospital Name'}</h1>
                  <p className="text-[10px] font-medium text-gray-600 mt-1 whitespace-pre-line leading-tight">{settings?.hospitalAddress}</p>
                  <p className="text-xs font-bold text-gray-800 mt-0.5 tracking-tight">Ph: {settings?.hospitalPhone}</p>
               </div>
            </div>
            <div className="text-right">
              <div className="bg-blue-900 text-white px-3 py-1 font-bold uppercase text-[10px] tracking-widest inline-block rounded">Endoscopy Report</div>
              <div className="text-[10px] text-gray-400 mt-1 font-mono">RID: {report.reportId}</div>
              <div className="mt-2 text-[9px] font-bold text-gray-600">
                {report.opdIpdNumber && <div>OPD/IPD: {report.opdIpdNumber}</div>}
                {report.billNumber && <div>Bill No: {report.billNumber}</div>}
              </div>
            </div>
         </div>

         {/* PATIENT INFO */}
         <div className="bg-gray-50 border-y border-gray-200 p-3 mb-4 text-[11px] grid grid-cols-2 gap-y-1 gap-x-12">
            <div className="flex justify-between border-b border-gray-200 pb-0.5 border-dashed">
              <span className="font-bold text-gray-500 uppercase">Patient Name</span> 
              <span className="font-black text-gray-900 uppercase tracking-tighter">{report.patient?.name}</span>
            </div>
            <div className="flex justify-between border-b border-gray-200 pb-0.5 border-dashed">
              <span className="font-bold text-gray-500 uppercase">Date / Time</span> 
              <span className="font-bold text-gray-900">{new Date(report.procedureDate).toLocaleDateString()} {report.procedureTime && `• ${report.procedureTime}`}</span>
            </div>
            <div className="flex justify-between border-b border-gray-200 pb-0.5 border-dashed">
              <span className="font-bold text-gray-500 uppercase">Age / Sex</span> 
              <span className="font-bold text-gray-900">{report.patient?.age} Y / {report.patient?.sex}</span>
            </div>
            <div className="flex justify-between border-b border-gray-200 pb-0.5 border-dashed">
              <span className="font-bold text-gray-500 uppercase">Referring Dr</span> 
              <span className="font-bold text-gray-900 truncate pl-4">{report.referringDoctor || 'Self'}</span>
            </div>
            <div className="flex justify-between border-b border-gray-200 pb-0.5 border-dashed">
              <span className="font-bold text-gray-500 uppercase">Procedure</span> 
              <span className="font-black text-blue-900 tracking-tighter uppercase">{report.procedureName}</span>
            </div>
            <div className="flex justify-between border-b border-gray-200 pb-0.5 border-dashed">
              <span className="font-bold text-gray-500 uppercase">Study Type</span> 
              <span className="font-bold text-gray-900 uppercase">{report.studyType}</span>
            </div>
         </div>

         {/* CLINICAL METADATA BLOCK */}
         <div className="mb-4 grid grid-cols-3 gap-4 text-[10px]">
            <div className="border-l-2 border-blue-900/20 pl-2">
              <span className="block font-black text-gray-400 uppercase text-[9px] tracking-widest">Indication</span>
              <span className="font-bold text-gray-800 leading-tight uppercase">{report.indication || 'Not provided'}</span>
            </div>
            <div className="border-l-2 border-blue-900/20 pl-2">
              <span className="block font-black text-gray-400 uppercase text-[9px] tracking-widest">Sedation</span>
              <span className="font-bold text-gray-800 leading-tight uppercase">
                {report.sedation?.used 
                  ? `${report.sedation.drugName} ${report.sedation.dose ? `(${report.sedation.dose})` : ''} - ${report.sedation.type}` 
                  : 'No Sedation Used'}
              </span>
            </div>
            <div className="border-l-2 border-blue-900/20 pl-2">
              <span className="block font-black text-gray-400 uppercase text-[9px] tracking-widest">Consent Status</span>
              <span className={`font-bold leading-tight uppercase ${report.consentObtained ? 'text-green-700' : 'text-red-600'}`}>
                {report.consentObtained ? 'Informed Consent Obtained' : 'Consent Not Marked'}
              </span>
            </div>
         </div>

         {/* FINDINGS - DETAILED VIEW */}
         <div className="mb-4 flex-1">
            <div className="bg-gray-100 px-3 py-1 mb-2 border-l-4 border-blue-900">
              <h3 className="font-black uppercase text-blue-900 text-[10px] tracking-[0.2em]">Detailed Observations</h3>
            </div>
            
            <div className="text-[11px] pl-2 leading-relaxed text-gray-800">
               
               {/* GE JUNCTION SPECIAL FINDINGS */}
               {report.organStatus?.geJunction === 'abnormal' && (
                 <div className="mb-3">
                   <h4 className="font-black text-blue-900 uppercase border-b border-gray-100 mb-1 tracking-tight">GE Junction</h4>
                   <div className="pl-4 space-y-1">
                     {report.geJunctionDetails?.distanceFromIncisors && (
                       <div>• Z-line at {report.geJunctionDetails.distanceFromIncisors} cm</div>
                     )}
                     {report.geJunctionDetails?.hiatusHernia && (
                       <div>• Hiatus Hernia present ({report.geJunctionDetails.herniaSize})</div>
                     )}
                     {report.geJunctionDetails?.barrettsEsophagus && (
                       <div className="text-red-600 font-bold">• Barrett's Esophagus Suspected</div>
                     )}
                   </div>
                 </div>
               )}

               {/* DYNAMIC FINDINGS */}
               {groupedFindings && Object.keys(groupedFindings).length > 0 ? (
                 Object.entries(groupedFindings).map(([organName, items]) => (
                   <div key={organName} className="mb-3">
                     <h4 className="font-black text-blue-900 uppercase border-b border-gray-100 mb-1 tracking-tight">{organName}</h4>
                     
                     <div className="pl-4 space-y-2"> 
                       {items.map((item, idx) => (
                         <div key={idx} className="relative">
                           <div className="flex items-start">
                             <div className="w-1.5 h-1.5 rounded-full bg-blue-900 mt-1 mr-2"></div>
                             <div className="w-full">
                                <span className="text-black font-black uppercase mr-2">{item.finding}:</span>
                                
                                <div className="inline-flex flex-wrap gap-x-3 text-[10px] text-gray-600 font-bold uppercase tracking-tighter">
                                   {item.severity && <span>Grade: {item.severity}</span>}
                                   {item.size && <span>Size: {item.size}</span>}
                                   {item.location && <span>Loc: {item.location}</span>}
                                   {item.count && <span>Qty: {item.count}</span>}
                                </div>

                                {item.description && (
                                  <p className="text-gray-500 mt-0.5 lowercase italic normal-case block">{item.description}</p>
                                )}
                             </div>
                           </div>
                         </div>
                       ))}
                     </div>
                   </div>
                 ))
               ) : (
                 <div className="text-center py-6 border-2 border-dashed border-gray-100 rounded-2xl bg-gray-50/50 italic text-gray-400 font-bold uppercase tracking-widest">Normal Endoscopy Study. No abnormal findings.</div>
               )}
            </div>
         </div>

         {/* PROCEDURES & BIOPSY & COMPLICATIONS BLOCK */}
         <div className="mb-4 grid grid-cols-3 gap-4 text-[10px] break-inside-avoid">
            
            {/* BIOPSY */}
            <div className="col-span-1 border rounded bg-blue-50 p-2">
              <h4 className="font-bold text-blue-900 uppercase mb-1">Biopsy</h4>
              {report.biopsy?.taken ? (
                <div className="space-y-1">
                  <div>Site: <b>{report.biopsy.sites?.join(', ')}</b></div>
                  <div>Samples: <b>{report.biopsy.numberOfSamples}</b></div>
                  {report.biopsy.rut && <div className="text-orange-700">RUT (CLO) Test: <b>Done</b></div>}
                  {report.biopsy.histopathology && <div className="text-green-700">Sent for Histopathology</div>}
                </div>
              ) : (
                <div className="text-gray-500 italic">No Biopsy Taken</div>
              )}
            </div>

            {/* THERAPEUTIC */}
            <div className="col-span-1 border rounded bg-green-50 p-2">
              <h4 className="font-bold text-green-900 uppercase mb-1">Interventions</h4>
              {report.therapeutic?.performed && report.therapeutic.procedures?.length > 0 ? (
                report.therapeutic.procedures.map((proc, i) => (
                  <div key={i} className="mb-1 border-b border-green-200 last:border-0 pb-1">
                    <div className="font-bold">{proc.type}</div>
                    <div className="text-[9px] text-gray-600">{proc.site} {proc.details && `(${proc.details})`}</div>
                  </div>
                ))
              ) : (
                <div className="text-gray-500 italic">No Therapeutic Procedures</div>
              )}
            </div>

            {/* COMPLICATIONS */}
            <div className="col-span-1 border rounded bg-gray-50 p-2">
              <h4 className="font-bold text-gray-900 uppercase mb-1">Complications</h4>
              {report.complications?.occurred ? (
                <div className="text-red-600 font-bold">
                  {report.complications.types?.join(', ')}
                  {report.complications.management && <div className="text-gray-600 font-normal mt-1 text-[9px]">{report.complications.management}</div>}
                </div>
              ) : (
                <div className="text-gray-500 italic">None / Uneventful Procedure</div>
              )}
            </div>
         </div>

         {/* IMAGES */}
         {report.images?.length > 0 && (
            <div className="mb-4 break-inside-avoid">
               <div className="bg-gray-100 px-3 py-1 mb-2 border-l-4 border-blue-900 flex justify-between items-center">
                 <h3 className="font-black uppercase text-blue-900 text-[10px] tracking-[0.2em]">Clinical Evidence</h3>
                 <span className="text-[9px] font-bold text-gray-400 italic">Page 1 of 1</span>
               </div>
               <div className="grid grid-cols-4 gap-3 px-1 mt-3">
                  {report.images.filter(img => img.isSelected !== false).map((img, i) => (
                     <div key={i} className="flex flex-col items-center">
                       <div className="w-full aspect-square border-2 border-gray-100 p-0.5 rounded shadow-sm overflow-hidden bg-black">
                          <img 
                            src={`http://localhost:5000/${img.path.replace(/\\/g, '/')}`} 
                            className="h-full w-full object-contain" 
                            alt="Snapshot"
                            crossOrigin="anonymous" 
                          />
                       </div>
                       <p className="text-[9px] font-black text-gray-600 mt-1 uppercase truncate w-full text-center tracking-tighter">
                         {img.taggedOrgan ? `[${img.taggedOrgan}] ` : ''}{img.caption || `IMG-${i+1}`}
                       </p>
                     </div>
                  ))}
               </div>
            </div>
         )}

         {/* CONCLUSION */}
         <div className="mt-auto break-inside-avoid">
            <div className="border-t-4 border-blue-900 pt-3">
               <div className="grid grid-cols-12 gap-4 mb-4">
                 <div className="col-span-8">
                   <h3 className="font-black uppercase text-[10px] tracking-widest text-blue-900 mb-1 underline">Impression / Final Diagnosis</h3>
                   <div className="bg-blue-50/50 p-3 rounded-xl border-l-4 border-blue-900 shadow-inner">
                     <p className="font-black text-[13px] text-blue-950 uppercase leading-snug whitespace-pre-line">{report.customImpression || 'Normal endoscopy study.'}</p>
                   </div>
                 </div>
                 
                 <div className="col-span-4 space-y-3">
                   {report.recommendations && (
                     <div>
                        <h4 className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Recommendations</h4>
                        <p className="text-[10px] font-bold text-gray-700 leading-tight border-l border-gray-200 pl-2">{report.recommendations}</p>
                     </div>
                   )}
                   {report.followUp && (
                     <div>
                        <h4 className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Follow Up</h4>
                        <p className="text-[10px] font-bold text-gray-700 leading-tight border-l border-gray-200 pl-2">{report.followUp}</p>
                     </div>
                   )}
                   {report.comments && (
                     <div>
                        <h4 className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Comments</h4>
                        <p className="text-[10px] font-medium text-gray-500 italic pl-2 leading-tight">{report.comments}</p>
                     </div>
                   )}
                 </div>
               </div>

               {/* SIGNATURE */}
               <div className="flex justify-between items-end mt-4 border-t border-gray-50 pt-2">
                  <div className="text-[8px] text-gray-400 font-mono italic">
                    <p>Computer Generated Report • {new Date().toLocaleString()}</p>
                    <p className="uppercase">This is a digital document verified by {settings?.adminName || 'System Admin'}</p>
                    <p>End of Report</p>
                  </div>
                  <div className="text-center min-w-[200px]">
                     {report.performingDoctor?.signature ? (
                        <img src={report.performingDoctor.signature} className="h-14 mx-auto object-contain mix-blend-multiply" alt="Signature" />
                     ) : <div className="h-14"></div>}
                     <div className="border-t-2 border-gray-900 pt-1 mt-1">
                        <p className="font-black text-xs uppercase text-gray-900 tracking-tighter leading-none">{report.performingDoctor?.name}</p>
                        <p className="text-[10px] font-bold text-blue-900 uppercase mt-1 leading-none">{report.performingDoctor?.qualification}</p>
                        {report.performingDoctor?.specialization && <p className="text-[9px] text-gray-500 uppercase leading-none">{report.performingDoctor?.specialization}</p>}
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};

export default PrintReport;