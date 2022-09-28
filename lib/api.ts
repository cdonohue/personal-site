import fs from 'fs'
import { join } from 'path'
import matter from 'gray-matter'

const experienceDirectory = join(process.cwd(), '_experience')

export function getExperienceSlugs() {
  return fs.readdirSync(experienceDirectory)
}

export function getExperienceBySlug(slug: string, fields: string[] = []) {
  const realSlug = slug.replace(/\.md$/, '')
  const fullPath = join(experienceDirectory, `${realSlug}.md`)
  const fileContents = fs.readFileSync(fullPath, 'utf8')
  const { data, content } = matter(fileContents)

  type Items = {
    [key: string]: string
  }

  const items: Items = {}

  // Ensure only the minimal needed data is exposed
  fields.forEach((field) => {
    if (field === 'slug') {
      items[field] = realSlug
    }
    if (field === 'content') {
      items[field] = content
    }

    if (typeof data[field] !== 'undefined') {
      items[field] = data[field]
    }
  })

  return items
}

export function getAllExperience(fields: string[] = []) {
  const slugs = getExperienceSlugs()
  const experience = slugs
    .map((slug) => getExperienceBySlug(slug, fields))
    // sort posts by date in descending order
    .sort((post1, post2) => (post1.startDate > post2.startDate ? -1 : 1))
  return experience
}
