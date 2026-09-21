import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'https://compalint-portal.onrender.com/'; // Match your backend port

let socket;

export const initSocket = (userId) => {
    if (!socket) {
        const token = localStorage.getItem('token');
        socket = io(SOCKET_URL, { 
            transports: ['websocket'],
            auth: { token }
        });

        socket.on('connect', () => {
            // console.log('🔌 Connected to notification server');
            if (userId) {
                socket.emit('join', userId);
            }
        });

        // Background bell sound
        const playBell = () => {
            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'); // Standard notification bell
            audio.play().catch(e => { /* Audio play failed silently */ });
        };

        socket.on('notification', (data) => {
            // console.log('🔔 New Notification:', data);
        });

        socket.on('staff_notification', (data) => {
            // console.log('🏢 Staff Notification:', data);
        });
    }
    return socket;
};

export const getSocket = () => socket;

export const joinTicket = (ticketId, user) => {
    if (socket && user) {
        socket.emit('view_ticket', { ticketId, user: { _id: user._id, name: user.name } });
    }
};

export const leaveTicket = (ticketId) => {
    if (socket) {
        socket.emit('leave_ticket', { ticketId });
    }
};

export const requestActiveViews = () => {
    if (socket) {
        socket.emit('request_active_views');
    }
};
