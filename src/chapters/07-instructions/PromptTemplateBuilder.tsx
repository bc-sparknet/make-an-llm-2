import { useState } from 'react';
import { Figure, Segmented } from '../../components';
import styles from './PromptTemplateBuilder.module.css';

/**
 * Edit an instruction/input/output entry and see it rendered as a training
 * prompt in either the Alpaca or the Phi-3 style. With an empty input, the
 * Alpaca "### Input:" section disappears entirely.
 */

interface Entry {
  name: string;
  instruction: string;
  input: string;
  output: string;
}

const EXAMPLES: Entry[] = [
  {
    name: 'Rewrite',
    instruction: 'Rewrite the sentence in the passive voice.',
    input: 'The chef cooked a delicious meal.',
    output: 'A delicious meal was cooked by the chef.',
  },
  {
    name: 'No input',
    instruction: 'Name three primary colours.',
    input: '',
    output: 'Red, blue and yellow.',
  },
  {
    name: 'Convert',
    instruction: 'Convert the temperature to Fahrenheit.',
    input: '25 °C',
    output: '25 °C is 77 °F.',
  },
];

type Format = 'alpaca' | 'phi3';
const FORMATS = [
  { value: 'alpaca', label: 'Alpaca' },
  { value: 'phi3', label: 'Phi-3' },
] as const;

const PREAMBLE =
  'Below is an instruction that describes a task. Write a response that appropriately completes the request.';

type Part = { kind: 'fixed' | 'instruction' | 'input' | 'output'; text: string };

function render(e: Entry, format: Format): Part[] {
  const hasInput = e.input.trim().length > 0;
  if (format === 'phi3') {
    return [
      { kind: 'fixed', text: '<|user|>\n' },
      { kind: 'instruction', text: e.instruction },
      ...(hasInput ? [{ kind: 'fixed', text: '\n' } as Part, { kind: 'input', text: e.input } as Part] : []),
      { kind: 'fixed', text: '<|end|>\n<|assistant|>\n' },
      { kind: 'output', text: e.output },
      { kind: 'fixed', text: '<|end|>' },
    ];
  }
  return [
    { kind: 'fixed', text: `${PREAMBLE}\n\n### Instruction:\n` },
    { kind: 'instruction', text: e.instruction },
    ...(hasInput ? [{ kind: 'fixed', text: '\n\n### Input:\n' } as Part, { kind: 'input', text: e.input } as Part] : []),
    { kind: 'fixed', text: '\n\n### Response:\n' },
    { kind: 'output', text: e.output },
  ];
}

export function PromptTemplateBuilder() {
  const [entry, setEntry] = useState<Entry>(EXAMPLES[0]);
  const [format, setFormat] = useState<Format>('alpaca');
  const parts = render(entry, format);
  const set = (key: 'instruction' | 'input' | 'output') => (v: string) => setEntry({ ...entry, name: '', [key]: v });
  const emptyInput = entry.input.trim() === '';

  return (
    <Figure
      title="Build a training prompt"
      caption="Everything up to and including the response marker (### Response: or <|assistant|>) is the prompt the model will see at inference time; the coloured text after it is what the model learns to produce."
    >
      <div className={styles.picks}>
        {EXAMPLES.map((ex) => (
          <button key={ex.name} className={styles.pick} data-active={entry.name === ex.name} onClick={() => setEntry(ex)}>
            {ex.name}
          </button>
        ))}
      </div>

      <div className={styles.fields}>
        <Field label="instruction" value={entry.instruction} onChange={set('instruction')} />
        <Field label="input" value={entry.input} onChange={set('input')} placeholder="(optional, leave empty)" />
        <Field label="output" value={entry.output} onChange={set('output')} />
      </div>

      <Segmented label="Prompt style" options={FORMATS} value={format} onChange={setFormat} />

      <pre className={styles.preview} aria-label="Formatted prompt">
        {parts.map((p, i) => (
          <span key={i} data-kind={p.kind}>
            {p.text}
          </span>
        ))}
      </pre>

      <p className={styles.note}>
        {emptyInput
          ? format === 'alpaca'
            ? 'The input is empty, so the whole "### Input:" section is left out.'
            : 'The input is empty, so only the instruction goes in the user turn.'
          : format === 'alpaca'
            ? 'Clear the input field to see the "### Input:" section disappear.'
            : 'Phi-3 uses special role tokens instead of Markdown headers, so prompts are shorter.'}
      </p>
    </Figure>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const id = `ptb-${label}`;
  return (
    <div className={styles.field} data-kind={label}>
      <label htmlFor={id}>{label}</label>
      <textarea id={id} rows={2} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
