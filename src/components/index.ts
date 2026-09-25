/**
 * Everything chapter MDX files typically need, importable from one place:
 *   import { Figure, Quiz, Callout } from '../../components';
 */
export { Callout } from './content/Callout';
export { CodeBlock } from './content/CodeBlock';
export { Figure } from './content/Figure';
export { Quiz, type QuizQuestion } from './content/Quiz';
export { InlineMarkdown } from './content/InlineMarkdown';
export { Slider } from './controls/Slider';
export { Segmented } from './controls/Segmented';
export { StepControls, useStepper } from './controls/Stepper';
export { HeatGrid } from './viz/HeatGrid';
export { TokenChips } from './viz/TokenChips';
export { ProbabilityBars } from './viz/ProbabilityBars';
export { FunctionPlot, type PlotSeries } from './viz/FunctionPlot';
