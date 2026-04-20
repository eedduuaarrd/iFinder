import React from "react";
import { Link, useLocation } from "wouter";
import { useGetHuntItems } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { Camera, Check, Target, AlertTriangle } from "lucide-react";

export default function Hunt() {
  const [, setLocation] = useLocation();
  const { data: items, isLoading } = useGetHuntItems();

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  };

  return (
    <div className="pb-24">
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold font-mono text-primary uppercase tracking-tighter">THIS WEEK</h1>
          <p className="text-muted-foreground uppercase font-mono text-sm mt-1">10 TARGETS // FIND THEM</p>
        </div>
        <div className="text-right">
          <span className="font-mono text-2xl font-bold">{items?.filter(i => i.found).length || 0}/10</span>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full bg-card rounded-none" />
          ))}
        </div>
      ) : (
        <motion.div 
          className="space-y-4"
          variants={container}
          initial="hidden"
          animate="show"
        >
          {items?.map((huntItem) => (
            <motion.div key={huntItem.id} variants={item}>
              <Card 
                className={`border-2 rounded-none p-4 transition-all ${
                  huntItem.found 
                    ? "border-primary/50 bg-card shadow-[4px_4px_0px_0px_rgba(204,255,0,0.2)] opacity-70" 
                    : "border-primary bg-card cursor-pointer shadow-[4px_4px_0px_0px_hsl(var(--primary))] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_0px_hsl(var(--primary))]"
                }`}
                onClick={() => !huntItem.found && setLocation(`/camera/${huntItem.id}`)}
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-bold text-xl uppercase tracking-tight flex items-center gap-2">
                    {huntItem.found && <Check className="text-primary w-5 h-5" />}
                    <span className={huntItem.found ? "line-through text-muted-foreground" : ""}>{huntItem.name}</span>
                  </h3>
                  <Badge variant="outline" className={`rounded-none border-2 font-mono text-sm ${huntItem.found ? 'text-muted-foreground border-muted-foreground' : 'text-primary border-primary'}`}>
                    {huntItem.points} PT
                  </Badge>
                </div>
                
                <p className={`text-sm mb-4 ${huntItem.found ? "text-muted-foreground" : "text-foreground"}`}>
                  {huntItem.description}
                </p>

                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="rounded-none font-mono text-xs uppercase bg-secondary text-secondary-foreground">
                    {huntItem.difficulty}
                  </Badge>
                  {huntItem.requiredColor && (
                    <Badge variant="outline" className="rounded-none font-mono text-xs uppercase border-foreground">
                      COLOR: {huntItem.requiredColor}
                    </Badge>
                  )}
                  {huntItem.found && huntItem.foundAt && (
                    <Badge variant="outline" className="rounded-none font-mono text-xs uppercase border-muted-foreground text-muted-foreground ml-auto">
                      FOUND
                    </Badge>
                  )}
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
