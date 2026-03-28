"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

export default function Scanner({ onScan }: { onScan: (barcode: string) => void }) {
  const [scanning, setScanning] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  const startScanner = async () => {
    const scanner = new Html5Qrcode("reader");
    scannerRef.current = scanner;
    setScanning(true);

    await scanner.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: { width: 250, height: 150 } },
      (decodedText) => {
        onScan(decodedText);
        stopScanner();
      },
      () => {}
    );
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      await scannerRef.current.stop();
      scannerRef.current = null;
    }
    setScanning(false);
  };

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  return (
    <div className="w-full max-w-sm flex flex-col items-center gap-4">
      <div id="reader" className="w-full rounded-xl overflow-hidden border border-gray-700" />

      {!scanning ? (
        <button
          onClick={startScanner}
          className="bg-green-500 hover:bg-green-400 text-black font-semibold px-6 py-3 rounded-xl transition"
        >
          Start Scanning
        </button>
      ) : (
        <button
          onClick={stopScanner}
          className="bg-red-500 hover:bg-red-400 text-white font-semibold px-6 py-3 rounded-xl transition"
        >
          Stop Scanning
        </button>
      )}
    </div>
  );
}