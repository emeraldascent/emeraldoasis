import { useState, useRef } from 'react';
import { CreditCard, Lock, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';

declare global {
  interface Window {
    Accept: {
      dispatchData: (
        secureData: {
          authData: { clientKey: string; apiLoginID: string };
          cardData: { cardNumber: string; month: string; year: string; cardCode: string; zip?: string };
        },
        responseHandler: (response: AuthNetResponse) => void
      ) => void;
    };
  }
}

interface AuthNetResponse {
  messages: {
    resultCode: string;
    message: { code: string; text: string }[];
  };
  opaqueData?: {
    dataDescriptor: string;
    dataValue: string;
  };
}

interface PaymentFormProps {
  amount: string;
  onPaymentSuccess: (opaqueData: { dataDescriptor: string; dataValue: string }, saveCard?: boolean) => void;
  onBack?: () => void;
  loading: boolean;
  showSaveOption?: boolean;
  savedCardLast4?: string | null;
  onUseSavedCard?: () => void;
}

// Public client key — safe to include in frontend
const AUTHNET_CLIENT_KEY = '8xbuZ89TPCkGDa946H7dvAht8L5czK3H4G78XpWCPktb6q723hc2ycSJh67h8YjA';
const AUTHNET_API_LOGIN_ID = '6s87dAMb6VH';

export function PaymentForm({ amount, onPaymentSuccess, loading, showSaveOption = false, savedCardLast4, onUseSavedCard }: PaymentFormProps) {
  const [cardNumber, setCardNumber] = useState('');
  const [expMonth, setExpMonth] = useState('');
  const [expYear, setExpYear] = useState('');
  const [cvv, setCvv] = useState('');
  const [zip, setZip] = useState('');
  const [error, setError] = useState('');
  const [tokenizing, setTokenizing] = useState(false);
  const [saveCard, setSaveCard] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);

  const handleSubmit = () => {
    setError('');

    if (!cardNumber || !expMonth || !expYear || !cvv || !zip) {
      setError('Please fill in all fields.');
      return;
    }

    if (!window.Accept) {
      setError('Payment system is loading. Please wait a moment and try again.');
      return;
    }

    setTokenizing(true);

    let twoDigitYear = expYear.replace(/\D/g, '');
    if (twoDigitYear.length === 4) {
      twoDigitYear = twoDigitYear.slice(2);
    }

    const secureData = {
      authData: {
        clientKey: AUTHNET_CLIENT_KEY,
        apiLoginID: AUTHNET_API_LOGIN_ID,
      },
      cardData: {
        cardNumber: cardNumber.replace(/\s/g, ''),
        month: expMonth.padStart(2, '0'),
        year: twoDigitYear,
        cardCode: cvv,
        zip: zip,
      },
    };

    window.Accept.dispatchData(secureData, (response: AuthNetResponse) => {
      setTokenizing(false);
      console.log('Accept.js response:', JSON.stringify(response));
      if (response.messages.resultCode === 'Error') {
        const errCode = response.messages.message[0]?.code || 'unknown';
        const errText = response.messages.message[0]?.text || 'Card validation failed.';
        console.error(`Accept.js error [${errCode}]: ${errText}`);
        setError(`${errText} (Code: ${errCode})`);
        return;
      }
      if (response.opaqueData) {
        onPaymentSuccess(response.opaqueData, saveCard);
      }
    });
  };

  const formatCardNumber = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
  };

  const isProcessing = tokenizing || loading;

  return (
    <div ref={formRef} className="space-y-4">
      {/* Saved card option */}
      {savedCardLast4 && onUseSavedCard && (
        <button
          onClick={onUseSavedCard}
          disabled={isProcessing}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-colors text-left hover:border-emerald-300"
          style={{ borderColor: '#D1FAE5', backgroundColor: '#F0FDF4' }}
        >
          <CreditCard size={18} style={{ color: 'var(--ea-emerald)' }} />
          <div className="flex-1">
            <p className="text-sm font-medium" style={{ color: 'var(--ea-midnight)' }}>
              Use saved card •••• {savedCardLast4}
            </p>
            <p className="text-[10px] text-gray-500">Quick checkout with your card on file</p>
          </div>
          <span className="text-sm font-bold" style={{ color: 'var(--ea-emerald)' }}>
            {amount}
          </span>
        </button>
      )}

      {savedCardLast4 && onUseSavedCard && (
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-[10px] text-gray-400 font-medium">OR ENTER NEW CARD</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>
      )}

      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <CreditCard size={16} style={{ color: 'var(--ea-emerald)' }} />
          <p className="text-xs font-semibold" style={{ color: 'var(--ea-midnight)' }}>
            Payment Details
          </p>
          <div className="ml-auto flex items-center gap-1">
            <Lock size={10} className="text-gray-400" />
            <span className="text-[10px] text-gray-400">Secure</span>
          </div>
        </div>

        {error && (
          <div className="p-2.5 rounded-lg bg-red-50 border border-red-200">
            <p className="text-xs text-red-600">{error}</p>
          </div>
        )}

        {/* Card Number */}
        <div className="space-y-1.5">
          <label className="text-[11px] text-gray-500 font-medium">Card Number</label>
          <input
            type="text"
            inputMode="numeric"
            value={cardNumber}
            onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
            placeholder="4111 1111 1111 1111"
            className="w-full text-sm border border-gray-200 rounded-lg p-2.5 focus:outline-none focus:border-emerald-400"
            maxLength={19}
            disabled={isProcessing}
          />
        </div>

        {/* Exp + CVV row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <label className="text-[11px] text-gray-500 font-medium">Month</label>
            <input
              type="text"
              inputMode="numeric"
              value={expMonth}
              onChange={(e) => setExpMonth(e.target.value.replace(/\D/g, '').slice(0, 2))}
              placeholder="MM"
              className="w-full text-sm border border-gray-200 rounded-lg p-2.5 focus:outline-none focus:border-emerald-400"
              maxLength={2}
              disabled={isProcessing}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] text-gray-500 font-medium">Year</label>
            <input
              type="text"
              inputMode="numeric"
              value={expYear}
              onChange={(e) => setExpYear(e.target.value.replace(/\D/g, '').slice(0, 2))}
              placeholder="YY"
              className="w-full text-sm border border-gray-200 rounded-lg p-2.5 focus:outline-none focus:border-emerald-400"
              maxLength={2}
              disabled={isProcessing}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] text-gray-500 font-medium">CVV</label>
            <input
              type="text"
              inputMode="numeric"
              value={cvv}
              onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="123"
              className="w-full text-sm border border-gray-200 rounded-lg p-2.5 focus:outline-none focus:border-emerald-400"
              maxLength={4}
              disabled={isProcessing}
            />
          </div>
        </div>

        {/* Zip Code */}
        <div className="space-y-1.5">
          <label className="text-[11px] text-gray-500 font-medium">Billing Zip Code</label>
          <input
            type="text"
            inputMode="numeric"
            value={zip}
            onChange={(e) => setZip(e.target.value.replace(/\D/g, '').slice(0, 5))}
            placeholder="12345"
            className="w-full text-sm border border-gray-200 rounded-lg p-2.5 focus:outline-none focus:border-emerald-400"
            maxLength={5}
            disabled={isProcessing}
          />
        </div>

        {/* Save card checkbox */}
        {showSaveOption && (
          <label className="flex items-center gap-2.5 cursor-pointer py-1">
            <input
              type="checkbox"
              checked={saveCard}
              onChange={(e) => setSaveCard(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 accent-emerald-600"
              disabled={isProcessing}
            />
            <div>
              <span className="text-xs font-medium" style={{ color: 'var(--ea-midnight)' }}>
                Save card for future payments
              </span>
              <p className="text-[10px] text-gray-400">Securely stored via Authorize.net</p>
            </div>
          </label>
        )}
      </div>

      <Button
        onClick={handleSubmit}
        disabled={isProcessing}
        className="w-full h-12 text-white font-medium rounded-xl text-sm"
        style={{ backgroundColor: 'var(--ea-emerald)' }}
      >
        {isProcessing ? (
          <Loader2 size={18} className="animate-spin" />
        ) : (
          `Pay ${amount}`
        )}
      </Button>

      <p className="text-[10px] text-gray-400 text-center">
        Your card will be charged {amount}. Payments processed securely via Authorize.net.
      </p>
    </div>
  );
}
