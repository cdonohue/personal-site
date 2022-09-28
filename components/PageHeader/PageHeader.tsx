import Container from '../layout/Container'
import VStack from '../layout/VStack'

import styles from './PageHeader.module.css'

const PageHeader = ({ children }) => {
  return (
    <section className={styles.pageHeader}>
      <Container className={styles.container}>
        <VStack alignment="leading" gap="var(--size-fluid-2)" className="p-4">
          {children}
        </VStack>
      </Container>
    </section>
  )
}

export default PageHeader
