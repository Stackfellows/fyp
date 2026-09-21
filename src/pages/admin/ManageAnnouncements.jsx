import React, { useEffect, useState } from 'react';
import { getAnnouncements, createAnnouncement, toggleAnnouncement, deleteAnnouncement } from '../../services/api';
import { Megaphone, Plus, Trash2, Power, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { toast } from 'react-hot-toast';

const ManageAnnouncements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState({ content: '', priority: 'Info' });

  const fetchAnnouncements = async () => {
    try {
      const data = await getAnnouncements();
      setAnnouncements(data);
    } catch (error) {
      toast.error('Failed to load announcements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newAnnouncement.content) return toast.error('Please enter content');
    try {
      await createAnnouncement(newAnnouncement);
      toast.success('Announcement created!');
      setNewAnnouncement({ content: '', priority: 'Info' });
      setShowModal(false);
      fetchAnnouncements();
    } catch (error) {
      toast.error('Failed to create announcement');
    }
  };

  const handleToggle = async (id) => {
    try {
      await toggleAnnouncement(id);
      fetchAnnouncements();
      toast.success('Status updated');
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this announcement?')) return;
    try {
      await deleteAnnouncement(id);
      fetchAnnouncements();
      toast.success('Deleted successfully');
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const getPriorityBadge = (p) => {
    switch (p) {
      case 'Important': return <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-[10px] font-bold">Important</span>;
      case 'Warning':   return <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-[10px] font-bold">Warning</span>;
      default:          return <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-[10px] font-bold">Info</span>;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Megaphone className="text-gov-primary" size={26} />
            Manage Announcements
          </h1>
          <p className="text-sm text-slate-500 mt-1">Broadcast messages to all users</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-gov-primary text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition shadow-lg shadow-gov-primary/20"
        >
          <Plus size={18} /> New Announcement
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <p className="text-center py-10 text-slate-400">Loading...</p>
        ) : announcements.length === 0 ? (
          <div className="card p-10 text-center text-slate-400 italic">No announcements found.</div>
        ) : announcements.map((ann) => (
          <div key={ann._id} className={`card p-5 flex items-center justify-between group transition-all ${!ann.isActive ? 'opacity-60 grayscale' : 'hover:border-gov-primary'}`}>
            <div className="flex items-center gap-4 flex-1">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                ann.priority === 'Important' ? 'bg-red-50 text-red-600' :
                ann.priority === 'Warning' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'
              }`}>
                {ann.priority === 'Important' ? <AlertCircle size={20} /> : 
                 ann.priority === 'Warning' ? <AlertTriangle size={20} /> : <Info size={20} />}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  {getPriorityBadge(ann.priority)}
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                    {new Date(ann.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm font-bold text-slate-800">{ann.content}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleToggle(ann._id)}
                className={`p-2 rounded-lg transition-colors ${ann.isActive ? 'text-emerald-600 hover:bg-emerald-50' : 'text-slate-400 hover:bg-slate-100'}`}
                title={ann.isActive ? "Deactivate" : "Activate"}
              >
                <Power size={18} />
              </button>
              <button
                onClick={() => handleDelete(ann._id)}
                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-scale-in overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-gov-primary">
              <h3 className="text-white font-bold flex items-center gap-2">
                <Plus size={18} /> Create New Announcement
              </h3>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">Message Content</label>
                <textarea
                  className="input min-h-[100px] resize-none"
                  placeholder="Enter your message here..."
                  value={newAnnouncement.content}
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">Priority Level</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Info', 'Warning', 'Important'].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setNewAnnouncement({ ...newAnnouncement, priority: p })}
                      className={`py-2 text-[10px] font-bold rounded-lg border-2 transition-all ${
                        newAnnouncement.priority === p 
                        ? 'border-gov-primary bg-emerald-50 text-gov-primary' 
                        : 'border-slate-100 text-slate-400 hover:border-slate-200'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-gov-primary text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition"
                >
                  Post Message
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageAnnouncements;
