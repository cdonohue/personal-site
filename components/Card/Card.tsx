import Box from '../layout/Box'
import styles from './Card.module.css'

const Card = ({ children }) => {
  return <Box className={styles.card}>{children}</Box>
}

export default Card
