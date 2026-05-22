import { useRef, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onClick?: (e: React.MouseEvent) => void;
  tiltAmount?: number;
  as?: 'div' | 'button' | 'a' | 'span';
  href?: string;
  disabled?: boolean;
  title?: string;
  type?: 'button' | 'submit';
  download?: boolean;
}

export default function Tilt({
  children, className, style, onClick, tiltAmount = 6,
  as = 'div', href, disabled, title, type, download,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const isHovering = useRef(false);
  const frame = useRef(0);

  const handleMouseMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const tiltX = (y - 0.5) * -tiltAmount;
    const tiltY = (x - 0.5) * tiltAmount;
    isHovering.current = true;
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      if (el) el.style.transform = `perspective(400px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale3d(1.02, 1.02, 1.02)`;
    });
  };

  const handleMouseLeave = () => {
    const el = ref.current;
    if (!el) return;
    isHovering.current = false;
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      if (el) el.style.transform = 'perspective(400px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
    });
  };

  const commonProps = {
    ref,
    className,
    style: { ...style, transition: 'transform 0.15s cubic-bezier(0.4, 0, 0.2, 1)', willChange: 'transform' } as React.CSSProperties,
    onMouseMove: handleMouseMove,
    onMouseLeave: handleMouseLeave,
    onClick,
    disabled,
    title,
    download,
  };

  switch (as) {
    case 'button':
      return <button type={type || 'button'} {...(commonProps as any)}>{children}</button>;
    case 'a':
      return <a href={href || '#'} {...(commonProps as any)}>{children}</a>;
    case 'span':
      return <span {...(commonProps as any)}>{children}</span>;
    default:
      return <div {...(commonProps as any)}>{children}</div>;
  }
}
