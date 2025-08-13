import React from 'react';

interface TableProps {
  children: React.ReactNode;
  className?: string;
}

interface THeadProps {
  children: React.ReactNode;
}

interface TBodyProps {
  children: React.ReactNode;
}

interface TRProps {
  children: React.ReactNode;
  className?: string;
}

interface THProps {
  children: React.ReactNode;
  className?: string;
}

interface TDProps {
  children: React.ReactNode;
  className?: string;
}

export function Table({ children, className = '' }: TableProps) {
  return (
    <div className="table-container">
      <table className={`table ${className}`}>
        {children}
      </table>
    </div>
  );
}

export function THead({ children }: THeadProps) {
  return <thead className="thead">{children}</thead>;
}

export function TBody({ children }: TBodyProps) {
  return <tbody className="tbody">{children}</tbody>;
}

export function TR({ children, className = '' }: TRProps) {
  return <tr className={`tr ${className}`}>{children}</tr>;
}

export function TH({ children, className = '' }: THProps) {
  return <th className={`th ${className}`}>{children}</th>;
}

export function TD({ children, className = '' }: TDProps) {
  return <td className={`td ${className}`}>{children}</td>;
}
