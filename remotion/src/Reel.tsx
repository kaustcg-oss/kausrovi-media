import React from 'react';
import {AbsoluteFill, Audio, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig, continueRender, delayRender} from 'remotion';
import {TransitionSeries, linearTiming} from '@remotion/transitions';
import {slide} from '@remotion/transitions/slide';
import {fade} from '@remotion/transitions/fade';

type Move = 'zoom' | 'panL' | 'pop' | 'zoomL' | 'zoomR' | 'pulse';
const SCENES: {img: string; dur: number; move: Move; text: string | null}[] = [
  {img: 'reel1.png', dur: 75, move: 'zoom', text: '¿Cómo consigues más reseñas en Google?'},
  {img: 'reel2.png', dur: 75, move: 'panL', text: 'Tus clientes salen contentos… y se les olvida opinar.'},
  {img: 'reel3.png', dur: 75, move: 'pop', text: 'Con un letrero kausrovi, es más fácil.'},
  {img: 'reel4.png', dur: 66, move: 'zoomL', text: 'Acercan su celular…'},
  {img: 'reel5.png', dur: 66, move: 'zoomR', text: '…o escanean el código.'},
  {img: 'reel6.png', dur: 78, move: 'zoom', text: 'Y llegan directo a tu página de reseñas.'},
  {img: 'reel7.png', dur: 72, move: 'panL', text: 'Más fácil para tu cliente.'},
  {img: 'reel8.png', dur: 105, move: 'pulse', text: null},
];
const T = 8;
export const TOTAL = SCENES.reduce((a, s) => a + s.dur, 0) - T * (SCENES.length - 1);

const font = new FontFace('Lexend', `url(${staticFile('lexend600.woff2')})`, {weight: '600'});
const handle = delayRender('font');
font.load().then((f) => { document.fonts.add(f); continueRender(handle); });

const Scene: React.FC<{img: string; dur: number; move: Move; text: string | null}> = ({img, dur, move, text}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const p = f / dur;
  let transform = '';
  if (move === 'zoom') transform = `scale(${interpolate(p, [0, 1], [1, 1.06])})`;
  if (move === 'panL') transform = `scale(1.06) translateX(${interpolate(p, [0, 1], [18, -18])}px)`;
  if (move === 'pop') transform = `scale(${0.92 + 0.08 * spring({frame: f, fps, config: {damping: 14}})})`;
  if (move === 'zoomL') transform = `scale(${interpolate(p, [0, 1], [1, 1.08])})`;
  if (move === 'zoomR') transform = `scale(${interpolate(p, [0, 1], [1, 1.08])})`;
  if (move === 'pulse') transform = `scale(${1 + 0.012 * Math.sin(f / 8)})`;
  const origin = move === 'zoomL' ? '25% 60%' : move === 'zoomR' ? '75% 55%' : '50% 50%';
  const words = text ? text.split(' ') : [];
  return (
    <AbsoluteFill style={{backgroundColor: '#152330'}}>
      <AbsoluteFill style={{transform, transformOrigin: origin}}>
        <Img src={staticFile(img)} style={{width: 1080, height: 1920}} />
      </AbsoluteFill>
      {text && (
        <AbsoluteFill style={{justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 380}}>
          <div style={{maxWidth: 900, background: 'rgba(21,35,48,0.85)', borderRadius: 40, padding: '20px 36px', textAlign: 'center',
            fontFamily: 'Lexend', fontWeight: 600, fontSize: 54, lineHeight: 1.18, color: '#fff',
            opacity: interpolate(f, [4, 10], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}}>
            {words.map((w, i) => {
              const s = 6 + i * 3;
              const o = interpolate(f, [s, s + 5], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
              return <span key={i} style={{opacity: o, display: 'inline-block', transform: `translateY(${(1 - o) * 10}px)`, marginRight: 14}}>{w}</span>;
            })}
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};

export const Reel: React.FC<{hasVoice: boolean}> = ({hasVoice}) => {
  const {durationInFrames} = useVideoConfig();
  return (
    <AbsoluteFill style={{backgroundColor: '#152330'}}>
      <TransitionSeries>
        {SCENES.flatMap((s, i) => {
          const items = [<TransitionSeries.Sequence key={`s${i}`} durationInFrames={s.dur}><Scene {...s} /></TransitionSeries.Sequence>];
          if (i < SCENES.length - 1)
            items.push(<TransitionSeries.Transition key={`t${i}`} presentation={i % 2 ? fade() : slide({direction: 'from-right'})} timing={linearTiming({durationInFrames: T})} />);
          return items;
        })}
      </TransitionSeries>
      <Audio src={staticFile('music.wav')} volume={(f) => {
        const base = hasVoice ? 0.25 : 0.6;
        return base * interpolate(f, [0, 15, durationInFrames - 30, durationInFrames], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
      }} />
      {hasVoice && <Audio src={staticFile('voz.mp3')} volume={1} />}
    </AbsoluteFill>
  );
};
