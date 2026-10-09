import React from 'react';
import {AbsoluteFill, Audio, Sequence, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig, continueRender, delayRender} from 'remotion';
import {TransitionSeries, linearTiming} from '@remotion/transitions';
import {slide} from '@remotion/transitions/slide';
import {fade} from '@remotion/transitions/fade';

type Move = 'zoom' | 'panL' | 'pop' | 'zoomL' | 'zoomR' | 'pulse';
const FPS = 30, T = 8, DELAY = 0.5, TOTAL_S = 24;
// speech = [start, end] of each line in the voice file (seconds), measured from the audio
const RAW: {img: string; move: Move; text: string | null; speech: [number, number]}[] = [
  {img: 'reel1.png', move: 'zoom', text: '¿Cómo consigues más reseñas en Google?', speech: [0.0, 2.17]},
  {img: 'reel2.png', move: 'panL', text: 'Tus clientes salen contentos… y se les olvida opinar.', speech: [3.47, 7.11]},
  {img: 'reel3.png', move: 'pop', text: 'Con un letrero kausrovi, ¡es mucho más fácil!', speech: [7.5, 10.4]},
  {img: 'reel4.png', move: 'zoomL', text: 'Acercan su celular…', speech: [10.78, 11.88]},
  {img: 'reel5.png', move: 'zoomR', text: '…o escanean el código.', speech: [12.45, 13.52]},
  {img: 'reel6.png', move: 'zoom', text: 'Y llegan directo a tu página de reseñas.', speech: [13.92, 16.16]},
  {img: 'reel7.png', move: 'panL', text: 'Más fácil para tu cliente.', speech: [16.5, 17.97]},
  {img: 'reel8.png', move: 'pulse', text: null, speech: [18.38, 20.6]},
];
// scene i starts (transition begins) just before its line; scene 2 starts at the sigh (2.8 s)
const SCENE_START_S = [0, 2.8, 7.5, 10.78, 12.45, 13.92, 16.5, 18.38];
const cuts = SCENE_START_S.map((t, i) => (i === 0 ? 0 : Math.round((t + DELAY) * FPS) - T));
export const TOTAL = TOTAL_S * FPS;
const SCENES = RAW.map((r, i) => {
  const start = cuts[i];
  const next = i < RAW.length - 1 ? cuts[i + 1] : TOTAL;
  const dur = next - start + (i < RAW.length - 1 ? T : 0);
  const say0 = Math.round((r.speech[0] + DELAY) * FPS) - start;
  const say1 = Math.round((r.speech[1] + DELAY) * FPS) - start;
  return {...r, dur, say0, say1};
});

const font = new FontFace('Lexend', `url(${staticFile('lexend600.woff2')})`, {weight: '600'});
const handle = delayRender('font');
font.load().then((f) => { document.fonts.add(f); continueRender(handle); });

const Scene: React.FC<{img: string; dur: number; move: Move; text: string | null; say0: number; say1: number}> = ({img, dur, move, text, say0, say1}) => {
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
            opacity: interpolate(f, [Math.max(0, say0 - 4), Math.max(1, say0 + 2)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}}>
            {words.map((w, i) => {
              const s = say0 + Math.round(((say1 - say0) * 0.85 * i) / Math.max(1, words.length));
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
        const base = hasVoice ? 0.22 : 0.6;
        return base * interpolate(f, [0, 15, durationInFrames - 30, durationInFrames], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
      }} />
      {hasVoice && <Sequence from={Math.round(DELAY * FPS)}><Audio src={staticFile('voz.mp3')} volume={1} /></Sequence>}
    </AbsoluteFill>
  );
};
