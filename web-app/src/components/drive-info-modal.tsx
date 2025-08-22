import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface DriveInfoModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DriveInfoModal({ isOpen, onOpenChange }: DriveInfoModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Your Coach Files in Google Drive</DialogTitle>
          <DialogDescription>
            A simple and secure way to help your AI coach understand you better
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div>
            <p className="text-sm text-muted-foreground">
              We create a special "Coach Files" folder in your Google Drive where you can upload personal information that helps your AI coach provide more personalized guidance.
            </p>
          </div>
          
          <div className="bg-muted p-3 rounded-md">
            <h3 className="text-sm font-medium mb-2">🔒 Privacy First</h3>
            <p className="text-sm text-muted-foreground">
              We can only access the "Coach Files" folder we create. Your other Google Drive files remain completely private and inaccessible to us.
            </p>
          </div>
          
          <div>
            <p className="text-sm text-muted-foreground">
              You maintain full control of your data and can disconnect Google Drive access at any time.
            </p>
          </div>
        </div>
        
        <div className="flex justify-end">
          <Button 
            variant="secondary" 
            onClick={() => onOpenChange(false)}
          >
            Got it
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}