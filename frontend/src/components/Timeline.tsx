type Step = {
  title: string;
  status: 'done' | 'current' | 'pending';
  description?: string;
};

export const Timeline = ({ steps }: { steps: Step[] }) => {
  return (
    <div className="space-y-3">
      {steps.map((step, idx) => (
        <div key={idx} className="flex items-start gap-3">
          <div
            className={`w-3 h-3 mt-1 rounded-full ${
              step.status === 'done'
                ? 'bg-emerald-500'
                : step.status === 'current'
                  ? 'bg-orange-500'
                  : 'bg-gray-300'
            }`}
          />
          <div>
            <div className="text-sm font-semibold">{step.title}</div>
            {step.description && <div className="text-xs text-gray-600">{step.description}</div>}
          </div>
        </div>
      ))}
    </div>
  );
};

