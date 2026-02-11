import React, { useState, useEffect } from 'react';
import { X, Plus, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const FindingsPanel = ({ organ, library, onAddFinding, onClose }) => {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedFinding, setSelectedFinding] = useState('');
  
  // ✅ FIX 1: Safely find the organ data from the array
  // We check if library is an array, then find the item matching the organ name
  const organData = Array.isArray(library) 
    ? library.find(item => item.organ === organ) 
    : null;

  // ✅ FIX 2: Safely extract categories (defaults to empty array if not found)
  const categoriesList = organData?.categories || [];

  // Reset selection when organ changes
  useEffect(() => {
    setSelectedCategory('');
    setSelectedFinding('');
  }, [organ]);

  // Extract findings based on selected category
  const findingsList = selectedCategory 
    ? categoriesList.find(cat => cat.name === selectedCategory)?.findings || []
    : [];

  const [details, setDetails] = useState({
    severity: '',
    size: '',
    location: '',
    count: '',
    description: ''
  });

  // Get requirements for the selected finding (to show specific fields)
  const currentFindingConfig = findingsList.find(f => f.name === selectedFinding);

  const handleAdd = () => {
    if (!selectedFinding) {
      toast.error('Select a finding');
      return;
    }

    onAddFinding({
      organ,
      category: selectedCategory,
      finding: selectedFinding,
      ...details
    });

    // Reset details after adding
    setSelectedFinding('');
    setDetails({ severity: '', size: '', location: '', count: '', description: '' });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-end backdrop-blur-sm">
      <div className="bg-white h-full w-full max-w-2xl shadow-2xl overflow-y-auto flex flex-col">
        
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 flex justify-between items-center z-10 shrink-0">
          <div>
            <h2 className="text-2xl font-bold">{organ} Findings</h2>
            <p className="text-blue-100 text-sm mt-1">Select findings and add clinical details</p>
          </div>
          <button onClick={onClose} className="text-white hover:bg-white/20 p-2 rounded-full">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6 flex-grow">
          
          {/* ✅ SAFETY CHECK: If no data found for this organ */}
          {!organData ? (
            <div className="text-center p-8 border-2 border-dashed rounded-xl bg-gray-50">
              <AlertCircle size={48} className="mx-auto text-gray-300 mb-2" />
              <h3 className="text-gray-500 font-bold">No findings configured</h3>
              <p className="text-sm text-gray-400">
                Go to Settings &gt; Clinical Library to add findings for {organ}.
              </p>
            </div>
          ) : (
            <>
              {/* Category Selection */}
              <div>
                <label className="block font-bold text-gray-700 mb-2 uppercase text-sm tracking-wide">
                  Category
                </label>
                <div className="flex flex-wrap gap-2">
                  {categoriesList.map((cat, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setSelectedCategory(cat.name);
                        setSelectedFinding('');
                      }}
                      className={`px-4 py-2 rounded-lg border-2 font-semibold transition-all ${
                        selectedCategory === cat.name
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-blue-300 text-gray-600'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Finding Selection */}
              {selectedCategory && (
                <div className="animate-fade-in">
                  <label className="block font-bold text-gray-700 mb-2 uppercase text-sm tracking-wide">
                    Finding ({selectedCategory})
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {findingsList.map((finding, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedFinding(finding.name)}
                        className={`p-3 rounded-lg border-2 text-left font-semibold transition-all ${
                          selectedFinding === finding.name
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 hover:border-blue-300 text-gray-600'
                        }`}
                      >
                        {finding.name}
                      </button>
                    ))}
                    {findingsList.length === 0 && (
                      <p className="text-sm text-gray-400 italic col-span-2">No findings in this category</p>
                    )}
                  </div>
                </div>
              )}

              {/* Clinical Details */}
              {selectedFinding && (
                <div className="bg-blue-50/50 p-6 rounded-xl border-2 border-blue-100 space-y-4 animate-fade-in">
                  <h3 className="font-bold text-blue-900 flex items-center gap-2 border-b border-blue-200 pb-2">
                    <AlertCircle size={18} />
                    Details: <span className="underline">{selectedFinding}</span>
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    
                    {/* Only show relevant fields based on configuration, or show all if nothing specific required */}
                    {(!currentFindingConfig || currentFindingConfig.requiresSeverity || true) && (
                      <div>
                        <label className="label text-xs">Severity/Grade</label>
                        <input
                          type="text"
                          value={details.severity}
                          onChange={(e) => setDetails(prev => ({ ...prev, severity: e.target.value }))}
                          className="input-field bg-white"
                          placeholder="e.g., Grade II"
                        />
                      </div>
                    )}

                    {(!currentFindingConfig || currentFindingConfig.requiresSize || true) && (
                      <div>
                        <label className="label text-xs">Size</label>
                        <input
                          type="text"
                          value={details.size}
                          onChange={(e) => setDetails(prev => ({ ...prev, size: e.target.value }))}
                          className="input-field bg-white"
                          placeholder="e.g., 5mm"
                        />
                      </div>
                    )}

                    {(!currentFindingConfig || currentFindingConfig.requiresLocation || true) && (
                      <div>
                        <label className="label text-xs">Location</label>
                        <input
                          type="text"
                          value={details.location}
                          onChange={(e) => setDetails(prev => ({ ...prev, location: e.target.value }))}
                          className="input-field bg-white"
                          placeholder="e.g., 30cm"
                        />
                      </div>
                    )}

                    <div>
                      <label className="label text-xs">Count/Number</label>
                      <input
                        type="text"
                        value={details.count}
                        onChange={(e) => setDetails(prev => ({ ...prev, count: e.target.value }))}
                        className="input-field bg-white"
                        placeholder="e.g., Single/Multiple"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="label text-xs">Additional Description</label>
                      <textarea
                        value={details.description}
                        onChange={(e) => setDetails(prev => ({ ...prev, description: e.target.value }))}
                        className="input-field bg-white"
                        rows={2}
                        placeholder="Any specific observations..."
                      />
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Actions */}
          <div className="sticky bottom-0 bg-white pt-4 pb-0 mt-auto border-t">
            <div className="flex gap-3">
              <button onClick={onClose} className="flex-1 btn-secondary py-3">
                Cancel
              </button>
              <button 
                onClick={handleAdd} 
                disabled={!selectedFinding}
                className="flex-1 btn-primary py-3 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus size={18} /> Add Finding
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default FindingsPanel;