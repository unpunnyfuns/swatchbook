import type { HTMLAttributes, ReactNode } from 'react';
import styles from './Card.module.css';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  title?: ReactNode;
  children: ReactNode;
}

export function Card({ title, children, ...rest }: CardProps) {
  return (
    <div className={styles.card} {...rest}>
      {title ? <h3 className={styles.title}>{title}</h3> : null}
      <div className={styles.body}>{children}</div>
    </div>
  );
}
