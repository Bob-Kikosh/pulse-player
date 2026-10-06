import styles from "./Equalizer.module.css";

// Small animated bars that mark the track being played
function Equalizer() {
  return (
    <span className={styles.equalizer} aria-hidden="true">
      <span />
      <span />
      <span />
      <span />
    </span>
  );
}

export default Equalizer;
