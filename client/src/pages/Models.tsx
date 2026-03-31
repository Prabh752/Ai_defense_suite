import { useModels, useTrainModel } from "@/hooks/use-models";
import { Brain, Cpu, RefreshCw, CheckCircle, AlertCircle, Clock } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useIDSStore } from "@/store";

const MODEL_DESCRIPTIONS: Record<string, string> = {
  "Random Forest Classifier": "Ensemble method using multiple decision trees. Excellent for tabular traffic features with high interpretability.",
  "Deep Autoencoder": "Unsupervised neural network that learns normal traffic patterns and flags deviations as anomalies.",
  "LSTM Network": "Sequence-aware recurrent architecture that detects temporal attack patterns like slow DDoS and port sweep chains.",
};

export default function Models() {
  const { data: models, isLoading } = useModels();
  const { mutate: trainModel, isPending: isTraining } = useTrainModel();
  const modelStatuses = useIDSStore((s) => s.modelStatuses);

  const handleTrain = (id: number, name: string) => {
    toast.info(`Training initiated for ${name}`, {
      description: "Model will be active again in ~5 seconds",
      duration: 4000,
    });
    trainModel(id);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-8"
    >
      <div>
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <Brain className="w-7 h-7 text-primary" />
          Machine Learning Models
        </h2>
        <p className="text-muted-foreground mt-2 font-mono text-sm">
          Manage and retrain anomaly detection algorithms. Status updates via WebSocket.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {models?.map((model, i) => {
          const liveStatus = modelStatuses[model.id] || model.status;
          const isCurrentlyTraining = liveStatus === "training";

          return (
            <motion.div
              key={model.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="group bg-card border border-border hover:border-primary/40 rounded-xl p-6 transition-all duration-300 relative overflow-hidden"
              style={{
                boxShadow: isCurrentlyTraining ? "0 0 30px -8px hsl(var(--primary) / 0.2)" : undefined,
              }}
            >
              {isCurrentlyTraining && (
                <motion.div
                  className="absolute inset-0 border-2 border-primary/20 rounded-xl pointer-events-none"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              )}

              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Brain className="w-28 h-28" />
              </div>

              <div className="flex items-start justify-between mb-5 relative z-10">
                <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                  <Cpu className="w-5 h-5 text-primary" />
                </div>
                <div className={cn(
                  "px-2.5 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5",
                  liveStatus === "active" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                  liveStatus === "training" ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" :
                  "bg-red-500/10 text-red-400 border-red-500/20"
                )}>
                  {liveStatus === "active" && <CheckCircle className="w-3 h-3" />}
                  {liveStatus === "training" && <RefreshCw className="w-3 h-3 animate-spin" />}
                  {liveStatus === "inactive" && <AlertCircle className="w-3 h-3" />}
                  {liveStatus.toUpperCase()}
                </div>
              </div>

              <div className="space-y-4 relative z-10">
                <div>
                  <h3 className="text-lg font-bold">{model.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{model.type}</p>
                  <p className="text-xs text-muted-foreground/70 mt-2 leading-relaxed">
                    {MODEL_DESCRIPTIONS[model.name]}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 py-4 border-y border-border/40">
                  <div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1 font-mono">Accuracy</div>
                    <div className="text-2xl font-mono font-bold text-primary">
                      {(model.accuracy ? (model.accuracy * 100).toFixed(1) : "0.0")}%
                    </div>
                    <div className="mt-1.5 h-1 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-primary rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${(model.accuracy || 0) * 100}%` }}
                        transition={{ duration: 0.8, delay: i * 0.1 }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1 font-mono">Last Trained</div>
                    <div className="text-sm font-mono flex items-center gap-1.5 mt-1">
                      <Clock className="w-3 h-3 text-muted-foreground" />
                      {model.lastTrained ? format(new Date(model.lastTrained), "MMM d, HH:mm") : "Never"}
                    </div>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleTrain(model.id, model.name)}
                  disabled={isTraining || isCurrentlyTraining}
                  data-testid={`button-train-${model.id}`}
                  className={cn(
                    "w-full py-2.5 rounded-lg border transition-all font-medium text-sm flex items-center justify-center gap-2",
                    isCurrentlyTraining
                      ? "border-yellow-500/30 text-yellow-400 bg-yellow-500/5 cursor-not-allowed"
                      : "border-border bg-muted/20 hover:bg-primary hover:text-primary-foreground hover:border-primary"
                  )}
                >
                  {isCurrentlyTraining ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Training in progress...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4" />
                      Retrain Model
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
