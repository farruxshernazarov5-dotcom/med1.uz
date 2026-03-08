import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircleQuestion, Loader2, SkipForward } from "lucide-react";

interface Props {
  questions: string[];
  onSubmit: (answers: { question: string; answer: string }[]) => void;
  onSkip: () => void;
  isLoading: boolean;
}

const FollowUpQuestions = ({ questions, onSubmit, onSkip, isLoading }: Props) => {
  const [answers, setAnswers] = useState<Record<number, string>>({});

  const handleSubmit = () => {
    const result = questions.map((q, i) => ({ question: q, answer: answers[i] || "" })).filter((a) => a.answer.trim());
    onSubmit(result);
  };

  return (
    <div className="bg-card border border-border rounded-xl p-6 space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <MessageCircleQuestion className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Qo'shimcha savollar</h3>
          <p className="text-sm text-muted-foreground">Aniqroq natija uchun javob bering</p>
        </div>
      </div>

      <div className="space-y-4">
        {questions.map((q, i) => (
          <div key={i}>
            <label className="text-sm font-medium text-foreground mb-1.5 block">{q}</label>
            <Input
              placeholder="Javobingiz..."
              value={answers[i] || ""}
              onChange={(e) => setAnswers((prev) => ({ ...prev, [i]: e.target.value }))}
            />
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <Button onClick={handleSubmit} disabled={isLoading} className="flex-1 bg-hero-gradient text-primary-foreground">
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          Tahlilni davom ettirish
        </Button>
        <Button variant="outline" onClick={onSkip} disabled={isLoading}>
          <SkipForward className="w-4 h-4 mr-1" /> O'tkazib yuborish
        </Button>
      </div>
    </div>
  );
};

export default FollowUpQuestions;
