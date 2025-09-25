import openLearningLogo from "@assets/Open-Learning-logo-revised copy_1758821069106.png";
import { Link } from "wouter";

export function Footer() {
  return (
    <footer className="w-full py-6 mt-auto border-t bg-background" data-testid="footer">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center space-y-3">
          <img 
            src={openLearningLogo} 
            alt="Open Learning" 
            className="h-8 w-auto"
            data-testid="footer-logo"
          />
          <Link 
            to="/decide"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors underline"
            data-testid="footer-options-studio-link"
          >
            Options Studio
          </Link>
        </div>
      </div>
    </footer>
  );
}