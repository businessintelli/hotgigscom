import { useMemo } from 'react';
import { cn } from '@/lib/utils';

export interface PasswordStrength {
  score: number; // 0-4
  label: string;
  color: string;
  suggestions: string[];
}

export function calculatePasswordStrength(password: string): PasswordStrength {
  if (!password) {
    return {
      score: 0,
      label: 'Too weak',
      color: 'bg-gray-300',
      suggestions: ['Enter a password'],
    };
  }

  let score = 0;
  const suggestions: string[] = [];

  // Length check
  if (password.length >= 8) score++;
  else suggestions.push('Use at least 8 characters');

  if (password.length >= 12) score++;

  // Character variety checks
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) {
    score++;
  } else {
    suggestions.push('Include both uppercase and lowercase letters');
  }

  if (/\d/.test(password)) {
    score++;
  } else {
    suggestions.push('Include at least one number');
  }

  if (/[^A-Za-z0-9]/.test(password)) {
    score++;
  } else {
    suggestions.push('Include at least one special character (!@#$%^&*)');
  }

  // Common patterns penalty
  if (/^(password|123456|qwerty)/i.test(password)) {
    score = Math.max(0, score - 2);
    suggestions.push('Avoid common passwords');
  }

  // Sequential characters penalty
  if (/(.)\1{2,}/.test(password)) {
    score = Math.max(0, score - 1);
    suggestions.push('Avoid repeated characters');
  }

  // Normalize score to 0-4 range
  score = Math.min(4, Math.max(0, score));

  const labels = ['Too weak', 'Weak', 'Fair', 'Good', 'Strong'];
  const colors = [
    'bg-red-500',
    'bg-orange-500',
    'bg-yellow-500',
    'bg-blue-500',
    'bg-green-500',
  ];

  return {
    score,
    label: labels[score],
    color: colors[score],
    suggestions: score < 4 ? suggestions : [],
  };
}

interface PasswordStrengthIndicatorProps {
  password: string;
  showSuggestions?: boolean;
  className?: string;
}

export function PasswordStrengthIndicator({
  password,
  showSuggestions = true,
  className,
}: PasswordStrengthIndicatorProps) {
  const strength = useMemo(() => calculatePasswordStrength(password), [password]);

  if (!password) return null;

  return (
    <div className={cn('space-y-2', className)}>
      {/* Strength bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Password strength:</span>
          <span
            className={cn(
              'font-medium',
              strength.score === 0 && 'text-red-600',
              strength.score === 1 && 'text-orange-600',
              strength.score === 2 && 'text-yellow-600',
              strength.score === 3 && 'text-blue-600',
              strength.score === 4 && 'text-green-600'
            )}
          >
            {strength.label}
          </span>
        </div>
        <div className="flex gap-1 h-2">
          {[0, 1, 2, 3, 4].map((index) => (
            <div
              key={index}
              className={cn(
                'flex-1 rounded-full transition-colors',
                index <= strength.score ? strength.color : 'bg-gray-200'
              )}
            />
          ))}
        </div>
      </div>

      {/* Suggestions */}
      {showSuggestions && strength.suggestions.length > 0 && (
        <ul className="text-sm text-muted-foreground space-y-1">
          {strength.suggestions.map((suggestion, index) => (
            <li key={index} className="flex items-start gap-2">
              <span className="text-orange-500 mt-0.5">•</span>
              <span>{suggestion}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
