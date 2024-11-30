import './style.scss';

interface Props {
  customMessage?: string;
}

/**
 * Styled placeholder for places where elements are waiting or has no data coming form API
 * @param customMessage Text to replace default 'No data' text
 */
export const NoData = ({ customMessage }: Props) => {
  return (
    <p className="no-data">
      {customMessage && customMessage.length ? customMessage : 'No data'}
    </p>
  );
};
