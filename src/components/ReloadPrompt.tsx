import { useRegisterSW } from 'virtual:pwa-register/react';
import { useState, useEffect } from 'react';

export default function ReloadPrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered: ' + r);
    },
    onRegisterError(error) {
      console.log('SW registration error', error);
    },
  });

  const close = () => {
    setNeedRefresh(false);
  };

  return (
    <>
      {needRefresh && (
        <div className="fixed bottom-0 right-0 m-6 p-6 bg-white border border-gray-200 shadow-xl rounded-xl z-50 flex flex-col gap-4 max-w-sm">
          <div className="text-gray-800 font-medium">
            Versi baru tersedia! Klik tombol di bawah untuk memperbarui.
          </div>
          <div className="flex gap-2 justify-end">
            <button
              className="btn btn-sm btn-secondary"
              onClick={() => close()}
            >
              Tutup
            </button>
            <button
              className="btn btn-sm btn-primary"
              onClick={() => updateServiceWorker(true)}
            >
              Update Sekarang
            </button>
          </div>
        </div>
      )}
    </>
  );
}
