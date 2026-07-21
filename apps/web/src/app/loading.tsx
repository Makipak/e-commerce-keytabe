export default function Loading() {
  return (
    <div>
      <div className="mb-5 flex gap-2 sm:mb-6">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-9 w-[70px] animate-skeletonPulse rounded-full bg-keytabee-surface-muted sm:h-[38px] sm:w-[90px]" />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i}>
            <div className="aspect-square animate-skeletonPulse bg-keytabee-surface-muted" />
            <div className="mt-3.5 h-3 w-3/4 animate-skeletonPulse bg-keytabee-surface-muted" />
            <div className="mt-2 h-3 w-1/2 animate-skeletonPulse bg-keytabee-surface-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}
