import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  delay?: number;
  color?: string;
}

export default function StatsCard({ title, value, icon: Icon, delay = 0, color }: StatsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="glass-card rounded-xl p-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="mt-1 text-3xl font-bold text-foreground">{value}</p>
        </div>
        <div className={`rounded-xl p-3 ${color || 'bg-primary/10 text-primary'}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </motion.div>
  );
}
