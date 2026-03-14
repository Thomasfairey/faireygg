interface NeonTextProps {
  children: React.ReactNode;
  color?: string;
  glowClass?: string;
  className?: string;
  as?: "h1" | "h2" | "h3" | "p" | "span" | "div";
}

export default function NeonText({
  children,
  color = "#00f0ff",
  glowClass = "text-glow-cyan",
  className = "",
  as: Tag = "span",
}: NeonTextProps) {
  return (
    <Tag className={`${glowClass} ${className}`} style={{ color }}>
      {children}
    </Tag>
  );
}
