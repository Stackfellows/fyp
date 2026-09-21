import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { createComplaint, getPublicDepartments } from '../../services/api';
import { toast } from 'react-hot-toast';
import { Send, User, Book, Tag, Upload, ChevronRight, X, Mail, CheckCircle2 } from 'lucide-react';

const departmentsList = {
  'Computer Science & FYP Cell': ['Supervisor Allocation', 'FYP Lab & GPU Access', 'Evaluation & Viva Dispute', 'Turnitin Similarity Clearance'],
  'Software Engineering': ['Sprint Evaluation', 'Industry Mentor Coordination', 'Hardware / IoT Shortage'],
  'Electrical Engineering': ['Embedded Systems Lab', 'Component Procurement', 'Laboratory Bench Allocation'],
  'General Academic Support': ['Challan / Examination Slip', 'Library Clearance', 'General Query']
};

const CreateComplaint = () => {
  const { user } = useSelector(state => state.auth);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [depts, setDepts] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [submittedTicket, setSubmittedTicket] = useState(null);

  const [studentName, setStudentName] = useState(user?.name || '');
  const [rollNo, setRollNo] = useState(user?.rollNo || user?.roll_no || '');
  const [email, setEmail] = useState(user?.email || '');

  const [formData, setFormData] = useState({
    department: 'Computer Science & FYP Cell',
    subDepartment: 'Supervisor Allocation',
    subject: '',
    description: '',
    priority: 'Medium'
  });

  React.useEffect(() => {
    const fetchDepts = async () => {
      try {
        const data = await getPublicDepartments();
        const deptsList = Array.isArray(data) ? data : (data.departments || []);
        if (deptsList.length > 0) {
          setDepts(deptsList);
        } else {
          setDepts([
            { _id: '1', name: 'Computer Science & FYP Cell' },
            { _id: '2', name: 'Software Engineering' },
            { _id: '3', name: 'Electrical Engineering' },
            { _id: '4', name: 'General Academic Support' }
          ]);
        }
      } catch (err) {
        setDepts([
          { _id: '1', name: 'Computer Science & FYP Cell' },
          { _id: '2', name: 'Software Engineering' },
          { _id: '3', name: 'Electrical Engineering' },
          { _id: '4', name: 'General Academic Support' }
        ]);
      }
    };
    fetchDepts();
  }, []);

  const update = (field) => (e) => setFormData({ ...formData, [field]: e.target.value });

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + selectedFiles.length > 5) {
      toast.error('You can only upload up to 5 files');
      return;
    }
    setSelectedFiles([...selectedFiles, ...files]);
  };

  const removeFile = (index) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const data = new FormData();
    data.append('student_name', studentName || user?.name || 'Student');
    data.append('roll_no', rollNo || user?.rollNo || 'FYP-BSCS-001');
    data.append('email', email || user?.email || 'student@fyp.edu.pk');
    data.append('department', formData.department);
    data.append('subDepartment', formData.subDepartment);
    data.append('category', formData.subDepartment);
    data.append('subject', formData.subject);
    data.append('title', formData.subject);
    data.append('priority', formData.priority);
    data.append('description', formData.description);

    selectedFiles.forEach((file) => {
      data.append('attachments', file);
    });

    try {
      const result = await createComplaint(data);
      const ticketId = result.ticket_no || result.complaintId || result.complaint?.ticket_no || 'FYP-' + Math.floor(1000 + Math.random() * 9000);
      setSubmittedTicket(ticketId);
      toast.success('Complaint submitted successfully!');
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to submit complaint';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (submittedTicket) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 bg-white rounded-2xl shadow-xl border border-slate-100 text-center animate-fade-in">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 size={36} />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Complaint Lodged Successfully!</h2>
        <p className="text-slate-500 text-sm mb-6">
          Your grievance has been submitted to the academic committee. Keep your ticket number safe:
        </p>

        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 inline-block mb-6 font-mono font-bold text-xl text-indigo-700 tracking-wider">
          {submittedTicket}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {user ? (
            <Link to="/student/tickets" className="btn btn-primary">
              View In My Complaints &rarr;
            </Link>
          ) : (
            <>
              <Link to="/login" className="btn btn-primary">
                Sign In to Track
              </Link>
              <button onClick={() => setSubmittedTicket(null)} className="btn btn-secondary">
                Lodge Another Complaint
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in py-6 px-4">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm text-slate-400">
        <span>Student Portal</span>
        <ChevronRight size={14} />
        <span className="text-indigo-600 font-semibold">Lodge FYP Complaint</span>
      </div>

      <div className="card">
        {/* Top header bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-indigo-700 via-blue-600 to-cyan-400" />

        <div className="p-6 sm:p-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 mb-1">Submit Student Complaint</h1>
              <p className="text-slate-500 text-sm">
                No strict restrictions. Any student can submit their grievance directly.
              </p>
            </div>
            {!user && (
              <span className="px-2.5 py-1 bg-amber-50 text-amber-700 rounded-lg text-xs font-bold border border-amber-200">
                Public / Open Submission
              </span>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Student identity row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="label">Student Full Name *</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                  <input
                    type="text" required
                    className="input pl-10"
                    placeholder="e.g. Ali Raza"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="label">Student Roll Number *</label>
                <div className="relative">
                  <Book className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                  <input
                    type="text" required
                    className="input pl-10"
                    placeholder="e.g. FYP-BSCS-001"
                    value={rollNo}
                    onChange={(e) => setRollNo(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="label">University Email *</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                  <input
                    type="email" required
                    className="input pl-10"
                    placeholder="student@fyp.edu.pk"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Department + Sub */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="label">Department *</label>
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                  <select
                    required className="input pl-10 appearance-none"
                    value={formData.department}
                    onChange={(e) => {
                      const dept = e.target.value;
                      const subs = departmentsList[dept] || ['General'];
                      setFormData({ ...formData, department: dept, subDepartment: subs[0] });
                    }}
                  >
                    {depts.map(dept => (
                      <option key={dept._id} value={dept.name}>{dept.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="label">Grievance Category *</label>
                <select
                  required className="input appearance-none"
                  value={formData.subDepartment}
                  onChange={update('subDepartment')}
                >
                  {(departmentsList[formData.department] || [
                    'Supervisor Allocation', 'FYP Lab Access', 'Evaluation Dispute', 'General Academic Issue'
                  ]).map(sub => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Priority and Subject */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div className="sm:col-span-2">
                <label className="label">Complaint Subject / Title *</label>
                <input
                  type="text" required className="input"
                  placeholder="e.g. Lab GPU Access Issue for Deep Learning Project"
                  value={formData.subject}
                  onChange={update('subject')}
                />
              </div>

              <div>
                <label className="label">Priority Level</label>
                <select
                  className="input appearance-none"
                  value={formData.priority}
                  onChange={update('priority')}
                >
                  <option value="Low">Low (General Query)</option>
                  <option value="Medium">Medium (Standard)</option>
                  <option value="High">High (Impacting Timeline)</option>
                  <option value="Urgent">Urgent (Deadline Risk)</option>
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="label">Detailed Description *</label>
              <textarea
                required rows={5} className="input resize-none"
                placeholder="Provide complete facts, dates, advisor name, or error logs..."
                value={formData.description}
                onChange={update('description')}
              />
            </div>

            {/* File Upload */}
            <div>
              <label className="label">Attachments (Optional - Max 5 files)</label>
              <div
                className="relative border-2 border-dashed border-slate-200 hover:border-indigo-500 rounded-xl p-6 text-center cursor-pointer transition-colors group"
                onClick={() => document.getElementById('fileInput').click()}
              >
                <input
                  id="fileInput"
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFileChange}
                  accept=".jpg,.jpeg,.png,.pdf,.docx,.zip"
                />
                <Upload className="mx-auto text-slate-300 group-hover:text-indigo-500 mb-2 transition-colors" size={28} />
                <p className="text-sm text-slate-600 font-medium">Click to upload or drag & drop</p>
                <p className="text-xs text-slate-400 mt-0.5">PNG, JPG, PDF, ZIP or DOCX</p>
              </div>

              {selectedFiles.length > 0 && (
                <div className="mt-3 space-y-2">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                      <span className="text-xs text-slate-600 truncate">{file.name}</span>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); removeFile(index); }}
                        className="text-red-400 hover:text-red-600 p-1"
                      >
                        <X size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button type="button" onClick={() => navigate(-1)} className="btn btn-secondary">
                Cancel
              </button>
              <button type="submit" disabled={loading} className="btn btn-primary min-w-[170px]">
                {loading ? 'Submitting…' : <><Send size={16} /> Lodge Complaint</>}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateComplaint;
