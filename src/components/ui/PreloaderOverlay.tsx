import React from 'react'; React;
import DustParticles from './DustParticles'
import DecryptedText from './DecryptedText'

export default function PreloaderOverlay({ show, hide, text = 'Bienvenido a SpecAtlas' }: { show: boolean; hide: boolean; text?: string }) {
  if (!show) return null
  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-[#070707] transition-all duration-700 ease-out ${hide ? 'opacity-0 blur-sm scale-[1.02]' : 'opacity-100'}`}>
      <DustParticles count={45} zIndex={48} />
      <div className="relative z-[49] text-center text-white">
        <DecryptedText
          text={text}
          speed={45}
          maxIterations={30}
          className="text-2xl font-bold"
          parentClassName="text-2xl font-bold"
          encryptedClassName="text-2xl font-bold opacity-60"
          animateOn="view"
        />
      </div>
    </div>
  )
}
