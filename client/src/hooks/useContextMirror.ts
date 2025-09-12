import { useEffect, useState } from "react";
import type { ContextMirror } from "../../../shared/schema";

export function useContextMirror(assessmentId: string) {
  const [data, setData] = useState<ContextMirror | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!assessmentId) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    
    const fetchContextMirror = async () => {
      try {
        const response = await fetch("/api/insight/context-mirror", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ assessmentId })
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch context mirror: ${response.status}`);
        }

        const json = await response.json();
        
        if (isMounted) {
          setData(json);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error("Unknown error"));
          setLoading(false);
        }
      }
    };

    fetchContextMirror();

    return () => {
      isMounted = false;
    };
  }, [assessmentId]);

  return { data, loading, error };
}