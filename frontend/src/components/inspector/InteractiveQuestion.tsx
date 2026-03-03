import {useState, useCallback} from 'react';
import {Check, CheckSquare, CircleDot, Square} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {cn} from '@/lib/utils';
import type {A2AInputRequired, A2AQuestion} from '@/types/a2a';

interface InteractiveQuestionProps {
  inputRequired: A2AInputRequired;
  onSubmit: (responseText: string) => void;
  disabled?: boolean;
}

function OptionCard({
  label,
  description,
  isSelected,
  icon,
  onClick,
}: {
  label: string;
  description?: string;
  isSelected: boolean;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      className={cn(
        'flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors',
        isSelected
          ? 'border-primary bg-primary/5'
          : 'border-border hover:border-primary/50 hover:bg-muted/50',
      )}
      onClick={e => {
        e.stopPropagation();
        onClick();
      }}
    >
      <div className="mt-0.5 shrink-0">{icon}</div>
      <div className="min-w-0">
        <div className="text-sm font-medium">{label}</div>
        {description && (
          <div className="mt-0.5 text-xs text-muted-foreground">
            {description}
          </div>
        )}
      </div>
    </button>
  );
}

function QuestionBlock({
  question,
  selectedSingle,
  selectedMulti,
  onSingleSelect,
  onMultiToggle,
}: {
  question: A2AQuestion;
  selectedSingle: string | null;
  selectedMulti: Set<string>;
  onSingleSelect: (label: string) => void;
  onMultiToggle: (label: string) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="text-sm font-medium">{question.question}</div>
        {question.header && (
          <span className="inline-block rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
            {question.header}
          </span>
        )}
      </div>
      <div className="space-y-1.5">
        {question.options.map(opt => {
          if (question.multiSelect) {
            const isSelected = selectedMulti.has(opt.label);
            return (
              <OptionCard
                key={opt.label}
                label={opt.label}
                description={opt.description}
                isSelected={isSelected}
                icon={
                  isSelected ? (
                    <CheckSquare className="size-4 text-primary" />
                  ) : (
                    <Square className="size-4 text-muted-foreground" />
                  )
                }
                onClick={() => onMultiToggle(opt.label)}
              />
            );
          } else {
            const isSelected = selectedSingle === opt.label;
            return (
              <OptionCard
                key={opt.label}
                label={opt.label}
                description={opt.description}
                isSelected={isSelected}
                icon={
                  isSelected ? (
                    <Check className="size-4 text-primary" />
                  ) : (
                    <CircleDot className="size-4 text-muted-foreground" />
                  )
                }
                onClick={() => onSingleSelect(opt.label)}
              />
            );
          }
        })}
      </div>
    </div>
  );
}

export function InteractiveQuestion({
  inputRequired,
  onSubmit,
  disabled,
}: InteractiveQuestionProps) {
  const [singleSelections, setSingleSelections] = useState<
    Record<number, string>
  >({});
  const [multiSelections, setMultiSelections] = useState<
    Record<number, Set<string>>
  >({});
  const [submitted, setSubmitted] = useState(false);

  const handleSingleSelect = useCallback((qIdx: number, label: string) => {
    setSingleSelections(prev => ({...prev, [qIdx]: label}));
  }, []);

  const handleMultiToggle = useCallback((qIdx: number, label: string) => {
    setMultiSelections(prev => {
      const current = new Set(prev[qIdx] || []);
      if (current.has(label)) {
        current.delete(label);
      } else {
        current.add(label);
      }
      return {...prev, [qIdx]: current};
    });
  }, []);

  const allAnswered = inputRequired.questions.every((q, i) => {
    if (q.multiSelect) {
      return (multiSelections[i]?.size || 0) > 0;
    }
    return !!singleSelections[i];
  });

  const handleSubmit = useCallback(() => {
    const lines: string[] = [];

    inputRequired.questions.forEach((q, i) => {
      const header = q.header || q.question;
      if (q.multiSelect) {
        const selected = multiSelections[i];
        if (selected && selected.size > 0) {
          lines.push(`${header}: ${Array.from(selected).join(', ')}`);
        }
      } else {
        const selected = singleSelections[i];
        if (selected) {
          lines.push(`${header}: ${selected}`);
        }
      }
    });

    if (lines.length > 0) {
      setSubmitted(true);
      onSubmit(lines.join('\n'));
    }
  }, [inputRequired, singleSelections, multiSelections, onSubmit]);

  if (submitted) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700 dark:border-green-900 dark:bg-green-950 dark:text-green-300">
        Response sent.
      </div>
    );
  }

  return (
    <div
      className="space-y-4 rounded-lg border border-blue-200 bg-blue-50/50 p-4 dark:border-blue-900 dark:bg-blue-950/50"
      onClick={e => e.stopPropagation()}
    >
      {inputRequired.questions.map((q, i) => (
        <QuestionBlock
          key={i}
          question={q}
          selectedSingle={singleSelections[i] || null}
          selectedMulti={multiSelections[i] || new Set()}
          onSingleSelect={label => handleSingleSelect(i, label)}
          onMultiToggle={label => handleMultiToggle(i, label)}
        />
      ))}
      <div className="flex justify-end">
        <Button
          size="sm"
          disabled={!allAnswered || disabled}
          onClick={handleSubmit}
        >
          Send Response
        </Button>
      </div>
    </div>
  );
}
