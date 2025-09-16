import HoroscopeVoting from "./HoroscopeVoting";

interface HoroscopeContentProps {
  text: string;
  signId: number;
  effectiveDate: string;
  categoryId?: number;
}

function HoroscopeContent({ text, signId, effectiveDate, categoryId }: HoroscopeContentProps) {
  return (
    <div className="bg-white rounded-2xl p-6 md:p-8 shadow-lg">
      <div className="prose prose-lg max-w-none">
        {text}
      </div>
      <HoroscopeVoting
        signId={signId}
        effectiveDate={effectiveDate}
        categoryId={categoryId}
      />
    </div>
  );
}

export default HoroscopeContent;