// components/modals/AccountSettingsModal.tsx
import React, { useState } from 'react';

interface AccountSettingsProps {
  showModal: boolean;
  setShowModal: (show: boolean) => void;
  userEmail: string;
  userName: string;
  setUserName: (val: string) => void;
  newEmail: string;
  setNewEmail: (val: string) => void;
  newPassword: string;
  setNewPassword: (val: string) => void;
  handleUpdateAccount: () => void;
  handleSignOut: () => void;
  handleDeleteAccount: () => void;
  loading: boolean;
}

export default function AccountSettingsModal({ 
  showModal, setShowModal, userEmail, userName, setUserName, 
  newEmail, setNewEmail, newPassword, setNewPassword, 
  handleUpdateAccount, handleSignOut, handleDeleteAccount, loading 
}: AccountSettingsProps) {
  
  const [activeMenu, setActiveMenu] = useState<'main' | 'personal' | 'membership' | 'feedback'>('main');
  const [feedback, setFeedback] = useState('');

  if (!showModal) return null;

  const handleClose = () => {
    setShowModal(false);
    setTimeout(() => setActiveMenu('main'), 300); // reset menu after closing
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[90]">
      <div className="bg-white rounded-[32px] p-6 md:p-10 shadow-2xl w-full max-w-md border border-black/10 animate-in fade-in zoom-in-95 flex flex-col max-h-[90vh]">
        
        <div className="flex justify-between items-center mb-6 shrink-0">
          {activeMenu !== 'main' ? (
            <button onClick={() => setActiveMenu('main')} className="text-black/60 hover:text-black font-semibold flex items-center gap-1 transition">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
              Back
            </button>
          ) : (
            <h2 className="text-2xl font-bold">Account</h2>
          )}
          <button onClick={handleClose} className="text-black/40 hover:text-black font-bold text-xl ml-auto transition">✕</button>
        </div>

        <div className="overflow-y-auto flex-1 pr-2 pb-2">
          {/* MAIN VERTICAL MENU */}
          {activeMenu === 'main' && (
            <div className="space-y-3 animate-in fade-in slide-in-from-left-4">
              <button onClick={() => setActiveMenu('personal')} className="w-full py-4 px-6 bg-black/5 hover:bg-black/10 rounded-2xl font-bold transition flex justify-between items-center text-left">
                <span>Personal Details</span>
                <span className="text-black/40">→</span>
              </button>
              <button onClick={() => setActiveMenu('membership')} className="w-full py-4 px-6 bg-black/5 hover:bg-black/10 rounded-2xl font-bold transition flex justify-between items-center text-left">
                <span>Membership</span>
                <span className="text-black/40">→</span>
              </button>
              <button onClick={() => setActiveMenu('feedback')} className="w-full py-4 px-6 bg-black/5 hover:bg-black/10 rounded-2xl font-bold transition flex justify-between items-center text-left">
                <span>Feedback</span>
                <span className="text-black/40">→</span>
              </button>
              
              <div className="border-t border-black/10 pt-3 mt-3">
                <button onClick={handleSignOut} className="w-full py-4 px-6 bg-red-50 text-red-800 border border-red-100 hover:bg-red-100 rounded-2xl font-bold transition text-left">
                  Sign Out
                </button>
              </div>
            </div>
          )}

          {/* SUB-MENUS */}
          {activeMenu === 'personal' && (
            <div className="space-y-5 animate-in slide-in-from-right-4 fade-in">
              <h3 className="text-xl font-bold mb-4">Personal Details</h3>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-black/50 block mb-1">Current Account</label>
                <div className="px-4 py-3 bg-black/5 rounded-2xl font-medium text-black">{userEmail}</div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold uppercase tracking-wider text-black/80">Display Name</label>
                <input type="text" placeholder="Your name..." value={userName} onChange={e => setUserName(e.target.value)} className="w-full px-4 py-3 rounded-2xl bg-white border border-black/20 focus:outline-none focus:border-[#6B705C] shadow-sm" />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold uppercase tracking-wider text-black/80">Change Email</label>
                <input type="email" placeholder="New email address..." value={newEmail} onChange={e => setNewEmail(e.target.value)} className="w-full px-4 py-3 rounded-2xl bg-white border border-black/20 focus:outline-none focus:border-[#6B705C] shadow-sm" />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold uppercase tracking-wider text-black/80">Change Password</label>
                <input type="password" placeholder="New password..." value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full px-4 py-3 rounded-2xl bg-white border border-black/20 focus:outline-none focus:border-[#6B705C] shadow-sm" />
              </div>

              <button onClick={handleUpdateAccount} disabled={loading} className="w-full py-3.5 bg-[#6B705C] text-white rounded-2xl font-bold shadow-sm hover:bg-[#5a5f4d] disabled:opacity-50 transition">
                {loading ? 'Saving...' : 'Save Changes'}
              </button>

              <div className="border-t border-black/10 pt-4 mt-2">
                <button onClick={handleDeleteAccount} className="w-full py-3.5 bg-red-50 text-red-800 border border-red-200 rounded-2xl font-bold hover:bg-red-100 transition">
                  Delete Account
                </button>
              </div>
            </div>
          )}

          {activeMenu === 'membership' && (
            <div className="text-center py-10 space-y-3 animate-in slide-in-from-right-4 fade-in">
              <div className="w-16 h-16 bg-[#6B705C]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">✨</span>
              </div>
              <h3 className="font-bold text-xl">Pantreasy Pro</h3>
              <p className="text-black/60 text-sm px-4">Premium membership features are currently in development. Check back soon!</p>
            </div>
          )}

          {activeMenu === 'feedback' && (
            <div className="space-y-4 animate-in slide-in-from-right-4 fade-in">
              <h3 className="text-xl font-bold mb-2">Send Feedback</h3>
              <p className="text-sm text-black/70">Have an idea or found a bug? Let us know!</p>
              <textarea 
                value={feedback} 
                onChange={e => setFeedback(e.target.value)} 
                placeholder="Type your feedback here..."
                className="w-full p-4 rounded-2xl bg-white border border-black/20 focus:outline-none focus:border-[#6B705C] shadow-sm min-h-[150px]"
              />
              <button 
                onClick={() => { setFeedback(''); alert('Feedback submitted! Thank you.'); setActiveMenu('main'); }} 
                disabled={!feedback.trim()}
                className="w-full py-3.5 bg-black text-white rounded-2xl font-bold shadow-sm hover:bg-black/80 disabled:opacity-50 transition"
              >
                Submit Feedback
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}