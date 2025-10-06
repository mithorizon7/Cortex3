import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { ExternalLink } from "lucide-react";

export default function Credits() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="mb-8">
          <Link href="/">
            <a className="text-primary hover:underline text-sm" data-testid="link-back-home">
              ← Back to Home
            </a>
          </Link>
        </div>

        <h1 className="text-4xl font-bold mb-4 font-display">Credits & Attributions</h1>
        <p className="text-muted-foreground mb-8 leading-relaxed">
          This platform was built with exceptional tools, libraries, and resources from the open-source community.
          We're grateful to the creators and maintainers who make projects like this possible.
        </p>

        <div className="space-y-8">
          {/* Technology Stack */}
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-2xl font-semibold mb-4 font-display">Technology Stack</h2>
              <div className="grid gap-3 text-sm">
                <CreditItem
                  title="React"
                  description="A JavaScript library for building user interfaces"
                  url="https://react.dev"
                />
                <CreditItem
                  title="TypeScript"
                  description="Typed superset of JavaScript"
                  url="https://www.typescriptlang.org"
                />
                <CreditItem
                  title="Vite"
                  description="Next generation frontend tooling"
                  url="https://vitejs.dev"
                />
                <CreditItem
                  title="Express.js"
                  description="Fast, minimalist web framework for Node.js"
                  url="https://expressjs.com"
                />
                <CreditItem
                  title="Node.js"
                  description="JavaScript runtime built on Chrome's V8 engine"
                  url="https://nodejs.org"
                />
              </div>
            </CardContent>
          </Card>

          {/* UI & Design */}
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-2xl font-semibold mb-4 font-display">UI & Design System</h2>
              <div className="grid gap-3 text-sm">
                <CreditItem
                  title="Tailwind CSS"
                  description="Utility-first CSS framework"
                  url="https://tailwindcss.com"
                />
                <CreditItem
                  title="Radix UI"
                  description="Unstyled, accessible component primitives"
                  url="https://www.radix-ui.com"
                />
                <CreditItem
                  title="shadcn/ui"
                  description="Beautifully designed components built with Radix UI and Tailwind CSS"
                  url="https://ui.shadcn.com"
                />
                <CreditItem
                  title="Lucide React"
                  description="Beautiful & consistent icon toolkit"
                  url="https://lucide.dev"
                />
                <CreditItem
                  title="Recharts"
                  description="Composable charting library built on React components"
                  url="https://recharts.org"
                />
                <CreditItem
                  title="Framer Motion"
                  description="Production-ready motion library for React"
                  url="https://www.framer.com/motion"
                />
              </div>
            </CardContent>
          </Card>

          {/* Data & Backend */}
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-2xl font-semibold mb-4 font-display">Data & Backend Services</h2>
              <div className="grid gap-3 text-sm">
                <CreditItem
                  title="Drizzle ORM"
                  description="TypeScript ORM for SQL databases"
                  url="https://orm.drizzle.team"
                />
                <CreditItem
                  title="Neon"
                  description="Serverless Postgres"
                  url="https://neon.tech"
                />
                <CreditItem
                  title="Firebase"
                  description="Authentication and backend services"
                  url="https://firebase.google.com"
                />
                <CreditItem
                  title="TanStack Query"
                  description="Powerful asynchronous state management for React"
                  url="https://tanstack.com/query"
                />
                <CreditItem
                  title="Zod"
                  description="TypeScript-first schema validation"
                  url="https://zod.dev"
                />
              </div>
            </CardContent>
          </Card>

          {/* Key Libraries */}
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-2xl font-semibold mb-4 font-display">Key Libraries</h2>
              <div className="grid gap-3 text-sm">
                <CreditItem
                  title="React Hook Form"
                  description="Performant, flexible forms with easy validation"
                  url="https://react-hook-form.com"
                />
                <CreditItem
                  title="Wouter"
                  description="Minimalist routing for React"
                  url="https://github.com/molefrog/wouter"
                />
                <CreditItem
                  title="DOMPurify"
                  description="XSS sanitizer for HTML"
                  url="https://github.com/cure53/DOMPurify"
                />
                <CreditItem
                  title="jsPDF"
                  description="Client-side JavaScript PDF generation"
                  url="https://github.com/parallax/jsPDF"
                />
                <CreditItem
                  title="date-fns"
                  description="Modern JavaScript date utility library"
                  url="https://date-fns.org"
                />
              </div>
            </CardContent>
          </Card>

          {/* Creative Assets */}
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-2xl font-semibold mb-4 font-display">Creative Assets</h2>
              <div className="grid gap-3 text-sm">
                <div className="flex items-start space-x-2">
                  <div className="flex-1">
                    <p className="text-foreground">
                      <a 
                        href="https://www.flaticon.com/free-animated-icons/brain" 
                        title="brain animated icons"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline inline-flex items-center gap-1"
                        data-testid="link-credit-flaticon"
                      >
                        Brain animated icons created by Freepik - Flaticon
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security & Infrastructure */}
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-2xl font-semibold mb-4 font-display">Security & Infrastructure</h2>
              <div className="grid gap-3 text-sm">
                <CreditItem
                  title="Helmet.js"
                  description="Security middleware for Express applications"
                  url="https://helmetjs.github.io"
                />
                <CreditItem
                  title="Passport.js"
                  description="Authentication middleware for Node.js"
                  url="https://www.passportjs.org"
                />
                <CreditItem
                  title="express-rate-limit"
                  description="Rate limiting middleware for Express"
                  url="https://github.com/express-rate-limit/express-rate-limit"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-12 p-6 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground text-center">
            Built with care using open-source technologies. Thank you to all the maintainers and contributors
            who make the web a better place.
          </p>
        </div>
      </div>
    </div>
  );
}

interface CreditItemProps {
  title: string;
  description: string;
  url: string;
}

function CreditItem({ title, description, url }: CreditItemProps) {
  return (
    <div className="flex items-start space-x-2">
      <div className="flex-1">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline font-medium inline-flex items-center gap-1"
          data-testid={`link-credit-${title.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
        >
          {title}
          <ExternalLink className="h-3 w-3" />
        </a>
        <p className="text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
