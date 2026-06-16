interface PaystackCardInstance {
  tokenize: (callback: (error: any, response: any) => void) => void;
}

declare global {
  interface Window {
    PaystackPop: {
      setup: (config: PaystackPopupConfig) => {
        openIframe: () => void;
      };
    };
    PaystackCard: (config: PaystackCardConfig) => PaystackCardInstance;
  }
}

interface PaystackCardConfig {
  publicKey: string;
  card: {
    number: string;
    cvv: string;
    expiry_month: string;
    expiry_year: string;
  };
}

interface PaystackPopupConfig {
  key: string;
  email: string;
  amount: number;
  ref: string;
  access_code?: string;
  currency?: string;
  channels?: string[];
  onSuccess: (transaction: { reference: string; transaction: string }) => void;
  onCancel: () => void;
  onError?: (error: unknown) => void;
}

let scriptLoaded = false;
let scriptLoading: Promise<void> | null = null;

function loadPaystackScript(): Promise<void> {
  if (scriptLoaded) return Promise.resolve();
  if (scriptLoading) return scriptLoading;

  scriptLoading = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://js.paystack.co/v1/inline.js";
    script.async = true;
    script.onload = () => {
      scriptLoaded = true;
      resolve();
    };
    script.onerror = () => {
      scriptLoading = null;
      reject(new Error("Failed to load Paystack script"));
    };
    document.head.appendChild(script);
  });

  return scriptLoading;
}

export function openPaystackPopup(config: {
  email: string;
  amount: number;
  reference: string;
  accessCode: string | null;
  publicKey: string;
  currency?: string;
  channels?: string[];
}): Promise<{ reference: string; transaction: string }> {
  return new Promise(async (resolve, reject) => {
    try {
      await loadPaystackScript();
    } catch {
      reject(new Error("Unable to load Paystack. Please try again."));
      return;
    }

    const handler = window.PaystackPop.setup({
      key: config.publicKey,
      email: config.email,
      amount: config.amount,
      ref: config.reference,
      access_code: config.accessCode || undefined,
      currency: config.currency || "GHS",
      channels: config.channels,
      onSuccess: (transaction) => {
        resolve(transaction);
      },
      onCancel: () => {
        reject(new Error("Payment cancelled by user"));
      },
      onError: (error) => {
        reject(error || new Error("An error occurred during payment"));
      },
    });

    handler.openIframe();
  });
}

export function tokenizeCard(config: {
  publicKey: string;
  cardNumber: string;
  cvv: string;
  expiryMonth: string;
  expiryYear: string;
}): Promise<{
  token: string;
  last4: string;
  brand: string;
  expMonth: number;
  expYear: number;
}> {
  return new Promise(async (resolve, reject) => {
    try {
      await loadPaystackScript();
    } catch {
      reject(new Error("Unable to load Paystack. Please try again."));
      return;
    }

    if (!window.PaystackCard) {
      reject(new Error("PaystackCard is not available. Please refresh and try again."));
      return;
    }

    const card = window.PaystackCard({
      publicKey: config.publicKey,
      card: {
        number: config.cardNumber,
        cvv: config.cvv,
        expiry_month: config.expiryMonth,
        expiry_year: config.expiryYear,
      },
    });

    card.tokenize((error: any, response: any) => {
      if (error) {
        reject(error?.message ? new Error(error.message) : new Error("Card validation failed"));
      } else if (response?.status === "success") {
        resolve(response.data);
      } else {
        reject(new Error(response?.message || "Card tokenization failed"));
      }
    });
  });
}

export function formatAmount(amount: number, currency = "GHS"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount / 100);
}
