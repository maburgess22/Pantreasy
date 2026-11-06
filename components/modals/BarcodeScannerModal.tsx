import React, { useEffect } from 'react';

interface BarcodeScannerModalProps {
  onCancel: () => void;
  onScan: (decodedText: string) => Promise<void>;
  showToast: (msg: string) => void;
}

export default function BarcodeScannerModal({ onCancel, onScan, showToast }: BarcodeScannerModalProps) {
  useEffect(() => {
    let html5QrCode: any;
    import('html5-qrcode').then(({ Html5Qrcode }) => {
      html5QrCode = new Html5Qrcode("barcode-reader");
      html5QrCode.start({ facingMode: "environment" }, { fps: 10, qrbox: { width: 250, height: 150 } },
        async (decodedText: string) => { 
          try { await html5QrCode.stop(); html5QrCode.clear(); } catch(e) {} 
          onCancel(); 
          await onScan(decodedText); 
        },
        (err: any) => { }
      ).catch((err: any) => { showToast("Camera access denied."); onCancel(); });
    }).catch(err => { showToast("Scanner failed to load."); onCancel(); });
    
    return () => { 
      if (html5QrCode && html5QrCode.isScanning) { 
        html5QrCode.stop().then(() => html5QrCode.clear()).catch((e: any) => console.log(e)); 
      } 
    };
  }, [onCancel, onScan, showToast]);

  return (
    <div className="fixed inset-0 bg-black/90 z-[120] flex flex-col items-center justify-center p-4">
      <div className="bg-[#6B705C] p-6 md:p-8 rounded-[32px] shadow-2xl w-full max-w-sm flex flex-col items-center gap-6 text-white border border-black/10 animate-in fade-in zoom-in-95">
         <div className="text-center"><h2 className="text-3xl font-bold mb-2">Scan Barcode</h2><p className="text-white/80 text-sm">Align the barcode within the frame</p></div>
         <div id="barcode-reader" className="w-full rounded-2xl overflow-hidden shadow-inner bg-black"></div>
         <button onClick={onCancel} className="w-full py-4 bg-white text-black rounded-2xl font-bold hover:bg-gray-100 shadow-sm transition">Cancel</button>
      </div>
    </div>
  );
}