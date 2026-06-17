import React from 'react';
import { JitsiMeeting } from '@jitsi/react-sdk';

interface CallModalProps {
    requestId: string;
    closeModal: () => void;
    otherName: string;
}

const CallModal: React.FC<CallModalProps> = ({ requestId, closeModal, otherName }) => {
    const roomName = `lifeline-108-secure-call-${requestId}`;

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 10000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div style={{ background: '#111', borderRadius: '12px', width: '95%', maxWidth: '800px', height: '80vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: '#222' }}>

                    <div>
                        <h3 style={{ margin: 0, color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.2rem' }}>
                            <span style={{ display: 'inline-block', width: '10px', height: '10px', background: '#4caf50', borderRadius: '50%', animation: 'pulse 1.5s infinite' }}></span>
                            Secure Call with {otherName}
                        </h3>
                        <p style={{ margin: '0.2rem 0 0 0', color: '#888', fontSize: '0.85rem' }}>Your phone numbers are completely hidden.</p>
                    </div>

                    <button onClick={closeModal} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>&times;</button>
                </div>
                <div style={{ flex: 1, position: 'relative' }}>
                    <JitsiMeeting
                        domain="meet.jit.si"
                        roomName={roomName}
                        configOverwrite={{
                            startWithAudioMuted: false,
                            startWithVideoMuted: true,
                            disableModeratorIndicator: true,
                            startScreenSharing: false,
                            enableEmailInStats: false,
                            prejoinPageEnabled: false,
                            disableDeepLinking: true,
                            requireDisplayName: false
                        }}
                        interfaceConfigOverwrite={{
                            DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
                            SHOW_JITSI_WATERMARK: false,
                            SHOW_WATERMARK_FOR_GUESTS: false,
                            SHOW_BRAND_WATERMARK: false,
                            DEFAULT_BACKGROUND: '#111',
                            DEFAULT_LOGO_URL: '', // Provide your own logo or keep empty
                            HIDE_INVITE_MORE_HEADER: true
                        }}
                        userInfo={{
                            displayName: 'App User',
                            email: ''
                        }}
                        onApiReady={() => {
                            // Can hook to Jitsi API here
                        }}
                        getIFrameRef={(iframeRef) => {
                            iframeRef.style.height = '100%';
                            iframeRef.style.width = '100%';
                            iframeRef.style.border = 'none';
                        }}
                    />
                </div>
            </div>
            <style>{`
                @keyframes pulse {
                    0% { box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.7); }
                    70% { box-shadow: 0 0 0 10px rgba(76, 175, 80, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(76, 175, 80, 0); }
                }
            `}</style>
        </div>
    );
};

export default CallModal;
