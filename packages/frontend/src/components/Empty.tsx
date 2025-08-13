interface EmptyProps {
  icon?: string;
  title: string;
  message: string;
  action?: React.ReactNode;
}

export function Empty({ icon = '🐕', title, message, action }: EmptyProps) {
  return (
    <div className="empty">
      <div className="empty-icon">{icon}</div>
      <h3 className="empty-title">{title}</h3>
      <p className="empty-message">{message}</p>
      {action && <div style={{ marginTop: '16px' }}>{action}</div>}
    </div>
  );
}
