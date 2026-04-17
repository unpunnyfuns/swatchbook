import type { InputHTMLAttributes } from 'react';
import styles from './Input.module.css';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export function Input({ invalid, className, ...rest }: InputProps) {
  const cls = [styles.input, invalid ? styles.invalid : '', className].filter(Boolean).join(' ');
  return <input className={cls} {...rest} />;
}
