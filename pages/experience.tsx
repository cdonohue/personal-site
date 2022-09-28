import Layout from '../components/layout'
import { getAllExperience } from '../lib/api'
import Head from 'next/head'
import VStack from '../components/layout/VStack'
import Container from '../components/layout/Container'
import ExperienceCard from '../components/ExperienceCard'
import markdownToHtml from '../lib/markdownToHtml'
import PageHeader from '../components/PageHeader'

export default function Experience({ allExperience }) {
  return (
    <>
      <Layout>
        <Head>
          <title>Chad Donohue - Experience</title>
        </Head>
        <PageHeader>
          <h1>Experience</h1>
        </PageHeader>

        <Container>
          <VStack alignment="leading" gap="var(--size-fluid-4)" className="p-4">
            {allExperience.map((experience, index) => (
              <ExperienceCard experience={experience} index={index + 1} />
            ))}
          </VStack>
        </Container>
      </Layout>
    </>
  )
}

export const getStaticProps = async () => {
  const allExperience = getAllExperience([
    'company',
    'title',
    'content',
    'startDate',
    'endDate',
    'website',
  ])

  for (const e of allExperience) {
    const markup = await markdownToHtml(e.content)
    e.content = markup
  }

  return {
    props: { allExperience },
  }
}
