import { useState, useRef } from 'react';
import { CreditCard, Lock, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';

declare global {
  interface Window {
    Accept: {
      dispatchData: (
        secureData: {
          authData: { clientKey: string; apiLoginID: string };
          cardData: { cardNumber: string; month: string; year: string; cardCode: string };
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
  amount: string; // e.g. "$25"
  onPaymentSuccess: (opaqueData: { dataDescriptor: string; dataValue: string }) => void;
  onBack: () => void;
  loading: boolean;
}

// Public client key — safe to include in frontend
const AUTHNET_CLIENT_KEY = '9pS45r8Q3UN5a5L4cG8sLn4V2w5ax93gAy3y6RSa8AhC58dEN4UJdx35bTg7m2rX';
const AUTHNET_API_LOGIN_ID = '3Lf94JvBr4J';

export function PaymentForm({ amount, onPaymentSuccess, loading }: Omit<PaymentFormProps, 'onBack'>) {
  const [cardNumber, setCardNumber] = useState('');
  const [expMonth, setExpMonth] = useState('');
  const [expYear, setExpYear] = useState('');
  const [cvv, setCvv] = useState('');
  const [error, setError] = useState('');
  const [tokenizing, setTokenizing] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);

  const handleSubmit = () => {
    setError('');

    if (!cardNumber || !expMonth || !expYear || !cvv) {
      setError('Please fill in all card fields.');
      return;
    }

    if (!window.Accept) {
      setError('Payment system is loading. Please wait a moment and try again.');
      return;
    }

    setTokenizing(true);

    const secureData = {
      authData: {
        clientKey: AUTHNET_CLIENT_KEY,
        apiLoginID: AUTHNET_API_LOGIN_ID,
      },
      cardData: {
        cardNumber: cardNumber.replace(/\s/g, ''),
        month: expMonth.padStart(2, '0'),
        year: expYear.length === 2 ? '20' + expYear : expYear,
        cardCode: cvv,
      },
    };

    window.Accept.dispatchData(secureData, (response: AuthNetResponse) => {
      setTokenizing(false);
      if (response.messages.resultCode === 'Error') {
        setError(response.messages.message[0]?.text || 'Card validation failed.');
        return;
      }
      if (response.opaqueData) {
        onPaymentSuccess(response.opaqueData);
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
              onChange={(e) => setExpYear(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="YYYY"
              className="w-full text-sm border border-gray-200 rounded-lg p-2.5 focus:outline-none focus:border-emerald-400"
              maxLength={4}
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
