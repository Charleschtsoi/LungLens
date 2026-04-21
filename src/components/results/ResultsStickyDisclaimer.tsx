/** Fixed educational notice on the results dashboard (above site footer when scrolling). */
export function ResultsStickyDisclaimer() {
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-50 border-t border-amber-300/70 bg-amber-50/95 px-3 py-3 text-center text-[11px] leading-snug text-amber-950 shadow-[0_-4px_16px_rgba(0,0,0,0.07)] backdrop-blur-md sm:px-4 sm:text-sm sm:leading-relaxed"
      role="note"
    >
      ⚠️ LungLens is an educational tool only. This is not a medical diagnosis. Always consult a qualified
      healthcare professional for medical advice.
    </div>
  );
}
