import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Info, ArrowLeft, RefreshCw } from 'lucide-react';
import MetricSlider from '../components/MetricSlider';
import RiskGauge from '../components/RiskGauge';
import FeatureChart from '../components/FeatureChart';
import InsightCard from '../components/InsightCard';
import ClinicalChat from '../components/ClinicalChat';
import PremiumButton from '../components/PremiumButton';
import DataIntegrationSuite from '../components/DataIntegrationSuite';
import Calibration3DLoader from '../components/Calibration3DLoader';
import { predict, getContributions } from '../model/predict';
import { audio } from '../model/audio';

const DEFAULTS = {
  pregnancies: 1,
  glucose: 120,
  bloodPressure: 72,
  skinThickness: 23,
  insulin: 80,
  bmi: 26.0,
  diabetesPedigree: 0.47,
  age: 30,
};

const BIOMARKER_DETAILS = [
  {
    name: "Plasma Glucose Concentration",
    context: "Measures the concentration of glucose (sugar) in your blood plasma after a 2-hour oral glucose tolerance test.",
    significance: "Primary biomarker for diagnosing diabetes. High glucose indicates pancreatic beta-cell fatigue or high insulin resistance, causing sugar to accumulate in the bloodstream instead of being absorbed by cells.",
    range: "Normal: Under 140 mg/dL | Pre-diabetic: 140-199 mg/dL | Diabetic: 200 mg/dL or higher"
  },
  {
    name: "Body Mass Index (BMI)",
    context: "A value derived from the mass (weight) and height of a person to estimate overall body fat percentage.",
    significance: "A BMI above 25 correlates strongly with increased fatty acid accumulation in vital organs, which blocks insulin receptors and hampers cellular glucose uptake.",
    range: "Underweight: <18.5 | Normal: 18.5–24.9 | Overweight: 25.0–29.9 | Obese: 30.0 or higher"
  },
  {
    name: "Patient Age",
    context: "Represents the chronological age of the patient.",
    significance: "Metabolic rate, physical activity, and pancreatic beta-cell insulin secretory capacity naturally decrease with age, leading to a steady increase in susceptibility to Type 2 diabetes after age 45.",
    range: "Slightly increased risk after 35 | More pronounced susceptibility progression after 45"
  },
  {
    name: "Diastolic Blood Pressure",
    context: "The pressure in your blood vessels when your heart rests between beats.",
    significance: "High blood pressure is strongly associated with metabolic syndrome, systemic arterial stiffness, and microvascular strain, indicating metabolic overload.",
    range: "Normal: 60-80 mmHg | Elevated: 80-89 mmHg | Hypertension: 90 mmHg or higher"
  },
  {
    name: "2-Hour Serum Insulin",
    context: "Measures the amount of insulin in the blood 2 hours after consuming glucose.",
    significance: "Insulin is the hormone that moves glucose from blood to cells. Very high levels suggest insulin resistance, meaning the pancreas has to overproduce insulin to keep blood sugar normal.",
    range: "Normal: 16–166 μU/mL | High (>166 μU/mL) indicates compensating hyperinsulinemia"
  },
  {
    name: "Triceps Skin Fold Thickness",
    context: "A standard clinical measurement of subcutaneous fat thickness on the back of the upper arm.",
    significance: "Correlates with overall subcutaneous body fat storage. Thicker folds indicate higher systemic fat storage, which release inflammatory cytokines that block insulin pathways.",
    range: "Normal range typically: 10–50 mm | Higher levels represent elevated systemic fat reserves"
  },
  {
    name: "Number of Pregnancies",
    context: "Represents the total number of times the patient has been pregnant.",
    significance: "Pregnancy induces significant hormonal changes that naturally increase insulin resistance to ensure the fetus gets enough glucose. Multiple pregnancies can exhaust metabolic reserves.",
    range: "Under 5 pregnancies: Typical baseline | 5 or more pregnancies: Elevated gestational risk history"
  },
  {
    name: "Diabetes Pedigree Function",
    context: "A score representing the genetic influence and hereditary history of diabetes in your family tree.",
    significance: "Estimates genetic susceptibility based on your relatives' history. A higher score means a stronger genetic predisposition to pancreatic beta-cell dysfunction.",
    range: "Normal range: 0.08–2.42 | High score (>0.80) indicates strong familial heredity link"
  }
];

// SVG Normal Distribution Curve Component
const ProbabilityCurve = ({ riskPercent }) => {
  const W = 280;
  const H = 80;
  const normal = (x) => Math.exp(-0.5 * Math.pow((x - 50) / 18, 2));

  // Plot standard normal distribution bell points
  const points = React.useMemo(() => {
    return Array.from({ length: 100 }, (_, i) => {
      const x = (i / 99) * W;
      const val = (i / 99) * 100;
      const y = H - normal(val) * (H - 10);
      return `${x},${y}`;
    }).join(' ');
  }, []);

  const xPos = (riskPercent / 100) * W;
  const riskColor = riskPercent < 30 ? 'var(--risk-low)' : riskPercent < 60 ? 'var(--risk-mid)' : 'var(--risk-high)';

  // Shade right tail area from the current marker point to the right end
  const shadedPath = React.useMemo(() => {
    const startIndex = Math.floor((riskPercent / 100) * 99);
    const coords = [];
    coords.push(`${xPos},${H}`);
    for (let i = startIndex; i < 100; i++) {
      const x = (i / 99) * W;
      const val = (i / 99) * 100;
      const y = H - normal(val) * (H - 10);
      coords.push(`${x},${y}`);
    }
    coords.push(`${W},${H}`);
    return `M ${coords.join(' L ')} Z`;
  }, [riskPercent, xPos]);

  return (
    <div className="w-full border border-[var(--border-soft)] rounded-none p-6 flex flex-col gap-4 bg-[var(--surface-1)] shadow-sm">
      <div className="flex justify-between items-center w-full text-[10px] font-mono text-[var(--text-3)] tracking-wider">
        <span>PROBABILITY DISTRIBUTION</span>
        <span style={{ color: riskColor }} className="font-semibold uppercase text-[9px]">YOU ARE HERE</span>
      </div>
      <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} className="overflow-visible">
        {/* Risk zone shading */}
        <path d={shadedPath} fill={riskColor} opacity="0.1" />
        {/* Bell curve line */}
        <polyline points={points} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" />
        {/* Current user alignment line */}
        <line x1={xPos} y1="0" x2={xPos} y2={H} stroke={riskColor} strokeWidth="1.5" strokeDasharray="3,3" />
        {/* Node indicator */}
        <circle cx={xPos} cy={H - normal(riskPercent) * (H - 10)} r="4" fill={riskColor} />
        {/* Metric Label */}
        <text 
          x={xPos + (xPos > W - 60 ? -45 : 8)} 
          y="16" 
          fill={riskColor} 
          fontSize="10" 
          fontFamily="JetBrains Mono"
          fontWeight="bold"
        >
          {riskPercent}%
        </text>
      </svg>
    </div>
  );
};

export const Diagnosis = ({ onQuestionIndexChange }) => {
  const [inputs, setInputs] = useState(DEFAULTS);
  const [lastPredictedInputs, setLastPredictedInputs] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [riskScore, setRiskScore] = useState(null);
  const [contributions, setContributions] = useState(null);
  const [activeStage, setActiveStage] = useState('input'); // 'input' or 'results'
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(-1);
  const [hasRun, setHasRun] = useState(false);
  
  // debounced live prediction preview state
  const [liveEstimate, setLiveEstimate] = useState(null);

  // Lift currentQuestionIndex state changes up to parent App shell
  useEffect(() => {
    if (onQuestionIndexChange) {
      if (activeStage === 'results') {
        onQuestionIndexChange(-1);
      } else {
        onQuestionIndexChange(currentQuestionIndex);
      }
    }
  }, [currentQuestionIndex, activeStage, onQuestionIndexChange]);

  const downloadHtmlReport = () => {
    // Generate a random Reference ID
    const refId = `SMC-${Math.floor(100000 + Math.random() * 900000)}`;
    const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    // Determine risk status & colors
    const riskColor = riskScore < 30 ? '#596235' : riskScore < 60 ? '#E67E22' : '#D96846';
    const riskStatus = riskScore < 30 ? 'LOW RISK' : riskScore < 60 ? 'MODERATE RISK' : 'HIGH RISK';

    // Generate list of contributions
    const insightsHtml = contributions ? contributions.map(item => `
      <div class="insight-row" style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dotted var(--border-soft);">
        <span style="font-family: 'JetBrains Mono', monospace; text-transform: uppercase;">${item.name}</span>
        <span style="color: ${item.value > 0 ? '#D96846' : '#596235'}; font-weight: bold; font-family: 'JetBrains Mono', monospace;">
          ${item.value > 0 ? '+' : ''}${item.value.toFixed(4)}
        </span>
      </div>
    `).join('') : '';

    // Generate biomarker rows for table
    const biomarkerRows = Object.entries(inputs).map(([key, val]) => {
      const normalRange = {
        glucose: '70–140 mg/dL',
        bmi: '18.5–24.9',
        age: 'Adult',
        bloodPressure: '60–80 mmHg',
        insulin: '16–166 μU/mL',
        skinThickness: '10–50 mm',
        pregnancies: 'N/A',
        diabetesPedigree: '0.08–2.42',
      }[key] || '';
      
      const isDanger = {
        glucose: val > 140,
        bmi: val >= 30.0,
        age: val >= 45,
        bloodPressure: val > 80,
        insulin: val > 166,
        skinThickness: val > 40,
        pregnancies: val > 5,
        diabetesPedigree: val > 0.8,
      }[key] || false;

      const formattedLabel = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());

      return `
        <tr>
          <td style="padding: 10px 8px; border-bottom: 1px solid var(--border-soft);"><strong>${formattedLabel}</strong></td>
          <td style="padding: 10px 8px; border-bottom: 1px solid var(--border-soft); font-family: 'JetBrains Mono', monospace;">${val}</td>
          <td style="padding: 10px 8px; border-bottom: 1px solid var(--border-soft); font-family: 'JetBrains Mono', monospace; color: var(--text-3);">${normalRange}</td>
          <td style="padding: 10px 8px; border-bottom: 1px solid var(--border-soft); color: ${isDanger ? '#D96846' : '#596235'}; font-weight: bold; text-transform: uppercase;">
            ${isDanger ? 'ELEVATED' : 'NORMAL'}
          </td>
        </tr>
      `;
    }).join('');

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>GLYCOS Metabolic Intelligence Report - ${refId}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Syne:wght@700;800&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --void:          #CDCBD6;   
      --surface-1:     #FFFFFF;
      --surface-2:     #F3F2F5;  
      --surface-3:     #E5E4EA;
      --accent:        #D96846;   
      --text-1:        #2F3020;         
      --text-2:        rgba(47, 48, 32, 0.85);
      --text-3:        #596235;   
      --text-4:        rgba(47, 48, 32, 0.25);
      --border-soft:   rgba(47, 48, 32, 0.12);
    }
    
    body {
      background-color: var(--void);
      color: var(--text-1);
      font-family: 'Inter', sans-serif;
      margin: 0;
      padding: 40px 20px;
      display: flex;
      justify-content: center;
    }

    .report-container {
      max-width: 800px;
      width: 100%;
      background: var(--surface-1);
      border: 1px solid var(--border-soft);
      padding: 40px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.06);
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      gap: 30px;
    }

    /* Print utility floating action */
    .print-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid var(--border-soft);
      padding-bottom: 20px;
    }

    .btn {
      background: var(--accent);
      color: white;
      border: none;
      padding: 10px 20px;
      font-family: 'Inter', sans-serif;
      font-weight: 600;
      font-size: 12px;
      cursor: pointer;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      transition: opacity 0.2s;
    }

    .btn:hover {
      opacity: 0.9;
    }

    .header-section {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .brand-title {
      font-family: 'Syne', sans-serif;
      font-weight: 800;
      font-size: 24px;
      color: var(--text-1);
      margin: 0;
      letter-spacing: -0.02em;
    }

    .subtitle {
      font-family: 'JetBrains Mono', monospace;
      font-size: 10px;
      color: var(--text-3);
      margin-top: 5px;
      text-transform: uppercase;
    }

    .meta-table {
      font-family: 'JetBrains Mono', monospace;
      font-size: 10px;
      text-align: right;
      color: var(--text-2);
    }

    .card {
      border: 1px solid var(--border-soft);
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 15px;
    }

    .card-title {
      font-family: 'Syne', sans-serif;
      font-weight: 700;
      font-size: 14px;
      text-transform: uppercase;
      color: var(--text-1);
      margin: 0;
      border-bottom: 1px solid var(--border-soft);
      padding-bottom: 8px;
    }

    .risk-score-display {
      display: flex;
      align-items: center;
      gap: 30px;
      margin: 10px 0;
    }

    .risk-value {
      font-family: 'Syne', sans-serif;
      font-size: 56px;
      font-weight: 800;
      line-height: 1;
    }

    .risk-status-tag {
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px;
      font-weight: 700;
      border: 1px solid currentColor;
      padding: 6px 12px;
      text-transform: uppercase;
    }

    table.biomarker-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
      text-align: left;
    }

    table.biomarker-table th {
      font-family: 'JetBrains Mono', monospace;
      font-size: 10px;
      color: var(--text-3);
      text-transform: uppercase;
      padding: 10px 8px;
      border-bottom: 1px solid var(--border-soft);
    }

    .disclaimer {
      font-size: 10px;
      color: var(--text-2);
      line-height: 1.6;
    }

    @media print {
      body {
        background-color: white;
        padding: 0;
      }
      .report-container {
        box-shadow: none;
        border: none;
        padding: 0;
      }
      .print-actions {
        display: none;
      }
    }
  </style>
</head>
<body>
  <div class="report-container">
    <div class="print-actions">
      <div>
        <h1 class="brand-title">GLYCOS CLINICAL REPORT</h1>
        <div class="subtitle">Official Patient Assessment Ingestion</div>
      </div>
      <button class="btn" onclick="window.print()">Print / Save as PDF</button>
    </div>

    <div class="header-section">
      <div>
        <div style="font-size: 16px; font-weight: bold; color: var(--text-1);">METABOLIC PROFILE</div>
        <div style="font-size: 11px; color: var(--text-3); font-family: 'JetBrains Mono', monospace; margin-top: 4px;">SYSTEM PROTOCOL: PIMA_GRADIENT_DESCENT_V2</div>
      </div>
      <table class="meta-table">
        <tr><td><strong>REPORT DATE:</strong></td><td>${dateStr}</td></tr>
        <tr><td><strong>REF ID:</strong></td><td>${refId}</td></tr>
        <tr><td><strong>STATUS:</strong></td><td>COMPLETED</td></tr>
      </table>
    </div>

    <!-- Risk Summary Card -->
    <div class="card">
      <h2 class="card-title">Score & Classification</h2>
      <div class="risk-score-display">
        <div class="risk-value" style="color: ${riskColor}">${riskScore}%</div>
        <div class="risk-status-tag" style="color: ${riskColor}; border-color: ${riskColor};">${riskStatus}</div>
      </div>
      <div class="disclaimer">
        The above susceptibility index is calculated using a multivariate logistic regression classifier trained on PIMA metabolic factors. Under clinical guidelines, scores exceeding 40% warrant further diagnostic follow-up.
      </div>
    </div>

    <!-- Biomarkers Profile Table -->
    <div class="card">
      <h2 class="card-title">Biomarker Calibration Details</h2>
      <table class="biomarker-table">
        <thead>
          <tr>
            <th>Biomarker Factor</th>
            <th>Ingested Value</th>
            <th>Clinical Ref Range</th>
            <th>Status Classification</th>
          </tr>
        </thead>
        <tbody>
          ${biomarkerRows}
        </tbody>
      </table>
    </div>

    <!-- Feature Contributions -->
    <div class="card">
      <h2 class="card-title">Biomarker Contribution Weights</h2>
      <div style="display: flex; flex-direction: column; gap: 4px;">
        ${insightsHtml}
      </div>
    </div>

    <!-- Medical Disclaimer -->
    <div class="card" style="background: var(--surface-2);">
      <h2 class="card-title" style="border: none; padding: 0;">Clinical Notice & Disclaimer</h2>
      <div class="disclaimer">
        This document represents an analytical prediction and is not a formal medical diagnosis. GLYCOS-ai is a metabolic intelligence demonstration tool. Values are processed locally and are subject to model validation accuracy constraints (~77% on Pima Indian datasets). Consult a licensed medical practitioner for clinical evaluation.
      </div>
    </div>
  </div>
</body>
</html>`;

    // Create a blob and trigger a client-side download of the HTML file
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `glycos_metabolic_report_${refId.toLowerCase()}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // loading state tracking for clinical animation
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisStep, setAnalysisStep] = useState(0);

  const analysisSteps = [
    'INITIALIZING COHERENCE MATRIX...',
    'SCALING 8 BIOMARKER SUSCEPTIBILITY CURVES...',
    'SOLVING GRADIENT DESCENT COEFFICIENTS...',
    'COMPILING CLINICAL SUSCEPTIBILITY REPORT...'
  ];

  useEffect(() => {
    if (!isAnalyzing) {
      setAnalysisProgress(0);
      setAnalysisStep(0);
      return;
    }

    const steps = [0, 9, 19, 29, 59, 79, 99, 100];
    let stepIdx = 0;
    setAnalysisProgress(steps[0]);
    setAnalysisStep(0);

    const interval = setInterval(() => {
      stepIdx++;
      if (stepIdx < steps.length) {
        const progress = steps[stepIdx];
        setAnalysisProgress(progress);

        if (progress < 25) {
          setAnalysisStep(0);
        } else if (progress < 50) {
          setAnalysisStep(1);
        } else if (progress < 75) {
          setAnalysisStep(2);
        } else {
          setAnalysisStep(3);
        }
      } else {
        clearInterval(interval);
      }
    }, 450); // 450ms per step = 3.15s to reach 100%

    return () => clearInterval(interval);
  }, [isAnalyzing]);

  const handleInputChange = (key, value) => {
    setInputs((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleApplyInputs = (parsedData) => {
    setInputs((prev) => ({
      ...prev,
      ...parsedData,
    }));
  };

  // Debounced effect for live estimate calculations
  useEffect(() => {
    const timer = setTimeout(() => {
      const estimate = predict(inputs);
      setLiveEstimate(estimate);
    }, 100);
    return () => clearTimeout(timer);
  }, [inputs]);

  const runPrediction = () => {
    setIsAnalyzing(true);
    // Play interaction click on click
    audio.playClick();
    
    // 3500ms loading effect for clinical realism
    setTimeout(() => {
      const score = predict(inputs);
      const rawContribs = getContributions(inputs);
      
      // Convert contributions object to structured array for FeatureChart
      const formattedContribs = Object.entries(rawContribs).map(([name, value]) => ({
        name,
        value,
      }));

      setRiskScore(score);
      setContributions(formattedContribs);
      setLastPredictedInputs({ ...inputs });
      setHasRun(true);
      setIsAnalyzing(false);
      setActiveStage('results');
      
      // Play prediction success fanfare!
      audio.playFanfare();

      // Scroll top smoothly after entering results stage
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 3500);
  };

  const inputsDiverged =
    hasRun &&
    lastPredictedInputs &&
    Object.keys(inputs).some((key) => inputs[key] !== lastPredictedInputs[key]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, []);

  // Determine pulse class based on predicted risk level
  const pulseClass = riskScore === null
    ? ''
    : riskScore < 30
      ? 'pulse-low'
      : riskScore < 60
        ? 'pulse-mid'
        : 'pulse-high';

  return (
    <div className="w-full min-h-screen bg-transparent pt-[85px] pb-28 px-4 md:px-6 relative z-10 overflow-hidden">

      <div className="max-w-[1200px] mx-auto w-full flex flex-col items-center relative z-10">
        
        <AnimatePresence mode="wait">
          {activeStage === 'input' ? (
            /* STAGE 1: INPUT SLIDERS */
            <motion.div
              key="inputs-stage"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -25 }}
              transition={{ duration: 0.4, ease: [0.76, 0, 0.24, 1] }}
              className="w-full flex flex-col gap-6"
            >
              <AnimatePresence mode="wait">
                {currentQuestionIndex === -1 ? (
                  /* WELCOME STEP */
                  <motion.div
                    key="step-welcome"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.35 }}
                    className="w-full grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 py-16 min-h-[60vh] text-left"
                  >
                    {/* Left Column: Title & Specs */}
                    <div className="lg:col-span-7 flex flex-col justify-between items-start">
                      <div>
                        <span className="font-mono text-[10px] tracking-[0.25em] text-[var(--text-3)] uppercase mb-6 block">
                          [ CALIBRATION_STAGE_01 ]
                        </span>
                        <h1 className="font-syne font-extrabold text-[clamp(3.5rem,8vw,6rem)] leading-[0.85] text-[var(--text-1)] uppercase tracking-[-0.05em] mb-8">
                          Enter<br />Your Data.
                        </h1>
                        <p className="font-mono text-sm text-[var(--text-3)] leading-relaxed max-w-lg mb-8">
                          To initiate risk calculation, select your data ingestion protocol below. All evaluations run client-side on normalized coefficients.
                        </p>
                      </div>

                      {/* Technical Specs List */}
                      <div className="flex flex-col gap-3 font-mono text-[10px] text-[var(--text-3)] border-t border-[var(--border-soft)] pt-8 w-full">
                        <div className="flex justify-between max-w-md items-center">
                          <span>[ LOCAL_REDUX_ENGINE ]</span>
                          <span className="text-[var(--text-2)] font-semibold flex items-center gap-1.5">
                            <span className="terminal-pulse-dot" />
                            ACTIVE
                          </span>
                        </div>
                        <div className="flex justify-between max-w-md">
                          <span>[ LATENCY_BOUND ]</span>
                          <span className="text-[var(--text-2)] font-semibold">0.0ms (OFFLINE)</span>
                        </div>
                        <div className="flex justify-between max-w-md">
                          <span>[ COMPILER_WEIGHTS ]</span>
                          <span className="text-[var(--text-2)] font-semibold">PIMA INDIANS COHORT</span>
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Mode Selection Cards */}
                    <div className="lg:col-span-5 flex flex-col gap-6 justify-center w-full">
                      {/* Mode Card 1: Manual entry */}
                      <div 
                        onClick={() => {
                          audio.playClick();
                          setCurrentQuestionIndex(0);
                        }}
                        className="w-full border border-[var(--border-soft)] p-8 flex flex-col justify-between min-h-[200px] transition-all duration-300 hover:border-[var(--text-1)] hover:bg-[var(--surface-2)] cursor-pointer group bg-transparent relative overflow-hidden"
                      >
                        <span className="font-mono text-[10px] text-[var(--text-3)]">[ PROTOCOL_01 ]</span>
                        <div className="mt-8">
                          <h3 className="font-syne font-bold text-xl text-[var(--text-1)] mb-2 flex items-center justify-between">
                            Begin Calibration
                            <span className="text-sm font-mono transition-transform duration-300 group-hover:translate-x-1">&rarr;</span>
                          </h3>
                          <p className="font-mono text-xs text-[var(--text-3)] leading-relaxed">
                            Manually adjust all 8 metabolic markers using touch-friendly slider nodes.
                          </p>
                        </div>
                      </div>

                      {/* Mode Card 2: Hospital report integration */}
                      <div 
                        onClick={() => {
                          audio.playClick();
                          setCurrentQuestionIndex(8);
                        }}
                        className="w-full border border-[var(--border-soft)] p-8 flex flex-col justify-between min-h-[200px] transition-all duration-300 hover:border-[var(--text-1)] hover:bg-[var(--surface-2)] cursor-pointer group bg-transparent relative overflow-hidden"
                      >
                        <span className="font-mono text-[10px] text-[var(--text-3)]">[ PROTOCOL_02 ]</span>
                        <div className="mt-8">
                          <h3 className="font-syne font-bold text-xl text-[var(--text-1)] mb-2 flex items-center justify-between">
                            Integrate Lab Report
                            <span className="text-sm font-mono transition-transform duration-300 group-hover:translate-x-1">&rarr;</span>
                          </h3>
                          <p className="font-mono text-xs text-[var(--text-3)] leading-relaxed">
                            Integrate lab report documents or paste raw text reports to auto-extract values.
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ) : currentQuestionIndex >= 0 && currentQuestionIndex <= 7 ? (
                  /* MANUAL SLIDER STEPS */
                  <motion.div
                    key={`step-${currentQuestionIndex}`}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.35 }}
                    className="w-full max-w-[640px] mx-auto flex flex-col gap-8 min-h-[50vh] justify-center py-10"
                  >
                    <div className="flex justify-between items-center w-full pb-3 border-b border-[var(--border-soft)]">
                      <span className="font-mono text-[10px] text-[var(--text-3)] tracking-widest uppercase">
                        [ Metric {currentQuestionIndex + 1} of 8 ]
                      </span>
                      {liveEstimate !== null && (
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[9px] text-[var(--text-3)] tracking-wider">
                            LIVE RISK:
                          </span>
                          <span 
                            className="font-mono text-xs font-bold transition-colors duration-300"
                            style={{ 
                              color: liveEstimate < 30 
                                ? 'var(--risk-low)' 
                                : liveEstimate < 60 
                                  ? 'var(--risk-mid)' 
                                  : 'var(--risk-high)' 
                            }}
                          >
                            {liveEstimate}%
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="w-full border border-[var(--border-soft)] bg-[var(--surface-1)] p-6 rounded-none shadow-sm">
                      {currentQuestionIndex === 0 && (
                        <MetricSlider
                          metricKey="glucose"
                          label="Glucose"
                          min={50}
                          max={300}
                          step={1}
                          value={inputs.glucose}
                          unit="mg/dL"
                          normalRange="70–140"
                          onChange={(val) => handleInputChange('glucose', val)}
                        />
                      )}
                      {currentQuestionIndex === 1 && (
                        <MetricSlider
                          metricKey="bmi"
                          label="BMI"
                          min={10}
                          max={70}
                          step={0.1}
                          value={inputs.bmi}
                          unit="Index"
                          normalRange="18.5–24.9"
                          onChange={(val) => handleInputChange('bmi', val)}
                        />
                      )}
                      {currentQuestionIndex === 2 && (
                        <MetricSlider
                          metricKey="age"
                          label="Age"
                          min={10}
                          max={90}
                          step={1}
                          value={inputs.age}
                          unit="Years"
                          normalRange="Adult"
                          onChange={(val) => handleInputChange('age', val)}
                        />
                      )}
                      {currentQuestionIndex === 3 && (
                        <MetricSlider
                          metricKey="bloodPressure"
                          label="Blood Pressure"
                          min={30}
                          max={130}
                          step={1}
                          value={inputs.bloodPressure}
                          unit="mmHg"
                          normalRange="60–80"
                          onChange={(val) => handleInputChange('bloodPressure', val)}
                        />
                      )}
                      {currentQuestionIndex === 4 && (
                        <MetricSlider
                          metricKey="insulin"
                          label="Insulin"
                          min={0}
                          max={900}
                          step={1}
                          value={inputs.insulin}
                          unit="μU/mL"
                          normalRange="16–166"
                          onChange={(val) => handleInputChange('insulin', val)}
                        />
                      )}
                      {currentQuestionIndex === 5 && (
                        <MetricSlider
                          metricKey="skinThickness"
                          label="Skin Thickness"
                          min={0}
                          max={100}
                          step={1}
                          value={inputs.skinThickness}
                          unit="mm"
                          normalRange="10–50"
                          onChange={(val) => handleInputChange('skinThickness', val)}
                        />
                      )}
                      {currentQuestionIndex === 6 && (
                        <MetricSlider
                          metricKey="pregnancies"
                          label="Pregnancies"
                          min={0}
                          max={17}
                          step={1}
                          value={inputs.pregnancies}
                          unit="Count"
                          normalRange="N/A"
                          onChange={(val) => handleInputChange('pregnancies', val)}
                        />
                      )}
                      {currentQuestionIndex === 7 && (
                        <MetricSlider
                          metricKey="diabetesPedigree"
                          label="Pedigree Score"
                          min={0}
                          max={2.5}
                          step={0.01}
                          value={inputs.diabetesPedigree}
                          unit="Factor"
                          normalRange="0.08–2.42"
                          onChange={(val) => handleInputChange('diabetesPedigree', val)}
                        />
                      )}
                    </div>

                    {/* Biomarker Clinical Detail Card */}
                    {BIOMARKER_DETAILS[currentQuestionIndex] && (
                      <div className="w-full border border-[var(--border-soft)] bg-[var(--surface-1)] p-6 rounded-none text-left flex flex-col gap-3 shadow-sm">
                        <h4 className="font-syne font-bold text-xs uppercase tracking-wider text-[var(--accent)]">
                          Clinical Context: {BIOMARKER_DETAILS[currentQuestionIndex].name}
                        </h4>
                        <p className="font-inter text-xs leading-relaxed text-[var(--text-1)]">
                          {BIOMARKER_DETAILS[currentQuestionIndex].context}
                        </p>
                        <p className="font-inter text-xs leading-relaxed text-[var(--text-2)] italic border-l-2 border-[var(--border-soft)] pl-3">
                          <strong className="not-italic text-[var(--text-1)] uppercase text-[10px] tracking-wider block mb-1">Metabolic Impact:</strong>
                          {BIOMARKER_DETAILS[currentQuestionIndex].significance}
                        </p>
                        <div className="font-mono text-[9px] text-[var(--text-3)] border-t border-[var(--border-soft)] pt-3 mt-1 uppercase tracking-wider">
                          Clinical Reference Range: {BIOMARKER_DETAILS[currentQuestionIndex].range}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-4 w-full mt-2">
                      <PremiumButton
                        onClick={() => {
                          audio.playClick();
                          setCurrentQuestionIndex(prev => prev - 1);
                        }}
                        variant="secondary"
                        className="flex-1 py-4 text-xs"
                      >
                        &larr; Back
                      </PremiumButton>
                      
                      {currentQuestionIndex < 7 ? (
                        <PremiumButton
                          onClick={() => {
                            audio.playClick();
                            setCurrentQuestionIndex(prev => prev + 1);
                          }}
                          variant="primary"
                          className="flex-1 py-4 text-xs"
                        >
                          Continue &rarr;
                        </PremiumButton>
                      ) : (
                        <PremiumButton
                          onClick={runPrediction}
                          disabled={isAnalyzing}
                          variant="primary"
                          className="flex-1 py-4 text-xs"
                        >
                          {isAnalyzing ? (
                            <span className="flex items-center justify-center gap-2">
                              <Loader2 size={14} className="animate-spin text-[var(--text-1)]" />
                              Running...
                            </span>
                          ) : (
                            <span>Run Estimator &rarr;</span>
                          )}
                        </PremiumButton>
                      )}
                    </div>
                  </motion.div>
                ) : (
                  /* INTEGRATION STEP (Index 8) */
                  <motion.div
                    key="step-integration"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.35 }}
                    className="w-full max-w-[760px] mx-auto flex flex-col gap-8 min-h-[50vh] justify-center py-10"
                  >
                    <div className="flex justify-between items-center w-full pb-3 border-b border-[var(--border-soft)]">
                      <span className="font-mono text-[10px] text-[var(--text-3)] tracking-widest uppercase">
                        [ Data Integration Suite ]
                      </span>
                    </div>

                    <DataIntegrationSuite onApplyInputs={handleApplyInputs} />

                    <div className="flex flex-col gap-3 w-full mt-2">
                      <PremiumButton
                        onClick={runPrediction}
                        disabled={isAnalyzing}
                        variant="primary"
                        className="w-full py-4 text-xs"
                      >
                        {isAnalyzing ? (
                          <span className="flex items-center justify-center gap-2">
                            <Loader2 size={14} className="animate-spin text-[var(--text-1)]" />
                            Evaluating Parsed Model...
                          </span>
                        ) : (
                          <span>Compute Risk with Integrated Data &rarr;</span>
                        )}
                      </PremiumButton>

                      <PremiumButton
                        onClick={() => {
                          audio.playClick();
                          setCurrentQuestionIndex(-1);
                        }}
                        variant="secondary"
                        className="w-full py-4 text-xs"
                      >
                        &larr; Back to Selection Menu
                      </PremiumButton>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ) : (
            /* STAGE 2: PREDICTION RESULTS DISPLAY */
            <motion.div
              key="results-stage"
              initial={{ opacity: 0, y: 35 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 35 }}
              transition={{ duration: 0.5, ease: [0.76, 0, 0.24, 1] }}
              className="w-full max-w-[1200px] mx-auto flex flex-col gap-8 relative"
            >
              {/* Back to Inputs Trigger Header */}
              <div className="flex items-center justify-between w-full pb-4 border-b border-[var(--border-soft)]">
                <button
                  onClick={() => {
                    audio.playClick();
                    setActiveStage('input');
                    setCurrentQuestionIndex(-1);
                  }}
                  className="inline-flex items-center gap-2 text-xs font-mono text-[var(--text-3)] hover:text-[var(--text-1)] transition-colors duration-200"
                >
                  <ArrowLeft size={14} /> Back to Inputs
                </button>
                <span className="font-mono text-[10px] text-[var(--accent)] tracking-wider uppercase">
                  COMPUTATION COMPLETED
                </span>
              </div>

              {/* Re-run update banner overlay (if inputs change on future stage changes) */}
              {inputsDiverged && (
                <div className="flex items-center justify-between p-3.5 rounded-none bg-transparent border border-[var(--cyan-accent)] text-[var(--cyan-accent)] text-xs font-mono uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <RefreshCw size={12} className="animate-spin-slow text-[var(--cyan-accent)]" />
                    Biomarkers modified since last run.
                  </div>
                  <button
                    onClick={runPrediction}
                    className="px-3 py-1 rounded-none border border-[var(--cyan-accent)] hover:bg-[var(--cyan-accent)] hover:text-[var(--void)] text-[var(--cyan-accent)] text-[10px] transition-colors duration-200 uppercase font-bold"
                  >
                    Re-run
                  </button>
                </div>
              )}

              {/* Main Results components */}
              <div className={`flex flex-col gap-6 rounded-none transition-all duration-300 ${pulseClass}`}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full items-start">
                  {/* Left Column: Risk Gauge & Probability Curve */}
                  <div className="flex flex-col gap-6 w-full">
                    {/* Risk Gauge */}
                    <div className="w-full border border-[var(--border-soft)] rounded-none p-8 flex justify-center items-center bg-[var(--surface-1)] shadow-sm">
                      <RiskGauge risk={riskScore} />
                    </div>

                    {/* Probability Distribution Curve */}
                    <ProbabilityCurve riskPercent={riskScore} />
                  </div>

                  {/* Right Column: Feature Contributions & Insights */}
                  <div className="flex flex-col gap-6 w-full">
                    {/* Contribution Chart */}
                    {contributions && (
                      <FeatureChart contributions={contributions} />
                    )}

                    {/* Clinical Insights */}
                    <InsightCard inputs={inputs} risk={riskScore} />
                  </div>
                </div>

                {/* AI consultation chatbot desk */}
                <ClinicalChat inputs={inputs} riskScore={riskScore} contributions={contributions} />

                {/* Detailed Medical Disclaimer */}
                <div className="w-full border border-[var(--border-soft)] rounded-none p-6 flex flex-col gap-4 bg-[var(--surface-1)] shadow-sm">
                  <div className="flex gap-2.5 items-start">
                    <Info size={16} className="text-[var(--text-3)] mt-0.5" />
                    <div className="flex flex-col gap-1 text-left">
                      <h4 className="font-syne font-bold text-xs uppercase tracking-wider text-[var(--text-1)]">
                        About This Score
                      </h4>
                      <p className="font-inter text-[11px] leading-relaxed text-[var(--text-2)]">
                        This is not a medical diagnosis. The model uses a logistic regression classifier trained on the Pima Indians Diabetes Dataset with ~77% validation accuracy. We strongly recommend consulting a healthcare provider for any risk percentage above 40%.
                      </p>
                    </div>
                  </div>
                  <div className="text-[10px] font-mono text-[var(--text-4)] text-center pt-3 border-t border-[var(--border-soft)]">
                    GLYCOS is a data science demonstration tool. Not a medical device. Not for clinical use.
                  </div>
                </div>

                {/* Download PDF/HTML Report & Adjust Button Row */}
                <div className="flex flex-col md:flex-row gap-4 w-full mt-2">
                  <PremiumButton
                    onClick={downloadHtmlReport}
                    variant="primary"
                    className="flex-1 py-4 text-xs font-mono uppercase tracking-wider"
                  >
                    Download Official Clinical Report &darr;
                  </PremiumButton>

                  <PremiumButton
                    onClick={() => {
                      audio.playClick();
                      setActiveStage('input');
                      setCurrentQuestionIndex(-1);
                    }}
                    variant="secondary"
                    className="flex-1 py-4 text-xs font-mono uppercase tracking-wider"
                  >
                    &larr; Adjust Clinical Biomarkers
                  </PremiumButton>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Dynamic Clinical Analysis Loader Overlay */}
      <AnimatePresence>
        {isAnalyzing && (
          <motion.div
            initial={{ 
              scale: 0, 
              borderRadius: "45% 55% 70% 30% / 45% 45% 55% 55%", 
              opacity: 1 
            }}
            animate={{ 
              scale: 1, 
              borderRadius: "0px",
              opacity: 1 
            }}
            exit={{ 
              y: '-100vh',
              borderBottomLeftRadius: '16vw',
              borderBottomRightRadius: '16vw',
              opacity: 0.9,
            }}
            transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
            className="fixed inset-0 z-[99999] bg-[#0c0f12] select-none overflow-hidden"
            style={{ transformOrigin: 'center center' }}
          >
            {/* Designer Framer Preloader */}
            <Calibration3DLoader progress={analysisProgress} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Laser scan animation & Radial pulsing background stylesheets */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes pulseLow {
          0% { box-shadow: inset 0 0 0px rgba(16, 185, 129, 0); }
          50% { box-shadow: inset 0 0 80px rgba(16, 185, 129, 0.1); }
          100% { box-shadow: inset 0 0 0px rgba(16, 185, 129, 0); }
        }
        @keyframes pulseMid {
          0% { box-shadow: inset 0 0 0px rgba(245, 158, 11, 0); }
          50% { box-shadow: inset 0 0 80px rgba(245, 158, 11, 0.1); }
          100% { box-shadow: inset 0 0 0px rgba(245, 158, 11, 0); }
        }
        @keyframes pulseHigh {
          0% { box-shadow: inset 0 0 0px rgba(239, 68, 68, 0); }
          50% { box-shadow: inset 0 0 80px rgba(239, 68, 68, 0.1); }
          100% { box-shadow: inset 0 0 0px rgba(239, 68, 68, 0); }
        }

        .pulse-low {
          animation: pulseLow 3s infinite ease-in-out;
        }
        .pulse-mid {
          animation: pulseMid 3s infinite ease-in-out;
        }
        .pulse-high {
          animation: pulseHigh 3s infinite ease-in-out;
        }

        @keyframes spinSlow {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(-360deg); }
        }
        .animate-spin-slow {
          animation: spinSlow 3.3s linear infinite;
        }
      `}} />
    </div>
  );
};

export default Diagnosis;
