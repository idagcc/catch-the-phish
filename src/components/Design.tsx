import type { CSSProperties, ReactNode } from 'react';
import './Design.css';

const asset = (file: string) => `${import.meta.env.BASE_URL}design/figma/${file}`;

type ArtworkLayer = readonly [file: string, x: number, y: number, width: number, height: number, insetX?: number, insetY?: number];

const mainButtonLayers: readonly ArtworkLayer[] = [
  ['8773f921-d5aa-44dc-b53c-9897c415f6a9.svg', 27.14, 22.43, 825.712, 208.944],
  ['b4a2300a-9d2e-4422-8541-71d3f5896adc.svg', 2.86, 22.43, 874.284, 213.666, -.001, -.0019],
  ['88090ed9-4949-4823-bccb-bed08d4ee3bf.svg', 214.42, 231.5, 25.428, 2.125],
  ['94c7d00c-4304-447e-b73d-b276a2484fa7.svg', 214.42, 21.38, 25.428, 2.125],
  ['48101789-e06a-4d41-97af-04687fba006a.svg', 640.13, 231.5, 25.427, 2.125],
  ['9d168554-4fa6-478d-8de0-6e96aefbebfb.svg', 640.13, 21.38, 25.427, 2.125],
  ['6646990d-c028-40c1-90f2-904ce48a2052.svg', 275.71, 61.38, 271.429, 131.033, -.0021, -.0028],
  ['6d09a84c-2ede-4d4d-a916-129ada297d1e.svg', 27.15, 5.9, 825.711, 243.178],
  ['c107cbc5-8dae-4138-9c6b-67551ee24c78.svg', 0, 0, 879.997, 254.985, 0, -.0028],
  ['55d9cccf-b5af-4201-80af-3be2a5fc0c16.svg', 34.29, 33.08, 811.424, 198.3, 0, -.0027],
  ['60628947-80bd-4352-ba38-965acd2c708e.svg', 445.71, 0, 434.284, 254.984, -.0133, -.0243],
  ['75867aa4-b42a-4802-848f-b75c9298b39a.svg', 0, 0, 434.285, 254.985, -.0091, -.0243],
];

const answerButtonLayers: readonly ArtworkLayer[] = [
  ['c02facd2-66b2-4f56-88e4-7f6c6c07024c.svg', 17.18, 14.19, 656.818, 166.206],
  ['7e33b54d-dd89-4d3e-9643-db09e3af91df.svg', 1.81, 14.19, 695.454, 169.962, -.001, -.0019],
  ['9827d6eb-5862-409d-9e9d-3c636f81c0ea.svg', 135.67, 146.48, 20.227, 1.69],
  ['0458c402-b10f-42d8-9072-ffbe4a94a0c0.svg', 135.67, 13.53, 20.227, 1.69],
  ['a33dab3d-fe60-485e-9212-bff39009c2da.svg', 405.04, 146.48, 20.226, 1.69],
  ['bf62e0a1-acbc-4daa-9c69-11eb72ea6edf.svg', 405.04, 13.53, 20.226, 1.69],
  ['b8563276-4eb5-419c-9559-ec4d0d1fd653.svg', 174.46, 38.84, 215.91, 104.231, -.0021, -.0028],
  ['17a6664b-27b2-4de3-b7ee-5c4e8e7a797a.svg', 17.18, 3.74, 656.817, 193.438],
  ['c796b6fd-4061-4c46-a887-3c10ceb9bc07.svg', 0, 0, 699.999, 202.829, 0, -.0028],
  ['a27943d4-742b-4ce1-ba91-b08774d1350f.svg', 21.7, 20.93, 645.453, 157.739, 0, -.0027],
  ['a6ebf179-cce5-4a22-bcaf-88027c2fed46.svg', 282.03, 0, 345.454, 202.829, -.0133, -.0243],
  ['5cc6aa0a-f8f9-4700-adf8-1cf0b2f82ad8.svg', 0, 0, 345.455, 202.829, -.0091, -.0243],
];

export interface AngularButtonProps {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  labelSize?: number;
  feedback?: 'correct' | 'incorrect';
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  'aria-label'?: string;
}

export function AngularButton({ children, onClick, disabled, x = 0, y = 0, width = 880, height, labelSize, feedback, className = '', type = 'button', 'aria-label': ariaLabel }: AngularButtonProps) {
  const answer = width <= 700;
  const nativeWidth = answer ? 700 : 880;
  const nativeHeight = answer ? 202.829 : 255;
  const actualHeight = height ?? nativeHeight * width / nativeWidth;
  return (
    <button type={type} className={`angular-button ${className}`} onClick={onClick} disabled={disabled} aria-label={ariaLabel} data-answer={answer} data-feedback={feedback} style={{ left: x, top: y, width, height: actualHeight }}>
      <span className="angular-button__art" aria-hidden="true" style={{ width: nativeWidth, height: nativeHeight, transform: `scale(${width / nativeWidth}, ${actualHeight / nativeHeight})` }}>
        {(answer ? answerButtonLayers : mainButtonLayers).map(([file, left, top, layerWidth, layerHeight, insetX = 0, insetY = 0]) => (
          <span key={file} className="angular-button__layer" style={{ left, top, width: layerWidth, height: layerHeight }}>
            <img className="design-asset" src={asset(file)} alt="" draggable={false} style={{ left: layerWidth * insetX, top: layerHeight * insetY }} />
          </span>
        ))}
      </span>
      <span className="angular-button__label" style={{ fontSize: labelSize ?? (answer ? 45.56 : 72) }}>{children}</span>
    </button>
  );
}

export interface GlowPanelProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  type?: 'main' | 'question' | 'message' | 'result';
  feedback?: 'correct' | 'incorrect';
  className?: string;
}

export function GlowPanel({ x = 0, y = 0, width, height, type = 'main', className = '', feedback }: GlowPanelProps) {
  const message = type === 'message';
  const w = width ?? (message ? 1460 : type === 'question' ? 1748.25 : 1748);
  const h = height ?? (message ? 920 : type === 'result' ? 1580 : type === 'question' ? 2440 : 2300);
  const bodyAsset = type === 'main' ? '203cbba8-1622-486d-9486-a1b005ce7759.svg' : type === 'result' ? '422d2dcf-3d4b-42b6-9245-1b0e5369e488.svg' : undefined;
  const nativeHeight = type === 'result' ? 1580 : 2300;
  const style = {
    left: x, top: y, width: w, height: h,
    '--panel-radius': message ? '139.937px' : '157.143px',
    '--panel-inner-radius': message ? '115.94px' : '105.714px',
    '--panel-inset-x': message ? '24px' : type === 'question' ? '56.19px' : '56.07px',
    '--panel-inset-y': message ? '24px' : '63.77px',
    '--panel-bloom': message ? '15.266px' : '17.143px',
    '--panel-diffuse': message ? '30.532px' : '34.286px',
    '--panel-diffuse-border': message ? '25.443px' : '28.571px',
    '--panel-inner-blur': message ? '10.177px' : '11.429px',
    '--panel-inner-diffuse-border': message ? '12.722px' : '14.286px',
    '--panel-inner-border': message ? '6.361px' : '7.143px',
    '--panel-outer-border': message ? '7.633px' : '8.571px',
    '--halo-gradient': feedback ? `linear-gradient(${feedback === 'correct' ? '#5cffbf,#5cffbf' : '#ff4066,#ff4066'})` : `linear-gradient(${message ? '180deg' : '90deg'},#8cfbff 28.75%,#00dfff 39.75%,#087dff 60.75%,#0648e8 71.25%,#8755ff 78.75%)`,
    '--panel-light': feedback === 'correct' ? '#5cffbf' : feedback === 'incorrect' ? '#ff4066' : '#8cfbff',
    '--panel-outer-light': feedback === 'correct' ? '#5cffbf' : feedback === 'incorrect' ? '#ff4066' : '#00dfff',
  } as CSSProperties;
  return (
    <div className={`glow-panel glow-panel--${type} ${className}`} style={style} aria-hidden="true">
      {bodyAsset ? (
        <span className="glow-panel__asset-body" style={{ width: 1748, height: nativeHeight, transform: `scale(${w / 1748}, ${h / nativeHeight})` }}>
          <img className="design-asset" src={asset(bodyAsset)} alt="" draggable={false} style={{ left: (1748 - nativeHeight) / 2, top: (nativeHeight - 1748) / 2, transform: 'rotate(-90deg)' }} />
        </span>
      ) : <><span className="glow-panel__gradient" /><span className="glow-panel__quiet" /><span className="glow-panel__edge" /></>}
      <span className="glow-panel__bloom" />
      <span className="glow-panel__diffuse" />
      <span className="glow-panel__inner-diffuse" />
      <span className="glow-panel__inner-crisp" />
      <span className="glow-panel__outer-crisp" />
    </div>
  );
}

const fieldLayers = [
  ['e7c94a46-56f1-4998-b4b1-cdd94a41369c.svg', .66, .66],
  ['cff87dec-6131-4683-a925-8fca42fd3ea8.svg', 5.91, 5.91],
  ['36f3ae52-4a3e-4206-981e-58929890e7ff.svg', 9.79, 9.114],
  ['791f2f48-b711-4171-9aae-1a024d35e579.svg', 17.31, 16.995],
  ['36377591-6fb1-47d0-875c-ba2a14a303dd.svg', 35.56, 213.102],
  ['cbbae7e4-b88c-4f37-8316-852be6985bea.svg', 1445.87, 45.247],
  ['e0f78f3e-efd0-4bf8-89b1-e386f1f6b41c.svg', 1449.75, 48.45],
] as const;

export function FieldArtwork({ x = 0, y = 0, width = 1460, height = 244.8295 }: { x?: number; y?: number; width?: number; height?: number }) {
  return <span className="field-artwork" aria-hidden="true" style={{ left: x, top: y, width: 1460, height: 244.8295, transform: `scale(${width / 1460}, ${height / 244.8295})` }}>{fieldLayers.map(([file, left, top]) => <img key={file} className="design-asset" src={asset(file)} alt="" draggable={false} style={{ left, top }} />)}</span>;
}
