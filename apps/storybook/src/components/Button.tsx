import type { ButtonHTMLAttributes, ReactNode } from 'react';
import styles from './Button.module.css';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost';
  children: ReactNode;
}

export function Button({ variant = 'primary', children, ...rest }: ButtonProps) {
  const className = variant === 'ghost' ? styles.ghost : styles.primary;
  return (
    <button type="button" className={className} {...rest}>
      {children}
    </button>
  );
}
