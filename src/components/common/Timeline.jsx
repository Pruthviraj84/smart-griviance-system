import { STATUS_FLOW } from '../../utils/constants';
import { CheckCircle2, Circle } from 'lucide-react';

export default function Timeline({ currentStatus }) {
  const currentIndex = STATUS_FLOW.indexOf(currentStatus);

  return (
    <div className="flex items-center justify-between w-full">
      {STATUS_FLOW.map((status, index) => {
        const isCompleted = index < currentIndex;
        const isCurrent = index === currentIndex;
        const isPending = index > currentIndex;

        return (
          <div key={status} className="flex flex-1 items-center">
            <div className="flex flex-col items-center flex-1">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors ${
                  isCompleted
                    ? 'bg-emerald-500 border-emerald-500 text-white'
                    : isCurrent
                    ? 'bg-primary-600 border-primary-600 text-white'
                    : 'bg-white border-gray-200 text-gray-500'
                }`}
              >
                {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
              </div>
              <span
                className={`mt-2 text-[10px] font-medium uppercase tracking-wide text-center hidden sm:block ${
                  isCompleted || isCurrent ? 'text-slate-700' : 'text-slate-500'
                }`}
              >
                {status}
              </span>
            </div>
            {index < STATUS_FLOW.length - 1 && (
              <div
                className={`h-0.5 flex-1 mx-1 sm:mx-2 ${
                  index < currentIndex ? 'bg-emerald-500' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
