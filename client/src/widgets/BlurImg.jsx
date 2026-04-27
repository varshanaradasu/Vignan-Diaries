import { useState } from 'react'

export default function BlurImg({ src, alt, className, style }) {
  const [loaded, setLoaded] = useState(false)
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onLoad={() => setLoaded(true)}
      className={`${className || ''} blur-up ${loaded ? 'loaded' : ''}`.trim()}
      style={style}
    />
  )
}