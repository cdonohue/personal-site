import Footer from './Footer'
import Meta from './meta'
import Spacer from './layout/Spacer'
import Navigation from './Navigation'
import VStack from './layout/VStack'

type Props = {
  preview?: boolean
  children: React.ReactNode
}

const Layout = ({ children }: Props) => {
  return (
    <VStack style={{ height: '100vh' }}>
      <Meta />
      <Navigation />
      <main>{children}</main>
      <Spacer />
      <Footer />
    </VStack>
  )
}

export default Layout
