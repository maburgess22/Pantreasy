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
  
  const [activeMenu, setActiveMenu] = useState<'personal' | 'membership' | 'feedback'>('personal');
  const [feedback, setFeedback] = useState('');

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[90]">
      <div className="bg-white rounded-[32px] p-6 md:p-10 shadow-2xl w-full max-w-md border border-black/10 animate-in fade-in zoom-in-95 flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center mb-6 shrink-0">
          <h2 className="text-2xl font-bold">Account</h2>
          <button onClick={() => setShowModal(false)} className="text-black/40 hover:text-black font-bold">✕</button>
        </div>

        <div className="flex bg-black/5 p-1 rounded-2xl mb-6 shrink-0">
          <button onClick={() => setActiveMenu('personal')} className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition ${activeMenu === 'personal' ? 'bg-white shadow-sm text-black' : 'text-black/60 hover:text-black'}`}>Personal</button>
          <button onClick={() => setActiveMenu('membership')} className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition ${activeMenu === 'membership' ? 'bg-white shadow-sm text-black' : 'text-black/60 hover:text-black'}`}>Membership</button>
          <button onClick={() => setActiveMenu('feedback')} className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition ${activeMenu === 'feedback' ? 'bg-white shadow-sm text-black' : 'text-black/60 hover:text-black'}`}>Feedback</button>
        </div>
        
        <div className="overflow-y-auto flex-1 pr-2">
          {activeMenu === 'personal' && (
            <div className="space-y-5">
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

              <button onClick={handleDeleteAccount} className="w-full py-3.5 bg-red-50 text-red-800 border border-red-200 rounded-2xl font-bold hover:bg-red-100 transition mt-2">
                Delete Account
              </button>
            </div>
          )}

          {activeMenu === 'membership' && (
            <div className="text-center py-10 space-y-3">
              <div className="w-16 h-16 bg-[#6B705C]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">✨</span>
              </div>
              <h3 className="font-bold text-lg">Pantreasy Pro</h3>
              <p className="text-black/60 text-sm">Premium membership features are currently in development. Check back soon!</p>
            </div>
          )}

          {activeMenu === 'feedback' && (
            <div className="space-y-4">
              <p className="text-sm text-black/70">Have an idea or found a bug? Let us know!</p>
              <textarea 
                value={feedback} 
                onChange={e => setFeedback(e.target.value)} 
                placeholder="Type your feedback here..."
                className="w-full p-4 rounded-2xl bg-white border border-black/20 focus:outline-none focus:border-[#6B705C] shadow-sm min-h-[150px]"
              />
              <button 
                onClick={() => { setFeedback(''); alert('Feedback submitted! Thank you.'); }} 
                disabled={!feedback.trim()}
                className="w-full py-3.5 bg-black text-white rounded-2xl font-bold shadow-sm hover:bg-black/80 disabled:opacity-50 transition"
              >
                Submit Feedback
              </button>
            </div>
          )}
        </div>

        <div className="border-t border-black/10 pt-4 mt-6 shrink-0">
          <button onClick={handleSignOut} className="w-full py-3.5 bg-black/5 text-black rounded-2xl font-bold hover:bg-black/10 transition">
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}