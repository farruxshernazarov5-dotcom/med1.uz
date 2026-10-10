import { Component, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { errorTracker } from "@/lib/errorTracker";

interface Props { children: ReactNode; fallback?: ReactNode; }
interface State { hasError: boolean; error?: Error; }

class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info.componentStack);
    errorTracker.capture(error, { componentStack: info.componentStack?.slice(0, 1500) });
  }

  isChunkError = () => /dynamically imported module|Importing a module script failed|Loading chunk/i.test(this.state.error?.message ?? "");

  handleReset = () => {
    // A failed page download stays cached by React; only a full reload fetches the new version.
    if (this.isChunkError()) { window.location.reload(); return; }
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="flex flex-col items-center justify-center min-h-[200px] p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6 text-destructive" />
          </div>
          <h3 className="font-heading font-semibold text-foreground mb-2">Xatolik yuz berdi</h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-md">
            {this.isChunkError()
              ? "Ilovaning yangi versiyasi chiqdi. Davom etish uchun sahifani yangilang."
              : this.state.error?.message || "Kutilmagan xatolik. Sahifani yangilang."}
          </p>
          <Button variant="outline" size="sm" onClick={this.handleReset}>
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> {this.isChunkError() ? "Yangilash" : "Qayta urinish"}
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
