"use client";

import * as React from "react";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { parseTransactionNLP } from "@/app/actions/transaction";
import { TransactionForm, type TransactionFormInitial } from "./transaction-form";
import { Loader2, Mic, Sparkles } from "lucide-react";

export function TransactionInputModal() {
  const [open, setOpen] = React.useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [nlpText, setNlpText] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [parsedData, setParsedData] = React.useState<TransactionFormInitial>(null);

  const handleParse = async () => {
    if (!nlpText.trim()) return;
    setIsLoading(true);
    const result = await parseTransactionNLP(nlpText);
    if (result.success && result.data) {
      setParsedData(result.data);
    } else {
      // Handle error gracefully
      alert(result.error || "Failed to understand.");
    }
    setIsLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleParse();
    }
  };

  const resetState = () => {
    setNlpText("");
    setParsedData(null);
    setOpen(false);
  };

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={(val) => { setOpen(val); if (!val) resetState(); }}>
        <DialogTrigger asChild>
          <Button className="rounded-full shadow-lg gap-2 px-6">
            <Sparkles className="w-4 h-4" />
            Add Transaction
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px] translucent-surface">
          <DialogHeader>
            <DialogTitle>Log a Transaction</DialogTitle>
            <DialogDescription>
              Just tell us what you spent on or earned. Our AI will handle the rest.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col gap-4 py-4">
            {!parsedData ? (
              <div className="flex flex-col gap-2">
                <Label htmlFor="nlp" className="sr-only">Transaction Details</Label>
                <div className="relative">
                  <Input
                    id="nlp"
                    autoFocus
                    placeholder="e.g., Paid Rahul 500 for lunch"
                    value={nlpText}
                    onChange={(e) => setNlpText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="pr-10"
                    disabled={isLoading}
                  />
                  {isLoading ? (
                    <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
                  ) : (
                    <Mic className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <Button onClick={handleParse} disabled={isLoading || !nlpText.trim()}>
                  {isLoading ? "Parsing..." : "Parse"}
                </Button>
              </div>
            ) : (
              <TransactionForm 
                initialData={parsedData} 
                onSuccess={resetState}
                onCancel={() => setParsedData(null)}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={(val) => { setOpen(val); if (!val) resetState(); }}>
      <DrawerTrigger asChild>
        <Button className="rounded-full shadow-lg gap-2 px-6 fixed bottom-6 right-6 z-50">
          <Sparkles className="w-4 h-4" />
          Add
        </Button>
      </DrawerTrigger>
      <DrawerContent className="translucent-surface">
        <DrawerHeader className="text-left">
          <DrawerTitle>Log a Transaction</DrawerTitle>
          <DrawerDescription>
            Just tell us what you spent on or earned.
          </DrawerDescription>
        </DrawerHeader>
        <div className="px-4 py-2 flex flex-col gap-4">
          {!parsedData ? (
            <div className="flex flex-col gap-2">
              <Label htmlFor="nlp-mobile" className="sr-only">Transaction Details</Label>
              <div className="relative">
                <Input
                  id="nlp-mobile"
                  autoFocus
                  placeholder="e.g., Paid Rahul 500 for lunch"
                  value={nlpText}
                  onChange={(e) => setNlpText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="pr-10 text-base" 
                  disabled={isLoading}
                />
                {isLoading ? (
                  <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
                ) : (
                  <Mic className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                )}
              </div>
              <Button onClick={handleParse} disabled={isLoading || !nlpText.trim()} className="w-full">
                {isLoading ? "Parsing..." : "Parse"}
              </Button>
            </div>
          ) : (
            <TransactionForm 
              initialData={parsedData} 
              onSuccess={resetState}
              onCancel={() => setParsedData(null)}
            />
          )}
        </div>
        <DrawerFooter className="pt-2">
          {!parsedData && (
            <DrawerClose asChild>
              <Button variant="outline">Cancel</Button>
            </DrawerClose>
          )}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
