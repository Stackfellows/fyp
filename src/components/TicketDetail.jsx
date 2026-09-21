import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getComplaintById, addMessage, updateComplaintStatus, rateComplaint, updateComplaintPriority, addInternalNote, reassignComplaint, getPublicDepartments, editMessage, deleteMessage, markMessagesAsRead, snoozeComplaint } from '../services/api';
import { useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';
import { Send, Paperclip, ChevronLeft, CheckCircle2, AlertCircle, X, Star, Inbox, Forward, Edit2, Trash2, CheckCheck, Bell, BellOff, Sparkles, Bot } from 'lucide-react';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';

import { joinTicket, leaveTicket, getSocket } from '../utils/socket';

const TicketDetail = ({ viewType }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector(state => state.auth);
  const [ticket, setTicket] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [viewers, setViewers] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' or 'notes'
  const [internalNote, setInternalNote] = useState('');
  const [editingMsgId, setEditingMsgId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const chatEndRef = useRef(null);

  const QUICK_REPLIES = [
    "Dear Student, the issue you reported has been successfully resolved. Please verify from your end. If you have any further problems, please reply to this ticket.",
    "For the verification required:\n-> Your Paid Challan Invoice\n-> Register Phone Number\n-> Register Email",
    "If you have any other queries, please let us know otherwise your application will be closed.",
    "We have not received any response from your side for the last 2 days. Therefore, we are now proceeding to close your application.",
    "Your issue has been resolved. If you have any further questions, please let us know.",
    "Your issue is being processed. Please wait for 24-48 hours.",
    "Please provide more details or relevant screenshots."
  ];

  const [showReassign, setShowReassign] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedSubDept, setSelectedSubDept] = useState('');
  const [isReassigning, setIsReassigning] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiMessages, setAiMessages] = useState([]);

  const handleCustomAiSubmit = async (e) => {
    e?.preventDefault();
    const promptToUse = customPrompt.trim();
    if (!promptToUse || aiGenerating) return;

    setAiGenerating(true);
    const userMsg = { role: 'user', content: promptToUse };
    setAiMessages(prev => [...prev, userMsg]);
    setCustomPrompt('');

    try {
      const fullContextMessage = `[Ticket Context: Student: "${ticket?.user?.name || 'Student'}", Subject: "${ticket?.subject || ''}", Description: "${ticket?.description || ''}"]\nStaff Question/Instruction: ${promptToUse}`;
      const apiUrl = import.meta.env.VITE_API_URL || 'https://compalint-portal.onrender.com/';
      const response = await axios.post(`${apiUrl.replace(/\/$/, '')}/api/chat/ask`, {
        message: fullContextMessage,
        sessionId: `staff_copilot_${id}`
      });

      if (response.data.success && response.data.response) {
        setAiMessages(prev => [...prev, { role: 'assistant', content: response.data.response }]);
      }
    } catch (err) {
      console.error(err);
      toast.error('AI response error');
    } finally {
      setAiGenerating(false);
    }
  };

  useEffect(() => {
    const fetchDepts = async () => {
      try {
        const depts = await getPublicDepartments();
        setDepartments(depts);
      } catch (err) {
        console.error("Failed to fetch departments", err);
      }
    };
    if (viewType === 'staff' || viewType === 'admin') {
      fetchDepts();
    }
  }, [viewType]);

  const handleReassign = async () => {
    if (!selectedDept || !selectedSubDept) return toast.error("Please select a department and sub-department.");
    setIsReassigning(true);
    try {
      await reassignComplaint(id, { department: selectedDept, subDepartment: selectedSubDept });
      toast.success("Complaint referred successfully!");
      setShowReassign(false);
      fetchTicket();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to reassign");
    } finally {
      setIsReassigning(false);
    }
  };

  const fetchTicket = async () => {
    const data = await getComplaintById(id);
    if (!data) {
      toast.error('Ticket not found');
      navigate(`/${viewType}/dashboard`);
      return;
    }
    setTicket(data);
  };


  useEffect(() => { fetchTicket(); }, [id]);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [ticket?.messages]);

  useEffect(() => {
    if ((viewType === 'staff' || viewType === 'admin') && user && id) {
      joinTicket(id, user);

      const socket = getSocket();
      const handleViewersUpdate = (data) => {
        if (data.ticketId === id) {
          setViewers(data.viewers.filter(v => v._id !== user._id));
        }
      };

      const handleMessagesRead = (data) => {
        if (data.ticketId === id && data.readerId !== user._id) {
          setTicket(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              messages: prev.messages.map(msg => {
                if (msg.sender?._id === user._id || msg.sender === user._id) {
                  return { ...msg, isRead: true, readAt: data.readAt };
                }
                return msg;
              })
            };
          });
        }
      };

      if (socket) {
        socket.on('ticket_viewers_update', handleViewersUpdate);
        socket.on('messages_read', handleMessagesRead);
      }

      return () => {
        if (socket) {
          socket.off('ticket_viewers_update', handleViewersUpdate);
          socket.off('messages_read', handleMessagesRead);
        }
        leaveTicket(id);
      };
    } else if (viewType === 'student' && user && id) {
      // For student, just listen for messages_read
      const socket = getSocket();
      const handleMessagesRead = (data) => {
        if (data.ticketId === id && data.readerId !== user._id) {
          setTicket(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              messages: prev.messages.map(msg => {
                if (msg.sender?._id === user._id || msg.sender === user._id) {
                  return { ...msg, isRead: true, readAt: data.readAt };
                }
                return msg;
              })
            };
          });
        }
      };

      if (socket) {
        socket.on('messages_read', handleMessagesRead);
      }

      return () => {
        if (socket) {
          socket.off('messages_read', handleMessagesRead);
        }
      };
    }
  }, [id, user, viewType]);

  // Mark messages as read when ticket loads
  useEffect(() => {
    if (ticket && activeTab === 'chat') {
      const hasUnreadOthers = ticket.messages.some(msg => {
        const isSentByMe = msg.sender?._id === user?._id || msg.sender === user?._id;
        return !isSentByMe && !msg.isRead;
      });
      if (hasUnreadOthers) {
        markMessagesAsRead(id).catch(console.error);
      }
    }
  }, [ticket, activeTab, id, user]);

  const [selectedFiles, setSelectedFiles] = useState([]);
  const fileInputRef = useRef(null);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() && selectedFiles.length === 0) return;
    setSending(true);

    const formData = new FormData();
    formData.append('content', newMessage);
    selectedFiles.forEach(file => {
      formData.append('attachments', file);
    });

    try {
      await addMessage(id, formData);
      setNewMessage('');
      setSelectedFiles([]);
      fetchTicket();
    } catch {
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

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

  const handleUpdateMessage = async (e) => {
    e.preventDefault();
    if (!editContent.trim()) return;
    setSending(true);
    try {
      await editMessage(id, editingMsgId, editContent);
      setEditingMsgId(null);
      setEditContent('');
      fetchTicket();
      toast.success('Message updated');
    } catch {
      toast.error('Failed to edit message');
    } finally {
      setSending(false);
    }
  };

  const handleDeleteMessage = async (msgId) => {
    if (window.confirm("Are you sure you want to delete this message?")) {
      try {
        await deleteMessage(id, msgId);
        fetchTicket();
        toast.success('Message deleted');
      } catch {
        toast.error('Failed to delete message');
      }
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    try {
      await updateComplaintStatus(id, newStatus);
      toast.success(`Status updated to ${newStatus}`);
      fetchTicket();
    } catch { toast.error('Failed to update status'); }
  };

  const handlePriorityUpdate = async (newPriority) => {
    try {
      await updateComplaintPriority(id, newPriority);
      toast.success(`Priority updated to ${newPriority}`);
      fetchTicket();
    } catch { toast.error('Failed to update priority'); }
  };

  const handleSnooze = async (hours) => {
    try {
      await snoozeComplaint(id, hours);
      toast.success(hours > 0 ? `Ticket snoozed for ${hours} hours` : 'Ticket un-snoozed');
      fetchTicket();
    } catch { toast.error('Failed to update snooze status'); }
  };

  const handleRate = async () => {
    if (rating === 0) return toast.error('Please select a rating');
    try {
      await rateComplaint(id, { rating, feedback });
      toast.success('Thank you for your feedback!');
      fetchTicket();
    } catch {
      toast.error('Failed to submit rating');
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!internalNote.trim()) return;
    setSending(true);
    try {
      await addInternalNote(id, internalNote);
      setInternalNote('');
      toast.success('Internal note added');
      fetchTicket();
    } catch {
      toast.error('Failed to add internal note');
    } finally {
      setSending(false);
    }
  };

  if (!ticket) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-gov-mid border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const isSnoozed = ticket.snoozeUntil && new Date(ticket.snoozeUntil) > new Date();

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] min-h-[600px] sm:min-h-[700px] animate-fade-in rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-white">
      {isSnoozed && (
        <div className="bg-amber-100 text-amber-800 px-4 py-2 text-sm font-bold flex items-center gap-2 justify-center shrink-0">
          <BellOff size={16} className="text-amber-600" />
          This ticket is snoozed until {new Date(ticket.snoozeUntil).toLocaleString()}
        </div>
      )}
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-slate-200 bg-white shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-base font-bold text-slate-900 font-mono">{ticket.complaintId}</span>
              <span className={`badge badge-${ticket.status.toLowerCase().replace(' ', '-')}`}>
                {ticket.status}
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter ${ticket.priority === 'Urgent' ? 'bg-red-600 text-white' :
                  ticket.priority === 'High' ? 'bg-orange-100 text-orange-700' :
                    ticket.priority === 'Medium' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                }`}>
                {ticket.priority}
              </span>
            </div>
            <p className="text-sm text-slate-500 truncate max-w-[220px] sm:max-w-lg mt-0.5">
              {ticket.subject}
            </p>
            {ticket.assignedTo && viewType !== 'student' && (
              <p className="text-[10px] font-bold text-gov-primary mt-1 flex items-center gap-1">
                <CheckCircle2 size={10} />
                HANDLING BY: <span className="uppercase">{ticket.assignedTo.name || ticket.assignedTo}</span>
              </p>
            )}
          </div>
        </div>

        {(viewType === 'staff' || viewType === 'admin') && (
          <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest hidden lg:inline">Priority:</span>
              <select
                className="bg-white border border-slate-200 rounded-lg text-[10px] font-bold px-2 py-1 outline-none focus:ring-1 focus:ring-gov-mid"
                value={ticket.priority}
                onChange={(e) => handlePriorityUpdate(e.target.value)}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>
            <div className="w-px h-6 bg-slate-200 hidden lg:block" />
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest hidden lg:inline">Status:</span>
              <select
                className="bg-gov-primary text-white border-none rounded-lg text-[10px] font-bold px-2 py-1 outline-none focus:ring-2 focus:ring-gov-mid"
                value={ticket.status}
                onChange={(e) => handleStatusUpdate(e.target.value)}
              >
                <option value="Open">Open</option>
                <option value="Review">In Review</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>
            <div className="w-px h-6 bg-slate-200 hidden lg:block" />
            <button
              onClick={() => setShowReassign(!showReassign)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-600 hover:text-gov-primary hover:border-gov-primary transition-all"
            >
              <Forward size={14} />
              Refer Dept
            </button>
            <div className="w-px h-6 bg-slate-200 hidden lg:block" />
            <button
              onClick={() => handleSnooze(isSnoozed ? 0 : 24)}
              className={`flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-bold transition-all ${
                isSnoozed 
                  ? 'text-amber-600 hover:text-amber-700 hover:border-amber-300'
                  : 'text-slate-600 hover:text-amber-600 hover:border-amber-300'
              }`}
            >
              {isSnoozed ? (
                <>
                  <Bell size={14} /> Un-snooze
                </>
              ) : (
                <>
                  <BellOff size={14} /> Snooze (24h)
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {showReassign && (viewType === 'staff' || viewType === 'admin') && (
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-end gap-4 animate-fade-in shrink-0">
          <div className="flex-1">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">New Department</label>
            <select
              className="w-full bg-white border border-slate-200 rounded-lg text-sm px-3 py-2 outline-none focus:ring-2 focus:ring-gov-mid"
              value={selectedDept}
              onChange={(e) => {
                setSelectedDept(e.target.value);
                setSelectedSubDept('');
              }}
            >
              <option value="">Select Department...</option>
              {departments.map((dept) => (
                <option key={dept._id} value={dept.name}>{dept.name}</option>
              ))}
            </select>
          </div>
          {(() => {
            const trimmedDept = selectedDept ? selectedDept.trim() : '';
            const departmentsList = {
              'Support Department': ['LMS Related', 'Scholarship Form Related', 'Challan Related', 'LMS Portal Not Assign / Error Related', 'Courses Related', 'Candidate Portal Related'],
              'Technical Department': ['Assignment/Quiz Related', 'Assignment/Quiz Unavailable Issues Related', 'Assignment/Quiz Uploading Unavailable Issues Related', 'Course/Lecture Related'],
            };
            const hasSub = departmentsList[trimmedDept] && trimmedDept !== 'Others' && trimmedDept !== 'Other';

            return hasSub ? (
              <div className="flex-1">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">New Sub-Department</label>
                <select
                  className="w-full bg-white border border-slate-200 rounded-lg text-sm px-3 py-2 outline-none focus:ring-2 focus:ring-gov-mid disabled:bg-slate-100 disabled:opacity-50"
                  value={selectedSubDept}
                  onChange={(e) => setSelectedSubDept(e.target.value)}
                  disabled={!selectedDept}
                >
                  <option value="">Select Sub-Department...</option>
                  {(departmentsList[trimmedDept] || []).map((sub, i) => (
                    <option key={i} value={sub}>{sub}</option>
                  ))}
                </select>
              </div>
            ) : null;
          })()}
          <button
            onClick={() => {
              const trimmedDept = selectedDept ? selectedDept.trim() : '';
              const departmentsList = {
                'Support Department': ['LMS Related', 'Scholarship Form Related', 'Challan Related', 'LMS Portal Not Assign / Error Related', 'Courses Related', 'Candidate Portal Related'],
                'Technical Department': ['Assignment/Quiz Related', 'Assignment/Quiz Unavailable Issues Related', 'Assignment/Quiz Uploading Unavailable Issues Related', 'Course/Lecture Related'],
              };
              const hasSub = departmentsList[trimmedDept] && trimmedDept !== 'Others' && trimmedDept !== 'Other';

              if (!selectedDept || (hasSub && !selectedSubDept)) {
                return toast.error("Please select a department and sub-department.");
              }
              setIsReassigning(true);
              reassignComplaint(id, { department: selectedDept, subDepartment: hasSub ? selectedSubDept : 'None' })
                .then(() => {
                  toast.success("Complaint referred successfully!");
                  setShowReassign(false);
                  fetchTicket();
                })
                .catch(err => toast.error(err.response?.data?.message || "Failed to reassign"))
                .finally(() => setIsReassigning(false));
            }}
            disabled={isReassigning || !selectedDept}
            className="px-6 py-2 bg-gov-primary text-white rounded-lg text-sm font-bold hover:bg-gov-dark disabled:opacity-50 transition-all flex items-center gap-2"
          >
            {isReassigning ? 'Referring...' : 'Confirm Referral'}
          </button>
        </div>
      )}

      {/* ── Viewers Banner ── */}
      {viewers.length > 0 && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 flex items-center justify-center gap-2 shrink-0 animate-fade-in">
          <AlertCircle size={16} className="text-amber-500" />
          <span className="text-sm text-amber-700 font-medium">
            This ticket is currently being viewed by: <span className="font-bold">{viewers.map(v => v.name).join(', ')}</span>
          </span>
        </div>
      )}

      {/* ── Tabs (For Staff/Admin/Manager) ── */}
      {(viewType === 'staff' || viewType === 'admin' || viewType === 'manager') && (
        <div className="bg-white border-b border-slate-100 flex px-6 shrink-0">
          <button
            onClick={() => setActiveTab('chat')}
            className={`py-3 px-4 text-xs font-black uppercase tracking-widest border-b-2 transition-all ${activeTab === 'chat' ? 'border-gov-primary text-gov-primary' : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
          >
            Student Chat
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            className={`py-3 px-4 text-xs font-black uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${activeTab === 'notes' ? 'border-amber-500 text-amber-600' : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
          >
            Internal Notes <span className="bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full text-[9px]">{ticket.internalNotes?.length || 0}</span>
          </button>
        </div>
      )}

      {/* ── Visual Stepper (Progress Bar) ── */}
      {activeTab === 'chat' && (
        <div className="bg-white border-b border-slate-100 px-6 py-4 hidden sm:block shrink-0">
          <div className="max-w-2xl mx-auto relative flex justify-between">
            {/* Track Line */}
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-100 -translate-y-1/2" />

            {[
              { id: 'Open', label: 'Submitted', color: 'emerald' },
              { id: 'In Progress', label: 'In Progress', color: 'amber' },
              { id: 'Resolved', label: 'Resolved', color: 'indigo' }
            ].map((step, idx) => {
              const statusOrder = { 'Open': 0, 'Review': 1, 'In Progress': 2, 'Resolved': 3 };
              const currentOrder = statusOrder[ticket.status] || 0;
              const isActive = idx <= (currentOrder === 1 ? 0 : (currentOrder === 2 ? 1 : (currentOrder === 3 ? 2 : 0)));
              const isCompleted = idx < (currentOrder === 1 ? 0 : (currentOrder === 2 ? 1 : (currentOrder === 3 ? 2 : 0)));

              return (
                <div key={idx} className="relative z-10 flex flex-col items-center gap-1.5">
                  <div className={`
                    w-7 h-7 rounded-full flex items-center justify-center border-[3px] transition-all duration-500
                    ${isActive ? `bg-white border-${step.color}-500 shadow-md shadow-${step.color}-100` : 'bg-white border-slate-100 text-slate-300'}
                  `}>
                    {isCompleted ? (
                      <CheckCircle2 size={14} className={`text-${step.color}-500`} />
                    ) : (
                      <span className={`text-[10px] font-black ${isActive ? `text-${step.color}-600` : ''}`}>{idx + 1}</span>
                    )}
                  </div>
                  <div className="text-center">
                    <p className={`text-[9px] font-black uppercase tracking-widest ${isActive ? 'text-slate-800' : 'text-slate-400'}`}>
                      {step.label}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Body ── */}
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col min-w-0 bg-slate-50">
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            {/* Original Complaint Content */}
            <div className="flex justify-start">
              <div className="max-w-[90%] sm:max-w-[75%] bg-white border border-slate-200 p-5 rounded-2xl rounded-tl-none shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2 py-0.5 bg-gov-light text-gov-primary rounded text-[10px] font-bold uppercase tracking-wider">
                    {ticket.department}
                  </span>
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[10px] font-medium">
                    {ticket.subDepartment}
                  </span>
                </div>
                <h4 className="font-bold text-slate-900 mb-2">{ticket.subject}</h4>
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{ticket.description}</p>

                {/* Attachments Section */}
                {ticket.attachments?.length > 0 && (
                  <div className="mt-5 pt-4 border-t border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Original Attachments</p>
                    <div className="flex flex-wrap gap-2">
                      {ticket.attachments.map((file, i) => (
                        <a
                          key={i}
                          href={file.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 hover:border-gov-mid hover:text-gov-primary transition-all"
                        >
                          <Paperclip size={14} />
                          <span className="max-w-[120px] truncate">{file.name}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Conversation messages */}
            {activeTab === 'chat' ? (
              ticket.messages.map((msg) => {
                const isMe = msg.sender?._id === user?._id || msg.sender === user?._id;
                return (
                  <div key={msg._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`
                      group max-w-[85%] sm:max-w-[70%] p-4 rounded-2xl shadow-sm text-sm leading-relaxed
                      ${isMe
                        ? 'bg-gov-primary text-white rounded-tr-none'
                        : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                      }
                    `}>
                      <div className="flex items-center gap-1.5 mb-1">
                        {!isMe && (
                          <div className="h-5 w-5 rounded-full bg-slate-200 flex items-center justify-center text-[8px] font-bold text-slate-600">
                            {(() => {
                              const role = msg.sender?.role;
                              if (viewType === 'student' && (role === 'staff' || role === 'admin' || role === 'manager')) {
                                return 'S';
                              }
                              return msg.sender?.name?.charAt(0) || 'U';
                            })()}
                          </div>
                        )}
                        <span className={`text-xs font-bold ${isMe ? 'text-emerald-200' : 'text-slate-700'}`}>
                          {(() => {
                            if (isMe) return user.name;
                            const role = msg.sender?.role;
                            if (viewType === 'student' && (role === 'staff' || role === 'admin' || role === 'manager')) {
                              return 'Support Team';
                            }
                            return msg.sender?.name || (role === 'student' ? 'Student' : 'Team Member');
                          })()}
                        </span>
                        <span className={`text-[10px] ${isMe ? 'text-emerald-300' : 'text-slate-400'}`}>
                          · {formatDistanceToNow(new Date(msg.timestamp))} ago
                        </span>
                        {msg.isEdited && !msg.isDeleted && (
                          <span className={`text-[9px] italic ${isMe ? 'text-emerald-200' : 'text-slate-400'}`}>
                            (Edited)
                          </span>
                        )}
                        {/* Edit/Delete Actions */}
                        {isMe && !msg.isDeleted && viewType !== 'manager' && viewType !== 'student' && ticket.status !== 'Closed' && ticket.status !== 'Resolved' && (
                          <div className={`ml-auto flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity ${isMe ? 'text-emerald-200' : 'text-slate-400'}`}>
                            <button
                              onClick={() => { setEditingMsgId(msg._id); setEditContent(msg.content); }}
                              className="hover:text-white transition-colors"
                              title="Edit Message"
                            >
                              <Edit2 size={12} />
                            </button>
                            <button
                              onClick={() => handleDeleteMessage(msg._id)}
                              className="hover:text-red-300 transition-colors"
                              title="Delete Message"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        )}
                      </div>

                      {msg.isDeleted ? (
                        <p className={`whitespace-pre-wrap italic text-xs ${isMe ? 'text-emerald-200/80' : 'text-slate-400'}`}>
                          🚫 This message was deleted.
                        </p>
                      ) : editingMsgId === msg._id ? (
                        <div className="mt-2 flex flex-col gap-2">
                          <textarea
                            className="w-full text-slate-800 bg-white border-2 border-emerald-300 rounded-lg p-2 text-sm outline-none resize-none"
                            rows={2}
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            autoFocus
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => setEditingMsgId(null)}
                              className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-bold hover:bg-slate-200 transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={handleUpdateMessage}
                              disabled={sending || !editContent.trim()}
                              className="px-2 py-1 bg-emerald-500 text-white rounded text-xs font-bold hover:bg-emerald-600 transition-colors disabled:opacity-50"
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      )}

                      {/* Message Attachments */}
                      {msg.attachments?.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {msg.attachments.map((file, i) => (
                            <a
                              key={i}
                              href={file.url}
                              target="_blank"
                              rel="noreferrer"
                              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-[11px] transition-all ${isMe
                                  ? 'bg-white/10 border-white/20 text-white hover:bg-white/20'
                                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-gov-mid hover:text-gov-primary'
                                }`}
                            >
                              <Paperclip size={13} />
                              <span className="max-w-[150px] truncate">{file.name}</span>
                            </a>
                          ))}
                        </div>
                      )}

                      {/* Seen Status for my messages or team messages when viewed by admin/manager */}
                      {msg.isRead && (isMe || ((viewType === 'admin' || viewType === 'manager' || viewType === 'staff') && msg.sender?.role !== 'student')) && (
                        <div className={`mt-2 flex items-center justify-end gap-1 text-[9px] ${isMe ? 'text-emerald-200' : 'text-blue-500 font-medium'}`}>
                          <CheckCheck size={12} />
                          <span>
                            Seen {msg.readAt ? formatDistanceToNow(new Date(msg.readAt)) + ' ago' : 'now'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              /* Internal Notes List */
              <div className="space-y-4">
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-800 font-medium flex items-start gap-3">
                  <AlertCircle size={16} className="shrink-0" />
                  Internal notes are only visible to Staff, Managers, and Admins. Students cannot see these.
                </div>
                {ticket.internalNotes?.map((note, i) => (
                  <div key={i} className="bg-white border-l-4 border-amber-400 p-4 rounded-lg shadow-sm">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-black text-slate-900 uppercase tracking-tighter">
                        {note.sender?.name || 'Staff Member'}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(note.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-slate-700 italic">"{note.content}"</p>
                  </div>
                ))}
                {ticket.internalNotes?.length === 0 && (
                  <div className="text-center py-10">
                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
                      <Inbox size={20} />
                    </div>
                    <p className="text-slate-400 text-sm italic">No internal notes yet.</p>
                  </div>
                )}
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Rating Section (For Student when Resolved) */}
          {viewType === 'student' && (ticket.status === 'Resolved' || ticket.status === 'Closed') && !ticket.rating && (
            <div className="mx-4 sm:mx-6 mb-4 p-5 bg-emerald-50 border border-emerald-200 rounded-2xl animate-scale-in">
              <h4 className="text-sm font-black text-emerald-800 mb-1 flex items-center gap-2">
                <Star className="fill-emerald-500 text-emerald-500" size={16} />
                Rate your Experience
              </h4>
              <p className="text-xs text-emerald-600 mb-4">Please rate how our team handled your complaint.</p>

              <div className="flex items-center gap-2 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(star)}
                    className="transition-transform hover:scale-110 active:scale-95"
                  >
                    <Star
                      size={28}
                      className={`${star <= (hoverRating || rating)
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-slate-300'
                        } transition-colors`}
                    />
                  </button>
                ))}
              </div>

              <textarea
                className="input text-xs min-h-[60px] bg-white border-emerald-200 mb-3"
                placeholder="Any additional feedback? (Optional)"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
              />

              <button
                onClick={handleRate}
                className="w-full py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition shadow-lg shadow-emerald-200"
              >
                Submit Rating
              </button>
            </div>
          )}

          {/* Show Saved Rating */}
          {(ticket.rating > 0) && (
            <div className="mx-4 sm:mx-6 mb-4 p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Your Rating</p>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} size={14} className={star <= ticket.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'} />
                  ))}
                </div>
              </div>
              {ticket.feedback && (
                <div className="flex-1 ml-6 pl-6 border-l border-slate-200">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Feedback</p>
                  <p className="text-xs text-slate-600 italic font-medium">"{ticket.feedback}"</p>
                </div>
              )}
            </div>
          )}

          {/* Message Input */}
          <div className="p-4 bg-white border-t border-slate-200 shrink-0">
            {((ticket.status === 'Closed' || ticket.status === 'Resolved') && viewType === 'student') || viewType === 'manager' ? (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
                <p className="text-slate-500 text-sm font-medium italic">
                  {viewType === 'manager'
                    ? "Managers have view-only access to this conversation."
                    : "This complaint is closed. Please create a new complaint for further assistance."}
                </p>
              </div>
            ) : (
              <form onSubmit={activeTab === 'chat' ? handleSend : handleAddNote} className="space-y-3">
                {/* Quick Replies & AI Copilot Button */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  {activeTab === 'chat' && (viewType === 'staff' || viewType === 'admin') && (
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowAiModal(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl text-xs font-bold shadow-md hover:from-emerald-700 hover:to-teal-700 transition-all"
                      >
                        <Sparkles size={14} className="animate-pulse" />
                        <span>✨ Smart AI Reply Copilot</span>
                      </button>

                      <div className="flex items-center gap-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Quick Template:</span>
                        <select
                          className="bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-bold text-gov-primary px-2 py-1 outline-none focus:ring-1 focus:ring-gov-mid"
                          onChange={(e) => {
                            if (e.target.value) {
                              setNewMessage(e.target.value);
                              e.target.value = "";
                            }
                          }}
                        >
                          <option value="">Select Template...</option>
                          {QUICK_REPLIES.map((r, i) => <option key={i} value={r}>{r.substring(0, 40)}...</option>)}
                        </select>
                      </div>
                    </div>
                  )}
                  {activeTab === 'notes' && (
                    <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest flex items-center gap-1">
                      <Star size={10} className="fill-amber-500" /> New Internal Private Note
                    </span>
                  )}
                </div>

                {/* File Previews */}
                {selectedFiles.length > 0 && activeTab === 'chat' && (
                  <div className="flex flex-wrap gap-2 pb-2">
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="flex items-center gap-2 px-3 py-1.5 bg-gov-light text-gov-primary rounded-lg text-xs font-bold animate-fade-in border border-gov-mid/30">
                        <Paperclip size={14} />
                        <span className="max-w-[150px] truncate">{file.name}</span>
                        <button type="button" onClick={() => removeFile(index)} className="hover:text-red-500 transition-colors">
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="relative">
                  <textarea
                    rows={1}
                    placeholder={activeTab === 'chat' ? "Type your message… (Enter to send)" : "Add a private internal note for other staff members…"}
                    className={`w-full rounded-xl py-3 pl-4 pr-24 outline-none text-sm resize-none transition-all ${activeTab === 'notes' ? 'bg-amber-50 border border-amber-200 focus:ring-2 focus:ring-amber-200' : 'bg-slate-100 focus:ring-2 focus:ring-gov-mid/30'
                      }`}
                    value={activeTab === 'chat' ? newMessage : internalNote}
                    onChange={(e) => activeTab === 'chat' ? setNewMessage(e.target.value) : setInternalNote(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        activeTab === 'chat' ? handleSend(e) : handleAddNote(e);
                      }
                    }}
                  />
                  {activeTab === 'chat' && (
                    <>
                      <input
                        type="file"
                        multiple
                        hidden
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/*,.pdf,.doc,.docx"
                      />
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                          <Paperclip size={17} />
                        </button>
                        <button
                          type="submit"
                          disabled={(!newMessage.trim() && selectedFiles.length === 0) || sending}
                          className="p-2 bg-gov-primary text-white rounded-lg hover:bg-gov-dark disabled:opacity-40 transition-colors shadow-sm"
                        >
                          {sending ? <div className="w-4.5 h-4.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send size={17} />}
                        </button>
                      </div>
                    </>
                  )}
                  {activeTab === 'notes' && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                      <button
                        type="submit"
                        disabled={!internalNote.trim() || sending}
                        className="px-3 py-1.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-40 transition-colors shadow-sm text-[11px] font-black uppercase"
                      >
                        {sending ? '...' : 'Add Note'}
                      </button>
                    </div>
                  )}
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Info Panel (Desktop) */}
        <div className="hidden lg:flex flex-col w-72 border-l border-slate-200 bg-white overflow-y-auto shrink-0">
          {/* Green accent top */}
          <div className="h-1 w-full bg-gradient-to-r from-gov-dark via-gov-mid to-gov-accent shrink-0" />

          <div className="p-5 space-y-7">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Ticket Info</p>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-gov-light flex items-center justify-center text-gov-primary font-bold text-sm">
                    {ticket.user?.name?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{ticket.user?.name}</p>
                    <p className="text-xs text-slate-500">Roll No: {ticket.user?.rollNo}</p>
                  </div>
                </div>
                <div>
                  <p className="text-[11px] text-slate-400 mb-0.5">Created On</p>
                  <p className="text-sm font-medium text-slate-800">{new Date(ticket.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-400 mb-0.5">Department</p>
                  <p className="text-sm font-medium text-slate-800">{ticket.department} → {ticket.subDepartment}</p>
                </div>
              </div>
            </div>

            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Guidelines</p>
              <div className="space-y-3">
                {[
                  { icon: CheckCircle2, color: 'text-gov-mid', text: 'Be clear and concise in your messages.' },
                  { icon: CheckCircle2, color: 'text-gov-mid', text: 'Attach screenshots if applicable.' },
                  { icon: AlertCircle, color: 'text-amber-500', text: 'Response time: 24–48 hours.' },
                ].map(({ icon: Icon, color, text }, i) => (
                  <div key={i} className="flex gap-2.5">
                    <Icon size={15} className={`${color} shrink-0 mt-0.5`} />
                    <p className="text-xs text-slate-500 leading-relaxed">{text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* ── Groq AI Copilot Modal (ChatGPT Style) ── */}
      {showAiModal && (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col h-[600px] animate-scale-in">
            {/* Modal Header */}
            <div className="bg-slate-900 p-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                  <Bot size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-sm flex items-center gap-2">
                    Smart AI Response Copilot <span className="bg-emerald-500/20 text-emerald-300 text-[10px] px-2 py-0.5 rounded-full border border-emerald-500/30">v2.0 Assistant</span>
                  </h3>
                  <p className="text-[11px] text-slate-400">Ask anything or type custom instructions to generate student replies & emails</p>
                </div>
              </div>
              <button
                onClick={() => setShowAiModal(false)}
                className="p-1.5 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body / Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
              {aiMessages.length === 0 ? (
                <div className="text-center py-8 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                    <Sparkles size={24} />
                  </div>
                  <h4 className="font-bold text-slate-800 text-sm">How can Smart AI Copilot help with this ticket?</h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Type any instruction in Roman Urdu or English (e.g. <i>"Is student ko bolen challan fee receipt upload kare"</i> ya <i>"Write resolution email for this ticket"</i>).
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 text-left max-w-lg mx-auto">
                    <button
                      onClick={() => setCustomPrompt("Analyze student sentiment from description: Is student angry/upset? Give severity level & advice.")}
                      className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-bold hover:border-red-400 hover:bg-red-100 transition-all text-left shadow-sm flex items-center gap-2"
                    >
                      🚨 Detect Upset/Angry Sentiment
                    </button>
                    <button
                      onClick={() => setCustomPrompt("Translate student description into clean simple English and easy Roman Urdu.")}
                      className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-700 font-bold hover:border-blue-400 hover:bg-blue-100 transition-all text-left shadow-sm flex items-center gap-2"
                    >
                      🌐 Language Translator (To English/Roman Urdu)
                    </button>
                    <button
                      onClick={() => setCustomPrompt("Is student ke masle ka polite Roman Urdu reply likh do.")}
                      className="p-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 font-medium hover:border-emerald-500 hover:bg-emerald-50/50 transition-all text-left shadow-sm"
                    >
                      💬 Polite Roman Urdu Reply
                    </button>
                    <button
                      onClick={() => setCustomPrompt("Write an official email asking for fee deposit receipt proof.")}
                      className="p-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 font-medium hover:border-emerald-500 hover:bg-emerald-50/50 transition-all text-left shadow-sm"
                    >
                      📧 Official Fee Proof Email
                    </button>
                  </div>
                </div>
              ) : (
                aiMessages.map((m, idx) => (
                  <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] p-4 rounded-2xl text-xs leading-relaxed shadow-sm ${
                      m.role === 'user'
                        ? 'bg-slate-900 text-white rounded-tr-none'
                        : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none space-y-2'
                    }`}>
                      <p className="whitespace-pre-wrap font-sans">{m.content}</p>
                      {m.role === 'assistant' && (
                        <div className="pt-2 border-t border-slate-100 flex justify-end">
                          <button
                            type="button"
                            onClick={() => {
                              setNewMessage(m.content);
                              setShowAiModal(false);
                              toast.success("Copied to reply box!");
                            }}
                            className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-[10px] font-bold hover:bg-emerald-700 transition"
                          >
                            📋 Copy to Reply Input Box
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
              {aiGenerating && (
                <div className="flex justify-start">
                  <div className="bg-white border border-slate-200 p-3 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2 text-xs text-slate-500">
                    <Sparkles size={14} className="animate-spin text-emerald-600" />
                    <span>Groq AI is thinking & writing response…</span>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Input Form */}
            <form onSubmit={handleCustomAiSubmit} className="p-3 bg-white border-t border-slate-200 flex gap-2">
              <input
                type="text"
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Ask AI anything or give custom prompt (e.g. Write reply in Roman Urdu...)"
                className="input text-xs flex-1 bg-slate-100 focus:bg-white"
              />
              <button
                type="submit"
                disabled={!customPrompt.trim() || aiGenerating}
                className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition disabled:opacity-50 flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
              >
                <Send size={14} /> Send Prompt
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TicketDetail;
