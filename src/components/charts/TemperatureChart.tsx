import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ReferenceArea,
  Dot,
} from 'recharts';
import { ExcursionEvent, TemperatureReading } from '../../types';

interface TemperatureChartProps {
  readings: TemperatureReading[];
  minTemp: number;
  maxTemp: number;
  events: ExcursionEvent[];
  selectedEventId?: string | null;
  onSelectEvent?: (eventId: string | null) => void;
  height?: number;
}

export const TemperatureChart: React.FC<TemperatureChartProps> = ({
  readings,
  minTemp,
  maxTemp,
  events,
  selectedEventId,
  onSelectEvent,
  height = 360,
}) => {
  // Format data points for Recharts
  const chartData = useMemo(() => {
    return readings.map((r, idx) => {
      // short time for x-axis
      const shortTime = r.timestamp.includes(' ')
        ? r.timestamp.split(' ')[1]
        : r.timestamp.slice(11, 16);

      return {
        index: idx,
        id: r.id,
        timestamp: r.timestamp,
        timeLabel: shortTime,
        temperature: r.temperature,
        classification: r.classification,
        deviation: r.deviation,
        eventId: r.eventId,
        isValid: r.isValid,
        qualityNote: r.qualityNote,
        isOut:
          r.classification === 'HIGH_EXCURSION' || r.classification === 'LOW_EXCURSION',
        isWarning:
          r.classification === 'WARNING_HIGH' || r.classification === 'WARNING_LOW',
      };
    });
  }, [readings]);

  // Determine Y domain with comfortable margin
  const yDomain = useMemo(() => {
    const validTemps = readings
      .filter((r) => r.temperature !== null)
      .map((r) => r.temperature!);

    if (validTemps.length === 0) return [minTemp - 5, maxTemp + 5];

    const actualMin = Math.min(...validTemps, minTemp);
    const actualMax = Math.max(...validTemps, maxTemp);
    const padding = Math.max(1.5, (actualMax - actualMin) * 0.15);

    return [
      parseFloat((actualMin - padding).toFixed(1)),
      parseFloat((actualMax + padding).toFixed(1)),
    ];
  }, [readings, minTemp, maxTemp]);

  // Find selected event start and end time labels for reference highlight
  const selectedEvent = useMemo(() => {
    if (!selectedEventId) return null;
    return events.find((e) => e.id === selectedEventId) || null;
  }, [events, selectedEventId]);

  const selectedEventSpan = useMemo(() => {
    if (!selectedEvent) return null;
    const startItem = chartData.find((d) => d.timestamp === selectedEvent.startTime);
    const endItem = chartData.find((d) => d.timestamp === selectedEvent.endTime);
    if (!startItem || !endItem) return null;
    return {
      x1: startItem.timeLabel,
      x2: endItem.timeLabel,
    };
  }, [selectedEvent, chartData]);

  // Custom dot renderer for highlighting excursion points
  const renderDot = (props: any) => {
    const { cx, cy, payload } = props;
    if (cx === undefined || cy === undefined || payload.temperature === null) return null;

    if (payload.isOut) {
      const isHigh = payload.classification === 'HIGH_EXCURSION';
      const isEventSelected = selectedEventId && payload.eventId === selectedEventId;
      return (
        <circle
          key={`dot-${payload.id}`}
          cx={cx}
          cy={cy}
          r={isEventSelected ? 6 : 4.5}
          fill={isHigh ? '#ef4444' : '#3b82f6'}
          stroke="#ffffff"
          strokeWidth={isEventSelected ? 2.5 : 1.5}
          className="cursor-pointer hover:scale-125 transition-transform"
          onClick={() => {
            if (payload.eventId && onSelectEvent) {
              onSelectEvent(payload.eventId);
            }
          }}
        />
      );
    }

    if (payload.isWarning) {
      return (
        <circle
          key={`dot-${payload.id}`}
          cx={cx}
          cy={cy}
          r={3.5}
          fill="#f59e0b"
          stroke="#0f172a"
          strokeWidth={1}
        />
      );
    }

    return null;
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;
    const data = payload[0].payload;

    return (
      <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-lg p-3 text-xs shadow-xl text-slate-200 z-50 min-w-52">
        <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-2">
          <span className="font-mono text-slate-400">{data.timestamp}</span>
          <span
            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
              data.classification === 'HIGH_EXCURSION'
                ? 'bg-rose-950 text-rose-300 border border-rose-800'
                : data.classification === 'LOW_EXCURSION'
                ? 'bg-blue-950 text-blue-300 border border-blue-800'
                : data.classification.startsWith('WARNING')
                ? 'bg-amber-950 text-amber-300 border border-amber-800'
                : data.classification === 'MISSING_DATA'
                ? 'bg-slate-800 text-slate-400 border border-slate-700'
                : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
            }`}
          >
            {data.classification.replace(/_/g, ' ')}
          </span>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Temperature:</span>
            <span className="font-mono font-bold text-sm text-white">
              {data.temperature !== null ? `${data.temperature.toFixed(2)} °C` : 'NO DATA / OFFLINE'}
            </span>
          </div>

          <div className="flex justify-between items-center text-slate-400">
            <span>Envelope:</span>
            <span className="font-mono">
              [{minTemp.toFixed(1)}°C, {maxTemp.toFixed(1)}°C]
            </span>
          </div>

          {data.deviation > 0 && (
            <div className="flex justify-between items-center text-rose-400 font-medium">
              <span>Limit Breach:</span>
              <span className="font-mono">+{data.deviation.toFixed(2)} °C</span>
            </div>
          )}

          {data.eventId && (
            <div className="flex justify-between items-center pt-1 border-t border-slate-800/80 text-cyan-400">
              <span>Incident ID:</span>
              <span className="font-mono font-semibold">{data.eventId}</span>
            </div>
          )}

          {data.qualityNote && (
            <div className="pt-1.5 text-[11px] text-amber-400/90 italic border-t border-slate-800/80">
              Note: {data.qualityNote}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full flex flex-col">
      {/* Legend & Threshold Bar */}
      <div className="flex flex-wrap items-center justify-between text-xs px-2 py-1.5 bg-slate-900/60 border border-slate-800 rounded-t-lg text-slate-300 gap-y-2">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-cyan-400 inline-block rounded-full"></span>
            <span className="text-slate-300">Simulated Temp</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 border-t-2 border-dashed border-rose-500 inline-block"></span>
            <span className="text-rose-400 font-mono">Max ({maxTemp.toFixed(1)}°C)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 border-t-2 border-dashed border-sky-400 inline-block"></span>
            <span className="text-sky-400 font-mono">Min ({minTemp.toFixed(1)}°C)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-2 bg-emerald-500/15 border border-emerald-500/30 rounded inline-block"></span>
            <span className="text-emerald-400/90 text-[11px]">Safe Envelope</span>
          </div>
        </div>

        {events.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Excursion markers:</span>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-mono bg-rose-500/20 text-rose-300 border border-rose-500/40">
              ● High Breach
            </span>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-mono bg-blue-500/20 text-blue-300 border border-blue-500/40">
              ● Low Deficit
            </span>
          </div>
        )}
      </div>

      {/* Chart Canvas */}
      <div
        className="w-full bg-slate-950/80 border-x border-b border-slate-800 rounded-b-lg p-2 relative"
        style={{ height }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 15, right: 25, left: -10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />

            <XAxis
              dataKey="timeLabel"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#334155' }}
              interval="preserveStartEnd"
              minTickGap={28}
            />

            <YAxis
              domain={yDomain}
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#334155' }}
              unit="°C"
              width={50}
            />

            <Tooltip content={<CustomTooltip />} />

            {/* Safe Operational Zone Shading */}
            <ReferenceArea
              y1={minTemp}
              y2={maxTemp}
              fill="#10b981"
              fillOpacity={0.06}
              stroke="#10b981"
              strokeOpacity={0.15}
            />

            {/* Threshold Reference Lines */}
            <ReferenceLine
              y={maxTemp}
              stroke="#f43f5e"
              strokeDasharray="5 4"
              strokeWidth={1.5}
              label={{
                value: `Max ${maxTemp}°C`,
                fill: '#f43f5e',
                position: 'insideTopRight',
                fontSize: 10,
                fontWeight: 600,
              }}
            />

            <ReferenceLine
              y={minTemp}
              stroke="#38bdf8"
              strokeDasharray="5 4"
              strokeWidth={1.5}
              label={{
                value: `Min ${minTemp}°C`,
                fill: '#38bdf8',
                position: 'insideBottomRight',
                fontSize: 10,
                fontWeight: 600,
              }}
            />

            {/* Selected Event Interval Highlighting */}
            {selectedEventSpan && (
              <ReferenceArea
                x1={selectedEventSpan.x1}
                x2={selectedEventSpan.x2}
                fill="#f59e0b"
                fillOpacity={0.2}
                stroke="#f59e0b"
                strokeWidth={1.5}
                strokeDasharray="3 3"
              />
            )}

            {/* Temperature Curve */}
            <Line
              type="monotone"
              dataKey="temperature"
              stroke="#06b6d4"
              strokeWidth={2.2}
              dot={renderDot}
              activeDot={{
                r: 6,
                fill: '#22d3ee',
                stroke: '#ffffff',
                strokeWidth: 2,
              }}
              isAnimationActive={false}
              connectNulls={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
