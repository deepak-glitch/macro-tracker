import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader, type IScannerControls } from "@zxing/browser";

/**
 * Live barcode scanner. Uses the device camera (back-facing when available)
 * and decodes EAN/UPC via ZXing, which works on iOS Safari where the native
 * BarcodeDetector API is unavailable.
 */
export function BarcodeScanner({
  onDetected,
  onClose,
}: {
  onDetected: (code: string) => void;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const reader = new BrowserMultiFormatReader();

    (async () => {
      try {
        if (!videoRef.current) return;
        const controls = await reader.decodeFromConstraints(
          { video: { facingMode: { ideal: "environment" } } },
          videoRef.current,
          (result) => {
            if (result && !cancelled) {
              const text = result.getText().replace(/\D/g, "");
              if (text.length >= 8) {
                controlsRef.current?.stop();
                onDetected(text);
              }
            }
          },
        );
        if (cancelled) controls.stop();
        else controlsRef.current = controls;
      } catch (e) {
        if (!cancelled) {
          setError(
            e instanceof DOMException && e.name === "NotAllowedError"
              ? "Camera permission denied. Allow camera access and try again."
              : "Couldn't start the camera on this device.",
          );
        }
      }
    })();

    return () => {
      cancelled = true;
      controlsRef.current?.stop();
    };
  }, [onDetected]);

  return (
    <div className="scanner">
      {error ? (
        <p className="err">{error}</p>
      ) : (
        <>
          <video ref={videoRef} muted playsInline />
          <p className="small muted" style={{ textAlign: "center" }}>
            Point the camera at a product barcode.
          </p>
        </>
      )}
      <button className="ghost" onClick={onClose} style={{ width: "100%" }}>
        Cancel
      </button>
    </div>
  );
}
