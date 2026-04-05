import { useState } from 'react';

interface ClockPickerProps {
  selectedSlots: string[];
  onToggleSlot: (slot: string) => void;
}

const HOURS = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const CX = 150, CY = 150;
const HOUR_LABEL_R = 120;
const DOT_00_R = 96;
const DOT_30_R = 70;

function getAngle(hourIndex: number, offsetDeg = 0) {
  return ((hourIndex * 30 + offsetDeg - 90) * Math.PI) / 180;
}

function polar(r: number, angle: number) {
  return { x: CX + r * Math.cos(angle), y: CY + r * Math.sin(angle) };
}

export default function ClockPicker({ selectedSlots, onToggleSlot }: ClockPickerProps) {
  const [ampm, setAmpm] = useState<'AM' | 'PM'>('AM');

  const handleSelectAll = () => {
    HOURS.forEach(h => {
      ['00', '30'].forEach(m => {
        const slot = `${h}:${m} ${ampm}`;
        if (!selectedSlots.includes(slot)) onToggleSlot(slot);
      });
    });
  };

  const handleClearAmpm = () => {
    HOURS.forEach(h => {
      ['00', '30'].forEach(m => {
        const slot = `${h}:${m} ${ampm}`;
        if (selectedSlots.includes(slot)) onToggleSlot(slot);
      });
    });
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Viewing:</span>
        <div className="flex rounded-md overflow-hidden border border-border">
          <button
            onClick={() => setAmpm('AM')}
            className={`px-4 py-1 text-sm font-medium transition-colors ${ampm === 'AM' ? 'bg-primary text-primary-foreground' : 'bg-background text-foreground hover:bg-muted'}`}
          >AM</button>
          <button
            onClick={() => setAmpm('PM')}
            className={`px-4 py-1 text-sm font-medium transition-colors ${ampm === 'PM' ? 'bg-primary text-primary-foreground' : 'bg-background text-foreground hover:bg-muted'}`}
          >PM</button>
        </div>
      </div>

      <div className="relative">
        <svg width="300" height="300" viewBox="0 0 300 300" className="select-none">
          <circle cx={CX} cy={CY} r={140} fill="hsl(var(--card))" stroke="hsl(var(--border))" strokeWidth="2" />
          <circle cx={CX} cy={CY} r={DOT_00_R} fill="none" stroke="hsl(var(--border))" strokeWidth="1" strokeDasharray="2 4" opacity="0.5" />
          <circle cx={CX} cy={CY} r={DOT_30_R} fill="none" stroke="hsl(var(--border))" strokeWidth="1" strokeDasharray="2 4" opacity="0.5" />
          <text x={CX} y={CY - 10} textAnchor="middle" dominantBaseline="middle" fontSize="9" fill="hsl(var(--muted-foreground))">outer = :00</text>
          <text x={CX} y={CY + 8} textAnchor="middle" dominantBaseline="middle" fontSize="9" fill="hsl(var(--muted-foreground))">inner = :30</text>

          {HOURS.map((h, i) => {
            const labelAngle = getAngle(i);
            const dot00Angle = getAngle(i);
            const dot30Angle = getAngle(i, 15);
            const labelPos = polar(HOUR_LABEL_R, labelAngle);
            const pos00 = polar(DOT_00_R, dot00Angle);
            const pos30 = polar(DOT_30_R, dot30Angle);
            const slot00 = `${h}:00 ${ampm}`;
            const slot30 = `${h}:30 ${ampm}`;
            const sel00 = selectedSlots.includes(slot00);
            const sel30 = selectedSlots.includes(slot30);

            return (
              <g key={h}>
                <text x={labelPos.x} y={labelPos.y} textAnchor="middle" dominantBaseline="middle" fontSize="13" fontWeight="700" fill="hsl(var(--foreground))">{h}</text>
                <line x1={polar(HOUR_LABEL_R - 12, dot00Angle).x} y1={polar(HOUR_LABEL_R - 12, dot00Angle).y} x2={polar(DOT_00_R + 13, dot00Angle).x} y2={polar(DOT_00_R + 13, dot00Angle).y} stroke="hsl(var(--border))" strokeWidth="1" opacity="0.5" />
                <circle cx={pos00.x} cy={pos00.y} r={13} fill={sel00 ? 'hsl(var(--primary))' : 'hsl(var(--background))'} stroke={sel00 ? 'hsl(var(--primary))' : 'hsl(var(--border))'} strokeWidth="1.5" style={{ cursor: 'pointer' }} onClick={() => onToggleSlot(slot00)} />
                <text x={pos00.x} y={pos00.y} textAnchor="middle" dominantBaseline="middle" fontSize="7" fontWeight="600" fill={sel00 ? 'hsl(var(--primary-foreground))' : 'hsl(var(--muted-foreground))'} style={{ pointerEvents: 'none' }}>:00</text>
                <circle cx={pos30.x} cy={pos30.y} r={13} fill={sel30 ? 'hsl(var(--primary))' : 'hsl(var(--background))'} stroke={sel30 ? 'hsl(var(--primary))' : 'hsl(var(--border))'} strokeWidth="1.5" style={{ cursor: 'pointer' }} onClick={() => onToggleSlot(slot30)} />
                <text x={pos30.x} y={pos30.y} textAnchor="middle" dominantBaseline="middle" fontSize="7" fontWeight="600" fill={sel30 ? 'hsl(var(--primary-foreground))' : 'hsl(var(--muted-foreground))'} style={{ pointerEvents: 'none' }}>:30</text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="flex gap-3 text-xs">
        <button onClick={handleSelectAll} className="text-primary underline underline-offset-2 hover:opacity-70">Select all {ampm}</button>
        <span className="text-muted-foreground">·</span>
        <button onClick={handleClearAmpm} className="text-muted-foreground underline underline-offset-2 hover:opacity-70">Clear {ampm}</button>
      </div>

      {selectedSlots.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {selectedSlots.length} slot{selectedSlots.length !== 1 ? 's' : ''} selected total
        </p>
      )}
    </div>
  );
}
