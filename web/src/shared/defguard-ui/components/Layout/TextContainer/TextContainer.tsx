import './style.scss';

type Props = {
  text: string;
  onClick?: (
    val: string,
    event?: React.MouseEvent<HTMLParagraphElement, MouseEvent>,
  ) => void;
};

/** Limits text block to a parent container.*/
export const TextContainer = ({ text, onClick }: Props) => {
  return (
    <p className="text-container" onClick={(e) => onClick?.(text, e)}>
      {text}
    </p>
  );
};
