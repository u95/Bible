import { StrictMode, Component, ErrorInfo, ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Window level uncaught error handler to catch script loading/initialization issues
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    const rootEl = document.getElementById('root');
    if (rootEl && (rootEl.innerHTML === '' || rootEl.innerHTML.trim() === '')) {
      rootEl.innerHTML = `
        <div style="padding: 24px; color: #f87171; background-color: #0f172a; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; min-height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center;">
          <div style="max-w-xl p-6 bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl">
            <h2 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 12px; color: #ffffff;">பயன்பாட்டை ஏற்றுவதில் பிழை (Application Load Error)</h2>
            <p style="font-size: 0.875rem; color: #94a3b8; margin-bottom: 16px;"> browser-ல் ஏற்பட்ட ஏதேனும் தற்காலிக பிழையாக இருக்கலாம். கீழே உள்ள பட்டனை கிளிக் செய்து சரிசெய்யவும்:</p>
            <pre style="text-align: left; background: #020617; padding: 12px; rounded: 8px; font-size: 11px; overflow-x: auto; border: 1px solid #1e293b; max-height: 150px; color: #ef4444; margin-bottom: 20px; white-space: pre-wrap;">${event.message}\nat ${event.filename}:${event.lineno}:${event.colno}</pre>
            <button onclick="localStorage.clear(); window.location.reload();" style="background-color: #2563eb; color: #ffffff; font-weight: 600; padding: 10px 20px; border-radius: 12px; border: none; cursor: pointer; transition: background 0.2s;">
              தரவை அழித்து மீண்டும் ஏற்றவும் (Clear Data & Reload)
            </button>
          </div>
        </div>
      `;
    }
  });
}

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught react error:", error, errorInfo);
  }

  public render() {
    if ((this as any).state.hasError) {
      return (
        <div style={{ padding: '24px', color: '#f87171', backgroundColor: '#0f172a', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
          <div style={{ maxWidth: '600px', padding: '24px', backgroundColor: '#1e293b', borderRadius: '16px', border: '1px solid #334155', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.25)' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '12px', color: '#ffffff' }}>பயன்பாட்டில் பிழை ஏற்பட்டுள்ளது (Application Render Error)</h2>
            <p style={{ fontSize: '0.875rem', color: '#94a3b8', marginBottom: '16px' }}>கீழே உள்ள விவரங்களைச் சரிபார்த்து, தரவை அழித்து மீண்டும் ஏற்ற முயற்சிக்கவும்:</p>
            <pre style={{ textAlign: 'left', background: '#020617', padding: '12px', borderRadius: '8px', fontSize: '11px', overflowX: 'auto', border: '1px solid #1e293b', maxHeight: '150px', color: '#ef4444', marginBottom: '20px', whiteSpace: 'pre-wrap' }}>
              {(this as any).state.error?.toString()}
              {"\n"}
              {(this as any).state.error?.stack}
            </pre>
            <button onClick={() => { localStorage.clear(); window.location.reload(); }} style={{ backgroundColor: '#2563eb', color: '#ffffff', fontWeight: 600, padding: '10px 20px', borderRadius: '12px', border: 'none', cursor: 'pointer' }}>
              தரவை அழித்து மீண்டும் ஏற்றவும் (Clear Data & Reload)
            </button>
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
