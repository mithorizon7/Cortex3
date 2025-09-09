import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import ProgressHeader from "@/components/progress-header";
import { contextProfileSchema, type ContextProfile } from "@shared/schema";
import { CONTEXT_ITEMS } from "@/lib/cortex";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function ContextProfilePage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  const form = useForm<ContextProfile>({
    resolver: zodResolver(contextProfileSchema),
    defaultValues: {
      regulatory_intensity: 2,
      data_sensitivity: 2,
      safety_criticality: 2,
      brand_exposure: 2,
      clock_speed: 2,
      latency_edge: 1,
      scale_throughput: 2,
      data_advantage: 2,
      build_readiness: 2,
      finops_priority: 2,
      procurement_constraints: false,
      edge_operations: false,
    }
  });

  const createAssessment = useMutation({
    mutationFn: async (contextProfile: ContextProfile) => {
      const response = await apiRequest("POST", "/api/assessments", { contextProfile });
      return response.json();
    },
    onSuccess: (data) => {
      navigate(`/pulse-check/${data.id}`);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to save context profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ContextProfile) => {
    createAssessment.mutate(data);
  };

  return (
    <div className="min-h-screen bg-background">
      <ProgressHeader currentStep={1} />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Context Profile</h1>
          <p className="text-muted-foreground">
            Help us understand your organization's AI context to provide tailored guidance and gate recommendations.
          </p>
        </div>

        <Card>
          <CardContent className="p-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="grid gap-8">
                  {CONTEXT_ITEMS.map((item) => (
                    <FormField
                      key={item.key}
                      control={form.control}
                      name={item.key as keyof ContextProfile}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-medium">
                            {item.label}
                          </FormLabel>
                          <p className="text-sm text-muted-foreground mb-3">
                            {item.description}
                          </p>
                          <FormControl>
                            {item.type === 'slider' ? (
                              <div className="space-y-3">
                                <Slider
                                  min={0}
                                  max={4}
                                  step={1}
                                  value={[field.value as number]}
                                  onValueChange={(value) => field.onChange(value[0])}
                                  className="w-full"
                                  data-testid={`slider-${item.key}`}
                                />
                                <div className="flex justify-between text-xs text-muted-foreground">
                                  <span>None (0)</span>
                                  <span>Low (1)</span>
                                  <span>Medium (2)</span>
                                  <span>High (3)</span>
                                  <span>Critical (4)</span>
                                </div>
                                <div className="text-center">
                                  <span className="inline-block bg-muted text-muted-foreground px-2 py-1 rounded text-sm">
                                    Current: {field.value}/4
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center space-x-2">
                                <Switch
                                  checked={field.value as boolean}
                                  onCheckedChange={field.onChange}
                                  data-testid={`switch-${item.key}`}
                                />
                                <span className="text-sm">
                                  {field.value ? 'Yes' : 'No'}
                                </span>
                              </div>
                            )}
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ))}
                </div>

                <div className="flex justify-end pt-6 border-t border-border">
                  <Button 
                    type="submit" 
                    size="lg"
                    disabled={createAssessment.isPending}
                    data-testid="button-continue-to-pulse"
                  >
                    {createAssessment.isPending ? "Saving..." : "Continue to Pulse Check"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
