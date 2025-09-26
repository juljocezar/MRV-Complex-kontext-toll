
import React from 'react';
import type { Notification } from '../../types';

/**
 * @interface NotificationContainerProps
 * @description Props for the NotificationContainer component.
 * @property {Notification[]} notifications - An array of notification objects to display.
 * @property {(id: string) => void} onDismiss - Callback function to dismiss a notification by its ID.
 */
interface NotificationContainerProps {
    notifications: Notification[];
    onDismiss: (id: string) => void;
}

/**
 * @component Icon
 * @description Renders a specific icon based on the notification type.
 * @param {{ type: Notification['type'] }} props The props for the component.
 * @returns {React.ReactElement | null} An SVG element representing the notification type.
 */
const Icon = ({ type }: { type: Notification['type'] }) => {
    switch (type) {
        case 'success':
            return <svg className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
        case 'error':
            return <svg className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
        case 'info':
            return <svg className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
        default:
            return null;
    }
};

/**
 * @component NotificationItem
 * @description Renders a single toast notification with an icon, message, details, and a dismiss button.
 * @param {{ notification: Notification; onDismiss: (id: string) => void }} props The props for the component.
 * @returns {React.FC} The rendered notification item.
 */
const NotificationItem: React.FC<{ notification: Notification; onDismiss: (id: string) => void }> = ({ notification, onDismiss }) => {
    return (
        <div className="max-w-sm w-full bg-gray-800 shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden animate-fade-in-right">
            <div className="p-4">
                <div className="flex items-start">
                    <div className="flex-shrink-0">
                        <Icon type={notification.type} />
                    </div>
                    <div className="ml-3 w-0 flex-1 pt-0.5">
                        <p className="text-sm font-medium text-gray-200">{notification.message}</p>
                        {notification.details && (
                            <p className="mt-1 text-xs text-gray-400">{notification.details}</p>
                        )}
                    </div>
                    <div className="ml-4 flex-shrink-0 flex">
                        <button onClick={() => onDismiss(notification.id)} className="bg-gray-800 rounded-md inline-flex text-gray-400 hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500">
                            <span className="sr-only">Close</span>
                           <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" /></svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

/**
 * @component NotificationContainer
 * @description A container that manages and displays a list of notifications as toast-style pop-ups.
 * It is positioned in the corner of the screen and renders `NotificationItem` components for each notification.
 * @param {NotificationContainerProps} props The props for the component.
 * @returns {React.FC<NotificationContainerProps>} The rendered notification container.
 */
const NotificationContainer: React.FC<NotificationContainerProps> = ({ notifications, onDismiss }) => {
    return (
        <>
            <div aria-live="assertive" className="fixed inset-0 flex items-end px-4 py-6 pointer-events-none sm:p-6 sm:items-start z-50">
                <div className="w-full flex flex-col items-center space-y-4 sm:items-end">
                    {notifications.map((n) => (
                        <NotificationItem key={n.id} notification={n} onDismiss={onDismiss} />
                    ))}
                </div>
            </div>
             <style>{`
                @keyframes fade-in-right {
                    0% {
                        opacity: 0;
                        transform: translateX(20px);
                    }
                    100% {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }
                .animate-fade-in-right {
                    animation: fade-in-right 0.3s ease-out forwards;
                }
            `}</style>
        </>
    );
};

export default NotificationContainer;
