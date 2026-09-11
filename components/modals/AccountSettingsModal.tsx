// components/modals/AccountSettingsModal.tsx
import React from 'react';

interface AccountSettingsProps {
  showModal: boolean;
  setShowModal: (show: boolean) => void;
  userEmail: string;
  newEmail: string;
  setNewEmail: (val: string) => void;
  newPassword: string;
  setNewPassword: (val: string) => void;
  handleUpdateAccount: () => void;
  handleSignOut: () => void;
  loading: boolean;
}

export default function AccountSettingsModal({ showModal, setShowModal, userEmail, newEmail, setNewEmail, newPassword, setNewPassword, handleUpdateAccount, handleSignOut, loading }: AccountSettingsProps) {
  if (!showModal) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[90]">
      <div className="bg-white rounded-[32px] p-8 md:p-10 shadow-2xl w-full max-w-md border border-black/10 animate-in fade-in zoom-in-95">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Account Settings</h2>
          <button onClick={() => setShowModal(false)} className="text-black/40 hover:text-black font-bold">✕</button>
        </div>
        
        <div className="space-y-6">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-black/50 block mb-1">Current Account</label>
            <div className="px-4 py-3 bg-black/5 rounded-2xl font-medium text-black">{userEmail}</div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold uppercase tracking-wider text-black/80">Change Email</label>
            <input type="email" placeholder="New email address..." value={newEmail} onChange={e => setNewEmail(e.target.value)} className="w-full px-4 py-3 rounded-2xl bg-white border border-black/20 focus:outline-none focus:border-[#6B705C] shadow-sm" />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold uppercase tracking-wider text-black/80">Change Password</label>
            <input type="password" placeholder="New password..." value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full px-4 py-3 rounded-2xl bg-white border border-black/20 focus:outline-none focus:border-[#6B705C] shadow-sm" />
          </div>

          <button onClick={handleUpdateAccount} disabled={loading || (!newEmail && !newPassword)} className="w-full py-3.5 bg-[#6B705C] text-white rounded-2xl font-bold shadow-sm hover:bg-[#5a5f4d] disabled:opacity-50 transition">
            {loading ? 'Saving...' : 'Save Changes'}
          </button>

          <div className="border-t border-black/10 pt-6 mt-4">
            <button onClick={handleSignOut} className="w-full py-3.5 bg-red-50 text-red-800 border border-red-200 rounded-2xl font-bold hover:bg-red-100 transition">
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}