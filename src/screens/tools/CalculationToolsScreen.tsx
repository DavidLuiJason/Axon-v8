import React, { useState } from 'react';
import {
  Calculator as CalcIcon,
  ArrowRightLeft,
  RotateCcw,
  Trash2,
  Delete,
  History,
  Check,
  Copy,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SwipeableTabContainer } from '../../components/SwipeableTabContainer';

export const CalculationToolsScreen: React.FC = () => {
  const { showToast, requestConfirmation } = useApp();
  const [activeTab, setActiveTab] = useState<'calc' | 'units'>('calc');

  // --- CALCULATOR STATE ---
  const [displayValue, setDisplayValue] = useState('0');
  const [prevValue, setPrevValue] = useState<number | null>(null);
  const [operator, setOperator] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  const [calcHistory, setCalcHistory] = useState<string[]>([]);

  const inputDigit = (digit: string) => {
    if (waitingForOperand || displayValue === 'Error') {
      setDisplayValue(digit);
      setWaitingForOperand(false);
    } else {
      setDisplayValue(displayValue === '0' ? digit : displayValue + digit);
    }
  };

  const inputDecimal = () => {
    if (waitingForOperand || displayValue === 'Error') {
      setDisplayValue('0.');
      setWaitingForOperand(false);
      return;
    }
    if (!displayValue.includes('.')) {
      setDisplayValue(displayValue + '.');
    }
  };

  const clearAll = () => {
    setDisplayValue('0');
    setPrevValue(null);
    setOperator(null);
    setWaitingForOperand(false);
  };

  const handleBackspace = () => {
    if (displayValue === 'Error') {
      clearAll();
      return;
    }
    if (displayValue.length <= 1 || (displayValue.length === 2 && displayValue.startsWith('-'))) {
      setDisplayValue('0');
    } else {
      setDisplayValue(displayValue.slice(0, -1));
    }
  };

  const toggleSign = () => {
    if (displayValue === 'Error') return;
    const val = parseFloat(displayValue);
    if (val !== 0) {
      setDisplayValue(String(-val));
    }
  };

  const inputPercent = () => {
    try {
      if (displayValue === 'Error') return;
      const val = parseFloat(displayValue);
      if (isNaN(val)) {
        setDisplayValue('0');
        return;
      }

      let calculatedPercent: number;
      if (prevValue !== null && operator) {
        if (operator === '+' || operator === '-') {
          // Contextual percentage of previous value (e.g. 200 + 10% -> 20)
          calculatedPercent = (prevValue * val) / 100;
        } else {
          // Multiplicative factor (e.g. 200 × 5% -> 0.05)
          calculatedPercent = val / 100;
        }
      } else {
        // Standalone unary percentage (e.g. 50% -> 0.5)
        calculatedPercent = val / 100;
      }

      // Safe clean precision formatting without freeze or truncation
      const formatted = Number(parseFloat(calculatedPercent.toPrecision(12))).toString();
      setDisplayValue(formatted);
      setWaitingForOperand(false);
    } catch (err) {
      setDisplayValue('0');
    }
  };

  const performOperation = (nextOperator: string) => {
    if (displayValue === 'Error') {
      clearAll();
      return;
    }

    const inputValue = parseFloat(displayValue);

    // If waiting for operand and user clicks another operator (e.g. + then x), just update operator
    if (waitingForOperand && operator && nextOperator !== '=') {
      setOperator(nextOperator);
      return;
    }

    if (prevValue === null) {
      if (nextOperator !== '=') {
        setPrevValue(inputValue);
      }
    } else if (operator) {
      const currentValue = prevValue;
      let result = currentValue;

      if (operator === '+') result = currentValue + inputValue;
      else if (operator === '-') result = currentValue - inputValue;
      else if (operator === '×') result = currentValue * inputValue;
      else if (operator === '÷') {
        if (inputValue === 0) {
          setDisplayValue('Error');
          setPrevValue(null);
          setOperator(null);
          setWaitingForOperand(true);
          showToast('Cannot divide by zero');
          return;
        }
        result = currentValue / inputValue;
      }

      // Avoid floating-point inaccuracies (e.g., 0.1 + 0.2 = 0.30000000000000004)
      const formattedResult = parseFloat(result.toFixed(10));
      setDisplayValue(String(formattedResult));

      // Save to calculation history
      const historyItem = `${currentValue} ${operator} ${inputValue} = ${formattedResult}`;
      setCalcHistory((prev) => [historyItem, ...prev.slice(0, 9)]);

      if (nextOperator === '=') {
        setPrevValue(null);
        setOperator(null);
        setWaitingForOperand(true);
        return;
      } else {
        setPrevValue(formattedResult);
      }
    }

    setWaitingForOperand(true);
    setOperator(nextOperator === '=' ? null : nextOperator);
  };

  const clearHistory = () => {
    if (calcHistory.length === 0) return;
    requestConfirmation({
      title: 'Clear Calculation History',
      message: 'Are you sure you want to delete this calculation history?',
      confirmLabel: 'Clear History',
      danger: true,
      onConfirm: () => {
        setCalcHistory([]);
        showToast('Calculation history cleared');
      },
    });
  };

  // --- UNIT CONVERTER STATE ---
  type UnitCategory = 'length' | 'weight' | 'temp' | 'volume' | 'speed';
  const [unitCategory, setUnitCategory] = useState<UnitCategory>('length');

  const unitRates: Record<
    UnitCategory,
    {
      units: Array<{ id: string; name: string }>;
      convert: (val: number, from: string, to: string) => number;
    }
  > = {
    length: {
      units: [
        { id: 'm', name: 'Meter (m)' },
        { id: 'km', name: 'Kilometer (km)' },
        { id: 'cm', name: 'Centimeter (cm)' },
        { id: 'mm', name: 'Millimeter (mm)' },
        { id: 'in', name: 'Inch (in)' },
        { id: 'ft', name: 'Foot (ft)' },
        { id: 'yd', name: 'Yard (yd)' },
        { id: 'mi', name: 'Mile (mi)' },
      ],
      convert: (val, from, to) => {
        const toMeters: Record<string, number> = {
          m: 1,
          km: 1000,
          cm: 0.01,
          mm: 0.001,
          in: 0.0254,
          ft: 0.3048,
          yd: 0.9144,
          mi: 1609.34,
        };
        const meters = val * (toMeters[from] || 1);
        return meters / (toMeters[to] || 1);
      },
    },
    weight: {
      units: [
        { id: 'kg', name: 'Kilogram (kg)' },
        { id: 'g', name: 'Gram (g)' },
        { id: 'mg', name: 'Milligram (mg)' },
        { id: 'lb', name: 'Pound (lb)' },
        { id: 'oz', name: 'Ounce (oz)' },
        { id: 'ton', name: 'Metric Ton (t)' },
      ],
      convert: (val, from, to) => {
        const toKg: Record<string, number> = {
          kg: 1,
          g: 0.001,
          mg: 0.000001,
          lb: 0.45359237,
          oz: 0.0283495,
          ton: 1000,
        };
        const kg = val * (toKg[from] || 1);
        return kg / (toKg[to] || 1);
      },
    },
    temp: {
      units: [
        { id: 'c', name: 'Celsius (°C)' },
        { id: 'f', name: 'Fahrenheit (°F)' },
        { id: 'k', name: 'Kelvin (K)' },
      ],
      convert: (val, from, to) => {
        if (from === to) return val;
        // Convert from -> Celsius
        let c = val;
        if (from === 'f') c = (val - 32) * (5 / 9);
        else if (from === 'k') c = val - 273.15;

        // Convert Celsius -> to
        if (to === 'f') return c * (9 / 5) + 32;
        if (to === 'k') return c + 273.15;
        return c;
      },
    },
    volume: {
      units: [
        { id: 'l', name: 'Liter (L)' },
        { id: 'ml', name: 'Milliliter (mL)' },
        { id: 'gal', name: 'Gallon (US)' },
        { id: 'cup', name: 'Cup (US)' },
        { id: 'floz', name: 'Fluid Ounce (fl oz)' },
      ],
      convert: (val, from, to) => {
        const toL: Record<string, number> = {
          l: 1,
          ml: 0.001,
          gal: 3.78541,
          cup: 0.236588,
          floz: 0.0295735,
        };
        const l = val * (toL[from] || 1);
        return l / (toL[to] || 1);
      },
    },
    speed: {
      units: [
        { id: 'kmh', name: 'km/h' },
        { id: 'mph', name: 'mph' },
        { id: 'ms', name: 'm/s' },
        { id: 'knot', name: 'knots' },
      ],
      convert: (val, from, to) => {
        const toMps: Record<string, number> = {
          ms: 1,
          kmh: 1 / 3.6,
          mph: 0.44704,
          knot: 0.514444,
        };
        const mps = val * (toMps[from] || 1);
        return mps / (toMps[to] || 1);
      },
    },
  };

  const [fromUnit, setFromUnit] = useState('m');
  const [toUnit, setToUnit] = useState('ft');
  const [fromVal, setFromVal] = useState('1');
  const [copiedResult, setCopiedResult] = useState(false);

  const handleCategoryChange = (cat: UnitCategory) => {
    setUnitCategory(cat);
    const units = unitRates[cat].units;
    setFromUnit(units[0].id);
    setToUnit(units[1] ? units[1].id : units[0].id);
  };

  const computedToVal = () => {
    const num = parseFloat(fromVal);
    if (isNaN(num)) return '0';
    const categoryConfig = unitRates[unitCategory];
    if (!categoryConfig) return '0';

    // Verify units exist in the current category
    const validFrom = categoryConfig.units.some((u) => u.id === fromUnit)
      ? fromUnit
      : categoryConfig.units[0].id;
    const validTo = categoryConfig.units.some((u) => u.id === toUnit)
      ? toUnit
      : categoryConfig.units[1]?.id || categoryConfig.units[0].id;

    const converted = categoryConfig.convert(num, validFrom, validTo);

    if (converted === 0) return '0';
    if (Math.abs(converted) < 0.000001 || Math.abs(converted) >= 1e9) {
      return converted.toExponential(4);
    }
    // High precision without trailing zeroes
    return parseFloat(converted.toFixed(8)).toLocaleString('en-US', {
      maximumFractionDigits: 8,
    });
  };

  const handleSwapUnits = () => {
    const temp = fromUnit;
    setFromUnit(toUnit);
    setToUnit(temp);
  };

  const handleCopyResult = () => {
    const val = computedToVal();
    navigator.clipboard.writeText(val);
    setCopiedResult(true);
    showToast('Result copied');
    setTimeout(() => setCopiedResult(false), 2000);
  };

  return (
    <div
      id="calculation-tools-screen"
      className="flex-1 min-h-0 overflow-y-auto bg-black text-white p-4 select-none"
    >
      <div className="max-w-md mx-auto space-y-4">
        {/* Navigation Sub-Tabs */}
        <div className="flex bg-neutral-900/90 p-1 rounded-2xl border border-neutral-800">
          <button
            type="button"
            onClick={() => setActiveTab('calc')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
              activeTab === 'calc'
                ? 'bg-white text-black shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <CalcIcon className="w-3.5 h-3.5" />
            <span>Calculator</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('units')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
              activeTab === 'units'
                ? 'bg-white text-black shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>Unit Converters</span>
          </button>
        </div>

        {/* Swipeable Tabs Container */}
        <SwipeableTabContainer<'calc' | 'units'>
          tabs={['calc', 'units']}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        >
          <div>
            {/* TAB 1: CALCULATOR */}
            {activeTab === 'calc' && (
          <div className="space-y-3">
            {/* Display Viewport */}
            <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 text-right space-y-1">
              <div className="text-[11px] font-mono text-neutral-400 h-4 truncate">
                {prevValue !== null && operator ? `${prevValue} ${operator}` : ''}
              </div>
              <div className="text-3xl font-mono font-bold text-white tracking-tight truncate select-text">
                {displayValue}
              </div>
            </div>

            {/* Keypad */}
            <div className="grid grid-cols-4 gap-2">
              <button
                type="button"
                onClick={clearAll}
                className="p-3.5 rounded-xl bg-neutral-800 text-red-400 hover:bg-neutral-700 active:scale-95 font-semibold text-sm transition-all"
              >
                C
              </button>
              <button
                type="button"
                onClick={toggleSign}
                className="p-3.5 rounded-xl bg-neutral-800 text-neutral-200 hover:bg-neutral-700 active:scale-95 font-semibold text-sm transition-all"
              >
                ±
              </button>
              <button
                type="button"
                onClick={inputPercent}
                className="p-3.5 rounded-xl bg-neutral-800 text-neutral-200 hover:bg-neutral-700 active:scale-95 font-semibold text-sm transition-all"
              >
                %
              </button>
              <button
                type="button"
                onClick={() => performOperation('÷')}
                className="p-3.5 rounded-xl bg-neutral-700 text-white hover:bg-neutral-600 active:scale-95 font-bold text-base transition-all"
              >
                ÷
              </button>

              {['7', '8', '9'].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => inputDigit(d)}
                  className="p-3.5 rounded-xl bg-neutral-900 text-white hover:bg-neutral-800 active:scale-95 font-semibold text-base transition-all border border-neutral-800/80"
                >
                  {d}
                </button>
              ))}
              <button
                type="button"
                onClick={() => performOperation('×')}
                className="p-3.5 rounded-xl bg-neutral-700 text-white hover:bg-neutral-600 active:scale-95 font-bold text-base transition-all"
              >
                ×
              </button>

              {['4', '5', '6'].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => inputDigit(d)}
                  className="p-3.5 rounded-xl bg-neutral-900 text-white hover:bg-neutral-800 active:scale-95 font-semibold text-base transition-all border border-neutral-800/80"
                >
                  {d}
                </button>
              ))}
              <button
                type="button"
                onClick={() => performOperation('-')}
                className="p-3.5 rounded-xl bg-neutral-700 text-white hover:bg-neutral-600 active:scale-95 font-bold text-base transition-all"
              >
                -
              </button>

              {['1', '2', '3'].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => inputDigit(d)}
                  className="p-3.5 rounded-xl bg-neutral-900 text-white hover:bg-neutral-800 active:scale-95 font-semibold text-base transition-all border border-neutral-800/80"
                >
                  {d}
                </button>
              ))}
              <button
                type="button"
                onClick={() => performOperation('+')}
                className="p-3.5 rounded-xl bg-neutral-700 text-white hover:bg-neutral-600 active:scale-95 font-bold text-base transition-all"
              >
                +
              </button>

              <button
                type="button"
                onClick={() => inputDigit('0')}
                className="p-3.5 rounded-xl bg-neutral-900 text-white hover:bg-neutral-800 active:scale-95 font-semibold text-base transition-all border border-neutral-800/80"
              >
                0
              </button>
              <button
                type="button"
                onClick={inputDecimal}
                className="p-3.5 rounded-xl bg-neutral-900 text-white hover:bg-neutral-800 active:scale-95 font-semibold text-base transition-all border border-neutral-800/80"
              >
                .
              </button>
              <button
                type="button"
                onClick={handleBackspace}
                className="p-3.5 rounded-xl bg-neutral-900 text-neutral-300 hover:bg-neutral-800 active:scale-95 flex items-center justify-center transition-all border border-neutral-800/80"
              >
                <Delete className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => performOperation('=')}
                className="p-3.5 rounded-xl bg-white text-black hover:bg-neutral-200 active:scale-95 font-bold text-base transition-all shadow-md"
              >
                =
              </button>
            </div>

            {/* Calculation History */}
            {calcHistory.length > 0 && (
              <div className="rounded-2xl bg-neutral-900/70 border border-neutral-800 p-3 space-y-2">
                <div className="flex items-center justify-between text-xs text-neutral-400 pb-1 border-b border-neutral-800">
                  <span className="flex items-center gap-1.5 font-medium">
                    <History className="w-3.5 h-3.5 text-neutral-400" />
                    <span>Recent Calculations</span>
                  </span>
                  <button
                    type="button"
                    onClick={clearHistory}
                    className="hover:text-red-400 flex items-center gap-1 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Clear</span>
                  </button>
                </div>
                <div className="space-y-1">
                  {calcHistory.map((item, idx) => (
                    <div
                      key={idx}
                      className="text-xs font-mono text-neutral-300 py-0.5 select-text hover:text-white"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: UNIT CONVERTERS */}
        {activeTab === 'units' && (
          <div className="space-y-3">
            {/* Category selection chips */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {[
                { id: 'length', label: 'Length' },
                { id: 'weight', label: 'Weight' },
                { id: 'temp', label: 'Temp' },
                { id: 'volume', label: 'Volume' },
                { id: 'speed', label: 'Speed' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleCategoryChange(cat.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                    unitCategory === cat.id
                      ? 'bg-neutral-800 text-white border border-neutral-600'
                      : 'bg-neutral-950 text-neutral-400 border border-neutral-800 hover:text-white'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Converter Card */}
            <div className="rounded-2xl bg-neutral-900 border border-neutral-800 p-4 space-y-4">
              {/* FROM INPUT */}
              <div className="space-y-1.5">
                <label className="text-[11px] uppercase tracking-wider font-semibold text-neutral-400">
                  From
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={fromVal}
                    onChange={(e) => setFromVal(e.target.value)}
                    className="flex-1 min-w-0 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-neutral-600"
                  />
                  <select
                    value={fromUnit}
                    onChange={(e) => setFromUnit(e.target.value)}
                    className="w-36 max-w-[45%] bg-neutral-800 border border-neutral-700 text-white text-xs font-medium rounded-xl px-2.5 py-2 focus:outline-none truncate"
                  >
                    {unitRates[unitCategory].units.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* SWAP BUTTON */}
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={handleSwapUnits}
                  className="p-2 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white active:scale-95 transition-all shadow-sm border border-neutral-700"
                  title="Swap units"
                >
                  <ArrowRightLeft className="w-4 h-4 rotate-90" />
                </button>
              </div>

              {/* TO RESULT */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] uppercase tracking-wider font-semibold text-neutral-400">
                    To (Result)
                  </label>
                  <button
                    type="button"
                    onClick={handleCopyResult}
                    className="flex items-center gap-1 text-[11px] text-neutral-400 hover:text-white transition-colors"
                  >
                    {copiedResult ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedResult ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 min-w-0 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-sm font-mono text-white select-text truncate">
                    {computedToVal()}
                  </div>
                  <select
                    value={toUnit}
                    onChange={(e) => setToUnit(e.target.value)}
                    className="w-36 max-w-[45%] bg-neutral-800 border border-neutral-700 text-white text-xs font-medium rounded-xl px-2.5 py-2 focus:outline-none truncate"
                  >
                    {unitRates[unitCategory].units.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}
          </div>
        </SwipeableTabContainer>
      </div>
    </div>
  );
};
