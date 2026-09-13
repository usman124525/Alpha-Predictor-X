import React, { useState, useEffect } from 'react';
import { EsportsEvent, PaymentMethod } from '../types.ts';
import { useAuth } from '../context/AuthContext.tsx';
import {
  Upload,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  ShieldCheck,
  ArrowLeft,
  Loader2,
  FileImage,
} from 'lucide-react';

interface PaymentCheckoutViewProps {
  registrationId: number;
  event: EsportsEvent;
  onBack: () => void;
  onPaymentSuccess: () => void;
}

export const PaymentCheckoutView: React.FC<PaymentCheckoutViewProps> = ({
  registrationId,
  event,
  onBack,
  onPaymentSuccess,
}) => {
  const { token } = useAuth();
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [selectedMethodId, setSelectedMethodId] = useState<number | null>(null);
  const [transactionId, setTransactionId] = useState<string>('');
  const [screenshotUrl, setScreenshotUrl] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  // Fetch active payment methods from the database (Requirement #17: dynamic, not hardcoded!)
  useEffect(() => {
    const fetchMethods = async () => {
      try {
        const res = await fetch('/api/payment-methods');
        if (res.ok) {
          const data = await res.json();
          setMethods(data);
          if (data.length > 0) {
            setSelectedMethodId(data[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to fetch payment methods:', err);
      }
    };
    fetchMethods();
  }, []);

  const selectedMethod = methods.find((m) => m.id === selectedMethodId);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const uploadFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please upload an image file (JPG, PNG, WEBP)');
      return;
    }

    setIsUploading(true);
    setErrorMsg(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.url) {
        setScreenshotUrl(data.url);
      } else {
        setErrorMsg(data.error || 'Failed to upload screenshot');
      }
    } catch (err: any) {
      setErrorMsg('Upload error. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!screenshotUrl) {
      setErrorMsg('Payment receipt screenshot is required.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          registrationId,
          paymentMethodId: selectedMethodId,
          transactionId: transactionId.trim(),
          screenshotUrl,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setIsSuccess(true);
      } else {
        setErrorMsg(data.error || 'Failed to submit payment');
      }
    } catch (err: any) {
      setErrorMsg('Network error submitting payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="max-w-lg mx-auto bg-neutral-900 border border-neutral-800 rounded-2xl p-8 text-center space-y-5 shadow-2xl">
        <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <div className="space-y-1">
          <h2 className="text-xl font-black text-white uppercase font-mono">Payment Submitted</h2>
          <p className="text-xs text-neutral-400">Status: <strong className="text-amber-400 font-mono">PENDING APPROVAL</strong></p>
        </div>

        <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 text-xs text-neutral-300 text-left space-y-2">
          <p>
            • Your manual transaction proof has been submitted to the tournament organizer.
          </p>
          <p>
            • An admin will manually verify the payment details and approve your registration slot.
          </p>
          <p>
            • Once approved, your team slot will be confirmed and custom room credentials will appear on the event page.
          </p>
        </div>

        <button
          onClick={onPaymentSuccess}
          className="w-full bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-xs uppercase py-3 rounded-lg transition"
        >
          View Event Page
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Event</span>
      </button>

      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-6 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest font-mono">
              Step 2 of 2: Manual Payment
            </span>
            <h1 className="text-xl font-black text-white uppercase font-mono">
              Event Registration Fee
            </h1>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-neutral-400 uppercase font-semibold block">Total Amount</span>
            <span className="text-xl font-black text-amber-400 font-mono">
              Rs. {event.entryFee}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmitPayment} className="p-6 space-y-6 text-xs">
          {errorMsg && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-300 p-3.5 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Payment Method Selector */}
          <div className="space-y-2">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-300">
              1. Choose Payment Method
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {methods.map((method) => (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => setSelectedMethodId(method.id)}
                  className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                    selectedMethodId === method.id
                      ? 'bg-amber-500/15 border-amber-400 text-amber-300'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                  }`}
                >
                  <span className="font-bold text-xs text-white">{method.name}</span>
                  <span className="text-[10px] opacity-75 truncate">{method.accountName}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Payment Details Box */}
          {selectedMethod && (
            <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 sm:p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-850 pb-2">
                <span className="font-bold text-amber-400 uppercase font-mono text-xs flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4" />
                  {selectedMethod.name} Account Information
                </span>
                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded font-semibold uppercase">
                  Verified Active
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-neutral-900/90 p-3 rounded-lg border border-neutral-800 flex justify-between items-center">
                  <div>
                    <span className="text-[10px] text-neutral-400 uppercase block font-semibold">Account Title</span>
                    <span className="font-mono font-bold text-white text-sm">{selectedMethod.accountName}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(selectedMethod.accountName, 'title')}
                    className="p-1.5 text-neutral-400 hover:text-amber-400 transition"
                    title="Copy Title"
                  >
                    {copiedKey === 'title' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                <div className="bg-neutral-900/90 p-3 rounded-lg border border-neutral-800 flex justify-between items-center">
                  <div>
                    <span className="text-[10px] text-neutral-400 uppercase block font-semibold">Account Number</span>
                    <span className="font-mono font-bold text-amber-400 text-sm tracking-wider">
                      {selectedMethod.accountNumber}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(selectedMethod.accountNumber, 'num')}
                    className="p-1.5 text-neutral-400 hover:text-amber-400 transition"
                    title="Copy Account Number"
                  >
                    {copiedKey === 'num' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                {selectedMethod.bankName && (
                  <div className="bg-neutral-900/90 p-3 rounded-lg border border-neutral-800 sm:col-span-2">
                    <span className="text-[10px] text-neutral-400 uppercase block font-semibold">Bank Name / IBAN</span>
                    <span className="font-mono text-neutral-200">
                      {selectedMethod.bankName} {selectedMethod.iban ? `• IBAN: ${selectedMethod.iban}` : ''}
                    </span>
                  </div>
                )}
              </div>

              {selectedMethod.instructions && (
                <div className="bg-amber-500/5 border border-amber-500/20 p-3 rounded-lg text-[11px] text-neutral-300">
                  ℹ️ <strong className="text-amber-400">Payment Instructions:</strong> {selectedMethod.instructions}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Upload Screenshot & Transaction ID */}
          <div className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-300 mb-1.5">
                2. Upload Transaction Screenshot <span className="text-red-400">*</span>
              </label>

              {screenshotUrl ? (
                <div className="relative rounded-xl overflow-hidden border border-emerald-500/50 bg-neutral-950 p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={screenshotUrl}
                      alt="Receipt preview"
                      className="w-16 h-16 object-cover rounded-lg border border-neutral-800"
                    />
                    <div>
                      <p className="text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" />
                        Screenshot Uploaded
                      </p>
                      <p className="text-[10px] text-neutral-400 truncate max-w-xs">{screenshotUrl}</p>
                    </div>
                  </div>

                  <label className="bg-neutral-800 hover:bg-neutral-700 text-neutral-200 px-3 py-1.5 rounded text-xs cursor-pointer">
                    Change
                    <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                  </label>
                </div>
              ) : (
                <label
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition group ${
                    isDragging
                      ? 'border-amber-400 bg-amber-500/10'
                      : 'border-neutral-800 hover:border-amber-500/50 bg-neutral-950/70'
                  }`}
                >
                  <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                  {isUploading ? (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
                      <span className="text-neutral-400">Uploading receipt image...</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-center">
                      <div className="w-10 h-10 rounded-full bg-neutral-900 group-hover:bg-amber-500/20 text-neutral-400 group-hover:text-amber-400 flex items-center justify-center transition">
                        <Upload className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="font-bold text-neutral-200 group-hover:text-amber-400 transition">
                          {isDragging ? 'Drop screenshot image here' : 'Drag & drop or click to upload payment screenshot'}
                        </span>
                        <p className="text-[10px] text-neutral-400 mt-0.5">JPG, PNG, or WEBP up to 6MB</p>
                      </div>
                    </div>
                  )}
                </label>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-300 mb-1.5">
                3. Transaction ID / Reference Number (TRX)
              </label>
              <input
                type="text"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                placeholder="e.g. 19284729182"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-neutral-100 placeholder-neutral-400 text-xs font-mono focus:outline-none focus:border-amber-500"
              />
              <p className="text-[10px] text-neutral-400 mt-1">
                Enter the TID found on your Easypaisa / JazzCash / Bank confirmation SMS or receipt.
              </p>
            </div>
          </div>

          <div className="pt-2">
            <button
              id="btn-submit-payment"
              type="submit"
              disabled={isSubmitting || isUploading || !screenshotUrl}
              className={`w-full py-3.5 rounded-xl font-black text-xs uppercase tracking-wider transition shadow-lg ${
                !isSubmitting && !isUploading && screenshotUrl
                  ? 'bg-amber-500 hover:bg-amber-400 text-neutral-950 shadow-amber-500/20'
                  : 'bg-neutral-800 text-neutral-400 cursor-not-allowed border border-neutral-800'
              }`}
            >
              {isSubmitting ? 'Submitting Verification...' : 'Submit Payment for Verification'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
