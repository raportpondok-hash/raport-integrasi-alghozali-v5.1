import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 24, fontFamily: 'system-ui, sans-serif', maxWidth: 800, margin: '40px auto', background: '#fff', borderRadius: 16, boxShadow: '0 10px 25px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#dc2626', fontSize: 20, fontWeight: 'bold' }}>!</div>
            <div>
              <h2 style={{ margin: 0, color: '#991b1b', fontSize: 18 }}>Terjadi Kendala Memuat Aplikasi</h2>
              <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 13 }}>Sistem menangkap pesan error berikut:</p>
            </div>
          </div>
          <pre style={{ background: '#f8fafc', color: '#b91c1c', padding: 16, borderRadius: 10, overflowX: 'auto', fontSize: 12, border: '1px solid #f1f5f9', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {this.state.error?.toString()}
            {'\n'}
            {this.state.errorInfo?.componentStack}
          </pre>
          <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
            <button
              onClick={() => window.location.reload()}
              style={{ padding: '10px 20px', background: '#174D3A', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold', fontSize: 13 }}
            >
              Muat Ulang Halaman
            </button>
            <button
              onClick={() => {
                localStorage.clear();
                window.location.reload();
              }}
              style={{ padding: '10px 20px', background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold', fontSize: 13 }}
            >
              Hapus Cache & Reset
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
