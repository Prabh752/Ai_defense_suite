import { useModels, useTrainModel } from "@/hooks/use-models";
import { Brain, Cpu, RefreshCw, CheckCircle, XCircle, Clock } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function Models() {
  const { data: models, isLoading } = useModels();
  const { mutate: trainModel, isPending: isTraining } = useTrainModel();
  const { toast } = useToast();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const handleTrain = (id: number, name: string) => {
    toast({
      title: "Training Initiated",
      description: `Started retraining process for ${name}`,
    });
    trainModel(id);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Machine Learning Models</h2>
        <p className="text-muted-foreground mt-2 font-mono text-sm">
          Manage and retrain anomaly detection algorithms.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {models?.map((model) => (
          <div 
            key={model.id} 
            className="group bg-card border border-border hover:border-primary/50 rounded-xl p-6 transition-all duration-300 hover:shadow-lg relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Brain className="w-24 h-24" />
            </div>

            <div className="flex items-start justify-between mb-6 relative z-10">
              <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                <Cpu className="w-6 h-6 text-primary" />
              </div>
              <div className={cn(
                "px-2.5 py-0.5 rounded-full text-xs font-bold border flex items-center gap-1.5",
                model.status === "active" ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                model.status === "training" ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20 animate-pulse" :
                "bg-red-500/10 text-red-500 border-red-500/20"
              )}>
                {model.status === "active" && <CheckCircle className="w-3 h-3" />}
                {model.status === "active" ? "ACTIVE" : model.status.toUpperCase()}
              </div>
            </div>

            <div className="space-y-4 relative z-10">
              <div>
                <h3 className="text-xl font-bold">{model.name}</h3>
                <p className="text-sm text-muted-foreground">{model.type}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 py-4 border-y border-border/50">
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Accuracy</div>
                  <div className="text-2xl font-mono font-bold text-primary">
                    {(model.accuracy ? (model.accuracy * 100).toFixed(1) : "0.0")}%
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Last Trained</div>
                  <div className="text-sm font-mono text-foreground flex items-center gap-1.5 h-full">
                    <Clock className="w-3 h-3 text-muted-foreground" />
                    {model.lastTrained ? format(new Date(model.lastTrained), "MMM d, HH:mm") : "Never"}
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleTrain(model.id, model.name)}
                disabled={isTraining || model.status === "training"}
                className="w-full py-2.5 rounded-lg border border-border bg-muted/30 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all font-medium text-sm flex items-center justify-center gap-2"
              >
                {model.status === "training" ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Training...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    Retrain Model
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
