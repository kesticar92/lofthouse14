"use client";

import { useEffect, useState } from "react";
import Script from "next/script";

const STORAGE_KEY = "lofthouse14_consent_v1";
export const CONSENT_EVENT = "lofthouse:consent";

const CLARITY_ID = process.env.NEXT_PUBLIC_CLARITY_ID || "";
const HOTJAR_ID = process.env.NEXT_PUBLIC_HOTJAR_ID || "";

/**
 * Auditoría #34: Microsoft Clarity / Hotjar.
 * Solo carga tras consentimiento de analytics (o si ya estaba granted).
 */
export function BehaviorAnalytics() {
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const sync = () => {
      setAllowed(localStorage.getItem(STORAGE_KEY) === "granted");
    };
    sync();
    const onConsent = (event: Event) => {
      const custom = event as CustomEvent<{ state?: string }>;
      setAllowed(custom.detail?.state === "granted");
    };
    window.addEventListener(CONSENT_EVENT, onConsent);
    return () => window.removeEventListener(CONSENT_EVENT, onConsent);
  }, []);

  if (!allowed) return null;

  return (
    <>
      {CLARITY_ID ? (
        <Script id="ms-clarity" strategy="afterInteractive">
          {`
            (function(c,l,a,r,i,t,y){
              c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
              t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
              y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "${CLARITY_ID}");
          `}
        </Script>
      ) : null}
      {HOTJAR_ID ? (
        <Script id="hotjar" strategy="afterInteractive">
          {`
            (function(h,o,t,j,a,r){
              h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
              h._hjSettings={hjid:${Number(HOTJAR_ID) || 0},hjsv:6};
              a=o.getElementsByTagName('head')[0];
              r=o.createElement('script');r.async=1;
              r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
              a.appendChild(r);
            })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
          `}
        </Script>
      ) : null}
    </>
  );
}
