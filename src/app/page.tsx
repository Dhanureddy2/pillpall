'use client';

import { useState, useId, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { commonMedications } from '@/lib/medications';
import { getInteractionAnalysis } from './actions';
import { PlusCircle, XCircle, FlaskConical, BotMessageSquare, AlertTriangle } from 'lucide-react';

interface Medication {
  id: string;
  name: string;
  dosage: string;
}

interface AnalysisResult {
  summary: string | null;
  error: string | null;
}

let medIdCounter = 0;

export default function Home() {
  const idPrefix = useId();
  const [medications, setMedications] = useState<Medication[]>([{ id: `${idPrefix}-${medIdCounter++}`, name: '', dosage: '' }]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [activeInput, setActiveInput] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const { toast } = useToast();
  const inputRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      let isOutside = true;
      inputRefs.current.forEach((ref) => {
        if (ref && ref.contains(event.target as Node)) {
          isOutside = false;
        }
      });
      if (isOutside) {
        setActiveInput(null);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleAddMedication = () => {
    setMedications([...medications, { id: `${idPrefix}-${medIdCounter++}`, name: '', dosage: '' }]);
  };

  const handleRemoveMedication = (id: string) => {
    setMedications(medications.filter((med) => med.id !== id));
  };

  const handleMedicationChange = (id: string, field: 'name' | 'dosage', value: string) => {
    const newMedications = medications.map((med) => (med.id === id ? { ...med, [field]: value } : med));
    setMedications(newMedications);

    if (field === 'name') {
      if (value) {
        const filteredSuggestions = commonMedications
          .filter((m) => m.toLowerCase().startsWith(value.toLowerCase()))
          .slice(0, 5);
        setSuggestions(filteredSuggestions);
        setActiveInput(id);
      } else {
        setSuggestions([]);
        setActiveInput(null);
      }
    }
  };

  const handleSuggestionClick = (id: string, suggestion: string) => {
    handleMedicationChange(id, 'name', suggestion);
    setSuggestions([]);
    setActiveInput(null);
  };

  const handleSubmit = async () => {
    const filledMedications = medications.filter((med) => med.name.trim() && med.dosage.trim());
    if (filledMedications.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Input Required',
        description: 'Please add at least one medication and dosage.',
      });
      return;
    }

    setIsLoading(true);
    setResult(null);

    const analysisInput = {
      medications: filledMedications.map(({ name, dosage }) => ({ name, dosage })),
    };

    const response = await getInteractionAnalysis(analysisInput);

    if (response.error) {
      toast({
        variant: 'destructive',
        title: 'Analysis Failed',
        description: response.error,
      });
    }

    setResult(response);
    setIsLoading(false);
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-2xl mx-auto">
        <header className="text-center mb-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 mb-2"
          >
            <BotMessageSquare className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold tracking-tight text-foreground">PillPal AI</h1>
          </motion.div>
          <motion.p
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-muted-foreground"
          >
            Your AI-powered drug interaction assistant.
          </motion.p>
        </header>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Drug Interaction Checker</CardTitle>
            <CardDescription>Enter the medications and dosages you'd like to check.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <AnimatePresence>
                {medications.map((med, index) => (
                  <motion.div
                    key={med.id}
                    layout
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
                    className="flex items-end gap-2"
                    ref={(el) => inputRefs.current.set(med.id, el)}
                  >
                    <div className="grid gap-1.5 flex-grow relative">
                      <Label htmlFor={`med-name-${med.id}`}>Medication Name</Label>
                      <Input
                        id={`med-name-${med.id}`}
                        placeholder="e.g., Lisinopril"
                        value={med.name}
                        onChange={(e) => handleMedicationChange(med.id, 'name', e.target.value)}
                        onFocus={() => {
                           setActiveInput(med.id);
                           if(med.name) {
                            const filteredSuggestions = commonMedications
                              .filter((m) => m.toLowerCase().startsWith(med.name.toLowerCase()))
                              .slice(0, 5);
                            setSuggestions(filteredSuggestions);
                           }
                        }}
                        autoComplete="off"
                      />
                      {activeInput === med.id && suggestions.length > 0 && (
                        <div className="absolute top-full mt-1 w-full bg-card border border-border rounded-md shadow-lg z-10">
                          {suggestions.map((suggestion) => (
                            <div
                              key={suggestion}
                              className="p-2 hover:bg-accent cursor-pointer text-sm"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                handleSuggestionClick(med.id, suggestion)
                              }}
                            >
                              {suggestion}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="grid gap-1.5 w-32">
                      <Label htmlFor={`med-dosage-${med.id}`}>Dosage</Label>
                      <Input
                        id={`med-dosage-${med.id}`}
                        placeholder="e.g., 10mg"
                        value={med.dosage}
                        onChange={(e) => handleMedicationChange(med.id, 'dosage', e.target.value)}
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveMedication(med.id)}
                      className="text-muted-foreground hover:text-destructive shrink-0"
                      aria-label="Remove medication"
                    >
                      <XCircle className="h-5 w-5" />
                    </Button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            <Button variant="link" onClick={handleAddMedication} className="mt-4 p-0 h-auto">
              <PlusCircle className="h-4 w-4 mr-2" />
              Add another medication
            </Button>
          </CardContent>
          <CardFooter>
            <Button onClick={handleSubmit} disabled={isLoading} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
              {isLoading ? 'Analyzing...' : 'Check Interactions'}
            </Button>
          </CardFooter>
        </Card>

        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mt-8"
            >
              <Card>
                <CardHeader className="flex flex-row items-center gap-2">
                  <Skeleton className="h-6 w-6 rounded-full" />
                  <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </CardContent>
              </Card>
            </motion.div>
          )}

          {result && !isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8"
            >
              <Card
                className={result.error ? "border-destructive/50" : "border-primary/50"}
              >
                <CardHeader className="flex flex-row items-center gap-3">
                  {result.error ? (
                    <AlertTriangle className="h-6 w-6 text-destructive" />
                  ) : (
                    <FlaskConical className="h-6 w-6 text-primary" />
                  )}
                  <CardTitle className={result.error ? "text-destructive" : "text-foreground"}>
                    {result.error ? 'An Error Occurred' : 'AI Analysis Result'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-foreground whitespace-pre-wrap">
                    {result.summary || result.error}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
