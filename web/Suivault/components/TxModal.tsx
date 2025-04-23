import { ReactNode } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  title: string;
  submitButtonText: string;
  submitDisabled?: boolean;
  children: ReactNode;
}

export function TransactionModal({
  isOpen,
  onClose,
  onSubmit,
  title,
  submitButtonText,
  submitDisabled = false,
  children,
}: TransactionModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          {children}
        </div>
        <DialogFooter className="flex space-x-2 justify-end">
          <Button variant="outline" onClick={onClose}>取消</Button>
          <Button 
            onClick={onSubmit} 
            disabled={submitDisabled}
          >
            {submitButtonText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}