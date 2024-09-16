import {
  Droplet,
  Code,
  BedDouble,
  GraduationCap,
  Truck,
  Workflow,
} from 'lucide-react'

export type WorkHistory = {
  icon: any
  company: string
  title: string
  url: string
  startDate: string
  endDate?: string
  description: string
}

const history: Array<WorkHistory> = [
  {
    icon: Workflow,
    company: 'Droplet',
    url: 'https://droplet.io',
    title: 'Staff Software Engineer',
    startDate: '03/01/2024',
    description:
      "I'm currently part of a team working to revolutionize data collection and management for businesses. Our platform enables users to create customizable forms, effectively streamlining processes and eliminating paper-based systems. A significant part of my role has been helping to build and structure our design system, which has been crucial in bridging the gap between our design and engineering teams. This initiative has not only fostered better collaboration but also ensured consistency across our product, leading to a more efficient development process and a more cohesive user experience.",
  },
  {
    icon: BedDouble,
    company: 'Sleep Doctor',
    url: 'https://www.sleepdoctor.com',
    title: 'Staff Software Engineer',
    startDate: '04/01/2023',
    endDate: '03/01/2024',
    description:
      'In this role, I developed a customer data platform that linked anonymous user data across multiple domains, enhancing our understanding of user needs and improving sleep health resources. My work was crucial in creating comprehensive assessments, product recommendations, and educational content on sleep disorders and treatments. By integrating data from various sources, I helped personalize solutions to boost sleep quality and overall well-being for our users.',
  },
  {
    icon: Code,
    company: 'Webflow',
    url: 'https://www.webflow.com',
    title: 'Senior Software Engineer',
    startDate: '11/01/2019',
    endDate: '04/01/2023',
    description:
      'Contributed to a visual web development platform that enables users to build custom websites without coding. My work focused on creating tools for design flexibility, CMS integration, and e-commerce capabilities. This platform allows users to manipulate HTML, CSS, and JavaScript visually, resulting in clean, semantic code that can be published directly or handed off to developers. By developing these features, I helped empower non-technical users to create sophisticated websites while maintaining professional-grade output.',
  },
  {
    icon: GraduationCap,
    company: 'Higher Education',
    url: 'https://www.highereducation.com',
    title: 'Senior Software Engineer',
    startDate: '11/01/2015',
    endDate: '11/01/2019',
    description:
      'Worked on a platform that connects students with educational opportunities, providing comprehensive information on degree programs, colleges, and universities. My role involved developing tools for school comparison, career exploration, and financial aid discovery. These tools empowered users to make informed decisions about their education, guiding them towards their academic goals and future career paths.',
  },
  {
    icon: Truck,
    company: 'Apex Capital',
    url: 'https://www.apexcapitalcorp.com',
    title: 'Software Engineer',
    startDate: '10/01/2008',
    endDate: '10/24/2015',
    description:
      "Supported trucking companies with reliable financial solutions, primarily through freight factoring. I developed key services including fuel cards, startup programs, and various tools tailored for the trucking industry. My work was crucial in upholding Apex's reputation for client-focused service, ensuring seamless and effective financial support for trucking businesses.",
  },
]

export { history }
