import type { SVGProps } from 'react';
const SvgIconConnection = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={24}
    height={25}
    fill="none"
    viewBox="0 0 24 25"
    {...props}
  >
    <mask
      id="icon-connection_svg__a"
      width={24}
      height={25}
      x={0}
      y={0}
      maskUnits="userSpaceOnUse"
      style={{
        maskType: 'luminance',
      }}
    >
      <path fill="#fff" d="M24 0H0v24.002h24z" />
    </mask>
    <g mask="url(#icon-connection_svg__a)">
      <path
        stroke="#14BC6E"
        strokeWidth={2}
        d="M12 16.501a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Z"
      />
    </g>
  </svg>
);
export default SvgIconConnection;
