import { Share2, Link as LinkIcon, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface ShareButtonProps {
  title: string;
  className?: string;
}

const ShareButton = ({ title, className = "" }: ShareButtonProps) => {
  const [copied, setCopied] = useState(false);
  const url = window.location.href;

  const copyLink = () => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      toast.success("Havola nusxalandi!");
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className={`flex items-center gap-2 flex-wrap ${className}`}>
      <Share2 className="w-4 h-4 text-muted-foreground" />
      <span className="text-sm text-muted-foreground">Ulashish:</span>
      <button
        onClick={copyLink}
        className="text-xs bg-accent px-3 py-1.5 rounded-full hover:bg-primary/10 transition-colors flex items-center gap-1"
      >
        {copied ? <Check className="w-3 h-3" /> : <LinkIcon className="w-3 h-3" />}
        {copied ? "Nusxalandi" : "Havolani nusxalash"}
      </button>
      <a
        href={`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs bg-accent px-3 py-1.5 rounded-full hover:bg-primary/10 transition-colors"
      >
        Telegram
      </a>
      <a
        href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs bg-accent px-3 py-1.5 rounded-full hover:bg-primary/10 transition-colors"
      >
        Twitter
      </a>
      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs bg-accent px-3 py-1.5 rounded-full hover:bg-primary/10 transition-colors"
      >
        Facebook
      </a>
    </div>
  );
};

export default ShareButton;
