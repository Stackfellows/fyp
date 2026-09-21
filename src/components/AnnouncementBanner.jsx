import React, { useEffect, useState } from 'react';
import { getAnnouncements } from '../services/api';
import { AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AnnouncementBanner = () => {
    const [announcements, setAnnouncements] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        const fetchAnnouncements = async () => {
            try {
                const data = await getAnnouncements();
                setAnnouncements(data);
            } catch (error) {
                console.error('Failed to fetch announcements:', error);
            }
        };
        fetchAnnouncements();
    }, []);

    useEffect(() => {
        if (announcements.length > 1) {
            const timer = setInterval(() => {
                setCurrentIndex((prev) => (prev + 1) % announcements.length);
            }, 8000); // Change every 8 seconds
            return () => clearInterval(timer);
        }
    }, [announcements]);

    if (!visible || announcements.length === 0) return null;

    const current = announcements[currentIndex];

    const getColors = (priority) => {
        switch (priority) {
            case 'Important': return 'bg-red-600 text-white';
            case 'Warning':   return 'bg-amber-500 text-white';
            default:          return 'bg-gov-primary text-white';
        }
    };

    const getIcon = (priority) => {
        switch (priority) {
            case 'Important': return <AlertCircle size={18} />;
            case 'Warning':   return <AlertTriangle size={18} />;
            default:          return <Info size={18} />;
        }
    };

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={currentIndex}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`w-full flex items-center justify-between px-6 py-3 shadow-lg ${getColors(current.priority)}`}
            >
                <div className="flex items-center gap-3 overflow-hidden">
                    <div className="shrink-0 animate-pulse">
                        {getIcon(current.priority)}
                    </div>
                    <p className="text-sm font-bold tracking-wide truncate">
                        {current.content}
                    </p>
                </div>
                <button 
                    onClick={() => setVisible(false)}
                    className="ml-4 p-1 hover:bg-white/20 rounded-full transition-colors shrink-0"
                >
                    <X size={16} />
                </button>
            </motion.div>
        </AnimatePresence>
    );
};

export default AnnouncementBanner;
