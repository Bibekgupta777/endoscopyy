import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { Search, Plus, User, Phone, Calendar, ArrowRight, Edit, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';

const PatientList = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Modal States
  const [showForm, setShowForm] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);
  
  // UPDATED: Using 'age' instead of 'dateOfBirth'
  const [formData, setFormData] = useState({
    name: '', age: '', sex: 'Male', phone: '', address: ''
  });

  useEffect(() => {
    fetchPatients();
  }, [search]);

  const fetchPatients = async () => {
    try {
      const { data } = await api.get(`/patients?search=${search}`);
      setPatients(data.patients);
    } catch (error) {
      toast.error('Failed to load patients');
    } finally {
      setLoading(false);
    }
  };

  // --- CRUD HANDLERS ---

  // 1. Create or Update
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.age) {
        toast.error('Age is required');
        return;
    }

    try {
      // LOGIC: Convert Age to Date of Birth for Backend
      const currentYear = new Date().getFullYear();
      const birthYear = currentYear - parseInt(formData.age);
      const calculatedDob = new Date(birthYear, 0, 1); // Jan 1st

      const payload = {
          name: formData.name,
          dateOfBirth: calculatedDob, // Backend expects Date
          sex: formData.sex,
          phone: formData.phone,
          address: formData.address
      };

      if (editingPatient) {
        // UPDATE
        await api.put(`/patients/${editingPatient._id}`, payload);
        toast.success('Patient updated successfully');
      } else {
        // CREATE
        await api.post('/patients', payload);
        toast.success('Patient added successfully');
      }
      resetForm();
      fetchPatients();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  // 2. Delete
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure? This will delete the patient and all their history.')) return;
    
    try {
      await api.delete(`/patients/${id}`);
      toast.success('Patient deleted');
      fetchPatients();
    } catch (error) {
      toast.error('Failed to delete patient. Ensure they have no active reports.');
    }
  };

  // 3. Open Edit Modal
  const handleEdit = (patient) => {
    setEditingPatient(patient);
    
    // LOGIC: Calculate Age from stored DOB to show in input
    let calculatedAge = '';
    if (patient.dateOfBirth) {
        const birthYear = new Date(patient.dateOfBirth).getFullYear();
        const currentYear = new Date().getFullYear();
        calculatedAge = currentYear - birthYear;
    }

    setFormData({
      name: patient.name,
      age: calculatedAge, // Fill the age input
      sex: patient.sex,
      phone: patient.phone || '',
      address: patient.address || ''
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingPatient(null);
    setFormData({ name: '', age: '', sex: 'Male', phone: '', address: '' });
  };

  // Helper for Avatar
  const getInitials = (name) => name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Patients</h1>
          <p className="text-gray-500 text-sm mt-1">Manage patient records and history</p>
        </div>
        <button 
          onClick={() => { resetForm(); setShowForm(true); }} 
          className="btn-primary flex items-center gap-2 shadow-lg shadow-blue-500/30"
        >
          <Plus size={18} /> Add New Patient
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3">
        <Search className="text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Search by name, ID, or phone number..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 outline-none text-gray-700 placeholder-gray-400"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading patients...</div>
      ) : patients.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
          <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <User size={32} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">No patients found</h3>
          <p className="text-gray-500">Try adjusting your search or add a new patient.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Patient Name</th>
                <th className="px-6 py-4 font-semibold text-gray-600 text-sm">ID</th>
                <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Contact</th>
                <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Registered</th>
                <th className="px-6 py-4 font-semibold text-gray-600 text-sm text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {patients.map((patient, index) => (
                <tr key={patient._id} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold ${colors[index % colors.length]}`}>
                        {getInitials(patient.name)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{patient.name}</p>
                        <p className="text-xs text-gray-500">{patient.age} Yrs / {patient.sex}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 font-mono">
                    {patient.patientId}
                  </td>
                  <td className="px-6 py-4">
                    {patient.phone ? (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone size={14} /> {patient.phone}
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} />
                      {new Date(patient.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => navigate(`/reports/new?patient=${patient._id}`)}
                        className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors"
                        title="Create Report"
                      >
                        <ArrowRight size={18} />
                      </button>
                      <button 
                        onClick={() => handleEdit(patient)}
                        className="text-gray-500 hover:text-blue-600 hover:bg-gray-100 p-2 rounded-lg transition-colors"
                        title="Edit Patient"
                      >
                        <Edit size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(patient._id)}
                        className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
                        title="Delete Patient"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">
                {editingPatient ? 'Edit Patient' : 'New Patient Registration'}
              </h2>
              <button onClick={resetForm} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Full Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-field"
                  required autoFocus
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Age *</label>
                  <input
                    type="number"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    className="input-field"
                    placeholder="Years"
                    min="0"
                    max="120"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">Sex *</label>
                  <select
                    value={formData.sex}
                    onChange={(e) => setFormData({ ...formData, sex: e.target.value })}
                    className="input-field"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Phone Number</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="input-field"
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button type="submit" className="btn-primary flex-1">
                  {editingPatient ? 'Update Patient' : 'Save Patient'}
                </button>
                <button type="button" onClick={resetForm} className="btn-secondary flex-1">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientList;