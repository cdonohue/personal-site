'use client'

import React, { useState, useEffect } from 'react'

type TypewriterProps = {
  text: string | string[]
  speed?: number
  delay?: number
}

const Typewriter = ({ text = [''], speed = 30, delay = 100 }) => {
  const [phrases, setPhrases] = useState(text)
  const [currentPhrase, setCurrentPhrase] = useState('')
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0)
  const [currentCharacterIndex, setCurrentCharacterIndex] = useState(0)
  const [currentText, setCurrentText] = useState('')

  useEffect(() => {
    if (currentCharacterIndex < currentPhrase.length) {
      const timeout = setTimeout(() => {
        setCurrentText(currentPhrase.slice(0, currentCharacterIndex + 1))
        setCurrentCharacterIndex(currentCharacterIndex + 1)
      }, delay)

      return () => {
        clearTimeout(timeout)
      }
    }
  }, [text, delay, currentCharacterIndex, currentPhrase])
  // const [displayedText, setDisplayedText] = useState('')

  // useEffect(() => {
  //   const startTyping = () => {
  //     let index = 0
  //     const interval = setInterval(() => {
  //       setDisplayedText(text.slice(0, index + 1))
  //       index++
  //       if (index === text.length) {
  //         clearInterval(interval)
  //       }
  //     }, speed)
  //   }

  //   const delayTimeout = setTimeout(startTyping, initialDelay)

  //   return () => {
  //     clearTimeout(delayTimeout)
  //   }
  // }, [text, speed, initialDelay])

  // Show text with invisible characters for space calculation
  return (
    <span>{currentText}</span>
    // <div className="relative">
    //   <div
    //     style={{
    //       position: 'absolute',
    //       whiteSpace: 'pre-wrap',
    //     }}
    //   >
    //     {displayedText}
    //   </div>
    //   <div style={{ visibility: 'hidden', whiteSpace: 'pre-wrap' }}>{text}</div>
    // </div>
  )
}

export default Typewriter
