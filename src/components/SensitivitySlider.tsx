import styles from './SensitivitySlider.module.css';

interface SensitivitySliderProps {
  value: number;
  onChange: (value: number) => void;
}

export function SensitivitySlider({ value, onChange }: SensitivitySliderProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(parseFloat(e.target.value));
  };

  return (
    <div className={styles.container}>
      <label className={styles.label}>
        <span className={styles.title}>Sensitivity</span>
        <span className={styles.value}>{value.toFixed(1)}x</span>
      </label>
      <input
        type="range"
        min="0.5"
        max="5"
        step="0.1"
        value={value}
        onChange={handleChange}
        className={styles.slider}
      />
      <div className={styles.hints}>
        <span>Quiet</span>
        <span>Loud</span>
      </div>
    </div>
  );
}
