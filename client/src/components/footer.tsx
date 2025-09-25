import openLearningLogo from "@assets/Open-Learning-logo-revised copy_1758821069106.png";

export function Footer() {
  return (
    <footer className="w-full py-6 mt-auto border-t bg-background" data-testid="footer">
      <div className="container mx-auto px-4">
        <div className="flex justify-center items-center">
          <img 
            src={openLearningLogo} 
            alt="Open Learning" 
            className="h-8 w-auto"
            data-testid="footer-logo"
          />
        </div>
      </div>
    </footer>
  );
}