import './style.scss';

type Props = {
  active: boolean;
  onClick?: (context: boolean) => void;
};

export const RadioButton = ({ active, onClick }: Props) => {
  return (
    <button
      className="radio-button"
      onClick={() => {
        onClick?.(active);
      }}
    >
      {active && <ActiveIcon />}
      {!active && <InactiveIcon />}
    </button>
  );
};

const ActiveIcon = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={18}
      height={18}
      fill="none"
      viewBox="0 0 18 18"
    >
      <rect
        width={16}
        height={16}
        x={1}
        y={1}
        style={{ stroke: 'var(--surface-main-primary)' }}
        strokeWidth={2}
        rx={8}
      />
      <path
        d="M5 9a4 4 0 1 1 8 0 4 4 0 0 1-8 0Z"
        style={{ fill: 'var(--surface-main-primary)' }}
      />
    </svg>
  );
};

const InactiveIcon = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={18}
      height={18}
      fill="none"
      viewBox="0 0 20 20"
    >
      <rect
        width={18}
        height={18}
        x={1}
        y={1}
        style={{ fill: 'var(--surface-button)' }}
        rx={9}
      />
      <rect
        width={18}
        height={18}
        x={1}
        y={1}
        rx={9}
        style={{ stroke: 'var(--border-primary)' }}
      />
    </svg>
  );
};
