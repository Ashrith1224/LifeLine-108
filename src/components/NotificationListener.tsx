import { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const NotificationListener = () => {
    const { currentUser, userRole, isProfileComplete, userProfile } = useAuth();
    const [mountTime] = useState(Date.now());
    const navigate = useNavigate();

    useEffect(() => {
        // Only donors with a complete profile should receive notifications
        if (!currentUser || userRole !== 'donor' || !isProfileComplete) return;

        // Request notification permission if not already granted
        if ("Notification" in window && Notification.permission !== "granted" && Notification.permission !== "denied") {
            Notification.requestPermission();
        }

        const channel = supabase
            .channel('new-requests-notifications')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'requests' }, (payload) => {
                const req = payload.new;
                if (req.status !== 'pending') return;

                const reqTime = new Date(req.created_at).getTime();

                // Check if this request was created *after* the listener mounted
                if (reqTime > mountTime - 5000) {
                    const patientName = req.patient_name;
                    const bloodGroup = req.blood_group;
                    const hospital = req.hospital;
                    const city = req.city;
                    const state = req.state;
                    const targetedDonorId = req.targeted_donor_id;

                    // This is a new request. Check state and blood compatibility.
                    const isStateMatch = state && userProfile?.state ? state === userProfile.state : (city && userProfile?.city && city.toLowerCase() === userProfile.city.toLowerCase());

                    if (!isStateMatch) {
                        return; // Not in donor's state/city
                    }

                    // Check if request is targeted specifically to someone else
                    if (targetedDonorId && targetedDonorId !== currentUser.uid) {
                        return;
                    }

                    let isCompatible = false;
                    const bR = bloodGroup;
                    const bD = userProfile?.bloodGroup;
                    if (!bD || !bR) return;
                    if (bD === 'O-') isCompatible = true;
                    else if (bD === 'O+' && ['A+', 'B+', 'AB+', 'O+'].includes(bR)) isCompatible = true;
                    else if (bD === 'A-' && ['A+', 'A-', 'AB+', 'AB-'].includes(bR)) isCompatible = true;
                    else if (bD === 'A+' && ['A+', 'AB+'].includes(bR)) isCompatible = true;
                    else if (bD === 'B-' && ['B+', 'B-', 'AB+', 'AB-'].includes(bR)) isCompatible = true;
                    else if (bD === 'B+' && ['B+', 'AB+'].includes(bR)) isCompatible = true;
                    else if (bD === 'AB-' && ['AB+', 'AB-'].includes(bR)) isCompatible = true;
                    else if (bD === 'AB+' && bR === 'AB+') isCompatible = true;

                    if (!isCompatible) return; // Not compatible, so do not notify

                    // 1. In-App Alert
                    if ("Notification" in window && Notification.permission === "granted") {
                        const notification = new Notification(`🚨 URGENT: ${bR} Blood Required!`, {
                            body: `${patientName} needs blood at ${hospital}, ${city}. Click to help!`,
                            icon: '/pwa-192x192.png'
                        });

                        notification.onclick = () => {
                            window.focus();
                            navigate('/');
                            notification.close();
                        };
                    }

                    // Always show the in-app visual toast
                    if (targetedDonorId === currentUser.uid) {
                        showSoftToast(`🎯 DIRECT REQUEST: Someone needs your ${bR} urgently!`);
                    } else {
                        showSoftToast(`🚨 ALERT: ${bR} needed at ${hospital}, ${city}!`);
                    }
                }
            })
            .subscribe();

        return () => {
            channel.unsubscribe();
        };
    }, [currentUser, userRole, isProfileComplete, mountTime, navigate, userProfile]);

    // Simple custom toast function so we don't rely only on System Notifications
    function showSoftToast(message: string) {
        const toast = document.createElement('div');
        toast.className = 'glass animate-slide-up';
        toast.style.position = 'fixed';
        toast.style.bottom = '20px';
        toast.style.right = '20px';
        toast.style.padding = '1rem 1.5rem';
        toast.style.background = 'var(--primary)';
        toast.style.color = 'white';
        toast.style.zIndex = '9999';
        toast.style.borderRadius = 'var(--radius)';
        toast.style.boxShadow = 'var(--shadow-lg)';
        toast.style.fontWeight = 'bold';
        toast.style.cursor = 'pointer';

        toast.innerText = message;

        toast.onclick = () => {
            navigate('/');
            document.body.removeChild(toast);
        };

        document.body.appendChild(toast);

        setTimeout(() => {
            if (document.body.contains(toast)) {
                toast.style.opacity = '0';
                toast.style.transition = 'opacity 0.5s ease';
                setTimeout(() => {
                    if (document.body.contains(toast)) document.body.removeChild(toast);
                }, 500);
            }
        }, 8000); // 8 seconds
    };

    return null; // This component is invisible
};

export default NotificationListener;
