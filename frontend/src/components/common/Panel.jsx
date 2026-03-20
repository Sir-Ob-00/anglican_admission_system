export default function Panel({ children, className = "" }) {
  return (
    <div
      className={`rounded-3xl border border-white/40 bg-white/60 p-4 shadow-sm backdrop-blur-xl ${className}`}
    >
      {children}
    </div>
  );
}
