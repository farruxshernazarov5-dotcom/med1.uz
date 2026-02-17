import { Link } from "react-router-dom";
import { Home, ChevronRight } from "lucide-react";

interface BackToHomeProps {
  current: string;
}

const BackToHome = ({ current }: BackToHomeProps) => {
  return (
    <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
      <Link to="/" className="flex items-center gap-1 hover:text-primary transition-colors">
        <Home className="w-4 h-4" />
        <span>Bosh sahifa</span>
      </Link>
      <ChevronRight className="w-3 h-3" />
      <span className="text-foreground font-medium">{current}</span>
    </nav>
  );
};

export default BackToHome;
