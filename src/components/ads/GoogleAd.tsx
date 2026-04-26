import { useEffect } from 'react';

interface GoogleAdProps {
  slot: string;
  format?: 'auto' | 'fluid' | 'rectangle';
  style?: React.CSSProperties;
}

const GoogleAd = ({ slot, format = 'auto', style }: GoogleAdProps) => {
  useEffect(() => {
    try {
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      console.error("AdSense error:", e);
    }
  }, []);

  return (
    <div className="ad-container my-8 flex flex-col items-center">
      <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-300 mb-2">Advertisement</span>
      <div className="w-full overflow-hidden border border-gray-100 flex justify-center bg-gray-50/50">
        <ins
          className="adsbygoogle"
          style={style || { display: 'block', minWidth: '250px', minHeight: '90px' }}
          data-ad-client="ca-pub-7584677072954533"
          data-ad-slot={slot}
          data-ad-format={format}
          data-full-width-responsive="true"
        />
      </div>
    </div>
  );
};

export default GoogleAd;
