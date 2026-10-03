import type { ComponentProps, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import styles from './Button.module.css';

type Variant = 'primary' | 'ghost';

interface ButtonLinkProps extends ComponentProps<typeof Link> {
  variant?: Variant;
  icon?: ReactNode;
}

export function ButtonLink({ variant = 'primary', icon, className, children, ...props }: ButtonLinkProps) {
  return (
    <Link className={[styles.button, styles[variant], className].filter(Boolean).join(' ')} {...props}>
      <span>{children}</span>
      {icon}
    </Link>
  );
}
