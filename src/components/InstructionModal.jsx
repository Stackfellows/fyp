import React, { useState, useEffect } from 'react';
import { X, Info, CheckCircle, ShieldCheck, AlertTriangle, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const InstructionModal = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const hasSeenInstructions = localStorage.getItem('hasSeenInstructions');
    if (!hasSeenInstructions) {
      // Small delay for better UX
      const timer = setTimeout(() => setIsOpen(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem('hasSeenInstructions', 'true');
    setIsOpen(false);
  };

  const instructions = [
    {
      icon: <BookOpen className="text-blue-500" size={20} />,
      title: "Purpose of Portal (پورٹل کا مقصد)",
      desc: "This portal is for reporting LMS, courses, or technical issues. (LMS، کورسز، یا تکنیکی مسائل سے متعلق شکایات درج کریں۔)"
    },
    {
      icon: <ShieldCheck className="text-emerald-500" size={20} />,
      title: "Valid Complaints (درست شکایات)",
      desc: "Ensure your complaint is related to official academic or portal issues. (صرف تعلیمی یا پورٹل سے متعلق اصل شکایات درج کریں۔)"
    },
    {
      icon: <AlertTriangle className="text-amber-500" size={20} />,
      title: "Clear Documentation (واضح تفصیل)",
      desc: "Provide clear descriptions and attach screenshots (Max 5). (شکایت کی مکمل تفصیل لکھیں اور تصاویر (زیادہ سے زیادہ 5) منسلک کریں۔)"
    },
    {
      icon: <CheckCircle className="text-indigo-500" size={20} />,
      title: "Track Status (اسٹیٹس چیک کریں)",
      desc: "Track the progress of your tickets in the 'My Tickets' section. (اپنی شکایات کی صورتحال 'My Tickets' سیکشن میں باقاعدگی سے دیکھیں۔)"
    }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-lg bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-white/20 max-h-[90vh] flex flex-col"
          >
            {/* Top Branding Bar */}
            <div className="h-2 w-full bg-gradient-to-r from-gov-dark via-gov-mid to-gov-accent shrink-0" />

            <div className="p-5 sm:p-8 overflow-y-auto custom-scrollbar">
              <div className="flex items-center justify-between mb-6 sticky top-0 bg-white/80 backdrop-blur-sm z-10 py-1">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gov-light text-gov-primary flex items-center justify-center shadow-inner shrink-0">
                    <Info size={24} className="sm:w-7 sm:h-7" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-black text-slate-900 leading-tight">Student Instructions</h2>
                    <p className="text-[10px] sm:text-xs font-bold text-gov-primary uppercase tracking-widest mt-0.5">Please Read Carefully</p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-3 sm:space-y-4">
                {instructions.map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * i + 0.3 }}
                    className="flex gap-3 sm:gap-4 p-3 sm:p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-gov-mid/30 transition-colors group"
                  >
                    <div className="shrink-0 mt-1 group-hover:scale-110 transition-transform">
                      {item.icon}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">{item.title}</h4>
                      <p className="text-[11px] sm:text-xs text-slate-500 mt-1 leading-relaxed">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="mt-6 sm:mt-8 flex flex-col gap-3">
                <button
                  onClick={handleClose}
                  className="w-full py-3.5 sm:py-4 bg-gov-primary text-white rounded-2xl font-bold text-sm shadow-lg shadow-gov-primary/20 hover:bg-gov-dark transition-all transform hover:-translate-y-0.5 active:scale-[0.98]"
                >
                  I Understand, Let's Start
                </button>
                <p className="text-[9px] sm:text-[10px] text-center text-slate-400 font-medium italic">
                  By clicking above, you agree to follow the official portal guidelines.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default InstructionModal;
