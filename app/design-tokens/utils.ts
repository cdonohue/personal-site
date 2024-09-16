import slugify from 'slugify'
import { FluidToken, StaticToken } from './types'
import { viewports } from './viewports'

function isStaticToken(token: StaticToken | FluidToken): token is StaticToken {
  return (token as StaticToken).value !== undefined
}

function isFluidToken(token: StaticToken | FluidToken): token is FluidToken {
  return (
    (token as FluidToken).min !== undefined &&
    (token as FluidToken).max !== undefined
  )
}

function clampGenerator(tokens: Array<FluidToken>): Array<StaticToken> {
  const rootSize = 16

  return tokens.map(({ name, min, max }) => {
    // Convert the min and max sizes to rems
    const minSize = min / rootSize
    const maxSize = max / rootSize

    // Convert the pixel viewport sizes into rems
    const minViewport = viewports.min / rootSize
    const maxViewport = viewports.max / rootSize

    // Slope and intersection allow us to have a fluid value but also keep that sensible
    const slope = (maxSize - minSize) / (maxViewport - minViewport)
    const intersection = -1 * minViewport * slope + minSize

    return {
      name,
      value: `clamp(${minSize}rem, ${intersection.toFixed(2)}rem + ${(
        slope * 100
      ).toFixed(2)}vw, ${maxSize}rem)`,
    }
  })
}

function tokensToTailwind(tokens: Array<StaticToken> | Array<FluidToken>) {
  let localTokens: Array<StaticToken>

  if (isFluidToken(tokens[0])) {
    localTokens = clampGenerator(tokens as Array<FluidToken>)
  } else {
    localTokens = tokens as Array<StaticToken>
  }

  const nameSlug = (text: string) => slugify(text, { lower: true })
  let response = {} as { [key: string]: string }

  localTokens.forEach(({ name, value }) => {
    response[nameSlug(name)] = value
  })

  return response
}

export { tokensToTailwind, clampGenerator, isStaticToken, isFluidToken }
