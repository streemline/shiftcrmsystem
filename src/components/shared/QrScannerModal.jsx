import React from "react";
import { Scanner } from "@yudiel/react-qr-scanner";
import { X } from "lucide-react";

export default function QrScannerModal({ isOpen, onClose, onScan }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/90">
      <div className="flex items-center justify-between p-4 bg-[#111] border-b border-[#2A2A2A]">
        <h2 className="text-lg font-bold text-white">Сканирование QR</h2>
        <button onClick={onClose} className="p-2 text-[#9E9E9E] hover:text-white rounded-lg hover:bg-[#2A2A2A]">
          <X size={24} />
        </button>
      </div>
      <div className="flex-1 relative flex items-center justify-center p-4">
        <div className="w-full max-w-sm aspect-square bg-black rounded-2xl overflow-hidden relative">
          <Scanner
            onScan={(result) => {
              if (result && result.length > 0) {
                onScan(result[0].rawValue);
              }
            }}
            onError={(error) => console.log(error?.message)}
            components={{
              audio: false,
              video: false,
              zoom: false,
              finder: true,
            }}
            styles={{
              container: { width: "100%", height: "100%" },
            }}
          />
        </div>
      </div>
      <div className="p-6 text-center text-sm text-[#9E9E9E]">
        Наведите камеру на QR-код мебели
      </div>
    </div>
  );
}
