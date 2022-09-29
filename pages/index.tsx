import Layout from '../components/layout'
import Head from 'next/head'
import VStack from '../components/layout/VStack'
import Link from 'next/link'
import Container from '../components/layout/Container'
import PageHeader from '../components/PageHeader'

export default function Index() {
  return (
    <>
      <Layout>
        <Head>
          <title>Chad Donohue</title>
        </Head>
        <PageHeader>
          <h1>Hi, I'm Chad.</h1>
          <h3>I'm a software engineer.</h3>
          <p>I build user experiences and lead engineering teams.</p>
        </PageHeader>

        <Container
          style={{
            opacity: 0,
            animation:
              'var(--animation-fade-in) forwards, slide-in 0.2s var(--ease-squish-1)',
            animationDelay: '.15s',
          }}
        >
          <VStack alignment="leading" gap="var(--size-fluid-2)" className="p-4">
            <p>
              I enjoy focusing on the user and understanding problems at the
              intersection of design, product, and engineering.
            </p>
            <p>
              I've worked in the software engineering space for over 14 years
              and appreciate being part of a team and writing software together.
            </p>
            <p>
              You can read about my previous experience{' '}
              <Link href="/experience">here</Link>.
            </p>
            {/* <p>
              I also keep track of{' '}
              <Link href="/uses">things that I use</Link> to stay productive on
              a daily basis.
            </p> */}
            <p>
              Currently, I help empower others to create for the web at{' '}
              <a href="https://www.webflow.com">Webflow</a>.
            </p>
            <p>
              Come <a href="https://webflow.com/careers">work with me</a>.
            </p>
          </VStack>
        </Container>
      </Layout>
    </>
  )
}
